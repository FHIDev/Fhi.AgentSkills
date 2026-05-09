# SkybertApp CRD-spesifikasjon

**Kilde:** https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/

## API

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
```

**Status:** Alpha - kan ha breaking changes.

## Quick Start

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0
```

## Spec Reference

### Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `image.repository` | string | **påkrevet** | Container image repository |
| `image.tag` | string | **påkrevet** | Container image tag |
| `port` | integer | `8080` | Port applikasjonen lytter på |
| `command` | string[] | — | Overstyr container-kommando |
| `args` | string[] | — | Argumenter til kommandoen (sendes etter `command`) |
| `resources.cpu` | string | `150m` | CPU request |
| `resources.memory` | string | `256Mi` | Memory request og limit |
| `readOnlyRootFilesystem` | boolean | `false` | Monter root-filsystem som read-only |
| `writableDirs` | string[] | — | Kataloger montert som skrivbare emptyDir-volumer |

> **Merk:** Memory limit er alltid lik request.

### Scaling

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `replicas` | integer | `1` | Antall pod-replikaer |
| `autoscaling.minReplicas` | integer | `1` | Minimum replikaer for HPA |
| `autoscaling.maxReplicas` | integer | `5` | Maksimum replikaer for HPA |
| `autoscaling.targetCPU` | integer | `80` | Mål-CPU-utnyttelse % |
| `autoscaling.targetMemory` | integer | `80` | Mål-minneutnyttelse % |

> **Merk:** Å spesifisere `autoscaling` aktiverer HPA (Horizontal Pod Autoscaling). Når `autoscaling` er satt, **overstyres `replicas`-feltet av `autoscaling.minReplicas`** som initial replica count på Deployment.

### Health Probes

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `probes.liveness.path` | string | **påkrevet** | HTTP path; restarter container ved failure |
| `probes.liveness.port` | integer | `spec.port` | Port for liveness-probe |
| `probes.liveness.initialDelaySeconds` | integer | `10` | Forsinkelse før første probe |
| `probes.liveness.periodSeconds` | integer | `10` | Sjekkintervall |
| `probes.liveness.timeoutSeconds` | integer | `3` | Probe-timeout |
| `probes.liveness.failureThreshold` | integer | `3` | Påfølgende feil før restart |
| `probes.readiness.path` | string | **påkrevet** | HTTP path; fjerner pod fra service-endpoints ved failure |
| `probes.readiness.port` | integer | `spec.port` | Port for readiness-probe |
| `probes.readiness.initialDelaySeconds` | integer | `5` | Forsinkelse |
| `probes.readiness.periodSeconds` | integer | `3` | Sjekkintervall |
| `probes.readiness.timeoutSeconds` | integer | `2` | Probe-timeout |
| `probes.readiness.failureThreshold` | integer | `2` | Påfølgende feil før fjerning |
| `probes.startup.path` | string | **påkrevet** | HTTP path under oppstart; gates liveness/readiness |
| `probes.startup.port` | integer | `spec.port` | Port for startup-probe |
| `probes.startup.initialDelaySeconds` | integer | `0` | Forsinkelse |
| `probes.startup.periodSeconds` | integer | `5` | Sjekkintervall |
| `probes.startup.timeoutSeconds` | integer | `3` | Probe-timeout |
| `probes.startup.failureThreshold` | integer | `60` | Påfølgende feil før oppstart anses feilet (60×5s = 300s) |

Bruk readiness for traffic gating, liveness for hengte prosesser, og startup for sakte-startende apper.

```yaml
probes:
  liveness:
    path: /health/live
  readiness:
    path: /health/ready
  startup:
    path: /health/startup
    failureThreshold: 60
```

