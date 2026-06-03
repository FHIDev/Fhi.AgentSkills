# Observability

Skybert bruker **LGTM-stakken** (Loki, Grafana, Tempo, Mimir) for observability, med **Alloy** som felles collector for logger, metrics og traces. Alloy gjør transformasjoner og videresender telemetri til et sentralt ingestion-kluster. Grafana er inngangspunktet for utviklere — brukes til å utforske logger, metrics, dashboards og alerts.

> Kilde: https://docs.sky.fhi.no/observability/

## Logging med Loki

Applikasjoner logger til stdout/stderr — Alloy scraper automatisk container-logger og beriker dem med Kubernetes-metadata (namespace, pod, deployment) i Loki/Grafana.

Tilgang til Grafana er **per kluster** — hvert kluster eksponerer sin egen Grafana-instans. URL-mønsteret er `https://grafana.<color>-<instance>.<domain>`, der `<domain>` er `skytest.fhi.no` for test og `sky.fhi.no` for prod.

| Kluster | Grafana-URL |
|---------|-------------|
| aks-sandbox-01 | `https://grafana.sandbox-01.skytest.fhi.no` |
| aks-green-test-01 | `https://grafana.green-01.skytest.fhi.no` |
| aks-green-prod-02 | `https://grafana.green-02.sky.fhi.no` |
| aks-yellow-test-01 | `https://grafana.yellow-01.skytest.fhi.no` |
| aks-yellow-prod-01 | `https://grafana.yellow-01.sky.fhi.no` |
| aks-red-test-01 | `https://grafana.red-01.skytest.fhi.no` |
| aks-red-prod-01 | `https://grafana.red-01.sky.fhi.no` (kun nåbar fra secure zone) |

> **Merk (gul test):** Den nye docs-siden viser fortsatt gul test = `aks-yellow-test-01` (`grafana.yellow-01.skytest.fhi.no`), mens infra `COLOR_GROUP_CLUSTERS["yellow"]` i `clusters.sh` nå bruker `aks-yellow-test-02` i fargeløypa. URL-en er ikke endret her (docs er autoritativ for bruker-URLer) — verifiser med plattformteamet ved tvil.

> Kilde: https://docs.sky.fhi.no/observability/grafana/

LogQL-query for egne logger:
```
{namespace="tn-<tenant>"}
```

### Logs Drilldown og nyttige labels

Grafana eksponerer **Logs Drilldown** som gir label-basert navigasjon uten å måtte skrive LogQL manuelt. Nyttige labels:

| Label | Typisk bruk |
|-------|-------------|
| `namespace` | Filter til `tn-<tenant>` (automatisk gitt av Grafana-datasourcen) |
| `pod` | Isoler én pod |
| `container` | Filtrer mellom main-container og sidecars |
| `node_name` | Node-nivå feilsøking |

> Kilde: https://docs.sky.fhi.no/observability/logs/

