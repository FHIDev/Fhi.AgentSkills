# SkybertApp CRD-spesifikasjon

Kanonisk feltreferanse for `SkybertApp`, med genererte ressurser og navnekonvensjoner. Feltene er
verifisert mot XRD-en og compositionen i infra-repoet; docs-siden er sekundær der de avviker.

## API

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
```

Namespaced Crossplane XRD (`skybertapps.skybert.fhi.no`), servert på alle klustere. En parallell
beta-XRD `skybert-beta.fhi.no/v1beta1` med `network`-felt finnes kun på `aks-ops-test-01` — se
[Ingress (nginx) og Gateway API (Envoy Gateway)](hostnames-and-networking.md#ingress-nginx-og-gateway-api-envoy-gateway).
WebApp (`skybert.fhi.no/v1`) er udokumentert i docs; bruk SkybertApp for nye workloads — se
[Legacy: WebApp CRD og CSI driver](legacy-webapp-csi.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml

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

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/

## Spec Reference

### Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `image.repository` | string | **påkrevet** | Container image repository |
| `image.tag` | string | **påkrevet** | Container image tag |
| `port` | integer | `8080` | Port applikasjonen lytter på |
| `command` | string[] | — | Overstyr container-kommando |
| `args` | string[] | — | Argumenter til kommandoen (sendes etter `command`) |
| `resources.cpu` | string | `150m` | CPU request — **ingen CPU-limit** settes; containeren kan burste på ledig CPU. Scheduleren pakker noder etter requesten. Se [Ressursanbefalinger i Grafana](observability.md#ressursanbefalinger-i-grafana) |
| `resources.memory` | string | `256Mi` | Memory request **og** limit (samme verdi) — cgroupen OOM-killer containeren på limit |
| `readOnlyRootFilesystem` | boolean | `false` | Monter root-filsystem som read-only |
| `writableDirs` | string[] | — | Kataloger montert som skrivbare emptyDir-volumer |

Compositionen setter i tillegg fast `allowPrivilegeEscalation: false` og `capabilities.drop: [ALL]`
på alle containere, og `runAsNonRoot: true`, `runAsUser`/`runAsGroup`/`fsGroup: 1000` og
`seccompProfile: RuntimeDefault` på poden. Imaget må derfor kunne kjøre som UID 1000.

> Kilde: https://docs.sky.fhi.no/workloads/resource-sizing/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Scaling

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `replicas` | integer | `1` | Antall pod-replikaer |
| `autoscaling.minReplicas` | integer | `1` | Minimum replikaer for HPA |
| `autoscaling.maxReplicas` | integer | `5` | Maksimum replikaer for HPA |
| `autoscaling.targetCPU` | integer | `80` | Mål-CPU-utnyttelse % |
| `autoscaling.targetMemory` | integer | `80` | Mål-minneutnyttelse % |

Å spesifisere `autoscaling` aktiverer HPA. Da settes Deployment-ens `replicas` til
`autoscaling.minReplicas`, ikke `spec.replicas`.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Status og scale-subresource

XRD-en eksponerer `/scale` og et `status`-objekt:

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `status.replicas` | integer | Observert `readyReplicas` fra den genererte Deployment-en |
| `status.labelSelector` | string | `skybert.fhi.no/webapp=<navn>` — selector som matcher app-podene |

`kubectl get skybertapp` viser kolonnene **DESIRED** (`.spec.replicas`) og **CURRENT** (`.status.replicas`).
Scale-subresourcen mapper `.spec.replicas` ↔ `.status.replicas` med `.status.labelSelector`, slik at
autoskalerere kan peke `targetRef` rett på SkybertApp-ressursen — plattformens VPA gjør det. Se
[Ressursanbefalinger (Goldilocks / VPA)](kyverno-policies.md#ressursanbefalinger-goldilocks--vpa).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml

### Health Probes

Ingen probes er påkrevd; hver probe som oppgis krever `path`.

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

For docs' .NET Health Checks-mønster, se [Health probes i .NET-apper](configuration.md#health-probes-i-net-apper).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml

### Pod Disruption Budget

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `podDisruptionBudget.enabled` | boolean | auto | Eksplisitt aktiver/deaktiver PDB |
| `podDisruptionBudget.minAvailable` | int eller "X%" | `"33%"` | Minimum tilgjengelige pods under voluntary disruptions |
| `podDisruptionBudget.maxUnavailable` | int eller "X%" | — | Maksimum utilgjengelige pods |

PDB opprettes automatisk når `replicas > 1` eller `autoscaling.minReplicas > 1`, med mindre
`enabled` er satt eksplisitt. `minAvailable` og `maxUnavailable` er gjensidig utelukkende.

```yaml
replicas: 3
podDisruptionBudget:
  minAvailable: "33%"
```

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Metrics

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `metrics.port` | integer | **påkrevet** | Port `/metrics` lytter på |
| `metrics.path` | string | `/metrics` | Path til metrics-endepunkt |
| `metrics.scheme` | string | `http` | `http` eller `https` |

Når `metrics` er satt, legger compositionen `prometheus.io/scrape: "true"`, `prometheus.io/port`
og ev. `prometheus.io/path`/`prometheus.io/scheme` på pod-template. Seriene rutes til tenantens
Mimir-org av `cortex-tenant` (på `namespace`-labelen). I Grafana finner du appens metrics ved å
filtrere på labelen `app=<metadata.name>`. Se [Metrics med Mimir](observability.md#metrics-med-mimir).

```yaml
metrics:
  port: 9090