For .NET Health Checks API-mønster og separasjon av public/private health endpoints, se [konfigurasjon — Health probes i .NET-apper](configuration.md#health-probes-i-net-apper).

### Pod Disruption Budget

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `podDisruptionBudget.enabled` | boolean | auto | Eksplisitt aktiver/deaktiver PDB |
| `podDisruptionBudget.minAvailable` | int eller "X%" | `"33%"` | Minimum tilgjengelige pods under voluntary disruptions |
| `podDisruptionBudget.maxUnavailable` | int eller "X%" | — | Maksimum utilgjengelige pods |

PDB opprettes automatisk når `replicas > 1` eller `autoscaling.minReplicas > 1`. Sett `podDisruptionBudget.enabled: false` for å deaktivere. `minAvailable` og `maxUnavailable` er gjensidig utelukkende; prosenter rundes opp.

```yaml
replicas: 3
podDisruptionBudget:
  minAvailable: "33%"
```

### Metrics

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `metrics.port` | integer | **påkrevet** | Port `/metrics` lytter på |
| `metrics.path` | string | `/metrics` | Path til metrics-endepunkt |
| `metrics.scheme` | string | `http` | `http` eller `https` |

Når `metrics` er satt, legger composition automatisk til `prometheus.io/scrape: "true"`, `prometheus.io/port`, ev. `prometheus.io/path` og `prometheus.io/scheme` på pod-template. Metrics filtreres til `tn-<tenant>` i Mimir via cortex-tenant-proxy. Se [Observability](observability.md).

```yaml
metrics:
  port: 9090
```

### Ingress

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `hostname` | string | — | Hostname å eksponere (aktiverer ingress) |

**Støttede domener:**
- Test: `*.skytest.fhi.no` og `*.fhi-k8s.com`
- Produksjon: `*.sky.fhi.no`

TLS-sertifikater provisjoneres automatisk via cert-manager.

### Configuration

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `config` | object | — | Nøkkel-verdi-par for konfigurasjon |

Config-verdier monteres som filer i `/config` OG injiseres som miljøvariabler i alle containere.

```yaml
config:
  LOG_LEVEL: info
  API_URL: https://api.example.com
  config.json: |
    {
      "setting": "value"
    }
```

### Workload Identity

Workload Identity er **alltid aktivert** for SkybertApp. Composition setter automatisk
`azure.workload.identity/use: "true"` på alle pods og kobler dem til `<tenant>-azure` service account
(utledet fra namespace `tn-<tenant>`).

Du trenger ikke sette noe felt for dette — det skjer automatisk.

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/crossplane/base/compositions/skybertapp.yaml

### Secrets

Secrets hentes fra Azure Key Vault og monteres automatisk i alle containere.

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `secrets[].vault` | string | **påkrevet** | Azure Key Vault-navn |
| `secrets[].keys` | array | **påkrevet** | Nøkler å hente fra vault |
| `secrets[].keys[].remote` | string | **påkrevet** | Nøkkelnavn i Azure Key Vault |
| `secrets[].keys[].local` | string | samme som `remote` | Nøkkelnavn i Kubernetes secret |
| `secrets[].keys[].property` | string | — | JSON-egenskap å ekstrahere |
| `secrets[].name` | string | `<vault-lowercase>-secret-<index>` | Kubernetes secret-navn |
| `secrets[].mountAsFiles` | boolean | `true` | Monter som filer |
| `secrets[].mountAsEnv` | boolean | `false` | Injiser som miljøvariabler |
| `secrets[].mountPath` | string | `"/secrets/<secret name>"` | Filmonteringsbane |
| `secrets[].secretType` | string | `Opaque` | Kubernetes secret type |
| `secrets[].labels` | object | — | Ekstra labels på secret |
| `secrets[].annotations` | object | — | Ekstra annotations på secret |

```yaml
secrets:
- vault: my-keyvault
  keys:
  - remote: database-password
    local: DB_PASSWORD
  - remote: api-key
  mountAsEnv: false
  mountPath: /secrets/db
```

### Init Containers

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `initContainers[].name` | string | **påkrevet** | Container-navn |
| `initContainers[].image.repository` | string | **påkrevet** | Image repository |
| `initContainers[].image.tag` | string | **påkrevet** | Image tag |
| `initContainers[].command` | string[] | — | Kommando å kjøre |
| `initContainers[].resources.cpu` | string | `150m` | CPU request |
| `initContainers[].resources.memory` | string | `256Mi` | Memory request/limit |
| `initContainers[].readOnlyRootFilesystem` | boolean | `false` | Read-only root filesystem |
| `initContainers[].writableDirs` | string[] | — | Skrivbare emptyDir-monteringer |

### Sidecar Containers

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `sidecarContainers[].name` | string | **påkrevet** | Container-navn |
| `sidecarContainers[].image.repository` | string | **påkrevet** | Image repository |
| `sidecarContainers[].image.tag` | string | **påkrevet** | Image tag |
| `sidecarContainers[].command` | string[] | — | Kommando å kjøre |
| `sidecarContainers[].resources.cpu` | string | `150m` | CPU request |
| `sidecarContainers[].resources.memory` | string | `256Mi` | Memory request/limit |
| `sidecarContainers[].readOnlyRootFilesystem` | boolean | `false` | Read-only root filesystem |
| `sidecarContainers[].writableDirs` | string[] | — | Skrivbare emptyDir-monteringer |

## Komplett eksempel

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-application
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0

  port: 8080

  command:
    - "/bin/sh"
    - "-c"
    - "start-app.sh"

  resources:
    cpu: "150m"
    memory: "256Mi"

  readOnlyRootFilesystem: true
  writableDirs:
    - /tmp
    - /var/cache

  replicas: 1

  autoscaling:
    minReplicas: 1
    maxReplicas: 5
    targetCPU: 80
    targetMemory: 80

  hostname: "myapp.skytest.fhi.no"

  config:
    MY_ENV_VAR: "some-value"
    ANOTHER_VAR: "another-value"
    config.json: |
      {
        "setting": "value"
      }

  secrets:
    - name: my-app-secrets
      vault: my-keyvault
      keys:
        - remote: database-password
          local: DB_PASSWORD
        - remote: api-credentials
          local: API_KEY
          property: apiKey
      mountAsEnv: false
      mountAsFiles: true
      mountPath: /secrets
      secretType: "Opaque"
      labels:
        custom-label: "value"
      annotations:
        custom-annotation: "value"

  initContainers:
    - name: init-db
      image:
        repository: crfhiskybert.azurecr.io/mytenant/init-container
        tag: v1.0.0
      command:
        - "/bin/sh"
        - "-c"
        - "run-migrations.sh"
      resources:
        cpu: "150m"
        memory: "256Mi"
      readOnlyRootFilesystem: true
      writableDirs:
        - /tmp

  sidecarContainers:
    - name: log-collector
      image:
        repository: crfhiskybert.azurecr.io/mytenant/log-collector
        tag: v1.0.0
      command:
        - "/bin/sh"
        - "-c"
        - "tail -f /var/log/app.log"
      resources:
        cpu: "150m"
        memory: "256Mi"
      readOnlyRootFilesystem: true
      writableDirs:
        - /var/log
```

## Generated Resources

> For å se nøyaktig hvilke manifester en konkret SkybertApp rendrer til
> (uten kluster-tilgang), se [SkybertApp rendering](skybertapp-render.md).
> Kopier av Composition, XRD og en render-klar `functions.yaml` ligger
> under `references/skybertapp/`.

SkybertApp oppretter følgende Kubernetes-ressurser:

- **Deployment** — Hoved-workload
- **Service** — ClusterIP service (når hostname er satt)
- **Ingress** — NGINX ingress med TLS (når hostname er satt)
- **ConfigMap** — Konfigurasjonsverdier (når config er satt)
- **HorizontalPodAutoscaler** — Autoskalering (når autoscaling er satt)
- **PodDisruptionBudget** — Beskytter tilgjengelighet under voluntary disruptions (når `replicas > 1`, `autoscaling.minReplicas > 1`, eller eksplisitt aktivert)
- **SecretStore** — External Secrets store per vault
- **ExternalSecret** — Synkroniserer secrets fra Azure Key Vault

### Navnekonvensjoner for genererte ressurser

| Ressurs | Navnemønster |
|---------|-------------|
| Deployment | `<name>-deployment` |
| Hoved-container | `<name>-main` |
| Service Account | `<tenant>-azure` (utledet fra namespace `tn-<tenant>`) |
| ConfigMap | `<name>-config` |
| Secret | `<vault-lowercase>-secret-<index>` (hvis ikke spesifisert med `name`) |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/crossplane/base/compositions/skybertapp.yaml

## SkybertApp vs WebApp

| | SkybertApp (v1alpha1) | WebApp (v1) |
|---|---|---|
| **Status** | Aktiv, anbefalt | **Utdatert** |
| **Secrets** | Inline i spec | Manuell SecretStore + ExternalSecret |
| **Workload Identity** | Automatisk (alltid aktivert) | Manuell service account + annotations |
| **Sikkerhet** | Automatisk hardening | Manuell securityContext |
| **Config** | `config`-felt (filer + env vars) | Manuell ConfigMap |
| **Init/Sidecar** | Innebygd støtte | Manuell |

**Bruk alltid SkybertApp for nye deployments.**
