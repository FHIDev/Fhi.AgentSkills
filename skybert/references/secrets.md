# Secrets-mønstre

## Anbefalt: SkybertApp inline secrets

SkybertApp håndterer SecretStore og ExternalSecret automatisk:

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-app
  namespace: tn-myteam-myapp
spec:
  image:
    repository: crfhiskybert.azurecr.io/myteam/myapp
    tag: "1.0.0"
  secrets:
    - vault: kv-myteam-myapp-test
      keys:
        - remote: database-password
          local: DB_PASSWORD
        - remote: api-key
          local: API_KEY
      mountAsEnv: true
```

## Manuell: SecretStore + ExternalSecret

Påkrevet for raw Kubernetes deployments eller spesielle behov.

### SecretStore

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: myapp-secret-store
  namespace: tn-myteam-myapp
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://kv-myteam-myapp-test.vault.azure.net"
      serviceAccountRef:
        name: myteam-myapp-azure
```

### ExternalSecret

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: tn-myteam-myapp
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

## Key Vault navnekonvensjon

Mønster: `kv-<team>-<app>-<env>`

| Miljø | Eksempel |
|-------|----------|
| Test | `kv-myteam-myapp-test` |
| Prod | `kv-myteam-myapp-prod` |

## Regler

- **Aldri** commit secrets til Git
- **Aldri** legg secrets i container images
- Bruk Azure Key Vault som eneste kilde for secrets
- SkybertApp inline secrets er foretrukket fremfor manuell SecretStore/ExternalSecret
