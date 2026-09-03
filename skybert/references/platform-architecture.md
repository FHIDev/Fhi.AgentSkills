# Plattformarkitektur

Kanonisk fil for GitOps-flyt, OCI-flyt, Flux-intervaller, tenant-bootstrap og tenant-RBAC. Klusterliste og tilkobling: [kubectl-access](kubectl-access.md#tilgjengelige-klustere).

## Teknologistakk

| Komponent | Teknologi | Rolle |
|-----------|-----------|-------|
| Container-orkestrering | Kubernetes (Azure Arc-connected) | Kjøremiljø |
| GitOps | Flux v2 (Flux Operator) | Deklarativ konfigurasjon |
| Infrastruktur som kode | Crossplane | CRD-er (SkybertApp; WebApp finnes, men er udokumentert i docs) |
| Policy | Kyverno | Sikkerhetshåndhevelse — se [Kyverno-policier](kyverno-policies.md) |
| Ressursanbefalinger | Goldilocks + VPA (recommend-only, alle klustere) | Se [Ressursanbefalinger](kyverno-policies.md#ressursanbefalinger-goldilocks--vpa) |
| Database | CloudNativePG + plugin-barman-cloud (alle klustere) | Se [Persistence](persistence.md#cloudnativepg) |
| Cloud | Azure | Underliggende infrastruktur |
| Git | GitHub (FHIDev org) | Kildekode og CI/CD |
| Container registry | Azure Container Registry (`crfhiskybert.azurecr.io`) | Image- og GitOps-artifact-lagring |

> Kilde: https://docs.sky.fhi.no/explanations/under-the-hood/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/flux-system/base/kustomizations-infra/

## Komponentkart for tenant-utviklere

De fleste team trenger bare Git/GitOps, SkybertApp og Grafana i starten. Andre komponenter dukker opp som ressurser i namespace, events eller feilmeldinger:

| Komponent | Tenant-relevans |
|-----------|-----------------|
| Flux | GitOps-motoren som applyer tenantens manifester. Tenant-admin kan bruke Flux `Kustomization`, notifications (`Alert`/`Provider`) og Flux Web UI innen eget namespace. |
| External Secrets | Synker Azure Key Vault-secrets til Kubernetes `Secret`. SkybertApp oppretter `ExternalSecret`/`SecretStore` automatisk ved inline secrets. |
| cert-manager | Utsteder og fornyer TLS-sertifikater. Automatisk for SkybertApp-hostnames; avanserte oppsett kan bruke `Certificate`/`Issuer`. |
| Envoy Gateway / Gateway API | Plattformen kjører delte `Gateway`-objekter; tenanter kan bruke `ListenerSet` og `HTTPRoute` i eget namespace. SkybertApp-compositionen rendrer `Ingress`. Se [Hostnavn og nettverk](hostnames-and-networking.md). |
| External DNS | Oppretter DNS-records for hostnames. Vanligvis usynlig. |
| Kyverno | Policy engine. Tenanter kan lese `PolicyReport`, men ikke endre cluster-policyer. |
| Goldilocks / VPA | Recommend-only; anbefalingene leses i Grafana. Se [Kyverno-policier](kyverno-policies.md#ressursanbefalinger-goldilocks--vpa). |
| CloudNativePG | PostgreSQL-operator på alle klustere; tenanten administrerer namespaced CNPG- og barman-ressurser selv. Se [Persistence](persistence.md#cloudnativepg). |
| Grafana, Loki, Mimir, Alloy | Observability-stakk. Grafana er brukerflaten; Alloy samler telemetri. Se [Observability](observability.md). |
| Workload Identity | Passordløs Azure-autentisering. Automatisk for SkybertApp, via label for raw Deployments. Se [Sikkerhet](security.md#azure-workload-identity). |

Øvrige komponenter (Crossplane, Trust Manager, Reloader, Replicator, Trident, MetalLB, CSI-drivere, Metrics Server, kube-state-metrics) er plattformdrevne og konfigureres ikke av tenanter.

> Kilde: https://docs.sky.fhi.no/explanations/tools-and-components/

## Flux GitOps

Flux installeres og oppgraderes via Flux Operator med multi-tenancy aktivert. `FluxInstance`-ressursen (`infra/flux-system/base/flux-instance.yaml`) ligger i base-kustomizationen og gjelder alle klustere; `flux-system`-Kustomizationen har `dependsOn: flux-operator`. Flux Web UI er installert på alle klustere — se [Flux-verktøy](flux-tooling.md).

> Kilde: https://docs.sky.fhi.no/internal/flux/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/flux-system/base/

### Multi-tenancy lockdown

`FluxInstance` setter `cluster.multitenant: true` og `cluster.tenantDefaultServiceAccount: flux-reconciler`. Konsekvenser:

- Alle Flux Kustomizations kjører som namespace-lokal ServiceAccount `flux-reconciler`; tenanter kan ikke opprette ressurser i andre namespaces.
- Remote bases er deaktivert — all YAML må ligge i GitOps-repoet.
- `OCIRepository`-ressursene ligger i plattform-namespacet `tenant-repositories`, ikke per tenant. Derfor patches `kustomize-controller` og `helm-controller` med `--no-cross-namespace-refs=false`; patchen fjernes når OCIRepositories flyttes til tenant-namespacene.
- `source-controller` bruker controller-level Workload Identity mot ACR (ikke per-tenant identitet).

> Kilde: https://docs.sky.fhi.no/internal/flux/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/flux-system/base/flux-instance.yaml

### Rekonsilieringsintervall

- Tenantens Flux `Kustomization`: `interval: 2m`, `prune: true`, `force: true`, `serviceAccountName: flux-reconciler`.
- Tenantens `OCIRepository` (`infra/tenant-repositories/base/ocirepos/oci-<tenant>.yaml`): `interval: 3m0s`, `provider: azure`, `ref.tag: latest`.
- Verste fall fra `oci-push` er ferdig til endringen er applyet: inntil ~5 minutter (3 min før ny digest oppdages + 2 min før Kustomization applyer). Tenanten kan trigge rekonsiliering umiddelbart selv via Flux-dashboardet — se [Flux-verktøy](flux-tooling.md).

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/tenants/exempl/base/flux-kustomization.yaml

### HelmRepository og HelmRelease

Flux støtter HelmRepositories og HelmReleases, men plattformen anbefaler dem ikke:
1. Helm-releases pinner ikke alltid dependencies (ikke-deterministisk)
2. Flux gjenskaper ikke slettede ressurser fra HelmReleases

> Kilde: https://docs.sky.fhi.no/internal/flux/

## Crossplane

SkybertApp er en Crossplane CompositeResourceDefinition (XRD) med Composition i pipeline-modus (`function-go-templating`). Tenanter bruker SkybertApp, ikke Crossplane direkte. WebApp (udokumentert i docs): se [Legacy WebApp/CSI](legacy-webapp-csi.md).

> Kilde: https://docs.sky.fhi.no/explanations/tools-and-components/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

### OCI-artifact flyt

```
GitOps-repo push (main) -> oci-push.yaml -> OCI-artifact -> ACR
                                                            |
Kluster <- Flux Kustomization <- OCIRepository (3m) <- ACR
```

- `oci-push.yaml` i GitOps-repoet pakker mappene `sandbox/`, `test/` og `prod/` (fast liste) til hver sin artifact `crfhiskybert.azurecr.io/<tenant>/gitops_<env>:latest`. Helm (`Chart.yaml`) og Kustomize (`kustomization.yaml`) rendres med `helm template`/`kustomize build` før pakking.
- Hvert kluster har sin `OCIRepository` per tenant som peker på artifacten for klusterets miljø (URL patches i `infra/tenant-repositories/<cluster>/kustomization.yaml`).
- Plattformens egne artifacts (`infra`/`crds`/`tenants`) er Cosign-signert og verifiseres av source-controller (`matchOIDCIdentity`). Tenant-OCIRepositories bootstrappes uten `verify` (unntak: `exempl`); Kyverno `flux-verify-sources` krever bare `oci://crfhiskybert.azurecr.io/*` som kilde.

> Kilde: https://docs.sky.fhi.no/get-started/gitops-repo/ · https://docs.sky.fhi.no/internal/oci-signing/

## Tenant-bootstrap

Hver tenant i infra-repoet har følgende struktur. Namespace-navnet `tn-<tenant>` er likt på alle klustere; klusteret bestemmer miljøet.

```yaml
tenants/<tenant>/
├── base/
│   ├── namespace.yaml                 # tn-<tenant>
│   ├── serviceaccounts.yaml           # flux-reconciler + <tenant>-azure (noen baser: serviceaccount.yaml)
│   ├── rolebinding.yaml               # RoleBinding tenant-admins: flux-reconciler -> skybert:tenant-flux-reconciler
│   ├── entra-access-rolebinding.yaml  # RoleBinding entra-access: Entra-gruppe -> skybert:tenant-admin
│   ├── flux-kustomization.yaml        # Flux Kustomization (sourceRef: OCIRepository <tenant>-gitops i tenant-repositories)
│   └── kustomization.yaml
└── <kluster>/
    └── kustomization.yaml             # Klusterspesifikk overlay
infra/tenant-repositories/base/ocirepos/oci-<tenant>.yaml   # OCIRepository-stub; URL patches per kluster
```

`<tenant>-azure` får Workload Identity-annotasjoner per kluster ved onboarding. Entra-gruppen i `entra-access-rolebinding.yaml` styres av tenantens access package i MyAccess — det avgjør hvem som får kubectl-tilgang til namespacene og Grafana-orgene.

Fire baser (`eurl`, `fida-analyserom`, `healthdcat-assistant`, `johan-exempl`) binder begge RoleBindings til `cluster-admin`, og `scripts/tenant--bootstrap--yaml.sh` genererer fortsatt `cluster-admin` for nye tenanter (RoleBinding-navn `flux-reconciler` og `entra-access`). Les tenantens faktiske `rolebinding.yaml` og `entra-access-rolebinding.yaml` før du konkluderer om rettigheter.

> Kilde: https://docs.sky.fhi.no/internal/managing-tenants/ · https://docs.sky.fhi.no/get-started/blaloypa/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/tenants/exempl/base/

### Tenant-RBAC

Tilgang i tenant-namespaces er en allow-list av ClusterRole-fragmenter i `infra/skybert-system/base/tenant-admin-clusterroles/`, aggregert via labels `rbac.skybert.fhi.no/aggregate-to-*` inn i to ClusterRoles som bindes med RoleBinding i `tn-*`:

- **`skybert:tenant-admin`** — bindes til tenantens Entra-gruppe. Hvert kluster-overlay i `infra/skybert-system/<kluster>/` patcher aggregation-selectoren til én miljølabel: `red-prod`, `red-test`, `yellow-prod` (yellow-prod-01 og norsyss-prod-01), `green-prod` eller `test-sandbox` (green-test-01, yellow-test-02, ops-test-01, sandbox-01).
- **`skybert:tenant-flux-reconciler`** — bindes til ServiceAccount `flux-reconciler`. Samme selector (`aggregate-to-tenant-flux-reconciler`) på alle klustere.

Fragmentene:

| Fragment | Aggregeres til | Gir |
|---|---|---|
| `skybert:tenant-admin:core` | alle miljøroller + flux-reconciler | Namespaced baseline uten wildcards: workloads, services, ingresses, configmaps, secrets, PVC, HPA, PDB, roles/rolebindings, native + Calico NetworkPolicies, cert-manager (`certificates`, `issuers`, `bundles`), Gateway API-ruter og `listenersets`, Envoy `securitypolicies`, `secretproviderclasses`, `externalsecrets`/`secretstores`, alle `skybert.fhi.no`-ressurser, Flux `alerts`/`providers`, Flux `kustomizations` (alle verb — patch for suspend/resume, create/delete for egne ekstra), Flux `ocirepositories` (get/list/watch/patch/update — ikke create/delete, plattform-bootstrappet), `pushsecrets` (kun lese + delete). Lesetilgang: `resourcequotas`, `limitranges`, `verticalpodautoscalers`, `policyreports`, `metrics.k8s.io/pods`, SelfSubjectAccessReview. |
| `skybert:tenant-admin:cnpg` | alle miljøroller + flux-reconciler | CNPG- og barman-ressurser (`clusters`, `backups`, `scheduledbackups`, `poolers`, `databases`, `objectstores` m.m.), alle klustere. Se [Persistence](persistence.md#cloudnativepg). |
| `skybert:tenant-admin:test-sandbox:runtime-access` | kun `test-sandbox` | `pods/exec`, `pods/attach`, `pods/portforward`, `pods/proxy`, `services/proxy`, `pods/ephemeralcontainers` (kubectl debug). Gjelder green-test-01, yellow-test-02, ops-test-01 og sandbox-01. `aks-red-test-01` har **ikke** fragmentet: exec feiler der på RBAC selv om Kyverno tillater exec i red-test. |
| `skybert:tenant-admin:norsyss:runtime-access` | `yellow-prod` + flux-reconciler, kun på `aks-norsyss-prod-01` | `pods/portforward`. |
| `skybert:tenant-flux-reconciler:eso` | kun flux-reconciler | `create`/`update`/`patch` på `pushsecrets`. Holdes unna tenant-admin og workload-SA-er slik at en kompromittert workload ikke kan lage pushsecrets dynamisk. |
| `skybert:tenant-admin:flux-web-ui` | alle miljøroller (ikke flux-reconciler) | Custom verb som Flux Web UI sjekker via SubjectAccessReview: `reconcile`/`suspend`/`resume` på `kustomizations`, `reconcile`/`suspend`/`resume`/`download` på `ocirepositories`, `restart` på deployments/statefulsets/daemonsets/cronjobs/jobs, `get` på `resourcesets` (namespace-filter i UI). Selve endringen krever de native verbene fra core. |

I prod-klustrene blokkerer Kyverno runtime-tilgang i tillegg til RBAC — se [Kyverno-policier](kyverno-policies.md#produksjon--runtime-restriksjoner).

> Kilde: https://docs.sky.fhi.no/internal/skybert-system/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/skybert-system/base/tenant-admin-clusterroles/

### ResourceSet-basert bootstrap

`infra/tenant-bootstrap/` er et proof of concept som bruker Flux `ResourceSet` til å generere tenant-ressurser fra en `ResourceSetInputProvider` per tenant (inputs `tenant`, `entraGroupId`, `wlidClientId`, `ociUrl`). Det er bare aktivert for `exempl` på `aks-ops-test-01`. ResourceSet-en genererer namespace, begge ServiceAccounts, RoleBindings mot `cluster-admin`, en egen `OCIRepository` i `tn-<tenant>` (`interval: 3m0s`) og Flux Kustomization (`interval: 2m`). Alle tenanter under `tenants/` bruker katalogstrukturen over.

> Kilde: https://docs.sky.fhi.no/internal/flux/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/tenant-bootstrap/base/resourceset.yaml

### Tenant-onboarding — plattformoperasjon

Plattformteamet oppretter tenanter med `ska tenant new -t <tenant> -c <farge> -g <entra-gruppe>` (`scripts/tenant--new.sh`), idempotent i seks steg:

1. **GitOps-repo** — `Fhi.<Tenant>.GitOps` opprettes fra malen, **før** Azure-steget: GitHub gir repoer opprettet etter 2026-07-15 et OIDC-subject med numeriske ID-er (`repo:<org>@<org-id>/<repo>@<repo-id>:ref:...`) som ikke finnes før repoet gjør det.
2. **Azure** — Managed Identity `tn-<tenant>-acr-push` med to federated credentials (`main-oci-push` navnebasert, `main-oci-push-immutable` ID-basert; subject matches eksakt, feil format gir `AADSTS700213`), ACR Repository Writer avgrenset til `<tenant>/`, Reader for Helm-charts, Reader på mgmt-subscription. Setter `AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_SUBSCRIPTION_ID` som repo-variabler i GitOps-repoet.
3. **Base-manifester** — `tenants/<tenant>/base/` og OCIRepository-stub (`tenant--bootstrap--yaml.sh`).
4. **Kluster-onboarding** — per kluster i fargegruppen (`COLOR_GROUP_CLUSTERS` i `scripts/lib/clusters.sh`: sandbox + fargens test + prod): Managed Identity `tn-<tenant>-skybert-sa-<env>` med federated credential for Workload Identity, kluster-overlay under `tenants/<tenant>/<kluster>/`, og OCIRepository-referanse + URL-patch i `infra/tenant-repositories/<kluster>/kustomization.yaml` (`tenant--add--to-cluster.sh`).
5. **Grafana** — per kluster: Grafana-org, Loki- og Mimir-datasource filtrert til `tn-<tenant>` (`X-Scope-OrgID`), og Entra-gruppe → org i `infra/grafana/<kluster>/patch-orgs.yaml` (`tenant--bootstrap--grafana.sh`). Kjøres separat kun når en tenant legges til et nytt kluster.
6. **PR** — én samlet PR for alle infra-endringer.

> Kilde: https://docs.sky.fhi.no/internal/managing-tenants/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--new.sh
