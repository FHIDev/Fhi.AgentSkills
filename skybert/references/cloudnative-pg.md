# CloudNativePG (Postgres i klusteret)

> Verifisert mot `Fhi.Skybert.Infra` @ `449745b`, 2026-08-27.

Operatøren kjører som plattformtjeneste i `cnpg-system` med `config.clusterWide: true`, så
den ser alle namespaces. Chart `cloudnative-pg` 0.29.0 + plugin `plugin-barman-cloud` 0.7.1.
CRD-ene ligger i `crds/base/` (`crds.create: false` i chartet).

Utrullet til alle ni klustere 2026-08-17 (#1222). Tenant-RBAC til alle klustere 2026-08-25
(#1237). **Ingen tenant bruker det ennå** — den første som gjør det er også den første som
finner problemene.

## Storage-fellen

`ontap-nas` er NFSv3 med `nolock`. PostgreSQL trenger fungerende fillåsing for
`postmaster.pid`-vakten, og CloudNativePG støtter ikke NFS for datavolumer. I verste fall
åpner to postmastere samme PGDATA og databasen korrumperes. Det er greit for å røyktest
operatøren, ikke for data vi bryr oss om.

Plattformens plan er å erstatte det med ACSA (Azure Container Storage enabled by Arc).
Namespacet `azure-arc-containerstorage` har hatt Kyverno-unntak siden mars 2026, men det
finnes ingen StorageClass for det i infra-repoet, og ingen CNPG-overlay refererer til en.

**Spør `#ext-fhi-skybert` om det finnes en block-StorageClass tenanten kan bruke på det
aktuelle klusteret før du planlegger en `Cluster` i produksjon.** Er svaret nei, er
alternativene Azure Database for PostgreSQL Flexible Server (Terraform-mønster i
`Fhi.Fida.KI.Tf`) eller VM-Postgres.

## Hva tenanten får lov til

`skybert:tenant-admin:cnpg` aggregeres inn i de miljøspesifikke tenant-admin-rollene.
Bind den med en `RoleBinding` i eget namespace, ikke en `ClusterRoleBinding`.

Full skrivetilgang på `postgresql.cnpg.io`: `clusters`, `backups`, `scheduledbackups`,
`poolers`, `databases`, `databaseroles`, `publications`, `subscriptions`, `imagecatalogs`,
og på `barmancloud.cnpg.io`: `objectstores`. Status-subresursene er read-only.

`clusterimagecatalogs` er bevisst utelatt — den er cluster-scoped.

## Backup: Azure Blob med workload identity

`azureCredentials.inheritFromAzureAD: true`. **Det ligger med vilje ingen secret i
tenant-namespacet:** tenanten har selv `secrets get/list/watch` der, og Kyverno ser aldri
GET eller LIST, så et credential plassert der er lesbart uansett admission-policy. S3 ble
forkastet nettopp fordi `s3Credentials.inheritFromIAMRole` forutsetter AWS og NHN S3
dermed tvinger statiske nøkler.

Azure-forutsetninger, som ikke ligger i infra-repoet:

- En backup-storage account per kluster. Plattformteamet eier disse — bekreft at den finnes
  på ditt kluster før du deklarerer en `Cluster` som faktisk skal ta backup.
- Én managed identity per tenant, med role assignment `Storage Blob Data Contributor`
  scopet til én container, så tenanten når kun egne backups.
- En federated credential på identiteten.

Subjektet er fellen: **service-accounten heter det samme som `Cluster`-ressursen, ikke det
samme som tenanten.** En `Cluster` med navn `pg` i `tn-<tenant>` gir subjektet
`system:serviceaccount:tn-<tenant>:pg`.

```bash
az identity federated-credential create -g $RG --subscription $SUB \
  --identity-name mi-cnpg-$NS --name $NS-$CLUSTER \
  --issuer "$ISSUER" --subject "system:serviceaccount:$NS:$CLUSTER" \
  --audiences api://AzureADTokenExchange
```

`$ISSUER` hentes med `az aks show ... --query oidcIssuerProfile.issuerURL -o tsv`.

## Manifester

`ObjectStore` er namespaced og har ingen cluster-scoped variant, så den ligger i
tenant-namespacet ved siden av `Cluster`. Storage-kontoen leses fra `destinationPath`, så
`azureCredentials.storageAccount` er unødvendig.

```yaml
apiVersion: barmancloud.cnpg.io/v1
kind: ObjectStore
metadata:
  name: pg-backup
  namespace: tn-<tenant>
spec:
  configuration:
    destinationPath: https://<konto>.blob.core.windows.net/cnpg-backups/pg
    azureCredentials:
      inheritFromAzureAD: true
    wal:
      compression: gzip
    data:
      compression: gzip
  retentionPolicy: 30d
```

`inheritedMetadata` setter workload-identity-labelen på podene så webhooken injiserer
tokenet; `serviceAccountTemplate` annoterer SA-en operatøren genererer. **Begge trengs** —
annotasjonen alene gjør ingenting uten labelen.

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: pg
  namespace: tn-<tenant>
spec:
  instances: 3
  storage:
    size: 20Gi
    storageClass: <se storage-fellen over>
  inheritedMetadata:
    labels:
      azure.workload.identity/use: "true"
  serviceAccountTemplate:
    metadata:
      annotations:
        azure.workload.identity/client-id: "<managed identity client id>"
        azure.workload.identity/tenant-id: "54475f80-1baa-4ea9-9185-c0de5cc603fe"
  plugins:
    - name: barman-cloud.cloudnative-pg.io
      isWALArchiver: true
      parameters:
        barmanObjectName: pg-backup
  resources:
    requests: { cpu: 200m, memory: 512Mi }
    limits: { memory: 1Gi }
---
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata:
  name: pg-nightly
  namespace: tn-<tenant>
spec:
  schedule: "0 0 3 * * *"            # seks felt, sekunder først — ikke standard cron
  backupOwnerReference: self
  cluster:
    name: pg
  method: plugin
  pluginConfiguration:
    name: barman-cloud.cloudnative-pg.io
```

Bruk `spec.plugins` som over. In-tree `spec.backup.barmanObjectStore` er deprecated i CNPG
1.30 og kan ikke kombineres med `isWALArchiver`. Et upstream Helm-chart som fortsatt bruker
in-tree-varianten må overrides.

## Rød sone

Sett namespace-labelen `skybert.fhi.no/needs-cnpg=true` i
`tenants/<tenant>/base/namespace.yaml`. Den opter inn i tre GlobalNetworkPolicies som
plattformteamet allerede har lagt inn: ingress fra `cnpg-system` til instanspodene (5432 og
8000), egress til kube-apiserver, og egress til Azure Blob på 443.

CNPGs backup-metrics (9187) scrapes av alloy, og `base-tenant-ingress` blokkerer alloy mot
`tn-*` på rød. **Backup-metrics er derfor ikke tilgjengelige på rød i dag** — overvåk at
backupene faktisk kjører på annen måte der.
