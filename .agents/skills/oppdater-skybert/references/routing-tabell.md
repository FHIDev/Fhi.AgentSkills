# Routing-tabell: Kildefiler til Skybert-målfiler

## Filsti-basert routing (GitHub-modus)

### Docs-repo

| Kildesti | Kanonisk målfil (første) — øvrige får kun kryssreferanse eller én setning |
|----------|--------------|
| `docs/index.md` | `SKILL.md` |
| `docs/explanations/what-is-skybert.md` | `SKILL.md` |
| `docs/explanations/what-is-a-tenant.md` | `SKILL.md` |
| `docs/explanations/under-the-hood.md` | `references/platform-architecture.md` |
| `docs/explanations/tools-and-components.md` | `references/platform-architecture.md`, eventuelt `SKILL.md` (kort komponentoversikt) |
| `docs/explanations/blaloypa.md` | `SKILL.md` |
| `docs/explanations/shared-responsibilities.md` | `SKILL.md` |
| `docs/get-started/blaloypa.md` | `SKILL.md` |
| `docs/get-started/connectedk8s.md` | `references/kubectl-access.md` |
| `docs/get-started/gitops-repo.md` | `SKILL.md`, `references/workflows.md` |
| `docs/get-started/prerequisites/*.md` | `SKILL.md` |
| `docs/workloads/index.md` | `references/configuration.md`, `references/skybertapp-crd.md` |
| `docs/workloads/skybertapp/index.md` | `references/skybertapp-crd.md` |
| `docs/workloads/skybertapp/references/skybertapp.md` | `references/skybertapp-crd.md` |
| `docs/workloads/jobs.md` | `references/configuration.md` |
| `docs/workloads/resource-sizing.md` | `references/observability.md`, `references/skybertapp-crd.md` |
| `docs/build/index.md` | `SKILL.md`, `references/workflows.md` |
| `docs/build/environments.md` | `SKILL.md`, `references/hostnames-and-networking.md` |
| `docs/build/explanations/gitops.md` | `references/workflows.md` |
| `docs/build/how-to/trigger-gitops-promotion.md` | `references/workflows.md` |
| `docs/build/flux-dashboard.md` | `references/flux-tooling.md` |
| `docs/build/flux-mcp.md` | `references/flux-tooling.md` |
| `docs/auth/index.md` | `references/security.md` |
| `docs/auth/workload-identity.md` | `references/security.md` |
| `docs/persistence/*.md` | `SKILL.md` (sammendrag) + `references/persistence.md` (detaljer, inkl. `postgres.md`) |
| `docs/observability/**/*.md` | `references/observability.md` |
| `docs/internal/observability/*.md` | `references/observability.md`, eventuelt `references/platform-architecture.md` — selektivt, merk plattformintern drift |
| `docs/miscellaneous/vault_secrets.md` | `references/secrets.md` |
| `docs/miscellaneous/publicCA.md` | `references/security.md` |
| `docs/miscellaneous/access-packages.md` | `SKILL.md` |
| `docs/miscellaneous/PIM.md` | `references/kubectl-access.md` |
| `docs/miscellaneous/probes.md` | `references/configuration.md` |
| `docs/legal/*.md` | `SKILL.md` (kort omtale) |
| `docs/troubleshooting/non-root.md` | `references/troubleshooting.md` |
| `docs/internal/flux.md` | `references/platform-architecture.md` (NB: kan motsi infra-repo — markeres som kildekonflikt) |
| `docs/internal/service-mesh.md` | `references/hostnames-and-networking.md` |
| `docs/internal/global-network-policies.md` | `references/hostnames-and-networking.md`, `references/kyverno-policies.md` |
| `docs/internal/ska-cli.md` | `references/kubectl-access.md` — intern-merket (script-dispatcheren `scripts/ska`; Go-CLI-en i `utils/sk8/` er separat og dekkes av `utils/sk8/`-raden) |
| `docs/internal/kyverno-policies.md` | `references/kyverno-policies.md` — intern katalogside; feltnivå-sjekk mot skillens policytabeller |
| `docs/internal/oci-signing.md` | `references/platform-architecture.md` — selektiv intern (Cosign-signering/verifisering av plattform-artifakter; disable-runbook er støy) |
| `docs/internal/skybert-system.md` | `references/security.md`, `references/platform-architecture.md` — selektiv intern (ACR pull secret, tenant-RBAC-aggregering; Flux-admin/shared-KV/Bertil er støy) |
| `docs/internal/metallb.md` | VURDER — plattformdrift uten tenant-impact (tenanter kan ikke lage LoadBalancer-Services); normalt utenfor scope |
| `docs/internal/script-atlas.md`, `docs/internal/skatlas/**` | Støy — generert intern tooling (SKAtlas-UI); ingen routing |
| `docs/sk8/clusters.json` | `references/kubectl-access.md` (publisert maskinlesbart klusterregister) |
| `docs/internal/attach-application-repo.md` | `references/security.md`, ev. `references/workflows.md` — selektiv intern (ACR-push-identitet, federering av app-repoer) |
| `docs/internal/helm-and-crds.md` | VURDER — plattformintern, ikke auto-route |
| `docs/internal/managing-clusters.md` | VURDER — plattformintern, ikke auto-route |
| `docs/internal/replace-cluster-in-place.md` | VURDER — plattformintern runbook; hent kun tenant-impact (federated credentials / Workload Identity-konsekvenser ved cluster-bytte) |
| `docs/internal/component-versions.md` | VURDER — versjonsmatrise, endres hyppig; vurder lenking framfor kopiering |
| `docs/internal/decisions/gatewayapi.md` | `references/hostnames-and-networking.md` — selektivt (Gateway API-retning); kombiner med `infra/envoy/` før konkrete påstander |
| `docs/internal/migrate-ingress-to-traefik.md` | `references/hostnames-and-networking.md` — selektivt, merk som intern beredskap, kun tenant-impact (Traefik backup på green) |
| `docs/miscellaneous/fhi-felles-cryptography.md` | VURDER — målgruppe (tenant-utviklere vs. plattform) må avklares |

