# Secrets-mønstre

Alle secrets ligger i Azure Key Vault og synkes inn i podene via External Secrets Operator (ESO)
med Workload Identity — aldri i image, kode eller Git. Anbefalt rekkefølge: **SkybertApp `secrets[]`**
først; manuell SecretStore + ExternalSecret bare for raw Deployments og andre workloads utenfor SkybertApp.

> Kilde: https://docs.sky.fhi.no/miscellaneous/vault_secrets/

## Anbefalt: SkybertApp inline secrets

`spec.secrets[]` i SkybertApp oppgir vault-navn og nøkler (`remote` i Key Vault, valgfritt `local`-navn
og `property` for JSON-uttrekk). Composition oppretter én SecretStore per unike vault og én
ExternalSecret per innslag (`refreshInterval: 10m`), begge med `authType: WorkloadIdentity` og
`serviceAccountRef: <tenant>-azure`. Secreten monteres som filer under `/secrets/<secret name>` som
standard (`mountAsFiles: true`); `mountAsEnv: true` injiserer den i tillegg som miljøvariabler, og
`mountPath` overstyrer filstien. Feltoversikt og eksempel: [SkybertApp CRD — Secrets](skybertapp-crd.md#secrets).

### Navn på genererte secrets

Uten `secrets[].name` heter den genererte Kubernetes-secreten
`<vault-lowercase>-secret-<index>-<app-navn>`, og ExternalSecret-ressursen
`<vault-lowercase>-es-<index>-<app-navn>`. `<app-navn>` er `metadata.name` på SkybertApp-en.
Docs' referanseliste viser mønsteret uten `-<app-navn>` — composition er autoritativ.

**Skal andre ressurser referere til secreten ved navn — sett `name` eksplisitt.** Da er du uavhengig
av composition-versjonen:

```yaml
secrets:
  - name: my-app-secrets     # stabilt navn, uavhengig av composition
    vault: my-keyvault
    keys:
      - remote: database-password
        local: DB_PASSWORD
```

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

## Manuell: SecretStore + ExternalSecret (ESO)

For raw Deployments og andre workloads utenfor SkybertApp. Service accounten `<tenant>-azure` er
allerede annotert med identitetens client-id, så du trenger bare en SecretStore som peker på vaulten,
en ExternalSecret som beskriver secreten, og et volum i Deploymenten.

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

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: tn-<tenant>
spec:
  refreshInterval: 5m
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

ExternalSecret oppretter Kubernetes-secreten `myapp-db-secret`; monter den som et vanlig
`secret`-volum i Deploymenten (`volumes[].secret.secretName: myapp-db-secret` + `volumeMounts`).

> Kilde: https://docs.sky.fhi.no/miscellaneous/vault_secrets/

## Key Vault

Tenanten oppretter selv Key Vault i egen Azure-subscription (anbefalt én for test og én for prod) og gir
tenantens managed identity `tn-<tenant>-skybert-sa-<env>` lesetilgang til secretene. Plattformen
oppretter og federerer identiteten, men setter ikke opp tilganger. Bruk vault-navnet i
`secrets[].vault` eller `vaultUrl`. Se [Sikkerhet — Tilgang til Azure-ressurser](security.md#tilgang-til-azure-ressurser).

> Kilde: https://docs.sky.fhi.no/get-started/prerequisites/application/

## Rotasjon og oppdatering

Når en secret endres i Azure Key Vault, oppdateres mountede secret-filer automatisk i containeren.
Hvis applikasjonen ikke leser filendringer fortløpende, kan **Reloader** (plattformkomponent,
installert på alle klustere) restarte poden automatisk når den monterte secreten endres —
docs omtaler dette som å «enable reloader» på workloaden.

> Kilde: https://docs.sky.fhi.no/miscellaneous/vault_secrets/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/reloader/