Eksempel strukturert logging:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Request processed",
  "tenant": "<tenant>",
  "requestId": "abc-123"
}
```

### Loki multi-tenancy og isolasjon

Loki kjøres med `auth_enabled: true` — logger er isolert per tenant via headeren `X-Scope-OrgID: tn-<tenant>`. Dette settes automatisk av Grafana-datasourcen som er klargjort for deg; du trenger ikke konfigurere det selv.

> Kilde (X-Scope-OrgID): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/scripts/tenant--bootstrap--grafana.sh

**Loggoppbevaring:** 31 dager.

### Tips for god logging
- Bruk strukturert logging (JSON)
- Inkluder correlation IDs / request IDs
- Logg på riktig nivå (debug, info, warn, error)
- Unngå å logge sensitive data

### OTLP log ingestion (eksperimentelt)

> **Advarsel:** OTLP log ingestion er per nå ikke ferdig testet. Kontakt plattformteamet før bruk.

I tillegg til automatisk scraping fra stdout/stderr, støtter Skybert direkte sending av logger til Alloy via OTLP SDK-er. Alloy beriker loggene med Kubernetes-metadata (namespace, pod, deployment) og sender dem til Loki.

**Endepunkter (klusterinternt):**
- HTTP: `alloy.alloy.svc.cluster.local:4318`
- gRPC: `alloy.alloy.svc.cluster.local:4317`

Alloy bruker `internalTrafficPolicy: Local` slik at OTLP-trafikk havner på Alloy-instansen på *samme node* som workloaden — nødvendig for at `k8sattributes`-prosessoren skal kunne resolve namespace/pod/deployment fra source-IP. **Konsekvens:** OTLP SDK-en MÅ retry ved feil. Under pod-rescheduling kan den lokale Alloy-instansen være borte kortvarig.

> Kilde: https://docs.sky.fhi.no/observability/logs/

## Metrics med Mimir

**Status per 2026-05-09:** Cluster- og infrastrukturmetrics scrapes automatisk. **Custom application metrics scrapes nå plattformmessig** — legg `prometheus.io/scrape: "true"` + `prometheus.io/port` på pod-template (eller bruk `metrics`-feltet i SkybertApp). Alloy oppdager annoterte pods og remote-writer til Mimir via cortex-tenant-proxy som setter `X-Scope-OrgID` basert på namespace, slik at metrics isoleres per tenant.

> Kilde: https://docs.sky.fhi.no/observability/metrics/

### Eksporter Prometheus-metrics på `/metrics`

```python
# Python eksempel
from prometheus_client import Counter, Histogram, generate_latest

request_count = Counter('http_requests_total', 'Total requests')
request_duration = Histogram('http_request_duration_seconds', 'Request duration')
```

### Konfigurasjon

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: "/metrics"
```

| Annotation | Påkrevet | Default | Beskrivelse |
|------------|----------|---------|-------------|
| `prometheus.io/scrape` | Ja | — | `"true"` for å opt-in |
| `prometheus.io/port` | Ja | — | Port for `/metrics` |
| `prometheus.io/path` | Nei | `/metrics` | Path |
| `prometheus.io/scheme` | Nei | `http` | `http` eller `https` |

Annotasjonene skal stå på pod-template (`.spec.template.metadata.annotations`), ikke på Deployment-metadata.

