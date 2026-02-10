# SkybertApp CRD-spesifikasjon

## API

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
```

**Status:** Alpha - kan ha breaking changes.

## Komplett eksempel

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
  hostname: myapp.skytest.fhi.no
  useWorkloadIdentity: true
  secrets:
    - vault: kv-myteam-myapp-test
      keys:
        - remote: database-password
          local: DB_PASSWORD
      mountAsEnv: true
  writableDirs:
    - /tmp
    - /app/cache
```

## Funksjoner

SkybertApp håndterer automatisk:
- **Secrets**: Spesifiser vault-navn og nøkler - SecretStore + ExternalSecret opprettes automatisk
- **Workload Identity**: Sett `useWorkloadIdentity: true` for passordløs Azure-autentisering
- **Ingress + TLS**: DNS og sertifikater provisjoneres automatisk basert på `hostname`
- **Sikkerhetshardening**: Non-root, read-only filesystem (bruk `writableDirs` for unntak)
- **HPA**: Autoskalering basert på CPU/minne

## Begrensninger

- Memory limit er alltid lik request
- Alpha API (kan ha breaking changes)

## SkybertApp vs WebApp

| | SkybertApp (v1alpha1) | WebApp (v1) |
|---|---|---|
| **Status** | Aktiv, anbefalt | **Utdatert** |
| **Secrets** | Inline i spec | Manuell SecretStore + ExternalSecret |
| **Workload Identity** | `useWorkloadIdentity: true` | Manuell service account + annotations |
| **Sikkerhet** | Automatisk hardening | Manuell securityContext |

**Bruk alltid SkybertApp for nye deployments.**

## Minimal konfigurasjon

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-app
  namespace: tn-myteam-myapp
spec:
  image:
    repository: crfhiskybert.azurecr.io/myteam/myapp
    tag: "latest"
  hostname: myapp.skytest.fhi.no
```