### Infra-repo

| Kildesti | Kanonisk målfil (første) — øvrige får kun kryssreferanse eller én setning |
|----------|--------------|
| `infra/crossplane/base/xrds/skybertapp.yaml` | `references/skybertapp-crd.md`, `references/skybertapp/xrd.yaml` (statisk kopi) |
| `infra/crossplane/base/xrds/webapp.yaml` | `references/legacy-webapp-csi.md` |
| `infra/crossplane/base/compositions/skybertapp.yaml` | `references/skybertapp-crd.md`, `references/platform-architecture.md`, `references/skybertapp/composition.yaml` (statisk kopi) |
| `infra/crossplane/base/compositions/webapp.yaml` | `references/legacy-webapp-csi.md` |
| `infra/crossplane/base/functions.yaml` | `references/skybertapp/functions.yaml` (kopi med xpkg-omskriving), `references/skybertapp-render.md` (provenance) |
| `infra/crossplane/*/xrds/skybertapp-*.yaml` (kluster-overlays, f.eks. `-alpha`/`-beta`) | `references/skybertapp-crd.md` |
| `infra/crossplane/*/compositions/*.yaml` (kluster-overlays) | `references/skybertapp-crd.md` |
| `infra/goldilocks/base/*-values.yaml` | `references/kyverno-policies.md`, `references/observability.md`, `references/platform-architecture.md` |
| `infra/cloudnative-pg/**` | `references/persistence.md` (kanonisk; `platform-architecture.md` har kun én komponentrad) |
| `infra/kube-state-metrics/base/*-values.yaml` | `references/observability.md` — CustomResourceState-metrics (VPA-gauges, PolicyReport) er tenant-synlige i Grafana |
| `infra/kyverno-policies/base/policies-*/**/*.yaml` | `references/kyverno-policies.md`, `references/security.md` |
| `infra/skybert-system/base/tenant-admin-clusterroles/*.yaml` | `references/platform-architecture.md`, `references/security.md`, `references/kyverno-policies.md` |
| `tenants/*/base/*.yaml` | `references/platform-architecture.md` |
| `scripts/tenant--*.sh` | `references/platform-architecture.md` |
| `scripts/lib/grafana/*.sh` | Ikke egen målfil — hjelpebibliotek der avledede fakta (X-Scope-OrgID, org_mapping) havner etter refaktorering. Brukes til provenance-referanser i `references/observability.md` / `references/platform-architecture.md`. Andre `scripts/lib/*.sh` leses bare selektivt når de sources av en endret tenant-scriptflyt og inneholder dokumentasjonsrelevant logikk |
| `infra/tenant-repositories/base/ocirepos/*.yaml`, `infra/grafana/*/patch-orgs.yaml` | Normalt ingen routing (ny tenant-instans = dokumentert mønster). Kun ved mønsterendring → `references/platform-architecture.md`. Se seleksjonsreglene i [github-modus.md](github-modus.md) |
| `infra/tenant-bootstrap/base/*.yaml` | `references/platform-architecture.md` |
| `infra/tenant-bootstrap/base/tenants/*.yaml` | `references/platform-architecture.md` |
| `infra/flux-operator/base/*.yaml` | `references/platform-architecture.md` |
| `infra/flux-system/*/flux-instance.yaml` | `references/platform-architecture.md` |
| `infra/globalnetworkpolicies/base/policies-red/*.yaml` | `references/hostnames-and-networking.md`, `references/kyverno-policies.md` |
| `infra/traefik/**` | `references/hostnames-and-networking.md`, `references/platform-architecture.md` |
| `infra/envoy/**` | `references/hostnames-and-networking.md`, `references/platform-architecture.md` (Gateway API/Envoy-status, kun tenant-impact) |
| `manifests/*.md` | VURDER — migreringsplaner, ikke auto-route (hent kun tenant-impact med konkrete tenant-steg) |
| `utils/sk8/README.md`, `utils/sk8/data/clusters.json` | `references/kubectl-access.md` — intern-merket (sk8 Go-CLI + innebygd klusterregister). Øvrig `utils/**` (Go-kode, `version-checker/`, `grafana-airgapped/`) er lavprioritet/støy |

