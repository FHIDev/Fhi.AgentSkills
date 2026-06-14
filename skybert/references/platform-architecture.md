# Plattformarkitektur

> Kilde: https://docs.sky.fhi.no/explanations/under-the-hood/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/crossplane/base/compositions/skybertapp.yaml

## Teknologistakk

| Komponent | Teknologi | Rolle |
|-----------|-----------|-------|
| Container-orkestrering | Kubernetes (Azure Arc-connected) | Kjøremiljø |
| GitOps | Flux v2 | Deklarativ konfigurasjon |
| Infrastruktur som kode | Crossplane | CRD-er (SkybertApp, WebApp) |
| Policy | Kyverno | Sikkerhetshåndhevelse |
| Cloud | Azure | Underliggende infrastruktur |
| Git | GitHub (FHIDev org) | Kildekode og CI/CD |
| Container registry | Azure Container Registry (`crfhiskybert.azurecr.io`) | Image-lagring |

## Klustere og miljøer

> Kilde: https://docs.sky.fhi.no/get-started/connectedk8s/

Namespace-navnet (`tn-<tenant>`) er identisk på tvers av klustere. Det er klusteret man kobler til som bestemmer miljøet, ikke namespace-navnet.

GitOps-mappene (`test/`, `sandbox/`, `prod/`) pakkes som separate OCI-artifacts (`gitops_test`, `gitops_sandbox`, `gitops_prod`) og deployes til sine respektive klustere. `aks-sandbox-01` er et felles sandkassekluster — alle fargesoner deler det.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/tenant-repositories/aks-sandbox-01/kustomization.yaml

For fullstendig kluster-liste per sikkerhetssone (inkludert sandbox), se [kubectl-access](kubectl-access.md).

## Flux GitOps

> Kilde: https://docs.sky.fhi.no/internal/flux/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/flux-system/base/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/flux-system/base/kustomizations-infra/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/flux-system/base/kustomizations-infra/flux-system.yaml

**Flux Operator er normativ installasjonsmodell:** Flux installeres og oppgraderes via Flux Operator med multi-tenancy aktivert. Operatoren håndterer CRD-livssyklus og oppgraderinger, så manuelt CRD-versjonsarbeid er ikke lenger nødvendig. Operator-versjonen versjonsstyres via Flux selv (samme mønster som andre infra-komponenter).

Flux rulles ut via en `flux-operator`-komponent som er inkludert i standard infra-kustomization (`infra/flux-system/base/kustomizations-infra/`). `flux-system`-Flux-Kustomizationen har eksplisitt `dependsOn: flux-operator`. `FluxInstance`-ressursen (`infra/flux-system/base/flux-instance.yaml`) er listet i base-kustomizationen og trekkes inn av kluster-overlays.

Flux Web UI er installert på alle klustere — se [Flux-verktøy](flux-tooling.md) for utviklerrettet bruk og URL-tabeller per kluster.

### Multi-tenancy lockdown

- Alle Flux Kustomizations bruker en namespace-spesifikk ServiceAccount (`flux-reconciler`)
- Tenanter kan IKKE spesifisere ressurser i andre namespaces
- Remote bases er deaktivert — all YAML må være i GitOps-repoet
- OCIRepository-ressurser bruker controller-level Workload Identity (ikke per-tenant)

Under `FluxInstance`-modellen (der den er i bruk) modelleres multi-tenancy-låsen som:

- `cluster.multitenant: true`
- `cluster.tenantDefaultServiceAccount: flux-reconciler`
- `--no-cross-namespace-refs=false` for `kustomize-controller` og `helm-controller` — dette er en **bevisst patch** av controller-args fordi `OCIRepository`-ressurser ligger i en plattform-managed namespace (`tenant-repositories`), ikke per-tenant. Migrering til per-tenant `OCIRepository` er planlagt — patchen fjernes da.
- Workload Identity-patch på `source-controller` (for ACR-tilgang)

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a16a243/infra/flux-system/base/flux-instance.yaml

### Rekonsilieringsintervall

Flux rekonsilerer hvert **2 minutt** (`interval: 2m` i tenant Kustomization).
Prune er aktivert (`prune: true`), og force er aktivert (`force: true`).

### HelmRepository og HelmRelease

Flux støtter HelmRepositories og HelmReleases, men plattformen anbefaler IKKE disse fordi:
1. Helm-releases pinner ikke alltid dependencies (ikke-deterministisk)
2. Flux gjenskaper ikke slettede ressurser fra HelmReleases

## Crossplane

SkybertApp og WebApp CRD-er er implementert som Crossplane CompositeResourceDefinitions (XRDs) med Go Templating-funksjoner i pipeline-modus.

### OCI-artifact flyt

```
GitOps-repo push -> oci-push.yaml -> OCI-artifact -> ACR
                                                       |
Kluster <- Flux (hvert 2 min) <- OCIRepository <- ACR
```

