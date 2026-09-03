# Konfigurasjonseksempler

## SkybertApp

SkybertApp er anbefalt måte å deploye på. GitOps-repoet leveres med `sandbox/`, `test/` og `prod/` som hver inneholder et minimalt SkybertApp-eksempel; start i `sandbox/`, endre image-referansen til `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>`, push og legg til konfigurasjon etter behov. Minimalt manifest og full feltreferanse: se [SkybertApp CRD](skybertapp-crd.md#quick-start). WebApp CRD er udokumentert i docs og ikke anbefalt — se [Legacy: WebApp CRD og CSI driver](legacy-webapp-csi.md).

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/workloads/

## Health probes i .NET-apper

Probe-stiene velger du selv, og stien i `SkybertApp.spec.probes` må være den appen faktisk eksponerer — docs' eksempler er ikke samstemte (probes-siden bruker `/liveness`/`/readiness` i appen og `/healthz`/`/readyz` i manifestet; SkybertApp-referansen bruker `/health/live`/`/health/ready`). Docs' .NET-mønster er Health Checks API med `live`-/`ready`-tags, detaljerte private sjekker (DB, avhengigheter) bundet til en intern port med `.RequireHost("*:<port>")` som ingress ikke eksponerer — `.RequireHost()` er bare en applikasjonslag-sjekk — og ingen tunge migreringer eller kompleks logikk i readiness-proben. For SkybertApp settes probes via [`probes`-feltet](skybertapp-crd.md#health-probes); ingen probes er påkrevd.

> Kilde: https://docs.sky.fhi.no/miscellaneous/probes/ · https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/

## Raw Deployment

Native Kubernetes-manifester (Deployment, StatefulSet, DaemonSet, Service, Ingress osv.) legges i samme miljømappe som SkybertApp og deployes på samme måte — bruk dem når SkybertApp ikke dekker behovet, f.eks. StatefulSet eller DaemonSet. Det SkybertApp ellers gjør for deg må da gjøres manuelt: Workload Identity aktiveres med label og `serviceAccountName` på pod-template (se [Azure Workload Identity](security.md#azure-workload-identity)), og Key Vault-secrets settes opp med SecretStore/ExternalSecret (se [Secrets-mønstre](secrets.md)).

> Kilde: https://docs.sky.fhi.no/workloads/ · https://docs.sky.fhi.no/auth/workload-identity/

## Jobs og CronJobs

Det finnes ingen Skybert-CRD for batch- eller planlagt arbeid; bruk Kubernetes' `Job`/`CronJob` som vanlige manifester i miljømappen. Førsteklasses Skybert-ressurser for jobbmønstre er planlagt uten dato — meld konkrete behov på `#ext-fhi-skybert`. Jobs og CronJobs får ingen VPA-anbefaling i Grafana.

> Kilde: https://docs.sky.fhi.no/workloads/jobs/ · https://docs.sky.fhi.no/workloads/resource-sizing/

## Helm og Kustomize

`oci-push`-workflowen i GitOps-repoet oppdager `Chart.yaml` (Helm) og `kustomization.yaml` (Kustomize) i miljømappen og kjører `helm template` / `kustomize build` før innholdet pakkes til OCI-artefaktet; ingen ekstra konfigurasjon trengs.

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/get-started/gitops-repo/

## Postgres i klusteret (CloudNativePG)

CloudNativePG med barman-cloud er et støttet alternativ på linje med Azure managed databases og NHN, tilgjengelig på alle klustere; plattformen leverer operator, plugin og RBAC, mens tenanten eier backup-lagringskontoen og restore-testen. StorageClass-valg, manifestmønstre, RBAC og fallgruver: se [Persistence og CloudNativePG](persistence.md#cloudnativepg).

> Kilde: https://docs.sky.fhi.no/persistence/postgres/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/cloudnative-pg/
