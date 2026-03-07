# Routing-tabell: Kildefiler til Skybert-målfiler

## Filsti-basert routing (GitHub-modus)

### Docs-repo

| Kildesti | Primær målfil |
|----------|--------------|
| `docs/index.md` | `SKILL.md` |
| `docs/explanations/what-is-skybert.md` | `SKILL.md` |
| `docs/explanations/what-is-a-tenant.md` | `SKILL.md` |
| `docs/explanations/under-the-hood.md` | `references/platform-architecture.md` |
| `docs/explanations/blaloypa.md` | `SKILL.md` |
| `docs/get-started/blaloypa.md` | `SKILL.md` |
| `docs/get-started/connectedk8s.md` | `references/kubectl-access.md` |
| `docs/get-started/kubernetes-yaml.md` | `references/configuration.md` |
| `docs/get-started/prerequisites/*.md` | `SKILL.md` |
| `docs/get-started/explanations/access-packages.md` | `SKILL.md` |
| `docs/get-started/explanations/PIM.md` | `references/kubectl-access.md` |
| `docs/workloads/skybertapp/index.md` | `references/skybertapp-crd.md` |
| `docs/workloads/skybertapp/references/skybertapp.md` | `references/skybertapp-crd.md` |
| `docs/workloads/jobs.md` | `references/configuration.md` |
| `docs/build/explanations/gitops.md` | `references/workflows.md` |
| `docs/build/how-to/trigger-gitops-promotion.md` | `references/workflows.md` |
| `docs/auth/index.md` | `references/security.md` |
| `docs/auth/workload-identity.md` | `references/security.md` |
| `docs/persistence/*.md` | `SKILL.md` |
| `docs/observability/**/*.md` | `references/observability.md` |
| `docs/miscellaneous/vault_secrets.md` | `references/secrets.md` |
| `docs/miscellaneous/publicCA.md` | `references/security.md` |
| `docs/legal/*.md` | `SKILL.md` (kort omtale) |
| `docs/internal/flux.md` | `references/platform-architecture.md` |
| `docs/internal/service-mesh.md` | `references/hostnames-and-networking.md` |
| `docs/internal/global-network-policies.md` | `references/hostnames-and-networking.md`, `references/kyverno-policies.md` |

### Infra-repo

| Kildesti | Primær målfil |
|----------|--------------|
| `infra/crossplane/base/xrds/skybertapp.yaml` | `references/skybertapp-crd.md` |
| `infra/crossplane/base/xrds/webapp.yaml` | `references/webapp-crd.md` |
| `infra/crossplane/base/compositions/skybertapp.yaml` | `references/skybertapp-crd.md`, `references/platform-architecture.md` |
| `infra/crossplane/base/compositions/webapp.yaml` | `references/webapp-crd.md` |
| `infra/kyverno-policies/base/policies-*/**/*.yaml` | `references/kyverno-policies.md`, `references/security.md` |
| `tenants/*/base/*.yaml` | `references/platform-architecture.md`, `SKILL.md` |
| `scripts/tenant--*.sh` | `references/platform-architecture.md` |
| `infra/globalnetworkpolicies/base/policies-red/*.yaml` | `references/hostnames-and-networking.md`, `references/kyverno-policies.md` |

---

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
| Feilsøking, diagnostikk | `references/troubleshooting.md` |
| Onboarding, Blåløypa, tenant-konsept, navnekonvensjoner, ingress, miljøer | `SKILL.md` |
| Plattformarkitektur, Flux, Crossplane, OCI-flyt, tenant-bootstrap | `references/platform-architecture.md` |
| Kyverno-policier, mutating/validating webhooks | `references/kyverno-policies.md` |
| Domener, TLS, ingress, hostnames, nettverksregler | `references/hostnames-and-networking.md` |
| WebApp CRD (legacy), migrering | `references/webapp-crd.md` |

---

## Routing-regler (felles for begge moduser)

- En kildefil/side kan mappe til flere målfiler.
- Uklar mapping → `VURDER`-kategori i endringsplanen.
- Nye emner som ikke passer eksisterende filer → foreslå ny fil med `ny-fil`-flagg.
- Filer i docs-repo som ikke matcher noen rad → vurder om emnet passer en eksisterende målfil eller trenger ny fil.
- Routing-tabellen er et startpunkt, ikke en tvangstrøye. Foreslå den plasseringen som gir best struktur.
- Nye referansefiler kan opprettes for ethvert emneområde som ikke passer naturlig inn i eksisterende filer.
