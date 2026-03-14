# Observability

## Logging med Loki

Applikasjoner logger til stdout/stderr - Alloy samler automatisk inn.

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

> Kilde (X-Scope-OrgID): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/scripts/tenant--bootstrap--grafana.sh

**Loggoppbevaring:** 31 dager.

### Tips for god logging
- Bruk strukturert logging (JSON)
- Inkluder correlation IDs / request IDs
- Logg på riktig nivå (debug, info, warn, error)
- Unngå å logge sensitive data

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

Skybert tilbyr distribuert tracing via **Tempo**. Tracing gir innsikt i hvordan forespørsler flyter gjennom distribuerte systemer.

> **Merk:** Tracing-funksjonaliteten er under utvikling og vil bli utvidet. Kontakt plattformteamet for status og oppsett.

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

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/scripts/tenant--bootstrap--grafana.sh

## Alerting

Kontakt Skybert-teamet for å sette opp alerts basert på:
- Error rates over terskel
- Latency over SLO
- Pod restarts
- Resource usage