```

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/mimir/base/cortex-tenant-0.8.0-values.yaml

### Ingress

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `hostname` | string | `""` | Hostname å eksponere (aktiverer ingress) |

Støttede domener: test `*.skytest.fhi.no` og `*.fhi-k8s.com`, produksjon `*.sky.fhi.no`.
Compositionen velger cert-manager-issuer etter domenesuffiks og feiler på andre hostnavn.
TLS-sertifikat provisjoneres automatisk. Se [Hostnavn og nettverk](hostnames-and-networking.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Configuration

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `config` | object | — | Nøkkel-verdi-par for konfigurasjon |

Config-verdier monteres som filer i `/config` og injiseres som miljøvariabler i alle containere
(hovedcontainer, init og sidecar).

```yaml
config:
  LOG_LEVEL: info
  API_URL: https://api.example.com
  config.json: |
    {
      "setting": "value"
    }
```

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Secrets

Secrets hentes fra Azure Key Vault via ExternalSecret (ESO) med Workload Identity og monteres
automatisk i alle containere.

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `secrets[].vault` | string | **påkrevet** | Azure Key Vault-navn |
| `secrets[].keys` | array | **påkrevet** | Nøkler å hente fra vault |
| `secrets[].keys[].remote` | string | **påkrevet** | Nøkkelnavn i Azure Key Vault |
| `secrets[].keys[].local` | string | samme som `remote` | Nøkkelnavn i Kubernetes secret |
| `secrets[].keys[].property` | string | — | JSON-egenskap å ekstrahere |
| `secrets[].name` | string | `<vault-lowercase>-secret-<index>-<app-navn>` | Kubernetes secret-navn |
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

Docs-tabellen oppgir standardnavnet uten `-<app-navn>`-suffiks; compositionen er autoritativ.
Refererer andre ressurser til secreten, sett `secrets[].name` eksplisitt. Se [Secrets-mønstre](secrets.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### Init Containers

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `initContainers[].name` | string | **påkrevet** | Container-navn |
| `initContainers[].image.repository` | string | **påkrevet** | Image repository |
| `initContainers[].image.tag` | string | **påkrevet** | Image tag |
| `initContainers[].command` | string[] | — | Kommando å kjøre |
| `initContainers[].args` | string[] | — | Argumenter til kommandoen |
| `initContainers[].resources.cpu` | string | `150m` | CPU request |
| `initContainers[].resources.memory` | string | `256Mi` | Memory request/limit |
| `initContainers[].readOnlyRootFilesystem` | boolean | `false` | Read-only root filesystem |
| `initContainers[].writableDirs` | string[] | — | Skrivbare emptyDir-monteringer |

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml

### Sidecar Containers

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `sidecarContainers[].name` | string | **påkrevet** | Container-navn |
| `sidecarContainers[].image.repository` | string | **påkrevet** | Image repository |
| `sidecarContainers[].image.tag` | string | **påkrevet** | Image tag |
| `sidecarContainers[].command` | string[] | — | Kommando å kjøre |
| `sidecarContainers[].args` | string[] | — | Argumenter til kommandoen |
| `sidecarContainers[].resources.cpu` | string | `150m` | CPU request |
| `sidecarContainers[].resources.memory` | string | `256Mi` | Memory request/limit |
| `sidecarContainers[].readOnlyRootFilesystem` | boolean | `false` | Read-only root filesystem |
| `sidecarContainers[].writableDirs` | string[] | — | Skrivbare emptyDir-monteringer |

Sidecars rendres som native sidecars (under `initContainers` med `restartPolicy: Always`) når `initContainers` også er angitt; uten init-containere rendres de som vanlige containere
i Deployment-en, og vises slik i `kubectl describe pod`.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

## Generated Resources

| Ressurs | Navn | Opprettes når |
|---------|------|---------------|
| Deployment | `<name>-deployment` (hovedcontainer `<name>-main`) | Alltid |
| Service (ClusterIP) | `<name>-svc` | `hostname` er satt |
| Ingress (nginx, TLS) | `<name>-ingress` (TLS-secret `<name>-tls`) | `hostname` er satt |
| ConfigMap | `<name>-config` | `config` er satt |
| HorizontalPodAutoscaler | `<name>-hpa` | `autoscaling` er satt |
| PodDisruptionBudget | `<name>-pdb` | Se [Pod Disruption Budget](#pod-disruption-budget) |
| SecretStore | `<vault-lowercase>-<name>` | Én per unik vault i `secrets[]` |
| ExternalSecret | `<vault-lowercase>-es-<index>-<name>` | Én per element i `secrets[]` |
| Secret (fra ExternalSecret) | `<vault-lowercase>-secret-<index>-<name>` (eller `secrets[].name`) | Én per element i `secrets[]` |

`<name>` er `metadata.name` på SkybertApp-en. Deployment, Service og PDB bruker labelen
`skybert.fhi.no/webapp: <name>` som selector; podene får i tillegg `app: <name>`. Pod-template får
`azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure`; service accounten
provisjoneres av tenant-bootstrap, ikke av SkybertApp — se
[Azure Workload Identity](security.md#azure-workload-identity).

For å se manifestene en konkret SkybertApp rendrer til, uten kluster-tilgang, se
[SkybertApp rendering](skybertapp-render.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml
