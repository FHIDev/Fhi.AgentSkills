# Legacy: WebApp CRD og CSI driver

WebApp (`skybert.fhi.no/v1`) er ikke dokumentert i docs (docs dokumenterer kun SkybertApp), men XRD og composition ligger fortsatt i `infra/crossplane/base/` og er rullet ut på alle klustere. Bruk SkybertApp for nye workloads. Secrets Store CSI driver og `SecretProviderClass` er merket deprecated for tenanter i RBAC-kommentaren («Remove once all tenants have migrated to external-secrets»), men driveren er installert på alle klustere og `skybert:tenant-admin` har fortsatt full CRUD på `secretproviderclasses`. Nye deployments bruker [SkybertApp](skybertapp-crd.md) med `secrets[]`, som henter fra Key Vault og oppretter SecretStore/ExternalSecret (ESO) automatisk; raw Deployments med CSI-volum migreres til ESO (se [Secrets-mønstre](secrets.md)). Denne filen finnes for eksisterende workloads og migrering.

> Kilde: https://docs.sky.fhi.no/workloads/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/secrets-store-csi-driver/

## WebApp CRD-spesifikasjon

### API

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
```

Namespaced Crossplane-XR (`apiextensions.crossplane.io/v2`, `scope: Namespaced`). `spec.container` er eneste påkrevde felt, og i den er kun `image` påkrevd. Schemaet er lukket: felter som ikke står i tabellene under (f.eks. `env`, `serviceAccount`, `probes`, `ingress.tls`, `volumes`) har ingen effekt — de prunes eller avvises avhengig av klient. Ikke bruk dem.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml

### Spec Reference — Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `container.image.repository` | string | **påkrevet** | Container image repository |
| `container.image.tag` | string | **påkrevet** | Container image tag |
| `container.port` | integer | `8080` | Container-port (brukes også av Service og Ingress) |
| `container.command` | string[] | — | Overstyr kommando |
| `container.resources.requests.cpu` | string | `150m` | CPU request |
| `container.resources.requests.memory` | string | `256Mi` | Memory request |
| `container.resources.limits.cpu` | string | `300m` | CPU limit |
| `container.resources.limits.memory` | string | `512Mi` | Memory limit |
| `container.secrets.name` | string | **påkrevet** (når `secrets` er satt) | Må være lik `azureSecrets[].vaultName` — composition monterer CSI-volumet `<name>-mnt` |
| `container.secrets.path` | string | `/secrets` | Monteringssti for CSI-volumet |
| `container.secrets.asEnv` | boolean | `false` | `envFrom` fra det synkede K8s-secretet `<name>-<app>-secretsync` (krever `azureSecrets[].kubernetesSecrets`) |
| `container.readOnlyRootFilesystem` | boolean | `false` | Read-only root |

Health probes finnes ikke i schemaet.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/webapp.yaml

### Spec Reference — Toppnivå

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `initContainers[]` | array | — | Samme feltsett som `container` (`name`, `image`, `command`, `resources`, `secrets`, `readOnlyRootFilesystem`); `name`, `image` og `readOnlyRootFilesystem` er påkrevd |
| `sidecarContainers[]` | array | — | Samme feltsett som `initContainers`; rendres som native sidecar (`restartPolicy: Always`) |
| `ingress.enabled` | boolean | `false` | Oppretter Service + nginx-Ingress; `hostname` påkrevd når `true` |
| `ingress.hostname` | string | — | TLS-sertifikat via cert-manager-issuer valgt etter domene (`skytest.fhi.no`, `fhi-k8s.com`, `sky.fhi.no`); andre domener feiler i render |
| `config[]` | array av `{key, value}` | — | ConfigMap `<app>-config`, montert på `/config` og satt som env vars i alle containere |
| `useWorkloadIdentity` | boolean | `false` | Setter label `azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure`; aktiveres også automatisk når `azureSecrets` er satt |
| `replicas` | integer | `1` | Antall replicas |
| `autoScaling.{minReplicas,maxReplicas,targetCPUUtilizationPercentage,targetMemoryUtilizationPercentage}` | object | `1`/`5`/`80`/`80` | Alle fire påkrevd når objektet er satt. Composition rendrer ingen HPA — feltet har ingen effekt |
| `azureSecrets[].{vaultName,clientId,secrets[],kubernetesSecrets[]}` | array | — | Key Vault via Secrets Store CSI driver: composition lager `SecretProviderClass` `<vaultName>-<app>` og CSI-volum `<vaultName>-mnt`; `kubernetesSecrets[]{name,secretKey}` synker valgte nøkler til K8s-secret `<vaultName>-<app>-secretsync`. `vaultName`, `clientId` og `secrets` er påkrevd |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/webapp.yaml

### Genererte ressurser

Deployment `<app>-deployment` (selector-label `skybert.fhi.no/webapp: <app>`, pod-`securityContext` med `runAsNonRoot`/`runAsUser`/`runAsGroup`/`fsGroup: 1000` og `seccompProfile: RuntimeDefault`, `capabilities.drop: [ALL]` på containerne), ConfigMap `<app>-config` (ved `config`), Service `<app>-svc` og Ingress `<app>-ingress` med TLS-secret `<app>-tls` (ved `ingress.enabled`), og én `SecretProviderClass` per `azureSecrets`-element. Ingen HPA, PDB eller probes.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/webapp.yaml

### Viktige forskjeller fra SkybertApp

| Aspekt | WebApp | SkybertApp |
|--------|--------|-----------|
| API-versjon | `v1` | `v1alpha1` |
| Struktur | Hovedcontainer nestet under `container.` | Flat |
| Resources | `requests`/`limits` for cpu og memory | `resources.cpu` (kun request) og `resources.memory` (request = limit) |
| Health probes | Ikke støttet | `probes.{liveness,readiness,startup}` |
| Ingress | `ingress.enabled` + `ingress.hostname` | `hostname` alene |
| Autoscaling | `autoScaling` i schema, ingen HPA rendres | `autoscaling` gir HPA |
| PodDisruptionBudget | Nei | Automatisk ved `replicas > 1` / `autoscaling.minReplicas > 1` |
| Secrets | `azureSecrets[]` via CSI driver (SecretProviderClass), montert via `container.secrets` | `secrets[]` via ESO (SecretStore/ExternalSecret), montert i alle containere |
| Workload Identity | Opt-in via `useWorkloadIdentity: true` (automatisk ved `azureSecrets`) | Automatisk |
| Config | `config[]` liste av `{key, value}` | `config` map |
| Init-/sidecar-containere | `initContainers[]`/`sidecarContainers[]` innebygd | Samme, i tillegg `args` og `writableDirs` |
| Metrics-scraping | Nei | `metrics` |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml · https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/

## Migrering fra WebApp til SkybertApp

1. `apiVersion` → `skybert.fhi.no/v1alpha1`, `kind` → `SkybertApp`.
2. Flytt `container.image`, `container.port`, `container.command` og `container.readOnlyRootFilesystem` til toppnivå.
3. `container.resources.requests/limits.{cpu,memory}` → `resources.cpu` (kun request, ingen CPU-limit) og `resources.memory` (request = limit). Juster verdiene etter «Request vs Recommendation» i Grafana når appen har kjørt en stund.
4. `ingress.enabled: true` + `ingress.hostname` → `hostname`.
5. `azureSecrets[]` + `container.secrets` → `secrets[]` med `vault` og `keys[].remote`/`local`; `container.secrets.path` → `mountPath`, `container.secrets.asEnv` → `mountAsEnv`. `clientId` faller bort — SkybertApp bruker tenantens identitet. Fjern manuelle SecretProviderClass; SkybertApp oppretter SecretStore/ExternalSecret selv.
6. `config[]` liste av `{key, value}` → `config` map.
7. `autoScaling.{minReplicas,maxReplicas,targetCPUUtilizationPercentage,targetMemoryUtilizationPercentage}` → `autoscaling.{minReplicas,maxReplicas,targetCPU,targetMemory}` (gir faktisk HPA i SkybertApp).
8. Fjern `useWorkloadIdentity` — Workload Identity er automatisk.
9. `initContainers[]`/`sidecarContainers[]`: samme struktur, men `resources` bytter form som i steg 3, og per-container `secrets` finnes ikke — SkybertApp-secrets monteres i alle containere.
10. Legg til `probes` — WebApp har ingen.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://docs.sky.fhi.no/workloads/resource-sizing/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml

## Minimal WebApp (eksisterende workloads)

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <app>
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>/<app>
      tag: "<tag>"
  ingress:
    enabled: true
    hostname: <app>.skytest.fhi.no
  useWorkloadIdentity: true   # valgfritt; utelat hvis appen ikke trenger Azure-tilgang
```

DNS og TLS-sertifikat opprettes automatisk fra `ingress.hostname` (se [Hostnavn og nettverk](hostnames-and-networking.md)).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/webapp.yaml · https://docs.sky.fhi.no/build/

## CSI driver i raw Deployments

Eksisterende raw Deployments som leser Key Vault via CSI driver kjennes igjen på et volum av denne formen, pluss en `SecretProviderClass` (`provider: azure`, `clientID`, `keyvaultName`, `objects` med `objectName`/`objectType: secret`, valgfritt `secretObjects` for synk til K8s-secret) i namespacet:

```yaml
volumes:
  - name: <vault>-mnt
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: <spc-navn>
```

Migrering: erstatt SecretProviderClass + CSI-volum med SecretStore/ExternalSecret (se [Secrets-mønstre](secrets.md)) og monter det resulterende Secret-et som volum eller `envFrom`. Workload Identity på pod-template beholdes uendret (se [Azure Workload Identity](security.md#azure-workload-identity)).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/webapp.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml
