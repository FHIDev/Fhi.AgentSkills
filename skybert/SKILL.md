---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, SkybertApp CRD, Azure Workload Identity, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---
# Skybert Platform Skill

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

> **Sist verifisert mot offisiell docs:** 2026-09-01
> **Offisiell dokumentasjon**: https://docs.sky.fhi.no/ (samme innhold på https://skybert.fhi.no/)
> Denne skillen er en kuratert oppsummering for AI-agenter. Hver seksjon har enten en `> Kilde:`-lenke eller er merket `> **Operasjonell antakelse:**` (erfaring uten repo-kilde).

**KRITISK**: Alle endringer går gjennom Git → GitHub Actions → Flux. Bruk aldri `kubectl apply` for permanente endringer.

**KRITISK**: Du har kun tilgang til eget namespace (`tn-<tenant>`). Runtime-kommandoer (`exec`, `port-forward`) er begrenset per kluster — se [Kyverno-policier](references/kyverno-policies.md#produksjon--runtime-restriksjoner).

**KRITISK**: Workload Identity er automatisk for `SkybertApp`. For rå Deployments må du sette label og `serviceAccountName` selv — se [Sikkerhet](references/security.md#azure-workload-identity).

**VIKTIG**: Bruk `SkybertApp` for deployments. `WebApp` (`skybert.fhi.no/v1`) er udokumentert i docs og ikke anbefalt — se [Legacy](references/legacy-webapp-csi.md).

---

## Om Skybert

Skybert er en Kubernetes-basert applikasjonsplattform hos FHI:
- **Kubernetes** — AKS på Azure Local, koblet til Azure med Azure Arc. Tilgang går via `az connectedk8s proxy`, ikke `az aks get-credentials`.
- **GitOps** med Flux: manifester i et GitOps-repo per tenant, pakket som OCI-artefakter og synket til klusteret.
- **Azure-integrasjon**: Workload Identity, Key Vault via External Secrets, Azure Container Registry (`crfhiskybert.azurecr.io`).
- **Observability**: Loki (logger), Mimir (metrics) og Grafana på hvert kluster. Tempo (tracing) er planlagt, ikke tilgjengelig.

> Kilde: https://docs.sky.fhi.no/explanations/what-is-skybert/ · https://docs.sky.fhi.no/explanations/tools-and-components/ · https://docs.sky.fhi.no/get-started/connectedk8s/

## Nøkkelkonsepter

### Tenant

En **tenant** er den grunnleggende organisasjonsenheten — et mellomnivå mellom team og applikasjon. Hver tenant har eget namespace `tn-<tenant>` (samme navn i alle miljøer; klusteret bestemmer miljøet), eget GitOps-repo og egne tilganger.

**Bestilling og navneregler:** Tenant bestilles i skjemaet **Bertil** (https://bertil.sky.fhi.no). Navnet velges av teamet: kun små bokstaver, tall og bindestrek, maks **38 tegn**, og ikke ordet «skybert». Navnet blir namespace (`tn-<navn>`) og GitOps-repo-navn (`Fhi.<Navn>.GitOps`, der bindestreker blir punktum og hvert ledd får stor forbokstav — `fida-myapp` → `Fhi.Fida.Myapp.GitOps`). Plattformteamet provisjonerer GitOps-repo, managed identities, namespace og tilgangspakke, og varsler når det er klart.

**Organisering:** vanligst er ett team, én tenant, én applikasjon. Ett team kan ha flere tenanter, og én tenant kan ha flere tett integrerte apper. Del i separate tenanter ved ulik sikkerhetsklassifisering (tenanter deployes til fargespesifikke klustere), når apper ikke skal kunne lese hverandres secrets (alle apper i en tenant deler namespace), eller når ulike team eier appene.

> Kilde: https://docs.sky.fhi.no/get-started/ · https://docs.sky.fhi.no/explanations/what-is-a-tenant/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--bootstrap--gitops.sh

### Miljøer

GitOps-repoet leveres med tre miljømapper. Hver mappe pakkes til sitt eget OCI-artefakt (`gitops_sandbox`, `gitops_test`, `gitops_prod`) og deployes til sitt kluster:

- `sandbox/` — felles sandkassekluster `aks-sandbox-01` for alle farger. Start her.
- `test/` — dedikert testkluster per farge. Samme nettverksregler som prod; test er ikke en svakere variant.
- `prod/` — dedikert prod-kluster per farge.

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/get-started/gitops-repo/

### Sikkerhetssoner og klustere

| Sone | Data | Test | Prod | Egress |
|------|------|------|------|--------|
| **Grønn** | Åpne data | `aks-green-test-01` | `aks-green-prod-02` | Åpen |
| **Gul** | Interne data, persondata | `aks-yellow-test-02` | `aks-yellow-prod-01` | Åpen inntil videre |
| **Rød** | Identifiserbar helseinformasjon | `aks-red-test-01` | `aks-red-prod-01` | Default deny; IP/CIDR-unntak via plattformteamet. Ingress kun fra NHN secure zone |

Utover disse finnes `aks-sandbox-01` (alle farger), `aks-norsyss-prod-01` (eget prod-kluster i gul-lanen for Norsyss) og `aks-ops-test-01` (test-/utviklingskluster; hoster også tenanter). `aks-yellow-test-01` er registrert, men inngår ikke i gul-lanen.

Alle klustere kjører samme Kyverno-grunnpolicyer (`policies-green`); prod-klustrene har i tillegg `policies-prod` (blokkerer runtime-kommandoer) og rød sone `policies-red`. Rød sone forbyr native `NetworkPolicy`; Calico `NetworkPolicy` tillates med `spec.order` i `[1000, 1200)`. Se [Kyverno-policier](references/kyverno-policies.md) og [Rød sone](references/hostnames-and-networking.md#rød-sone). Full klusterliste med subscription-ID-er: [kubectl-tilgang](references/kubectl-access.md#tilgjengelige-klustere).

> Kilde: https://docs.sky.fhi.no/get-started/blaloypa/ · https://docs.sky.fhi.no/build/environments/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/lib/clusters.sh

### Blåløypa (Golden Path)

**Forutsetninger**

*Organisatorisk:* en utpekt **tenant owner** (typisk produkteier/domeneeier) som er ansvarlig for brukeradministrasjon, kostnader, sikkerhet, tilgjengelighet, dataklassifisering, applikasjons-ROS og DPIA (ved persondata). Plattformens egen ROS kan refereres for infrastruktur, nettverk og secrets management.

*Applikasjon:* kjører på Linux (språk og rammeverk er valgfritt), har Dockerfile og en CI-pipeline som bygger og pusher image (plattformen federerer pipelinen mot registeret). Azure-subscriptions for Key Vault o.l. er teamets ansvar (anbefalt: én for test, én for prod). Database: Azure managed, NHN Moderne Etatsplattform eller CloudNativePG i klusteret — se [Persistence](references/persistence.md). Rød data krever komplett liste over eksterne tjenester appen når, med risikovurdering.

*Teknisk:* GitHub-organisasjon FHIDev; tilgangspakke via MyAccess; PIM for prod og `aks-red-test-01` — se [kubectl-tilgang](references/kubectl-access.md#pim-privileged-identity-management).

**Steg**

1. **Bestill tenant i Bertil.** Plattformteamet provisjonerer og varsler.
2. **Tilgangspakke i MyAccess.** Utviklere søker; tenant owner/approvere godkjenner. Tilgang gjelder ett år og må søkes på nytt. Hver tenant har to approvere — den ene må godkjenne den andre. Tenant owner gjennomfører access review hvert kvartal (e-post fra Microsoft); ikke fullført review fjerner tilgangen.
3. **GitOps-repoet** `Fhi.<Tenant>.GitOps` ligger klart med workflows og eksempelmanifest.
4. **Key Vault:** gi tenantens managed identity lesetilgang til vaulten — se [Secrets](references/secrets.md#key-vault).
5. **Deploy:** legg en `SkybertApp` i `sandbox/` og push til `main`. Verifiser på hostnavnet du satte.
6. **Grafana** per kluster med FHI Entra ID; **klustertilgang** via `az connectedk8s proxy`.
7. **Koble app-repoet** til GitOps-repoet for automatisk promotion — se [Workflows](references/workflows.md).

> Kilde: https://docs.sky.fhi.no/get-started/blaloypa/ · https://docs.sky.fhi.no/get-started/prerequisites/ · https://docs.sky.fhi.no/miscellaneous/access-packages/

## GitOps-repo og deployment

Repoet leveres fra plattformens mal; `.github/workflows/` er ferdig konfigurert og trenger normalt ikke endres:

```
.github/workflows/
    oci-push.yaml         # pakker manifester til OCI-artefakter ved push til main
    update-tag.yaml       # oppdaterer image-tag via repository_dispatch
sandbox/                  # → aks-sandbox-01
    my-app.yaml
test/                     # → testklusteret for din farge
    my-app.yaml
prod/                     # → prod-klusteret for din farge
    my-app.yaml
```

Legg manifester (SkybertApp, Deployments, Services …) i miljømappen og push til `main`. `oci-push` gjenkjenner Helm (`Chart.yaml`) og Kustomize (`kustomization.yaml`) og kjører `helm template`/`kustomize build` før pakking. Flux applyer artefaktet innen ~5 minutter; rekonsiliering kan trigges manuelt i Flux-dashboardet — se [Rekonsilieringsintervall](references/platform-architecture.md#rekonsilieringsintervall).

**Promotion:** app-repoets build-workflow sender `repository_dispatch` (`update_tag`) til GitOps-repoet med `env` og `updates[]`, der `repository` er `<app>`-segmentet i `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>`. Cross-repo-tokenet kommer fra en GitHub App (`GITOPS_APP_CLIENT_ID`/`GITOPS_APP_PRIVATE_KEY`); `AZURE_*`-variablene i GitOps-repoet settes av plattformen. Payload-format, workflow-eksempel og variabeltabell: [Workflows](references/workflows.md).

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/get-started/gitops-repo/ · https://docs.sky.fhi.no/build/how-to/trigger-gitops-promotion/

## SkybertApp

`SkybertApp` (`skybert.fhi.no/v1alpha1`) samler deployment, service, ingress med TLS, secrets fra Key Vault, autoskalering og sikkerhetshardening i én ressurs:

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: "1.0.0"
  hostname: myapp.skytest.fhi.no
  probes:
    liveness:
      path: /health/live
    readiness:
      path: /health/ready
  secrets:
    - vault: my-keyvault
      keys:
        - remote: database-password
          local: DB_PASSWORD
      mountAsEnv: true
```

Nøkkelegenskaper:
- Secrets: oppgi vault og nøkler; SecretStore og ExternalSecret opprettes automatisk.
- Workload Identity alltid aktivert (label + `serviceAccountName: <tenant>-azure`).
- `probes` (liveness/readiness/startup) er valgfrie; `writableDirs` for read-only rot; `args`; `metrics.port` gir Prometheus-annotasjoner automatisk.
- `autoscaling` (HPA) og automatisk PodDisruptionBudget når `replicas > 1` eller `autoscaling.minReplicas > 1`.
- Scale-subresource: `kubectl get skybertapp` viser DESIRED/CURRENT; VPA kan peke `targetRef` på ressursen.
- Memory limit er alltid lik request; CPU har request uten limit.

Full feltreferanse: [SkybertApp CRD](references/skybertapp-crd.md). Rå manifester (Deployment, StatefulSet, Job, Helm, Kustomize) kan ligge side om side med SkybertApp i samme miljømappe — se [Konfigurasjon](references/configuration.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/ · https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

## Navnekonvensjoner

| Ressurs | Mønster | Eksempel |
|---------|---------|----------|
| Namespace | `tn-<tenant>` | `tn-exempl` |
| GitOps-repo | `Fhi.<Tenant>.GitOps` | `Fhi.Exempl.GitOps` |
| Container-image | `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>` | `crfhiskybert.azurecr.io/exempl/api:1.2.3` |
| OCI-artefakt (manifester) | `crfhiskybert.azurecr.io/<tenant>/gitops_<env>` | `…/exempl/gitops_test` |
| Service Account (Workload Identity) | `<tenant>-azure` | `exempl-azure` |
| Managed Identity per miljø | `tn-<tenant>-skybert-sa-<env>` (offentlig docs viser navnet uten `tn-`; infra er autoritativ) | `tn-exempl-skybert-sa-test` |
| Hostnavn | valgfritt navn under `*.skytest.fhi.no`/`*.fhi-k8s.com` (non-prod) eller `*.sky.fhi.no` (prod) | `api.skytest.fhi.no` |

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/auth/workload-identity/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--add--to-cluster.sh

## Ingress og nettverk

| Miljø | Domener |
|-------|---------|
| Sandbox og test | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Prod | `*.sky.fhi.no` |

TLS og DNS opprettes automatisk fra `hostname`. `SkybertApp` genererer en nginx-`Ingress`. Envoy Gateway (Gateway API) finnes parallelt på de fleste klustere med GatewayClass `fhinett`, `helsenett` og `internett`; tenanter skriver `ListenerSet`/`HTTPRoute` selv, og Gateway API når ikke tenant-pods i rød sone. Rød sone: default deny egress, DNS og intern namespace-trafikk åpen, egress-unntak via plattformteamet. Alt om domener, issuere, Gateway API, beta-XRD og nettverkspolicyer: [Hostnavn og nettverk](references/hostnames-and-networking.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://docs.sky.fhi.no/build/environments/

## Persistence

Tre likestilte databasealternativer: Azure managed, NHN Moderne Etatsplattform, eller PostgreSQL i klusteret med CloudNativePG (støttet på alle klustere; teamet eier backup-konto og restore-test). Sju StorageClasses; ingen av dem gir backup eller snapshots. `ontap-nas` (NFS) skal aldri brukes til databaser. Se [Persistence og CloudNativePG](references/persistence.md).

> Kilde: https://docs.sky.fhi.no/persistence/ · https://docs.sky.fhi.no/persistence/postgres/

## Workload Identity og secrets

Hver tenant får én managed identity per miljø, federert til service-accounten `<tenant>-azure`. `SkybertApp` bruker den automatisk; rå Deployments setter label `azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure` selv. Tenanten oppretter Key Vault i egen subscription og gir identiteten lesetilgang; det er også tenanten som tildeler identiteten andre Azure-roller. Secrets leses inn via `SkybertApp.spec.secrets` (anbefalt) eller manuell SecretStore + ExternalSecret for rå Deployments. Se [Sikkerhet](references/security.md) og [Secrets-mønstre](references/secrets.md).

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/ · https://docs.sky.fhi.no/miscellaneous/vault_secrets/

## Brukervendt autentisering

Skybert har ingen innebygd brukervendt eller maskin-til-maskin-autentisering for tenanter. Bruk standard IAM med OIDC via Entra ID, ID-porten eller HelseID; unngå legacy AD. Tenant-RBAC gir skrivetilgang til Envoy `SecurityPolicy`, men det er ikke en dokumentert plattformfunksjon — se [Sikkerhet](references/security.md).

> Kilde: https://docs.sky.fhi.no/auth/

## Verifisere og feilsøke

Etter push: sjekk at `oci-push` fullførte, følg Kustomization-status i Flux-dashboardet (trigg rekonsiliering der om du ikke vil vente), og sjekk pods, events og ExternalSecrets i `tn-<tenant>`. Vanlige feil (ImagePullBackOff, manglende secrets, rød sone-nettverk, root-avvisning, Workload Identity, kubectl-tilkobling): [Feilsøking](references/troubleshooting.md).

**Flux-verktøy:** Flux-dashboard per kluster (status, suspend/resume, manuell rekonsiliering; Entra ID-pålogging) og Flux Operator MCP for AI-assistenter (`--read-only` anbefalt) — se [Flux-verktøy](references/flux-tooling.md).

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://docs.sky.fhi.no/build/flux-mcp/

## Ansvarsfordeling

Ansvar følger eierskap: det Skybert eier (klustere, Flux, Crossplane, observability-stakk, plattform-sikkerhet, Azure-integrasjoner) er plattformteamets; resten er tenantens — applikasjonskode, GitOps-konfigurasjon, Key Vault og Azure-roller, applikasjons-ROS og DPIA, tilgjengelighet. Plattformens ROS dekker infrastruktur, nettverk og secrets-mekanismen og kan refereres i applikasjons-ROS.

**Høy tilgjengelighet er applikasjonsteamets ansvar:** Kubernetes garanterer at *det finnes* kjørende pods — ikke at *samme* pod består. Pod-restart og flytting uten forvarsel er normal drift. Appen må håndtere brå shutdown og kjøre flere identiske replikaer når tilgjengelighetskravet tilsier det; plattformens PDB og autoskalering erstatter ikke applikasjonsdesign for failover og reconnect.

> Kilde: https://docs.sky.fhi.no/legal/responsibilities/ · https://docs.sky.fhi.no/get-started/prerequisites/organization/ · https://docs.sky.fhi.no/explanations/what-is-skybert/

## Skybert-verdier i CLAUDE.md / AGENTS.md

For prosjekter på Skybert anbefales det å legge disse verdiene i prosjektets `CLAUDE.md` eller `AGENTS.md`, så agenten slipper å gjette:

| Nøkkel | Verdi |
|--------|-------|
| Tenant | `<tenant-navn>` |
| Sikkerhetssone | Grønn / Gul / Rød |
| Namespace (alle miljøer) | `tn-<tenant>` |
| Test hostname | `<app>.skytest.fhi.no` |
| Prod hostname | `<app>.sky.fhi.no` |
| ACR image | `crfhiskybert.azurecr.io/<tenant>/<app>` |
| Azure tenant ID | `<azure-tenant-id>` |

> **Operasjonell antakelse:** Anbefaling for AI-agenter i FHI-repoer, ikke fra Skybert-docs; verdiene er de Skybert-spesifikke konvensjonene over.

## Referanser

| Dokument | Innhold |
|----------|---------|
| [SkybertApp CRD-spesifikasjon](references/skybertapp-crd.md) | Full feltreferanse, genererte ressurser, navnekonvensjoner |
| [SkybertApp rendering](references/skybertapp-render.md) | Kjør Composition lokalt med `crossplane render` |
| [Konfigurasjon](references/configuration.md) | Rå Deployment, Jobs, Helm/Kustomize, probes i .NET |
| [Secrets-mønstre](references/secrets.md) | SkybertApp-secrets, SecretStore/ExternalSecret, Key Vault-ansvar |
| [Sikkerhet](references/security.md) | Workload Identity, managed identities, tenant-RBAC, securityContext, ACR-pull |
| [Workflows](references/workflows.md) | GitOps-workflows, promotion, GitHub App, variabler og secrets |
| [Plattformarkitektur](references/platform-architecture.md) | Flux, Crossplane, OCI-flyt, tenant-bootstrap, tenant-RBAC |
| [kubectl-tilgang](references/kubectl-access.md) | Proxy, klusterliste, PIM, sk8, k9s, ACR-pull lokalt |
| [Kyverno-policier](references/kyverno-policies.md) | Mutasjoner, Enforce/Audit, runtime-restriksjoner, VPA |
| [Hostnavn og nettverk](references/hostnames-and-networking.md) | Domener, TLS, Gateway API, rød sone |
| [Persistence og CloudNativePG](references/persistence.md) | StorageClasses, databasevalg, CNPG-oppsett og fallgruver |
| [Observability](references/observability.md) | Loki, Mimir, Grafana, Alloy, ressursanbefalinger |
| [Flux-verktøy](references/flux-tooling.md) | Flux-dashboard og Flux Operator MCP |
| [Feilsøking](references/troubleshooting.md) | Verifisering etter push og vanlige feil |
| [Legacy: WebApp CRD og CSI driver](references/legacy-webapp-csi.md) | WebApp-referanse og migrering til SkybertApp |

## Support

NHN Slack: `#ext-fhi-skybert`.

> Kilde: https://docs.sky.fhi.no/get-started/

---

## Instruksjoner for Claude

1. **Identifiser konteksten**: onboarding eller eksisterende app, sikkerhetssone, miljø (sandbox/test/prod).
2. **Bruk konvensjonene** i denne filen (`tn-<tenant>`, `<tenant>-azure`, image- og hostnavnmønstre) og anbefal `SkybertApp` framfor `WebApp` og rå Deployment når den dekker behovet.
3. **Vær oppmerksom på** sone-forskjeller (rød sone-nettverk og runtime-restriksjoner i prod), at alt går via Git, og at tenanten selv eier Key Vault, Azure-roller og backup.
4. **Ved usikkerhet**: referer til docs-lenken i seksjonen, eller til plattformteamet på `#ext-fhi-skybert`.

> **Operasjonell antakelse:** Arbeidsinstruks for agenten, ikke plattformfakta.