---

## Kanonisk plassering for tverrgående fakta

Fakta som berøres av flere kildefiler har én kanonisk fil. Andre filer får kun kryssreferanse
(`Se [..](<fil>.md#<anker>)`) eller én oppsummerende setning — aldri kopi av YAML, tabell eller
avsnitt. Tabellen oppdateres i samme kjøring som en kanonisk plassering endres.

| Faktum | Kanonisk fil | Andre filer lenker kun |
|---|---|---|
| Tenant-navneregler, Bertil, provisjonering | `SKILL.md` §Tenant | resten av `SKILL.md` |
| Klustertabell (kort) / full liste m/ subscription-ID | `SKILL.md` §Sikkerhetssoner / `kubectl-access.md` | `platform-architecture.md` |
| GitOps-flyt, OCI-artefaktnavn, Flux-intervaller | `platform-architecture.md` | `SKILL.md`, `workflows.md`, `troubleshooting.md`, `skybertapp-crd.md`, `flux-tooling.md` |
| Promotion-payload, GitHub App, `repository`-semantikk | `workflows.md` | `SKILL.md` (kort sammendrag), `troubleshooting.md` |
| SecretStore/ExternalSecret-YAML, Key Vault-ansvar | `secrets.md` | `SKILL.md`, `security.md` |
| Workload Identity (automatisk/manuell, SA-navn, MI-navn) | `security.md` | `SKILL.md`, `configuration.md`, `skybertapp-crd.md`, `legacy-webapp-csi.md` |
| Tenant-RBAC (`skybert:tenant-admin`, cluster-admin-unntak, runtime-fragment) | `platform-architecture.md` | `security.md`, `kubectl-access.md`, `kyverno-policies.md`, `troubleshooting.md` |
| Runtime-restriksjoner prod/red-test/norsyss | `kyverno-policies.md` | `kubectl-access.md`, `troubleshooting.md`, `security.md` |
| Rød sone-nettverk (GNP-er, Calico-vindu, NFS, egress-unntak) | `hostnames-and-networking.md` | `SKILL.md`, `kyverno-policies.md`, `security.md` |
| Gateway API/Envoy, beta-XRD | `hostnames-and-networking.md` | `SKILL.md`, `skybertapp-crd.md` |
| Issuer-tabell, trust bundle | `hostnames-and-networking.md` | `SKILL.md`, `security.md` |
| Goldilocks/VPA-mekanisme / Grafana-tabellen | `kyverno-policies.md` / `observability.md` | `platform-architecture.md`, `security.md`, `skybertapp-crd.md` |
| StorageClasses + CloudNativePG | `persistence.md` | `SKILL.md`, `configuration.md`, `platform-architecture.md`, `hostnames-and-networking.md` |
| WebApp/CSI-status | `legacy-webapp-csi.md` | `SKILL.md` (én setning), `configuration.md`, `secrets.md`, `security.md`, `skybertapp-crd.md` |
| Feilsøking, tilkoblingsfeil / ACR-pull lokalt | `troubleshooting.md` / `kubectl-access.md` | `SKILL.md` (prosa, ikke kommandoer) |
| Minimal SkybertApp | `SKILL.md` + `skybertapp-crd.md` | `configuration.md`, `secrets.md` |

