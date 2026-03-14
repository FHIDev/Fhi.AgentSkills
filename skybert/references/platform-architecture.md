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

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/infra/tenant-repositories/aks-sandbox-01/kustomization.yaml

For fullstendig kluster-liste per sikkerhetssone (inkludert sandbox), se [kubectl-access](kubectl-access.md).

## Flux GitOps

> Kilde: https://docs.sky.fhi.no/internal/flux/ | https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/tenants/exempl/base/flux-kustomization.yaml

Flux er installert direkte (`flux install --export`) på de fleste klustere. Flux Operator (v0.43.0) er under pilottesting på `aks-ops-test-01` med `FluxInstance`-ressurs, men er ikke rullet ut til øvrige klustere ennå.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/flux-system/aks-ops-test-01/flux-instance.yaml | https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/flux-operator/base/flux-operator-0.43.0-helm.yaml

### Multi-tenancy lockdown

- Alle Flux Kustomizations bruker en namespace-spesifikk ServiceAccount (`flux-reconciler`)
- Tenanter kan IKKE spesifisere ressurser i andre namespaces
- Remote bases er deaktivert — all YAML må være i GitOps-repoet
- OCIRepository-ressurser bruker controller-level Workload Identity (ikke per-tenant)

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
│   ├── namespace.yaml          # tn-<tenant>
│   ├── serviceaccount.yaml     # flux-reconciler + <tenant>-azure
│   ├── rolebinding.yaml        # Tilgang til namespace
│   ├── flux-kustomization.yaml # Flux Kustomization (interval: 2m, prune: true)
│   └── kustomization.yaml      # Kustomize-referanse
└── <kluster>/
    └── kustomization.yaml      # Klusterspesifikk overlay
```

Service account `<tenant>-azure` opprettes av plattformteamet med Workload Identity-annotasjoner.
Service account `flux-reconciler` brukes av Flux for å applye tenant-ressurser.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/e5bbc4b/tenants/exempl/base/

### ResourceSet-basert bootstrap (ny mekanisme)

> **Intern plattformmekanisme** — denne informasjonen er utledet fra infra-repo og beskriver hvordan plattformteamet provisjonerer tenant-ressurser.

Plattformteamet har introdusert `ResourceSet` (Flux) som en mer deklarativ tilnærming til tenant-bootstrap. En sentral `ResourceSet` i `infra/tenant-bootstrap/` genererer alle nødvendige ressurser per tenant:

- Namespace (`tn-<tenant>`)
- ServiceAccounts (`flux-reconciler` + `<tenant>-azure` med WI-annotasjoner)
- RoleBinding for flux-reconciler og crossplane
- Betinget RoleBinding for Entra-gruppe (hvis `entraGroupId` er satt)
- OCIRepository for GitOps-manifest
- Flux Kustomization (interval: 2m, prune: true, force: true)

Inputs leveres via `ResourceSetInputProvider` per tenant med parametere: `tenant`, `entraGroupId`, `wlidClientId`, `ociUrl`.

Legacy `tenants/<tenant>/base/`-strukturen finnes fortsatt for eksisterende tenanter og begge mønstre brukes parallelt.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/infra/tenant-bootstrap/base/resourceset.yaml

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
| `yellow` | aks-sandbox-01, aks-yellow-test-01, aks-yellow-prod-01 |
| `red` | aks-sandbox-01, aks-red-test-01, aks-red-prod-01 |

Grafana klargjøres separat med `scripts/tenant--bootstrap--grafana.sh`: oppretter Grafana-org, Loki/Mimir-datasources filtrert til `tn-<tenant>`, og oppdaterer org_mapping for Entra-gruppekobling.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/scripts/tenant--new.sh
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/986db5d1ad0e4b4a80b8cfb3476bb28fd16bd24a/scripts/tenant--bootstrap--grafana.sh
