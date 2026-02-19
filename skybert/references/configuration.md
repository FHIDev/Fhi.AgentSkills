# Konfigurasjonseksempler

## **Legacy** - WebApp med Workload Identity

> **Merk:** WebApp CRD er utdatert. Bruk [SkybertApp](skybertapp-crd.md) for nye deployments.

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>
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

### WebApp CRD Begrensninger

**Felter som IKKE støttes i WebApp CRD:**
- `livenessProbe` / `readinessProbe` (health checks)
- Visse Kubernetes-native felter

**Anbefaling:**
- Start med minimal konfigurasjon
- Legg til felter gradvis etter behov
- Sjekk med Skybert-teamet før du legger til felter som ikke er dokumentert

## **Legacy** - Deployment med Azure Key Vault Secrets (CSI driver)

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
        image: crfhiskybert.azurecr.io/<tenant>:latest
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

## **Legacy** - SecretProviderClass for Key Vault (CSI driver)

> **Merk:** SecretProviderClass (CSI driver) er legacy. Bruk SkybertApp inline secrets eller ESO (SecretStore + ExternalSecret).

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

## Helm-basert deployment

Struktur:
```
test/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
```

`test/Chart.yaml`:
```yaml
apiVersion: v2
name: <tenant>-app
version: 1.0.0
appVersion: "1.0.0"
```

`test/values.yaml`:
```yaml
image:
  repository: crfhiskybert.azurecr.io/<tenant>
  tag: latest

ingress:
  enabled: true
  hostname: <tenant>.skytest.fhi.no
```

## Kustomize-basert deployment

`test/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: tn-<tenant>

resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml

images:
  - name: app
    newName: crfhiskybert.azurecr.io/<tenant>
    newTag: latest
```

## **Legacy** - Minimal WebApp for rask start

> **Merk:** WebApp CRD er utdatert. Bruk [SkybertApp](skybertapp-crd.md) for nye deployments.

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>
      tag: "latest"

  ingress:
    enabled: true
    hostname: <tenant>.skytest.fhi.no
```

**Merk**: DNS-oppføring og TLS-sertifikat opprettes automatisk basert på hostname.

## Prod-konfigurasjon

For produksjon brukes `pn-` namespace-prefiks og `*.sky.fhi.no` hostname:

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: <tenant>-web
  namespace: pn-<tenant>
spec:
  image:
    repository: crfhiskybert.azurecr.io/<tenant>/<tenant>
    tag: "1.0.0"
  hostname: <tenant>.sky.fhi.no
  useWorkloadIdentity: true
```

**Viktig:** Samme image brukes i test og prod. Promotion skjer via manuell workflow, ikke egen build.