OCI-artifacts navngis: `crfhiskybert.azurecr.io/<tenant>/gitops_<env>:latest`

## Tenant-bootstrap

Hver tenant i infra-repoet har følgende struktur:

```yaml
tenants/<tenant>/
├── base/
│   ├── namespace.yaml              # tn-<tenant>
│   ├── serviceaccounts.yaml        # flux-reconciler + <tenant>-azure (flertall i nyere tenanter)
│   ├── rolebinding.yaml            # flux-reconciler og crossplane → ClusterRole cluster-admin innen namespace
│   ├── entra-access-rolebinding.yaml  # Entra ID-gruppe → ClusterRole (cluster-admin eller skybert:tenant-admin) innen namespace
│   ├── flux-kustomization.yaml     # Flux Kustomization (interval: 2m, prune: true)
│   └── kustomization.yaml          # Kustomize-referanse
└── <kluster>/
    └── kustomization.yaml          # Klusterspesifikk overlay
```

Service account `<tenant>-azure` opprettes av plattformteamet med Workload Identity-annotasjoner.
Service account `flux-reconciler` brukes av Flux for å applye tenant-ressurser.

**`entra-access-rolebinding.yaml`** (observert i de fleste tenant-baser per april 2026) — RoleBinding som gir en Entra ID-gruppe en ClusterRole avgrenset til tenant-namespacet (`cluster-admin` for eldre tenanter, `skybert:tenant-admin` for migrerte — se «Aggregert tenant-admin RBAC» nedenfor). Observert bootstrap-mønster tyder på at denne gruppen kobles til access packages i MyAccess, men dette er ikke eksplisitt dokumentert i kilderepoene.

> **Merk:** Eldre tenanter kan fortsatt bruke `serviceaccount.yaml` (entall) og mangle `entra-access-rolebinding.yaml`. Begge layouter er gyldige.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/tenants/fida-stat19core/base/kustomization.yaml

Nyere tenanter har to separate RoleBindings:
- **`rolebinding.yaml`** — binder `flux-reconciler` (lokal SA) og `crossplane` (fra crossplane-namespace) til `ClusterRole cluster-admin` innen tenant-namespacet. Brukes av plattformen for å reconcile og provisjonere ressurser. **Uendret.**
- **`entra-access-rolebinding.yaml`** — binder en Entra ID-gruppe (via gruppe-ID) til en ClusterRole innen tenant-namespacet. Gir kubectl-tilgang for utviklere. **Under utrulling:** migrerte tenanter binder mot den kuraterte `skybert:tenant-admin` (least-privilege, f.eks. `fida-stat19`), mens eldre tenanter og mal-tenanten `exempl` binder mot `cluster-admin`. Minst to nye tenant-baser lagt til i juni 2026 (`fida-evergreen`, `oslo-exempl`) binder også mot `cluster-admin` — hvilken rolle en tenant har kan altså ikke utledes av når den ble opprettet.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/6a94bd896a89599f7a257e15106ea8a5b6ef749b/tenants/ki-mcp/base/rolebinding.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/01abbad/tenants/fida-stat19/base/entra-access-rolebinding.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/3e3d50b/tenants/fida-evergreen/base/entra-access-rolebinding.yaml

#### Aggregert tenant-admin RBAC (ny modell)

Menneskelig tenant-admin-tilgang er nå modellert som aggregerte ClusterRole-fragmenter i `infra/skybert-system/base/tenant-admin-clusterroles/` (erstatter den fjernede `tenant-namespace-admin-clusterrole.yaml`):

- **`skybert:tenant-admin:core`** — baseline namespaced rettigheter uten wildcards (workloads, services, ingresses, configmaps, secrets, PVC, HPA, PDB, namespaced RBAC uten `bind`/`escalate`, native + Calico NetworkPolicies, cert-manager, Gateway API-ruter, external-secrets, Crossplane-claims, metrics, policy-rapport-innsyn). Aggregeres inn i miljøspesifikke roller via labels (`aggregate-to-tenant-admin-{red-prod,red-test,yellow-prod,green-prod,test-sandbox}`).
- **`skybert:tenant-admin:test-sandbox:runtime-access`** — legger til runtime-subressurser (`exec`/`attach`/`portforward`/`proxy`/ephemeral). Aggregeres **kun** via `test-sandbox`-labelen → gjelder green-test, yellow-test-02, ops-test og sandbox. **Ikke** `aks-red-test-01`, som derfor mangler runtime-RBAC. I prod blokkeres runtime-tilgang i tillegg av Kyverno (`deny-tenant-runtime-access`); i red-test blokkerer Kyverno (`restrict-tenant-runtime-access`) port-forward/attach/proxy, men ikke exec — om exec fungerer der avhenger av RBAC/tilgang. Dette forklarer hvorfor interaktiv debugging oppfører seg ulikt per miljø.
- **`skybert:tenant-flux-reconciler`** — egen aggregering for Flux-rekonsiliering.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/01abbad/infra/skybert-system/base/tenant-admin-clusterroles/

