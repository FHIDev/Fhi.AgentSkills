# Observability

LGTM-stacken (Loki, Grafana, Tempo, Mimir) er en **plattformtjeneste** driftet av Skybert-teamet. Tenanter deployer ingenting selv — Grafana Alloy kjører cluster-wide og samler inn data automatisk.

## Hva tenanter får uten konfigurasjon

| Komponent | Hva samles inn | Tenant-konfig nødvendig |
|-----------|---------------|------------------------|
| **Logging (Loki)** | stdout/stderr fra alle pods | Nei |
| **Pod-metrics (Mimir)** | CPU, minne, nettverk (kubelet/cAdvisor) | Nei |
| **App-metrics (Mimir)** | Custom Prometheus-metrics | Ja — annotations + `/metrics` endpoint |
| **Tracing (Tempo)** | Distribuerte traces | Ja — under utvikling, kontakt plattformteamet |
| **Grafana** | Visualisering av alt over | Få URL fra plattformteamet |
| **Alerting** | Alerts basert på metrics | Kontakt plattformteamet for oppsett |

## Logging med Loki

### Slik fungerer det

**Grafana Alloy** kjører som DaemonSet på alle noder og samler automatisk stdout/stderr fra alle containere. Ingen sidecar, annotations eller konfigurasjon er nødvendig — bare logg til stdout/stderr.

### For SkybertApp

Ingen ekstra konfigurasjon. Deploy appen, logg til stdout/stderr, og det dukker opp i Grafana.

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: "v1.0.0"
  config:
    LOG_LEVEL: info          # styr loggnivå via config
    LOG_FORMAT: json         # app-spesifikk env-var, leses av appen
```

### For raw Deployments

Samme prinsipp — ingen ekstra konfigurasjon. Stdout/stderr samles automatisk.

### Tilgang via Grafana

- URL: Få fra plattformteamet eller #ext-fhi-skybert
- LogQL-query for ditt namespace: `{namespace="tn-<tenant>"}`
- Filtrer på pod: `{namespace="tn-<tenant>", pod=~"myapp-.*"}`
- Filtrer på lognivå (strukturert JSON): `{namespace="tn-<tenant>"} | json | level="error"`

Start med `namespace`, `pod` eller `container` i LogQL. Andre labels kan variere avhengig av hvilke Kubernetes-labels som videresendes til Loki.

### Strukturert logging (anbefalt)

Bruk JSON-format for å muliggjøre filtrering og søk i Grafana:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Request processed",
  "tenant": "<tenant>",
  "requestId": "abc-123"
}
```

#### .NET-eksempel

```csharp
// Program.cs — bruk Serilog med JSON-output
builder.Host.UseSerilog((ctx, cfg) => cfg
    .WriteTo.Console(new RenderedCompactJsonFormatter()));
```

Installer `Serilog.AspNetCore` og `Serilog.Formatting.Compact`.

#### Python-eksempel

```python
import logging, json_log_formatter

handler = logging.StreamHandler()
handler.setFormatter(json_log_formatter.JSONFormatter())
logger = logging.getLogger()
logger.addHandler(handler)
```

Installer `json-log-formatter`.

### Tips for god logging

- Bruk strukturert logging (JSON) — muliggjør LogQL-filtrering
- Inkluder correlation IDs / request IDs for å spore forespørsler
- Logg på riktig nivå (debug, info, warn, error)
- Unngå å logge sensitive data (personnummer, passord, tokens)
- Ikke logg til filer — Alloy fanger kun stdout/stderr

## Metrics med Mimir

### Pod-metrics (automatisk)

Grunnleggende container-metrics (CPU, minne, nettverk) samles automatisk via kubelet/cAdvisor. Ingen konfigurasjon nødvendig.

### App-metrics (krever konfigurasjon)

For custom Prometheus-metrics må du:
1. Eksponere en `/metrics`-endpoint i appen
2. Legge til scrape-annotations på pod-templaten

#### For SkybertApp

SkybertApp har per nå ingen innebygd støtte for Prometheus-annotations. Bruk fortsatt SkybertApp som standard for vanlige applikasjoner; bruk raw Deployment kun hvis du trenger scrape-annotations som CRD-en ikke støtter. Kontakt plattformteamet hvis du trenger en workaround.

#### For raw Deployments

Legg annotations på pod-templaten (`.spec.template.metadata.annotations`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: myapp
  template:
    metadata:
      labels:
        app.kubernetes.io/name: myapp
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: myapp
          # ...
```

#### Kodeeksempler

```python
# Python
from prometheus_client import Counter, Histogram, generate_latest

request_count = Counter('http_requests_total', 'Total requests', ['method', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'Request duration')
```

```csharp
// .NET — bruk prometheus-net
app.UseHttpMetrics();   // automatisk HTTP-metrics
app.MapMetrics();       // eksponerer /metrics
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
