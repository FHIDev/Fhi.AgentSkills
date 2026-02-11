# Observability

## Logging med Loki

Applikasjoner logger til stdout/stderr - Alloy samler automatisk inn.

Tilgang via Grafana:
- URL: (få fra plattformteamet)
- LogQL-query: `{namespace="tn-<tenant>"}`

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

## Alerting

Kontakt Skybert-teamet for å sette opp alerts basert på:
- Error rates over terskel
- Latency over SLO
- Pod restarts
- Resource usage
