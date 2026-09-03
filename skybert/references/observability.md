# Observability

Hvert kluster kjører sin egen, komplette LGTM-stack: **Loki** (logger), **Mimir** (metrics) og **Grafana** (UI). **Tempo** (traces) er planlagt, ikke tilgjengelig. **Alloy** kjører som DaemonSet på hvert kluster, samler logger og metrics og skriver dem til Loki og Mimir i samme kluster — det finnes ingen sentral ingestion på tvers av klustere. Grafana er inngangspunktet: Explore, Logs Drilldown, dashboards og alerts.

> Kilde: https://docs.sky.fhi.no/observability/ · https://docs.sky.fhi.no/internal/observability/alloy/

## Logging med Loki

Applikasjoner logger til stdout/stderr. Alloy scraper container-loggene automatisk og setter labelene `namespace`, `pod`, `container`, `node_name` og `app` (hvis podden har en `app`-label). Loki fungerer best med strukturert JSON til stdout — da kan feltene parses ved spørring (`| json | level="error"`).

LogQL for egne logger:
```logql
{namespace="tn-<tenant>"} |= "error"
```

> Kilde: https://docs.sky.fhi.no/observability/logs/

### Logs Drilldown og nyttige labels

**Logs Drilldown** i Grafana gir label-basert navigasjon uten å skrive LogQL. Nyttige labels:

| Label | Typisk bruk |
|-------|-------------|
| `namespace` | `tn-<tenant>` — settes av Alloy på hver logglinje; må fortsatt angis i LogQL |
| `pod` | Isoler én pod |
| `container` | Filtrer mellom main-container og sidecars |
| `node_name` | Node-nivå feilsøking |

> Kilde: https://docs.sky.fhi.no/observability/logs/ · https://docs.sky.fhi.no/internal/observability/alloy/

### Loki multi-tenancy og isolasjon

Loki kjører med `auth_enabled: true`. Alloy setter Loki-tenant lik `namespace`-labelen på hver logglinje, og Grafana-datasourcen i tenantens org sender headeren `X-Scope-OrgID: tn-<tenant>` — du ser kun egne logger og trenger ikke konfigurere noe selv. Oppbevaring: 31 dager (`retention_period: 744h`).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/loki/base/loki-18.7.6-values.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/lib/grafana/datasource.sh

### OTLP log ingestion (eksperimentelt)

OTLP log ingestion er ikke ferdig testet — kontakt plattformteamet før bruk.

Logger kan sendes direkte til Alloy via OpenTelemetry-SDK-er. Alloy beriker dem med Kubernetes-metadata (namespace, pod, container, node) og sender dem til Loki med samme namespace-routing som scrapede logger.

**Endepunkter (klusterinternt):**
- HTTP: `alloy.alloy.svc.cluster.local:4318`
- gRPC: `alloy.alloy.svc.cluster.local:4317`

Alloy-servicen har `internalTrafficPolicy: Local`: OTLP-trafikk havner på Alloy-instansen på *samme node* som workloaden, som er nødvendig for at `k8sattributes` skal kunne slå opp pod-metadata fra source-IP. Er den lokale instansen nede (f.eks. under rollout), feiler requesten. SDK-en må derfor konfigureres til å retry ved feil.

> Kilde: https://docs.sky.fhi.no/observability/logs/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/alloy/base/alloy-1.2.1-values.yaml

## Metrics med Mimir

Cluster- og infrastrukturmetrics (node, cAdvisor container-CPU/-minne) scrapes automatisk og kan spørres uten instrumentering, f.eks. `container_memory_working_set_bytes{namespace="tn-<tenant>"}`. Applikasjonsmetrics scrapes når podden opt-er inn med Prometheus-annotasjoner (eller `metrics`-feltet i SkybertApp). Alloy oppdager annoterte pods og remote-writer til Mimir via `cortex-tenant`, som setter `X-Scope-OrgID` fra labelene på hver serie, i denne rekkefølgen:

1. `namespace`-labelen (normalt `tn-<tenant>`)
2. ellers en eksplisitt `tenant`-label
3. mangler begge, havner serien i `cluster_metrics` — utenfor tenantens Grafana-org

Labelene beholdes på serien (`label_remove: false`). Metrics er spørrbare i Grafana etter et par minutter.

> Kilde: https://docs.sky.fhi.no/observability/metrics/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/mimir/base/cortex-tenant-0.8.0-values.yaml

### Konfigurasjon

Eksponer et Prometheus-kompatibelt `/metrics`-endepunkt med et standard klientbibliotek, og legg annotasjonene på pod-template (`.spec.template.metadata.annotations`), ikke på Deployment-metadata:

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

