# Persistence og CloudNativePG

Kanonisk fil for StorageClasses, databasevalg og CloudNativePG (CNPG). Andre filer lenker hit.

## StorageClasses

Skybert kjører AKS på **Azure Local**, og StorageClassene kommer fra fire ulike CSI-drivere.
`kubectl get sc` på eget kluster er autoritativt — dette er forventet liste:

| StorageClass | Provisioner | Reclaim | Access | Hva det er |
|:--|:--|:--|:--|:--|
| `cloud-backed-sc` | `wyvern.csi.azure.com` | Delete | RWO | Block-volum med Azure-kopi — overlever node-tap. **Start her.** |
| `cloud-backed-retain-sc` | `wyvern.csi.azure.com` | Retain | RWO | Samme, men PV-en overlever PVC-en |
| `unbacked-sc` | `wyvern.csi.azure.com` | Delete | RWO | Block-volum kun på Azure Local-klusteret, ingen cloud-kopi |
| `unbacked-retain-sc` | `wyvern.csi.azure.com` | Retain | RWO | Samme med Retain |
| `default` | `disk.csi.akshci.com` | Delete | RWO | Node-lokal disk. Kluster-default, og den svakeste av disse |
| `ontap-nas` | `csi.trident.netapp.io` | Delete | RWM | NFSv3 på NetApp ONTAP. Delte filer på tvers av pods |
| `blob-fuse` | `blob.csi.azure.com` | Delete | RWM | Azure Blob montert som filsystem — se advarsel under |

