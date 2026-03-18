# Observability

Skybert bruker **LGTM-stakken** (Loki, Grafana, Tempo, Mimir) for observability, med **Alloy** som felles collector for logger, metrics og traces. Alloy gjør transformasjoner og videresender telemetri til et sentralt ingestion-kluster. Grafana er inngangspunktet for utviklere — brukes til å utforske logger, metrics, dashboards og alerts.

> Kilde: https://docs.sky.fhi.no/observability/

## Logging med Loki

Applikasjoner logger til stdout/stderr — Alloy scraper automatisk container-logger og beriker dem med Kubernetes-metadata (namespace, pod, deployment) i Loki/Grafana.

Tilgang via Grafana:
- **Grønn test / sandbox:** https://grafana.skytest.fhi.no
- **Gul test:** https://grafana-yellow.skytest.fhi.no
- **Produksjon:** https://grafana.sky.fhi.no

- LogQL-query: `{namespace="tn-<tenant>"}`

> Merk: Grafana-URL varierer per sikkerhetssone. Rød test er ikke verifisert — kontakt plattformteamet.

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

> Kilde (X-Scope-OrgID): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/bdd8bf05fade7c7e1aba534b75e64f6e46b0e22f/scripts/tenant--bootstrap--grafana.sh

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

> **Advarsel:** OTLP log ingestion er ikke HA — forespørsler sendes til Alloy-instansen på samme node som workloaden (nødvendig for Kubernetes-metadata-berikelse). Konfigurer OTLP SDK til å retry ved kortvarig nedetid (f.eks. under pod-rescheduling).

> Kilde: https://docs.sky.fhi.no/observability/logs/

## Metrics med Mimir

Eksporter Prometheus-metrics på `/metrics`:

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

### Anbefalte metrics
- `http_requests_total` - Antall requests (med labels for status, method, endpoint)
- `http_request_duration_seconds` - Request latency
- `http_requests_in_flight` - Pågående requests
- Applikasjonsspesifikke business metrics

## Tracing med Tempo

Skybert planlegger distribuert tracing via **Tempo**. Tracing vil gi innsikt i hvordan forespørsler flyter gjennom distribuerte systemer.

> **Merk:** Traces (gjennom Tempo) er per nå **ikke støttet**. Kontakt plattformteamet for oppdatert status.

> Kilde: https://docs.sky.fhi.no/observability/

## Grafana Dashboards

Tilgang dashboards for:
- Pod-metrics (CPU, minne, nettverk)
- HTTP-metrics (RPS, latency, errors)
- Custom app-metrics

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

Du logger inn med FHI-bruker. Grafana plasserer deg i riktig organisasjon basert på Entra-gruppemedlemskap via `org_mapping`.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/bdd8bf05fade7c7e1aba534b75e64f6e46b0e22f/scripts/tenant--bootstrap--grafana.sh

## Alerting

Kontakt Skybert-teamet for å sette opp alerts basert på:
- Error rates over terskel
- Latency over SLO
- Pod restarts
- Resource usage