### ResourceSet-basert bootstrap (ny mekanisme)

> **Intern plattformmekanisme** — denne informasjonen er utledet fra infra-repo og beskriver hvordan plattformteamet provisjonerer tenant-ressurser.

Plattformteamet har introdusert `ResourceSet` (Flux) som en mer deklarativ tilnærming til tenant-bootstrap. En sentral `ResourceSet` i `infra/tenant-bootstrap/` genererer alle nødvendige ressurser per tenant:

- Namespace (`tn-<tenant>`)
- ServiceAccounts (`flux-reconciler` + `<tenant>-azure` med WI-annotasjoner)
- RoleBinding for flux-reconciler og crossplane
- Betinget RoleBinding for Entra-gruppe (hvis `entraGroupId` er satt)
- OCIRepository for GitOps-manifest (se kobling nedenfor)
- Flux Kustomization (interval: 2m, prune: true, force: true)

Koblingen mellom tenant-bootstrap og GitOps-artifakter:
1. `infra/tenant-repositories/base/ocirepos/` inneholder én `OCIRepository`-ressurs per tenant, f.eks. `<tenant>-gitops`
2. OCIRepository peker til `oci://crfhiskybert.azurecr.io/<tenant>/gitops_<env>` med `provider: azure` og `ref.tag: latest`
3. `flux-kustomization.yaml` i tenant-bootstrap refererer til denne OCIRepository som kilde

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/tenant-repositories/base/ocirepos/oci-fida-stat19core.yaml

Inputs leveres via `ResourceSetInputProvider` per tenant med parametere: `tenant`, `entraGroupId`, `wlidClientId`, `ociUrl`.

Legacy `tenants/<tenant>/base/`-strukturen finnes fortsatt og begge mønstre brukes parallelt — minst to nye tenant-baser lagt til i juni 2026 (`fida-evergreen`, `oslo-exempl`) bruker legacy-strukturen.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/tenant-bootstrap/base/resourceset.yaml

### Tenant-onboarding — plattformoperasjon

> **Intern plattformmekanisme** — gjøres av plattformteamet. Dokumentert her for forståelse av hva som skjer under onboarding.

Plattformteamet bruker `scripts/tenant--new.sh` for å opprette en ny tenant i 4 steg:

1. **Azure-ressurser** — Managed Identity og GitOps-ACR-repo
2. **GitOps-repo** — GitHub-repo i FHIDev-organisasjonen
3. **Base-manifester** — namespace, serviceaccounts, rolebinding, Flux Kustomization i infra-repo
4. **Kluster-onboarding** — kjøres for hvert kluster i valgt sikkerhetssone

Color → kluster-mapping ved onboarding:

| Farge | Klustere |
|-------|---------|
| `green` | aks-sandbox-01, aks-green-test-01, aks-green-prod-02 |
| `yellow` | aks-sandbox-01, aks-yellow-test-02, aks-yellow-prod-01 |
| `red` | aks-sandbox-01, aks-red-test-01, aks-red-prod-01 |

Grafana klargjøres separat med `scripts/tenant--bootstrap--grafana.sh`:

```bash
tenant--bootstrap--grafana.sh --tenant <tenant> --entra-group-id <uuid> --color <red|yellow|green>
```

Kjøres mot alle klustere i fargegruppen (sandbox + test + prod) via `az connectedk8s proxy + kubectl`. Oppretter per kluster: Grafana-org, Loki-datasource og Mimir-datasource (begge filtrert til `tn-<tenant>` via `X-Scope-OrgID`), og oppdaterer `infra/grafana/<cluster>/patch-orgs.yaml` med Entra-gruppekobling.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/6a94bd896a89599f7a257e15106ea8a5b6ef749b/scripts/tenant--new.sh
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/6a94bd896a89599f7a257e15106ea8a5b6ef749b/scripts/tenant--bootstrap--grafana.sh

### Sentralisert kluster-register

> **Intern plattformmekanisme** — dokumentert her for kontekst om kluster-tilleggsoperasjoner.

`scripts/lib/clusters.sh` er single source of truth for kluster-metadata i infra-repoet. Scripts som trenger kluster-informasjon sourcer denne filen. Registeret inneholder per kluster: navn, resource group, subscription ID, OIDC-issuer URL og PIM-krav. `COLOR_GROUP_CLUSTERS` definerer hvilke klustere som inngår i hvert fargelane (red/yellow/green).

Klustere kan eksistere i registeret uten å tilhøre en fargegruppe. Per juni 2026 bruker `COLOR_GROUP_CLUSTERS["yellow"]` `aks-yellow-test-02` (tidligere `aks-yellow-test-01`) som gul test-kluster, og `aks-norsyss-prod-01` er registrert uten å tilhøre en fargegruppe.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/01abbad/scripts/lib/clusters.sh