Alle støtter volume expansion. **Ingen av dem er backup:** det finnes ingen `VolumeSnapshotClass`
på klusterne — ingen volume snapshots og ingen point-in-time restore. Applikasjonsnivå-backup er
ditt ansvar; for PostgreSQL gjør [CloudNativePG](#cloudnativepg) akkurat det.

- **`Delete` vs `Retain`:** `Delete` fjerner PV-en (og dataene) når PVC-en slettes. `Retain` lar
  PV-en stå som `Released` — den holder disk, koster penger og gjenbrukes aldri automatisk. Velg
  `Retain` når en utilsiktet `kubectl delete pvc` eller `prune: true` ikke skal være slutten på
  dataene, og rydd manuelt: `kubectl get pv | grep Released`.
- **Databaser og skrivesensitivt:** `cloud-backed-sc`, eller `cloud-backed-retain-sc` når PVC-tap
  ikke skal bety datatap. **Aldri database på `ontap-nas`:** klassen er definert med
  `mountOptions: [nfsvers=3, nolock]`, så den gir ingen av konsistensgarantiene en database
  trenger — i verste fall åpner to prosesser samme datakatalog — og CNPG støtter ikke NFS for PGDATA.
- **Cache/scratch:** `unbacked-sc` eller `default`.
- **Delte filer flere pods:** `ontap-nas` — eneste klasse med `ReadWriteMany` for vanlig filtilgang.
- **`blob-fuse` peker på delt konto** definert én gang for hele plattformen (alle klustere og
  tenanter lander samme sted), og har ikke-POSIX-semantikk (ingen locking, ingen partial writes).
  Avklar på `#ext-fhi-skybert` før bruk.

> Kilde: https://docs.sky.fhi.no/persistence/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/trident/base/nas-sc.yaml

## Databasevalg

Tre støttede alternativer på samme nivå — velg på avveining, ikke hierarki:

| Alternativ | Når |
|:--|:--|
| **CloudNativePG in-cluster** | PostgreSQL som skal bo ved appen, i samme GitOps-repo, på samme identitet |
| **Azure managed** (SQL, PostgreSQL, Cosmos …) | Grønn/gul med Azure-subscription, og alt som ikke er PostgreSQL |
| **NHN Moderne Etatsplattform** | Rød sone, eller når Azure ikke er aktuelt |

Den reelle forskjellen er **hvem som beviser at restore virker**: med Azure/NHN gjør de det; med
CNPG automatiserer operatoren replikering/failover/backup, men du eier lagringskontoen og
restore-testen. CNPG er kun for PostgreSQL — alt annet betyr fortsatt Azure, NHN eller en prat på
`#ext-fhi-skybert`.

Docs-konflikt: `get-started/prerequisites/application.md` sier fortsatt «Databases should be
hosted outside Kubernetes for now». Persistence-sidene er mer spesifikke og legges til grunn her.

> Kilde: https://docs.sky.fhi.no/persistence/ · https://docs.sky.fhi.no/get-started/prerequisites/application/

## CloudNativePG

Operatoren (`cnpg-system`, CloudNativePG 1.30.0 via chart `cloudnative-pg` 0.29.0) og
barman-cloud-pluginen (`plugin-barman-cloud` v0.14.0 via chart 0.7.1) er utrullet på alle klustere
som Flux-Kustomization `cloudnative-pg` med `dependsOn: crds` og `cert-manager` (pluginen trenger
cert-manager for sitt CNPG-I mTLS-oppsett). CRD-ene forvaltes separat i `crds/` (`crds.create:
false`). Operatoren ser alle namespaces, så en `Cluster` i `tn-<tenant>` rekonsileres uten videre.
**Du eier backupen:** egen storage account, egen container, egen restore-test — plattformen
leverer operator, plugin og RBAC.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/cloudnative-pg/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/flux-system/base/kustomizations-infra/cloudnative-pg.yaml

### RBAC — hva tenanten kan administrere

| API-gruppe | Ressurser | Tilgang |
|------------|-----------|---------|
| `postgresql.cnpg.io` | `clusters`, `backups`, `scheduledbackups`, `poolers`, `databases`, `databaseroles`, `publications`, `subscriptions`, `imagecatalogs` | Full CRUD |
| `postgresql.cnpg.io` | `failoverquorums`, samt `*/status` for clusters/backups/scheduledbackups/poolers | Kun lesing (operatør-eid) |
| `barmancloud.cnpg.io` | `objectstores` | Full CRUD |

Fragmentet `skybert:tenant-admin:cnpg` aggregeres inn i alle de miljøspesifikke
tenant-admin-rollene **og** i `skybert:tenant-flux-reconciler` — det siste er det som gjør at en
`Cluster` i GitOps-repoet faktisk rekonsileres. Rettighetene følger bindingene tenanten allerede
har; lag ingen ny RoleBinding. `clusterimagecatalogs` er bevisst utelatt — kluster-scoped
ressurser inngår ikke i tenant-admin-settet.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/cnpg-access-rules.yaml

### Før du oppretter en Cluster

- **Storage account** med **private endpoint** inn i kluster-VNet, public network access
  deaktivert.
- **Blob-container** med `Storage Blob Data Contributor` tildelt **på containeren**, ikke kontoen
  — på kontoen skriver et feil containernavn i `destinationPath` stille inn i en annen databases
  backuper; på containeren feiler det med 403.
- **Én federated credential per `Cluster`-ressurs** — subject
  `system:serviceaccount:tn-<tenant>:<cluster-navn>`. Kan henge på eksisterende managed identity;
  grensen er 20 per identitet. CNPG lager en ServiceAccount navngitt etter Cluster-en, så en
  restore-cluster trenger **sin egen** credential — ellers feiler recovery med `AADSTS70021`.
  Opprett den *før* manifestet merges.
- **Rød sone:** meld private endpoint-adressen på `#ext-fhi-skybert` (trenger egress-regel) og be
  om namespace-labelene `skybert.fhi.no/needs-cnpg` og `skybert.fhi.no/needs-entra-login` i samme
  henvendelse. Se [Rød sone](#rød-sone-globalnetworkpolicies) under.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Minimal produksjonsrettet Cluster

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: pg
  namespace: tn-<tenant>
spec:
  instances: 3                    # 3 i prod; 2 er minimum for failover
  imageName: ghcr.io/cloudnative-pg/postgresql:17.6   # pin den
  bootstrap:
    initdb:                       # kjører én gang; oppretter database app, rolle app, secret pg-app
      database: app
      owner: app
  storage:
    size: 20Gi
    storageClass: cloud-backed-retain-sc
  walStorage:                     # fullt PGDATA-volum tar databasen ned
    size: 10Gi
    storageClass: cloud-backed-retain-sc
  # Begge kreves for Workload Identity — ingen av dem virker alene:
  inheritedMetadata:
    labels:
      azure.workload.identity/use: "true"
  serviceAccountTemplate:
    metadata:
      annotations:
        azure.workload.identity/client-id: "<client-id>"
        azure.workload.identity/tenant-id: "<azure-tenant-id>"
  postgresql:
    parameters:
      archive_timeout: "300"      # setter tak på RPO — se fellene
  resources:
    requests: { cpu: 200m, memory: 512Mi }
    limits: { memory: 1Gi }
```

Operatoren lager tre Services: `pg-rw` (skriving, følger primary gjennom failover), `pg-ro`
(lesing fra replikaer), `pg-r` (hvilken som helst instans). En failover dropper eksisterende
forbindelser — connection poolen må reconnecte (test med
`kubectl cnpg promote pg pg-2 -n tn-<tenant>`).

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Databaser, roller og migreringer

`bootstrap.initdb` kjører én gang og kjører **ikke** på et restaurert cluster. Alt annet er
deklarativt: `Database` (immutable `name`/encoding/locale; extensions og schemas per felt) og
`DatabaseRole` (passord i egen `kubernetes.io/basic-auth`-Secret der brukernavn = rollenavn — synk
fra Key Vault, ikke fra git). `databaseReclaimPolicy` er `retain` som default, så `prune: true`
tar ikke dataene. `spec.managed.roles` på Cluster-en gjør samme jobb inline — ikke bruk begge for
én rolle. **`GRANT` er ikke deklarativt** — det hører hjemme i migreringene, kjørt med eget
verktøy (Flyway, Liquibase, EF Core, Alembic) som versjonert Kubernetes `Job` mot `pg-rw`.

Docs sier `kubectl exec` ikke gis til tenanter på noe kluster; infra gir det i praksis kun i
green-test, yellow-test-02, ops-test og sandbox (se
[runtime-restriksjoner](kyverno-policies.md#produksjon--runtime-restriksjoner)). Bruk mønsteret
som virker overalt: kjør SQL fra en kortlivet klient-pod mot `pg-rw` (engangs-pod med
`kubectl run` + `psql`, les passordet fra `pg-app`-secreten). `enableSuperuserAccess` er `false`
som default; settes den til `true`, lander passordet i `pg-superuser`-secreten.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### App-tilkobling

Secreten `pg-app` (opprettet av `bootstrap.initdb`) inneholder `username`, `password`, `dbname`, `host`,
`port`, `uri`, `jdbc-uri`, `pgpass`. **Operatoren roterer passordet** — les det ved pod-start
(f.eks. `secretKeyRef` på `uri`), aldri kopier det.

> **SkybertApp kan ikke lese denne secreten:** SkybertApps `secrets`-blokk er Key Vault-only og
> `config` tar literaler. En app som trenger `pg-app` må være en raw `Deployment`. Si fra på
> `#ext-fhi-skybert` hvis det blokkerer.

**Pooler:** egen `Pooler`-ressurs (navnet må IKKE være likt Cluster-navnet), pgbouncer.
`poolMode: transaction` er der gevinsten er, men bryter session state — `SET`, advisory locks,
`LISTEN`/`NOTIFY`, server-side prepared statements.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Backup

Tre deler: `ObjectStore` (hvor — namespaced, ligger i tenant-namespacet), `ScheduledBackup` (når),
og `spec.plugins` på Cluster-en (kobler dem, `isWALArchiver: true` + `barmanObjectName`). **Uten
plugin-blokken arkiveres ingen WAL.** Storage-kontoen leses fra `destinationPath`;
`azureCredentials.inheritFromAzureAD: true` — ingen secret i namespacet.
`ScheduledBackup.schedule` er **seksfelts Go-cron med sekunder først**: `"0 0 3 * * *"` er 03:00.
Kjør en manuell `Backup` (generateName) rett etter oppsett og verifiser at webhooken injiserte
`AZURE_FEDERATED_TOKEN_FILE` i barman-sidecaren.

**Fellene (kan koste data):**

1. **`destinationPath` må være unik per cluster-generasjon.** Gjenskapes en `Cluster`, får
   PostgreSQL ny system-identifier, men barman skiller arkiver kun på sti. En fersk instans
   krever tomt arkiv og nekter ellers (`Expected empty archive`) — deretter arkiveres **ingenting**,
   mens base-backuper fortsetter å laste opp og rapportere `completed`. Bump generasjonsmarkøren
   i siste segment av `destinationPath` (`…/tn-<tenant>/pg-g1` → `pg-g2`) hver gang Cluster-en
   gjenskapes; ingenting gjør det for deg. `serverName` følger cluster-navnet og endres ikke.
2. **`ContinuousArchiving` er den eneste statusen som teller.** `Ready`, `LastBackupSucceeded` og
   `Phase` kan alle være grønne mens WAL-arkivering feiler — base backup og WAL er separate
   kodeveier, og bare den andre avgjør om restore er mulig. Alarmér på den; ikke stol på å lese
   den manuelt.
3. **RPO = siste *lukkede* WAL-segment.** Segmentet som skrives ligger ikke i arkivet; på en
   stille database kan det stå åpent i timevis. `archive_timeout` setter tak (mot ett 16 MB-objekt
   per intervall).
4. **Private endpoint som bare resolves utenfor klusteret:** er ikke privat DNS-sone linket til
   kluster-VNet, resolves kontoen til offentlig IP, egress droppes, og backup feiler med timeout —
   ikke noe som nevner DNS. Sjekk med `getent hosts <konto>.blob.core.windows.net` fra en pod i
   namespacet, ikke fra laptopen.

Alarmér på `cnpg_collector_last_failed_backup_timestamp` og
`cnpg_collector_pg_wal_archive_status`; følg `cnpg_pg_replication_lag` og `cnpg_backends_total`.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Restore

Restore inn i et **separat** cluster (`bootstrap.recovery` + `externalClusters` med barman-plugin)
og sjekk faktiske rader. `serverName` er **origin**-clusterets navn — barman lagrer under
`<destinationPath>/<serverName>/`; utelates den, leter recovery under restore-clusterets eget navn
og finner ingenting. Uten `recoveryTarget` replayes alt; PITR via `targetTime`, eller pin en
backup med `backupID`.

> **Aldri gi restore-clusteret `spec.plugins`:** arkivering mot samme `barmanObjectName` skriver
> inn i originens WAL-serie og korrumperer den. Uten plugin er `archive_command` `false` —
> arkiveringsfeilene i loggen er forventet.

Rydd opp ved å fjerne filen fra git (Flux pruner) — ikke `kubectl delete` (gjenskapes av Flux).

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Metrics

Instansene eksponerer metrics på port **9187**. Alloy oppdager targets fra pod-annotasjoner
(`prometheus.io/scrape: "true"` + `prometheus.io/port: "9187"` via `inheritedMetadata`);
`spec.monitoring.enablePodMonitor` gjør ingenting — det finnes ingen Prometheus Operator.

> **Ingen CNPG-metrics på rød sone:** `base-tenant-ingress` blokkerer Alloy fra å scrape `tn-*`
> der. Kjent plattform-gap; annotasjonene fikser det ikke. Backup-overvåking på rød er manuell.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Oppgraderinger

- **Minor** (`17.6` → `17.7`): bump `imageName`; `primaryUpdateStrategy: unsupervised` gjør det
  uovervåket.
- **Major:** offline in-place; rollback betyr restore. Øv på en restaurert kopi.
- **Operatoren** er plattformens ansvar — du pinner den ikke.

> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Rød sone (GlobalNetworkPolicies)

`base-tenant-policy` default-denier ingress og egress i `tn-*`, så CNPG trenger tre hull (alle `order: 500`).
Alle er opt-in på namespace-labelen `skybert.fhi.no/needs-cnpg=true`, som plattformteamet setter i
`tenants/<tenant>/base/namespace.yaml`:

| GlobalNetworkPolicy | Retning | Effekt |
|---|---|---|
| `cnpg-ingress-from-operator` | Ingress | Fra `cnpg-system` til instanspodene på 5432 og 8000 (9187/metrics er bevisst utenfor) |
| `cnpg-egress-to-apiserver` | Egress | Instance manager → kube-apiserver |
| `cnpg-egress-to-blob` | Egress | 443 til Azure Storage — plattformforvaltet IP-liste; med private endpoint erstattes den av én VNet-adresse, derfor må adressen meldes |

Token-utvekslingen mot Entra dekkes **ikke** av disse: den ligger i `shared-egress-to-entra`,
som velger på `skybert.fhi.no/needs-entra-login=true` — et separat opt-in. Uten den labelen får
`inheritFromAzureAD: true` aldri et token, og både base-backup og WAL-arkivering feiler.
Replikering mellom instansene dekkes av den Kyverno-genererte `<ns>-internal-access`-GNP-en.
Generelle rød sone-regler: se [Rød sone](hostnames-and-networking.md#rød-sone).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/globalnetworkpolicies/base/policies-red/cnpg.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/globalnetworkpolicies/base/policies-red/shared-egress-to-entra.yaml