## Emnebasert routing (web-scraping-modus)

Brukes når agenten ikke har filsti-tilgang, kun emnenavn fra docs-sider.

| Emne i docs | Målfil i skybert/ |
|-------------|-------------------|
| SkybertApp CRD, felt-spec | `references/skybertapp-crd.md` |
| Secrets, Key Vault, ExternalSecret, SecretStore | `references/secrets.md` |
| Workload Identity, nettverkspolicyer, sikkerhet | `references/security.md` |
| GitHub Actions, CI/CD, oci-push, update-tag | `references/workflows.md` |
| kubectl, k9s, az connectedk8s proxy | `references/kubectl-access.md` |
| Logging, metrics, Grafana, Loki, Mimir, Tempo | `references/observability.md` |
| Helm, Kustomize, WebApp, Deployment, raw manifests | `references/configuration.md` |
| Persistence, StorageClasses, PostgreSQL/CloudNativePG | `references/persistence.md` |
| Feilsøking, diagnostikk | `references/troubleshooting.md` |
| Onboarding, Blåløypa, tenant-konsept, navnekonvensjoner, ingress, miljøer | `SKILL.md` |
| Plattformarkitektur, Flux, Crossplane, OCI-flyt, tenant-bootstrap | `references/platform-architecture.md` |
| Kyverno-policier, mutating/validating webhooks | `references/kyverno-policies.md` |
| Domener, TLS, ingress, hostnames, nettverksregler | `references/hostnames-and-networking.md` |
| WebApp CRD (legacy), CSI driver, migrering | `references/legacy-webapp-csi.md` |

---

## Routing-regler (felles for begge moduser)

- En kildefil kan berøre flere målfiler, men hvert faktum fra den har én kanonisk fil: den første i listen, med mindre raden sier annet. Se «Kanonisk plassering for tverrgående fakta» over.
- Uklar mapping → `VURDER`-kategori i endringsplanen.
- Nye emner som ikke passer eksisterende filer → foreslå ny fil med `ny-fil`-flagg.
- Filer i docs-repo som ikke matcher noen rad → vurder om emnet passer en eksisterende målfil eller trenger ny fil.
- Routing-tabellen er et startpunkt, ikke en tvangstrøye. Foreslå den plasseringen som gir best struktur.
- Nye referansefiler kan opprettes for ethvert emneområde som ikke passer naturlig inn i eksisterende filer.

## Vedlikehold av tabellen

Tabellen skal holdes i synk med virkeligheten i samme kjøring som avviket oppdages:

- Når en ny målfil opprettes i `skybert/` (godkjent `ny-fil`-post) → legg til routing-rad(er) for kildene som ruter dit.
- Når kanonisk plassering for et tverrgående faktum endres (ny fil overtar tema) → oppdater tabellen «Kanonisk plassering for tverrgående fakta» og flytt/reduser innhold i andre filer i samme kjøring.
- Når dekningsmatrise A foreslår målfil for en udekket side → legg til routing-rad når forslaget godkjennes.
- Når en kildefil er flyttet/omdøpt i kilderepoene (compare viser removed+added) → oppdater raden, ikke la den peke på død sti.

Disse oppdateringene rapporteres som selvoppdaterings-poster i UPDATE-PLAN.md (se SKILL.md) og speiles til `.agents/skills/oppdater-skybert/`.
