# Legacy: WebApp CRD og CSI driver (UTDATERT)

> **ADVARSEL:** WebApp CRD og Key Vault CSI driver er utdatert. Bruk [SkybertApp](skybertapp-crd.md) og ESO/inline secrets (se [Secrets-mønstre](secrets.md)) for alle nye deployments. Denne filen finnes for eksisterende workloads og migrering.

## WebApp CRD-spesifikasjon

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/crossplane/base/xrds/webapp.yaml

### API

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
```

### Spec Reference — Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `container.image.repository` | string | **påkrevet** | Container image repository |
| `container.image.tag` | string | **påkrevet** | Container image tag |
| `container.port` | integer | `8080` | Container-port |
| `container.command` | string[] | — | Overstyr kommando |
| `container.resources.requests.cpu` | string | `150m` | CPU request |
| `container.resources.requests.memory` | string | `256Mi` | Memory request |
| `container.resources.limits.cpu` | string | `300m` | CPU limit |
| `container.resources.limits.memory` | string | `512Mi` | Memory limit |
| `container.secrets.name` | string | **påkrevet** | Secret-navn |
| `container.secrets.path` | string | `/secrets` | Secret-monteringssti |
| `container.secrets.asEnv` | boolean | `false` | Monter som env vars |
| `container.readOnlyRootFilesystem` | boolean | `false` | Read-only root |

### Viktige forskjeller fra SkybertApp

| Aspekt | WebApp | SkybertApp |
|--------|--------|-----------|
| API-versjon | `v1` | `v1alpha1` |
| Struktur | Nestet under `container.` | Flat |
| Resources | Separate requests/limits | Kun request (limit = request for memory) |
| CPU limit | Ja (`300m` default) | Nei (kun request) |
| Secrets | Enkelt secret-objekt | Array av secrets med vault-integrasjon |
| Workload Identity | Manuell | Automatisk |
| Config | Ikke innebygd | `config`-felt |

### WebApp CRD Begrensninger

**Felter som IKKE støttes i WebApp CRD:**
- `livenessProbe` / `readinessProbe` (health checks)
- Visse Kubernetes-native felter

**Anbefaling:**
- Start med minimal konfigurasjon
- Legg til felter gradvis etter behov
- Sjekk med Skybert-teamet før du legger til felter som ikke er dokumentert

## Migrering fra WebApp til SkybertApp

1. Endre `apiVersion` fra `skybert.fhi.no/v1` til `skybert.fhi.no/v1alpha1`
2. Endre `kind` fra `WebApp` til `SkybertApp`
3. Flytt felt fra `container.*` til toppnivå (`image`, `port`, `resources`)
4. Konverter secrets til SkybertApp-format med `vault`-felt
5. Fjern manuell SecretStore/ExternalSecret — SkybertApp oppretter disse automatisk
6. Fjern `serviceAccount`-konfigurasjon — Workload Identity er automatisk

## Eksempler for eksisterende workloads

### Minimal WebApp for rask start

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>_test
      tag: "latest"

  ingress:
    enabled: true
    hostname: <tenant>.skytest.fhi.no
```

**Merk**: DNS-oppføring og TLS-sertifikat opprettes automatisk basert på hostname.

### WebApp med Workload Identity

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>_test
      tag: "v1.0.0"
    env:
      - name: AZURE_CLIENT_ID
        value: "<client-id>"

  serviceAccount:
    name: <tenant>-azure
    annotations:
      azure.workload.identity/client-id: "<client-id>"

  ingress:
    enabled: true
    hostname: <tenant>.skytest.fhi.no
    tls:
      enabled: true
```

### Deployment med Azure Key Vault Secrets (CSI driver)

> **Merk:** CSI driver er legacy. Bruk SkybertApp inline secrets eller External Secrets Operator (ESO) i stedet.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  replicas: 2
  selector:
    matchLabels:
      app: <tenant>-app
  template:
    metadata:
      labels:
        app: <tenant>-app
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: <tenant>-azure
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: app
        image: crfhiskybert.azurecr.io/<tenant>_test:latest
        securityContext:
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
        env:
        - name: AZURE_CLIENT_ID
          value: "<client-id>"
        volumeMounts:
        - name: secrets-store
          mountPath: /mnt/secrets
          readOnly: true
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: <tenant>-secrets
```

### SecretProviderClass for Key Vault (CSI driver)

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: <tenant>-secrets
  namespace: tn-<tenant>
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "false"
    clientID: "<client-id>"
    keyvaultName: "<keyvault-name>"
    tenantId: "<tenant-id>"
    objects: |
      array:
        - |
          objectName: database-password
          objectType: secret
          objectVersion: ""
```
