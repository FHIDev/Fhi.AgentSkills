# SkybertApp CRD-spesifikasjon

Kanonisk feltreferanse for `SkybertApp` i dagens docs og infra. Gjeldende standard er beta-APIet
`skybert-beta.fhi.no/v1beta1` med Gateway API og `network`-felt. Alpha-varianten
`skybert.fhi.no/v1alpha1` ligger fortsatt som legacy og migreringssti.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp-beta.yaml

## API

```yaml
apiVersion: skybert-beta.fhi.no/v1beta1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  network: fhinett
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0
```

`SkybertApp` er et namespaced Crossplane XRD. I infra-repoet finnes både alpha- og beta-XRD-en:
- `skybertapps.skybert.fhi.no` / `skybert.fhi.no/v1alpha1` (legacy)
- `skybertapps.skybert-beta.fhi.no` / `skybert-beta.fhi.no/v1beta1` (gjeldende)

For nye workloads skal beta-APIet brukes. Migrering fra alpha følger [migrate-alpha-to-beta](https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/index.md · https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/

## Quick Start

```yaml
apiVersion: skybert-beta.fhi.no/v1beta1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  network: fhinett
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0
```

`network` avgjør hvilket Gateway-tilknyttede nettverk appen skal eksponeres på. `hostname` brukes for TLS/GatewayAPI tilknytning når appen skal eksponeres.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/

## Spec Reference

### Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `image.repository` | string | **påkrevet** | Container image repository |
| `image.tag` | string | **påkrevet** | Container image tag |
| `port` | integer | `8080` | Port appen lytter på |
| `command` | string[] | — | Overstyr container command |
| `args` | string[] | — | Argumenter til containeren |
| `resources.cpu` | string | `150m` | CPU request |
| `resources.memory` | string | `256Mi` | Memory request + limit |
| `readOnlyRootFilesystem` | boolean | `false` | Monter rootfs som read-only |
| `writableDirs` | string[] | — | Writable emptyDir-mounts |

Compositionen setter `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, `runAsNonRoot: true` og `seccompProfile: RuntimeDefault` for poden. Imaget må kunne kjøre som UID 1000.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml

### Scaling

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `replicas` | integer | `1` | Antall pod-replikaer |
| `autoscaling.minReplicas` | integer | `1` | Minimum replikaer for HPA |
| `autoscaling.maxReplicas` | integer | `5` | Maksimum replikaer for HPA |
| `autoscaling.targetCPU` | integer | `80` | Mål-CPU-utilisering % |
| `autoscaling.targetMemory` | integer | `80` | Mål-memory-utilisering % |

Når `autoscaling` er satt, brukes `autoscaling.minReplicas` som initial vertikal/horisontal skalering. `replicas` er da reservert for initial count og overstyrt av HPA.

### Health Probes

Ingen probes er påkrevd, men hvis `probes` brukes må hver probe ha `path`.

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `probes.liveness.path` | string | **påkrevet** | HTTP path for liveness |
| `probes.liveness.port` | integer | `spec.port` | Port for liveness |
| `probes.liveness.initialDelaySeconds` | integer | `10` | Delay før første probe |
| `probes.liveness.periodSeconds` | integer | `10` | Intervall |
| `probes.liveness.timeoutSeconds` | integer | `3` | Timeout |
| `probes.liveness.failureThreshold` | integer | `3` | Feil før restart |
| `probes.readiness.path` | string | **påkrevet** | HTTP path for readiness |
| `probes.readiness.port` | integer | `spec.port` | Port for readiness |
| `probes.readiness.initialDelaySeconds` | integer | `5` | Delay |
| `probes.readiness.periodSeconds` | integer | `3` | Intervall |
| `probes.readiness.timeoutSeconds` | integer | `2` | Timeout |
| `probes.readiness.failureThreshold` | integer | `2` | Feil før pod fjernes fra endpoints |
| `probes.startup.path` | string | **påkrevet** | Startup-probe |
| `probes.startup.port` | integer | `spec.port` | Port for startup |
| `probes.startup.initialDelaySeconds` | integer | `0` | Delay |
| `probes.startup.periodSeconds` | integer | `5` | Intervall |
| `probes.startup.timeoutSeconds` | integer | `3` | Timeout |
| `probes.startup.failureThreshold` | integer | `60` | Feil før startup feiler |

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

### Pod Disruption Budget

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `podDisruptionBudget.enabled` | boolean | auto | Manuelt enable/disable av PDB |
| `podDisruptionBudget.minAvailable` | integer eller "X%" | `"33%"` | Minimum tilgjengelige pods |
| `podDisruptionBudget.maxUnavailable` | integer eller "X%" | — | Maksimum utilgjengelige pods |

SkybertApp oppretter automatisk PDB når `replicas > 1`, `autoscaling.minReplicas > 1` eller når `enabled` settes eksplisitt. Bruk bare ett av `minAvailable` og `maxUnavailable`.

```yaml
replicas: 3
podDisruptionBudget:
  minAvailable: "33%"
```

### Networking

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `network` | string | `fhinett` | `fhinett`, `helsenett` eller `internett` |
| `hostname` | string | — | Hostname som skal eksponeres via Gateway API |

`network` avgjør hvilket nettverk appen kobles til. `hostname` brukes til faktisk publisering og TLS. `fhinett` holder tjenesten internt i FHI/NIPH; `helsenett`/`internett` publiseres via plattformens offentlige domener.

Støttede domener:
- `fhinett`: `*.skybert`-domener i valgt cluster (for eksempel `.green.skybert`, `.yellowtest.skybert`)
- `helsenett`/`internett` (test): `*.skytest.fhi.no`
- `helsenett`/`internett` (prod): `*.sky.fhi.no`

TLS-sertifikat provisjoneres automatisk via cert-manager.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp-beta.yaml

### Metrics

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `metrics.port` | integer | **påkrevet** | Port på `/metrics`-endepunktet |
| `metrics.path` | string | `/metrics` | Path til metrics-endepunktet |
| `metrics.scheme` | string | `http` | `http` eller `https` |

Setter `metrics` aktiverer Prometheus-scraping med pod-annotations.

```yaml
metrics:
  port: 9090
```

### Configuration

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `config` | object | — | Key-value-par for miljøvariabler / konfig-filer |

Verdier monteres under `/config` og injiseres som miljøvariabler i alle containere.

```yaml
config:
  LOG_LEVEL: info
  API_URL: https://api.example.com
```

### Secrets

Secrets hentes fra Azure Key Vault og monteres automatisk i alle containere.

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `secrets[].vault` | string | **påkrevet** | Azure Key Vault-navn |
| `secrets[].keys` | array | **påkrevet** | Nøkkelset som skal hentes |
| `secrets[].keys[].remote` | string | **påkrevet** | Nøkkelnavn i Key Vault |
| `secrets[].keys[].local` | string | samme som `remote` | Nøkkelnavn i Kubernetes Secret |
| `secrets[].keys[].property` | string | — | JSON-property å ekstrahere |
| `secrets[].name` | string | `<vault-lowercase>-secret-<index>-<app-name>` | Kubernetes Secret-navn |
| `secrets[].mountAsFiles` | boolean | `true` | Monter som filer |
| `secrets[].mountAsEnv` | boolean | `false` | Setter som miljøvariabler |
| `secrets[].mountPath` | string | `/secrets/<secret name>` | Mount-path |
| `secrets[].secretType` | string | `Opaque` | Secret-type |
| `secrets[].labels` | object | — | Ekstra labels |
| `secrets[].annotations` | object | — | Ekstra annotations |

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

### Status og scale-subresource

XRD-en eksponerer `/scale` og `status`-felt:

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `status.replicas` | integer | Katalog over `readyReplicas` fra Deployment |
| `status.labelSelector` | string | Selector som matcher podene til appen |

`kubectl get skybertapp` viser kolonnene `DESIRED` og `CURRENT`.

## Genererte ressurser

| Ressurs | Navn | Opprettes når |
|---------|------|---------------|
| Deployment | `<name>-deployment` | Alltid |
| Service | `<name>-svc` | Når `hostname` er satt |
| ListenerSet/HTTPRoute | `listenerset-gw-<name>-<network>` / `<name>-httproute-gw-<network>` | Når `hostname` er satt |
| ConfigMap | `<name>-config` | Når `config` er satt |
| HPA | `<name>-hpa` | Når `autoscaling` er satt |
| PDB | `<name>-pdb` | Når PDB-betingelsen er oppfylt |
| SecretStore / ExternalSecret | Per vault | Når `secrets` er satt |

For mer detaljer om render, se [SkybertApp rendering](skybertapp-render.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml

## Beta (Gateway API)

`skybert-beta.fhi.no/v1beta1` rendrer `ListenerSet` + `HTTPRoute` i stedet for nginx `Ingress` og bruker Gateway API med `network`-valg:

| Felt | Standard | Beskrivelse |
|------|----------|-------------|
| `network` | `fhinett` | `fhinett`, `helsenett` eller `internett` |
| `hostname` | — | Hostname som trigges via Gateway eksponering og TLS |

`fhinett` går via tenantens egen gateway; `helsenett`/`internett` går via delt Envoy Gateway i platformen.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml

## Legacy / alpha

Alpha-varianten (`skybert.fhi.no/v1alpha1`) brukes fortsatt for eksisterende workloads og migrering. Nyutvikling bør bruke beta-APIt med `network`-feltet.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp-alpha.yaml