> **SkybertApp-snarvei:** Sett `metrics.port: 9090` (og evt. `path`/`scheme`) i SkybertApp-spec så legger composition annotasjonene automatisk på pod-template. Se [SkybertApp CRD — Metrics](skybertapp-crd.md#metrics).

### Anbefalte metrics
- `http_requests_total` - Antall requests (med labels for status, method, endpoint)
- `http_request_duration_seconds` - Request latency
- `http_requests_in_flight` - Pågående requests
- Applikasjonsspesifikke business metrics

### Custom-metrics-HPA (planlagt)

Plattformteamet vurderer KEDA for autoskalering basert på request rate, kø-dybde, latens m.m. Kontakt `#ext-fhi-skybert` med use case for å påvirke designet.

## Tracing med Tempo

Distribuert tracing via **Tempo** er **planlagt, foreløpig ikke tilgjengelig** på plattformen. Forbered appen ved å instrumentere med OpenTelemetry (SDK-er for .NET/Python/Node m.fl.) slik at tracing fungerer den dagen Tempo slås på — men ikke regn med funksjonalitet i dag. Kontakt plattformteamet for oppdatert status.

> Kilde: https://docs.sky.fhi.no/observability/tracing/

## Grafana Dashboards

Tilgang dashboards for:
- Pod-metrics (CPU, minne, nettverk)
- HTTP-metrics (RPS, latency, errors)
- Custom app-metrics (eksponer `/metrics` og opt-in via Prometheus-annotasjoner eller SkybertApp `metrics`-feltet — se "Metrics med Mimir" over)

### Dashboards fra GitOps (ConfigMap)

Du kan publisere dashboards fra Kubernetes ved å opprette en labelet `ConfigMap` i tenant-namespacet ditt (`tn-<tenant>`). En in-cluster controller (`grafana-dashboard-syncer`) watcher disse og upserter dashboardet i din Grafana-org via HTTP API. Typisk flyt: commit ConfigMap i GitOps-repoet → Flux applyer → syncer oppretter/oppdaterer dashboardet.

| Krav | Detalj |
|------|--------|
| **Label (påkrevd)** | `skybert.fhi.no/grafana-dashboard: "true"` (kun ConfigMaps som matcher label-selektoren synkes) |
| **Data-nøkkel (påkrevd)** | Nøyaktig `json` under `data:` (ren tekst). `binaryData` brukes ikke. |

`data.json` kan være enten (1) klassisk dashboard-modell (må ha stabil `uid`, samt `title` og/eller `panels`) eller (2) full save-payload `{"dashboard": {...}, "folderUid": "..."}`. Synceren lagrer alltid med `overwrite: true`.

| Annotasjon (valgfri) | Funksjon |
|----------------------|----------|
| `skybert.fhi.no/grafana-folder` | Sikrer at en mappe med gitt tittel finnes og lagrer dashboardet der. Verdien trimmes, maks 100 tegn, og saneres til `[a-zA-Z0-9 _\-.]`. |
| `skybert.fhi.no/grafana-dashboard-org-home` | Truthy verdi (`true`/`1`/`yes`) setter dashboardet som org-hjem etter lagring. Bruk sparsomt. |

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-service-overview
  namespace: tn-<tenant>
  labels:
    skybert.fhi.no/grafana-dashboard: "true"
data:
  json: |
    {
      "title": "My service overview",
      "uid": "<tenant>-service-overview",
      "schemaVersion": 39,
      "version": 1,
      "panels": []
    }
```

**Atferd og begrensninger:**
- **Resync hvert 5. minutt** — overskriver manuelle endringer gjort i Grafana-UI. Vil du redigere kun i UI, fjern ConfigMap (men da mister du GitOps-backup).
- **Ingen auto-sletting** — sletting av ConfigMap (eller fjerning av label) fjerner ikke dashboardet i Grafana. Slett/omdøp manuelt i UI.
- **Maks `data.json`: 900 000 bytes** (Kubernetes-ressursgrense). Større payloads avvises ved validering. Kontakt `#ext-fhi-skybert` ved behov.
- **Metrics i Mimir:** `syncer_dashboard_configmaps` og `syncer_malformed_dashboard_configmaps` (oppdateres hvert minutt).

> Kilde: https://docs.sky.fhi.no/observability/grafana/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/01abbad/infra/grafana/base/dashboard-syncer.yaml

### PromQL eksempler

```promql
# Request rate per sekund (5 min gjennomsnitt)
rate(http_requests_total{namespace="tn-<tenant>"}[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{namespace="tn-<tenant>"}[5m]))

# Error rate
sum(rate(http_requests_total{namespace="tn-<tenant>",status=~"5.."}[5m])) / sum(rate(http_requests_total{namespace="tn-<tenant>"}[5m]))

# Memory usage
container_memory_usage_bytes{namespace="tn-<tenant>"}

# CPU usage
rate(container_cpu_usage_seconds_total{namespace="tn-<tenant>"}[5m])
```

### Grafana multi-tenancy

Hver tenant har sin egen **Grafana-organisasjon** med:
- **Loki-datasource** — filtrert til `tn-<tenant>` (kun egne logger synlig)
- **Mimir-datasource** — filtrert til `tn-<tenant>` (kun egne metrics synlig)
- Tilgang gis via Entra ID-gruppe gjennom `org_mapping`-konfigurasjon (satt opp av plattformteamet ved onboarding)

Entra-gruppen mappes inn i Grafana-instansen på alle klustere i fargegruppen din (sandbox, test og prod).

Du logger inn med FHI-bruker. Grafana plasserer deg i riktig organisasjon basert på Entra-gruppemedlemskap via `org_mapping`.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/scripts/tenant--bootstrap--grafana.sh

## Alerting

Kontakt Skybert-teamet for å sette opp alerts basert på:
- Error rates over terskel
- Latency over SLO
- Pod restarts
- Resource usage