**SkybertApp-snarvei:** sett `metrics.port` (og evt. `path`/`scheme`) i SkybertApp-spec, så legger composition annotasjonene på pod-template. Se [SkybertApp CRD — Metrics](skybertapp-crd.md#metrics).

Spørreeksempel fra docs:
```promql
rate(http_requests_total{namespace="tn-<tenant>"}[5m])
```

> Kilde: https://docs.sky.fhi.no/observability/metrics/ · https://docs.sky.fhi.no/internal/observability/alloy/

### Ressursanbefalinger i Grafana

VPA-anbefalingene leses i standard-dashboardet (**Tenant Overview**), tabellen **Request vs Recommendation** under *Resource requests*. Hvordan VPA-objektene opprettes, og at de aldri endrer pods, står i [Kyverno-policier — Ressursanbefalinger](kyverno-policies.md#ressursanbefalinger-goldilocks--vpa).

- Én rad per `workload · container`. SkybertApp-rader bruker det composede Deployment-navnet (`<app>-deployment`); native sidecars er med; Jobs og CronJobs har ikke VPA-target.
- `CPU/Mem vs target` er `request ÷ recommendation × 100` (100 % = samsvar; manglende requests vises som `No request`). `current` er request på kjørende pod, `rec` er VPA-target.
- Recommenderen går ikke under **15 millicores / 100 MB** — en ny eller lite belastet tjeneste ligger på gulvene til den har sett reell last.
- Anbefalt praksis: start med SkybertApp-defaults (`150m` / `256Mi`), kjør minst en uke under forventet last, og sett deretter `spec.resources` i Git til targetet (Flux applyer). VPA øker memory-anbefalingen betydelig etter OOM-kill.

Bakgrunn: recommenderen leser bruks-historikk fra Mimir-orgen `cluster_metrics` (cAdvisor dual-writes dit via Alloy), mens Grafana-tabellen leser VPA-gauges fra kube-state-metrics i tenant-orgen.

> Kilde: https://docs.sky.fhi.no/workloads/resource-sizing/ · https://docs.sky.fhi.no/internal/observability/vpa/

### Kyverno PolicyReport som metrics

kube-state-metrics eksponerer Kyverno `PolicyReport` til Mimir via CustomResourceState:

- `kube_policyreport_summary` — antall per result (`pass`, `fail`, `warn`, `error`, `skip`)
- `kube_policyreport_result_info` — én serie per resultat, med labels `policy`, `rule`, `result`, `severity`, `category` og `message`

Filtrer tenant-visninger med `namespace=~"tn-.*"`. Dette gjør policy-funn (f.eks. `resource-limits`- og `recommend-network-policy`-audits) synlige i Grafana uten kubectl.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kube-state-metrics/base/kube-state-metrics-7.3.0-values.yaml

### Custom-metrics-HPA (planlagt)

Plattformteamet planlegger autoskalering på egne metrics (request rate, kø-dybde, latens) med KEDA. Meld behov i `#ext-fhi-skybert`.

> Kilde: https://docs.sky.fhi.no/observability/metrics/

## Tracing med Tempo

Distribuert tracing via **Tempo** er planlagt, ikke tilgjengelig for tenanter. Instrumenter appen med OpenTelemetry (auto-instrumentering for ASP.NET, Spring Boot, Flask m.fl.) så traces fungerer når Tempo slås på, men ikke regn med funksjonalitet i dag. Er tracing viktig for teamet, si fra i `#ext-fhi-skybert`.

> Kilde: https://docs.sky.fhi.no/observability/tracing/

## Grafana

Hvert kluster har sin egen Grafana-instans. URL-mønsteret er `https://grafana.<color>-<instance>.<domain>`, der `<domain>` er `skytest.fhi.no` for non-prod og `sky.fhi.no` for prod.

| Kluster | Grafana-URL |
|---------|-------------|
| aks-sandbox-01 | `https://grafana.sandbox-01.skytest.fhi.no` |
| aks-green-test-01 | `https://grafana.green-01.skytest.fhi.no` |
| aks-green-prod-02 | `https://grafana.green-02.sky.fhi.no` |
| aks-yellow-test-02 | `https://grafana.yellow-02.skytest.fhi.no` |
| aks-yellow-prod-01 | `https://grafana.yellow-01.sky.fhi.no` |
| aks-red-test-01 | `https://grafana.red-01.skytest.fhi.no` |
| aks-red-prod-01 | `https://grafana.red-01.sky.fhi.no` (kun nåbar fra secure zone) |

Du logger inn med FHI-bruker (Entra ID) og lander i Grafana-organisasjonen som tilhører tenanten. Alerts settes opp av tenanten selv i egen org.

> Kilde: https://docs.sky.fhi.no/observability/grafana/

### Grafana multi-tenancy

Plattformen oppretter ved onboarding (`ska tenant bootstrap grafana`) én **Grafana-organisasjon per tenant per kluster**, med:
- **Loki-datasource** og **Mimir-datasource** scopet til `tn-<tenant>` via `X-Scope-OrgID` — kun egne logger og metrics er synlige
- Entra-gruppe → org-mapping (patchet inn per kluster i `infra/grafana/<cluster>/patch-orgs.yaml`)

Målklustere er de tenanten er rullet ut på (utledet fra `tenants/<tenant>/<cluster>/`), eller de plattformteamet angir eksplisitt.

> Kilde: https://docs.sky.fhi.no/internal/managing-tenants/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/scripts/lib/grafana/

### Standard-dashboard

Grafana er forhåndskonfigurert med et standard-dashboard (**Tenant Overview**) fra plattformteamet. Det dekker workload health, Flux, ressursbruk, logger og **Request vs Recommendation**-tabellen (se [Ressursanbefalinger i Grafana](#ressursanbefalinger-i-grafana)). Dashboardet kan bli oppdatert når som helst — endringer du gjør i det via web-UI kan bli overskrevet. Vil du tilpasse det, kopier det til et eget dashboard. Dashboards teamet skal beholde over tid bør eksporteres til JSON og forvaltes via ConfigMap-flyten under.

> Kilde: https://docs.sky.fhi.no/observability/grafana/

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

> Kilde: https://docs.sky.fhi.no/observability/grafana/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/grafana/base/dashboard-syncer.yaml
