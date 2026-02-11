# Secrets-mønstre

## Anbefalt: SkybertApp inline secrets

SkybertApp håndterer SecretStore og ExternalSecret automatisk:

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: "1.0.0"
  secrets:
    - vault: my-keyvault
      keys:
        - remote: database-password
          local: DB_PASSWORD
        - remote: api-key
          local: API_KEY
      mountAsEnv: true
```

## Manuell: SecretStore + ExternalSecret (ESO)

External Secrets Operator (ESO) er standard mekanisme for secrets-håndtering utenfor SkybertApp. Påkrevet for raw Kubernetes deployments eller spesielle behov.

### SecretStore

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: myapp-secret-store
  namespace: tn-<tenant>
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://<vault-navn>.vault.azure.net"
      serviceAccountRef:
        name: <tenant>-azure
```

### ExternalSecret

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: tn-<tenant>
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: myapp-secret-store
    kind: SecretStore
  target:
    name: myapp-db-secret
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: "database-password"
```

## Key Vault

Key Vault-navnet oppgis av plattformteamet ved onboarding. Det finnes ingen fast navnekonvensjon - bruk det faktiske vault-navnet du har fått tildelt.

## Regler

- **Aldri** commit secrets til Git
- **Aldri** legg secrets i container images
- Bruk Azure Key Vault som eneste kilde for secrets
- SkybertApp inline secrets er foretrukket fremfor manuell SecretStore/ExternalSecret
- ESO (SecretStore + ExternalSecret) er **standard** mekanisme
- CSI driver (SecretProviderClass) er **legacy** - unngå for nye deployments
