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

> **Merk:** Å spesifisere `autoscaling` aktiverer HPA (Horizontal Pod Autoscaling). `replicas`-feltet blir initial count.

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

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `useWorkloadIdentity` | boolean | `true` | Azure Workload Identity (på som default) |

Podden knyttes automatisk til `<tenant>-azure` service account med federated credentials. Feltet er ikke nevnt i offisiell docs fordi det er slått på som default.

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
  mountAsEnv: true
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

  useWorkloadIdentity: true

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

SkybertApp oppretter følgende Kubernetes-ressurser:

- **Deployment** — Hoved-workload
- **Service** — ClusterIP service (når hostname er satt)
- **Ingress** — NGINX ingress med TLS (når hostname er satt)
- **ConfigMap** — Konfigurasjonsverdier (når config er satt)
- **HorizontalPodAutoscaler** — Autoskalering (når autoscaling er satt)
- **SecretStore** — External Secrets store per vault
- **ExternalSecret** — Synkroniserer secrets fra Azure Key Vault

## SkybertApp vs WebApp

| | SkybertApp (v1alpha1) | WebApp (v1) |
|---|---|---|
| **Status** | Aktiv, anbefalt | **Utdatert** |
| **Secrets** | Inline i spec | Manuell SecretStore + ExternalSecret |
| **Workload Identity** | `useWorkloadIdentity: true` | Manuell service account + annotations |
| **Sikkerhet** | Automatisk hardening | Manuell securityContext |
| **Config** | `config`-felt (filer + env vars) | Manuell ConfigMap |
| **Init/Sidecar** | Innebygd støtte | Manuell |

**Bruk alltid SkybertApp for nye deployments.**
