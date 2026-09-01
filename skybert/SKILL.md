---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, SkybertApp CRD, Azure Workload Identity, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---
# Skybert Platform Skill

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

> **Sist verifisert mot offisiell docs:** 2026-09-01
> **Sist verifisert mot `Fhi.Skybert.Infra`:** 2026-09-01 (`d3d4e926`) — CloudNativePG, Gateway API
> **Offisiell dokumentasjon**: https://docs.sky.fhi.no/
> **Fallback-dokumentasjon**: https://skybert.fhi.no/
> Denne skillen er en kuratert oppsummering for AI-agenter. For fullstendig dokumentasjon, se offisiell wiki.

**KRITISK**: Alle endringer må gå gjennom Git -> GitHub Actions -> FluxCD. Bruk aldri `kubectl apply` for permanente endringer.

**KRITISK**: Du har kun tilgang til ditt eget namespace (`tn-<tenant>`). Du kan ikke aksessere andre namespaces eller kluster-ressurser.

**KRITISK**: Workload Identity er automatisk aktivert for SkybertApp. For raw Deployments må du sette label og serviceAccountName manuelt (se [Sikkerhet](references/security.md)).

**VIKTIG**: Bruk `SkybertApp` CRD for deployments. `WebApp` CRD er utdatert og skal ikke brukes.

**VIKTIG**: Flux rekonsilerer automatisk hvert 2. minutt. Vent opptil 2 minutter etter at GitHub workflow lykkes for at endringer skal vises i klusteret.

---

## Om Skybert

Skybert er en Kubernetes-basert applikasjonsplattform hos FHI, bygget på:
- **Kubernetes** — AKS på Azure Local, koblet til Azure med Azure Arc (ikke Azure-hostet managed AKS)
- **GitOps** med Flux for deklarativ konfigurasjon
- **Azure-integrasjon** (Workload Identity, Key Vault, ACR)
- **Observability** (Loki for logging, Mimir for metrics, Tempo for tracing, Grafana for visualisering)

**Viktig:** Skybert bruker Azure Arc-connected Kubernetes, ikke vanlig Azure Kubernetes Service (AKS). Dette betyr at `az aks get-credentials` IKKE fungerer - du må bruke `az connectedk8s proxy` for kubectl-tilgang.

## Nøkkelkonsepter

### Tenant
En **Tenant** er den grunnleggende organisasjonsenheten i Skybert - et mellomnivå mellom team og applikasjon. Hver tenant har sitt eget Kubernetes namespace (`tn-<tenant>`) med isolerte ressurser og administreres via GitOps.

**Bestilling og navneregler:** Tenant bestilles via skjemaet **Bertil** (https://bertil.sky.fhi.no). Teamet velger selv tenant-navn innenfor navnereglene: kun små bokstaver, tall og bindestrek, maks **38 tegn**, og navnet kan ikke inneholde ordet «skybert». Velg med omhu — navnet blir namespace (`tn-<navn>`), GitOps-repo-navn m.m. Plattformteamet provisjonerer deretter tenanten (GitOps-repo, managed identities, namespace, tilgangspakke).

> Kilde: https://docs.sky.fhi.no/get-started/

**Organisasjonsmodeller:**
1. **Standard** (vanligst): Ett team, én tenant, én applikasjon
2. **Multi-app**: Ett team med flere tenants, hver med separate applikasjoner
3. **Integrert**: Én tenant med flere sammenkoblede applikasjoner

**Anbefaling:** Opprett separate tenants for applikasjoner med ulik sikkerhetsklassifisering.

### GitOps-flyt
1. Utvikler pusher endringer til `main`-branch
2. `oci-push.yaml` workflow renderer manifester og pusher OCI-artifact til ACR
3. Flux i klusteret oppdager endringer og applyer til klusteret

### Miljøer

Nye tenants leveres med alle tre miljømappene fra start:

- `sandbox/` — Sandkassemiljø på `aks-sandbox-01` (felles kluster for alle fargesoner, kjører grønn sone-policyer)
- `test/` — Testmiljø (skal oppføre seg som prod innen samme fargesone — samme policyer og nettverksregler)
- `prod/` — Produksjonsmiljø

Hvert miljø er en toppnivå-mappe med egne manifester/verdier. Mappene pakkes som separate OCI-artifacts (`gitops_sandbox`, `gitops_test`, `gitops_prod`) og deployes til sine respektive klustere.

**Miljø- og sonepresiseringer (per 2026-04-17):**

- Gul sone har foreløpig **åpen egress** uten IP/CIDR-whitelist.
- Rød sone krever **IP/CIDR-baserte egress-unntak** (GlobalNetworkPolicy, opprettet av plattformteamet) og er kun nåbar fra **secure zone** på ingress-siden.
- Test og prod innen samme farge deler policy-sett — test er ikke en svakere variant.

> Kilde: https://docs.sky.fhi.no/build/environments/

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/tenant-repositories/aks-sandbox-01/kustomization.yaml

**Namespace er identisk i alle miljøer.** Namespace-navnet (`tn-<tenant>`) er det samme på tvers av alle miljøer (test, sandbox, prod) — det er klusteret du kobler til som bestemmer miljøet, ikke namespace-navnet.

### Sikkerhetssoner

Hver sikkerhetssone har dedikerte klustere for test og prod. Kluster-navngivning: `aks-<sone>-<env>-NN`.

| Sone | Dataklassifisering | Kluster (test) | Kluster (prod) |
|------|-------------------|-----------------|-----------------|
| **Grønn** | Åpne data, lavere sensitivitet | aks-green-test-01 | aks-green-prod-02 |
| **Gul** | Interne data, persondata | aks-yellow-test-02 | aks-yellow-prod-01 |
| **Rød** | Identifiserbar helseinformasjon | aks-red-test-01 | aks-red-prod-01 |
| **Norsyss** | Egen prod-pipeline for Norsyss | – | aks-norsyss-prod-01 |
| **Ops** | Plattformtjenester (intern, ikke en standard fargegruppe) | aks-ops-test-01 | – |

Totalt 10 klustere er registrert i `scripts/lib/clusters.sh`. I den autoritative
`COLOR_GROUP_CLUSTERS`-mappingen er `aks-yellow-test-02` aktivt testkluster for
yellow-lanen. `aks-yellow-test-01` er fortsatt registrert, men inngår ikke i
yellow-lanen og er under utfasing.

> Kilde (autoritativ kluster-mapping): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/8aa3d7a71eb1209962ff3769a00a169cb3caec8e/scripts/lib/clusters.sh

Sandbox (`aks-sandbox-01`) er et unntak — ett felles kluster delt av alle fargesoner, med grønn sone-policyer.

**Grønn og gul sone** bruker identisk policy-sett (Kyverno `policies-green`): Pod Security Standards, Flux-relatert image/source-signaturverifisering, ressurskrav, og standard nettverkspolicyer. Tenanter kan opprette egne `NetworkPolicy`-ressurser.

> Kilde (policy-sett): https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-green/

**Rød sone** har en fundamentalt annerledes sikkerhetsmodell:
- **Default DENY** — all egress-trafikk blokkert som utgangspunkt
- Kun intern kommunikasjon innenfor eget namespace og DNS er automatisk tillatt
- Egress til eksterne tjenester krever eksplisitte IP-baserte whitelists (GlobalNetworkPolicy), opprettet av plattformteamet
- Native Kubernetes `NetworkPolicy` (`networking.k8s.io/v1`) er forbudt. Tenanter kan derimot opprette **Calico `NetworkPolicy`** (`crd.projectcalico.org/v1`) for ingress-only med `spec.order` i `[1000, 1200)` (gulvet 1000 håndheves på alle klustere av `limit-calico-netpol-order`; taket 1200 av rød sone-policyen)
- NFS egress (port 2049) er blokkert for alle soner

> Kilde (rød sone-policyer): https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/a16a243/infra/kyverno-policies/base/policies-red/

Se [kubectl-access](references/kubectl-access.md) for fullstendig kluster-liste med subscription-ID-er og proxy-kommandoer.

> Kilde (kluster-mapping): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/scripts/tenant--new.sh

### Blåløypa (Golden Path)

Blåløypa er den anbefalte veien for å komme i gang på Skybert.

**Forutsetninger:**

*Organisatorisk:*
- Utpekt tenant owner (typisk produkteier/domeneeier) med ansvar for: brukeradministrasjon, kostnader, sikkerhet, tilgjengelighet, dataklassifisering
- Avklaring om hvilken sikkerhetssone
- ROS (risikovurdering) for applikasjonen
- Tilgang til NHN Slack (#ext-fhi-skybert)

*Applikasjonskrav:*
- Applikasjon som kan kjøre på Linux — språk og rammeverk er valgfritt
- En Dockerfile (eller tilsvarende) som pakker appen til container-image
- En CI-pipeline (GitHub Actions, Azure DevOps e.l.) som bygger og pusher imaget — plattformen
  setter opp federert tilgang til container-registeret fra pipelinen
- Azure-subscriptions for Key Vault og andre Azure-integrasjoner (anbefalt: én for test, én for
  prod). Subscriptions er teamets ansvar — plattformen oppretter dem ikke
- Database: tre støttede alternativer — Azure managed, NHN Moderne Etatsplattform, eller
  PostgreSQL in-cluster med CloudNativePG (se [Persistence](references/persistence.md))
- For rød data: Kontroll av utgående trafikk + risikovurderingsdokumentasjon

*Teknisk:*
- GitHub-organisasjon: FHIDev
- Azure-tilganger fra plattformteamet
- Tilgangspakke via MyAccess-portalen (myaccess.microsoft.com)
- For prod og foreløpig red-test (`aks-red-test-01`): PIM elevation (se `references/kubectl-access.md` for presis regel)
- Kjør `az logout && az login` etter tilgangsendringer

**Steg-for-steg (Blåløypa):**
1. **Bestill tenant via Bertil** (https://bertil.sky.fhi.no): Plattformteamet provisjonerer tenant, GitOps-repo, managed identities, namespace og tilgangspakke — du varsles når det er klart
2. **Søk tilgang via MyAccess**: Teammedlemmer søker riktig access package (f.eks. `FHI - Skybert - <Tenant>-Test-Yellow`)
   - Access package-tilgang er tidsbegrenset (typisk 1 år) og må fornyes
   - Én av tenantens approvere må godkjenne søknader i access package-flyten
   - **Approvere kan ikke godkjenne sin egen tilgangssøknad** — den andre approveren må gjøre det
   - **Tenant owner er ansvarlig** for å gjennomføre access review hver tredje måned (Microsoft sender e-post når review skal startes). Manglende fullføring innen frist fører til at alle medlemmer mister tilgang.

> Kilde: https://docs.sky.fhi.no/miscellaneous/access-packages/

3. **Verifiser GitOps-repo** (`Fhi.<Tenant>.GitOps`): oci-push og update-tag workflows er allerede satt opp
4. **Deploy med minimal SkybertApp**: Lag `sandbox/skybertapp.yaml` og push til main (docs anbefaler å starte i sandbox; bruk `test/` eller `prod/` når miljøet er klart)
5. **Verifiser i klusteret**: Vent på Flux-rekonsiliering (hvert 2 min), sjekk pods og ingress

> Detaljert steg-for-steg finnes på https://docs.sky.fhi.no/get-started/blaloypa/ (noe innhold er under arbeid)

## Repository-oppsett

Nye tenants starter fra en mal som inneholder:
- `.github/workflows/oci-push.yaml` — Bygger og pusher OCI-artifakter
- `.github/workflows/update-tag.yaml` — Webhook for image tag-oppdateringer
- `sandbox/`, `test/`, `prod/` — Alle tre miljømapper fra start

> Kilde: https://docs.sky.fhi.no/build/
> Kilde: https://docs.sky.fhi.no/get-started/gitops-repo/

### Påkrevde GitHub Repository-variabler og secrets

Før workflows kan kjøre, må disse **variablene** konfigureres (brukes med `vars.*` i workflows):

| Variabel | Beskrivelse |
|----------|-------------|
| `AZURE_CLIENT_ID` | Managed Identity client ID for ACR push |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `GITOPS_REPO` | GitOps-repository (f.eks. `FHIDev/Fhi.Exempl.Gitops`) |

I tillegg trengs disse **secrets** (brukes med `secrets.*`):

| Secret | Beskrivelse |
|--------|-------------|
| `GH_PAT` | Token GitOps-repoets `update-tag.yaml` bruker for intern workflow chaining — verifiser mot repoets faktiske workflow |
| `GITOPS_APP_CLIENT_ID` | Client ID for GitHub App installert på GitOps-repoet (anbefalt for cross-repo dispatch) |
| `GITOPS_APP_PRIVATE_KEY` | Privat nøkkel-PEM for samme GitHub App (ikke client secret) |
| `GITOPS_PAT` | Eldre oppsett: PAT for repository_dispatch — fungerer fortsatt, men GitHub App er dokumentert mønster |

**For å verifisere variabler og secrets:**
```bash
gh variable list --repo <owner>/<repo>
gh secret list --repo <owner>/<repo>
```

**For å sette variabler** (krever admin-tilgang til repoet):
```bash
gh variable set AZURE_CLIENT_ID --body "<verdi>"
gh variable set AZURE_TENANT_ID --body "<verdi>"
gh variable set AZURE_SUBSCRIPTION_ID --body "<verdi>"
gh variable set GITOPS_REPO --body "FHIDev/Fhi.<Tenant>.GitOps"
```

## Image Tag Management og Promotion

Hvert miljø har sin egen pinned tag i GitOps-repoet. App-repoets build-workflow sender `repository_dispatch` til GitOps-repoet, som kjører `update-tag.yaml` og committer tag-oppdateringen i target-miljøets mappe.

### Promotion-flyt

```
sandbox → test → prod
```

### Dispatch fra app-repo

```bash
# I app-repoets build-workflow, som bash-step. ${{ ... }} er GitHub Actions-uttrykk.
# Bearer-tokenet er et GitHub App-installasjonstoken (anbefalt — se references/workflows.md),
# eller GITOPS_PAT i eldre oppsett.
curl -X POST \
  -H "Authorization: Bearer ${{ steps.gitops-app-token.outputs.token }}" \
  "https://api.github.com/repos/${{ vars.GITOPS_REPO }}/dispatches" \
  -d '{"event_type":"update_tag","client_payload":{
    "env": "test",
    "updates": [{"repository": "${{ github.event.repository.name }}", "tag": "abc1234"}]
  }}'
```

`repository` er **image-repository-navnet i GitOps-manifestene** — `<app>`-segmentet i `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>` (docs per 2026-09). Er GitHub repo-navn og image-navn identiske spiller det ingen rolle; avviker de, er det image-navnet `update-tag.yaml` matcher på. Default-varianten dokumentert i `references/workflows.md` leser kun `env` og `tag` og bytter alle `tag:`-linjer i en fast fil — sjekk den konkrete `update-tag.yaml` i eget repo. Se `references/workflows.md` for komplett payload-format.

### Hvor tag-en havner

`update-tag.yaml` oppdaterer `tag:`-linjer i filer under `${ENV}/`-mappen i GitOps-repoet. Default-varianten dokumentert i `references/workflows.md` kjører `sed` på `${ENV}/skybertapp.yaml`, men GitOps-repoer kan ha egne varianter som håndterer andre filstrukturer (Helm values, Kustomize, osv.). Sjekk den konkrete `update-tag.yaml` i GitOps-repoet for å se hva som faktisk skjer.

Uavhengig av filstruktur:
- Tag-verdien for et miljø må ligge i en fil under `${ENV}/`-mappen. Tags utenfor (f.eks. i `base/`) blir ikke oppdatert av dispatch.
- Ikke sett en fallback-tag som `latest` i delte baseline-filer. Det maskerer feilet promotion med stille deploy av vilkårlig siste push — la manglende tag feile høyt i stedet.

### Promotion til neste miljø

Promotion er manuell — send en ny `repository_dispatch` med ønsket `env` og tag. Kan gjøres via `workflow_dispatch`, CLI, eller en dedikert promotion-workflow.

## SkybertApp CRD

Bruk `SkybertApp` for alle applikasjoner. Den håndterer secrets, ingress, autoskalering og sikkerhetshardening i én ressurs.

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
      mountAsEnv: false
```

> **Probes anbefales for produksjon.** Se [SkybertApp CRD](references/skybertapp-crd.md#health-probes) for full felt-liste og [konfigurasjon](references/configuration.md#health-probes-i-net-apper) for .NET-mønster (Health Checks API + public/private endpoints).

**Funksjoner:**
- Enhetlig secrets-håndtering - spesifiser bare vault-navn og nøkler
- Automatisk SecretStore + ExternalSecret-opprettelse
- Automatisk workload identity (alltid aktivert for alle SkybertApp-deployments)
- `writableDirs`-støtte for sikkerhetshardening
- Renere konfigurasjonssyntaks (objekt vs array)
- HPA-støtte
- Innebygde **probes** (liveness/readiness/startup) via `probes`-felt
- Automatisk **PodDisruptionBudget** når `replicas>1` eller `autoscaling.minReplicas>1` (default `minAvailable: "33%"`)
- **Prometheus metrics-scraping** via `metrics.port` — annotasjoner settes automatisk
- **`args`** for argumenter til container-kommandoen
- **Scale-subresource** — `kubectl scale skybertapp/<navn>` fungerer, `kubectl get skybertapp` viser DESIRED/CURRENT, og autoskalerere kan peke `targetRef` rett på SkybertApp-en. Merk at `kubectl scale` overstyres av Flux ved neste rekonsiliering — se [SkybertApp CRD](references/skybertapp-crd.md#status-og-scale-subresource)

**Begrensninger:**
- Memory limit er alltid lik request
- Alpha API (kan ha breaking changes)

Se [SkybertApp CRD-spesifikasjon](references/skybertapp-crd.md) for full dokumentasjon.

> **Merk:** Det finnes også en `WebApp` CRD (`skybert.fhi.no/v1`) men den er utdatert og skal ikke brukes.

## Raw Helm/Manifester - Komplekse apper

For komplekse applikasjoner (som Airflow, Gitea) som trenger:
- Upstream Helm charts som dependencies
- StatefulSets, Jobs eller andre ressurstyper
- Tilpassede RBAC-konfigurasjoner
- Flere deployments/services

Bruk `base/` + miljø-mønsteret med Helm charts.

## Navnekonvensjoner

Tenant-navnet velges av teamet i Bertil-skjemaet innenfor navnereglene (små bokstaver/tall/bindestrek, maks 38 tegn, ikke ordet «skybert» — se [Tenant](#tenant)). Bruk disse mønstrene:

| Ressurs | Mønster | Eksempel |
|---------|---------|----------|
| Namespace | `tn-<tenant>` | `tn-exempl` |
| Service Account | `<tenant>-azure` | `exempl-azure` |
| Managed Identity | `<tenant>-skybert-sa-<env>` | `exempl-skybert-sa-test` |

**Utlede tenant-navn fra repository** (ett eksempel):
- Repository: `Fhi.Fida.MyApp.GitOps`
- Tenant-navn kan f.eks. være: `fida-myapp`, `fida`, eller annet format valgt ved bestilling
- Namespace: `tn-<tenant>`

## Vanlige ressurser

### SecretStore (for WebApp eller manuelle secrets)

Påkrevet når du bruker `WebApp` CRD eller håndterer secrets manuelt:

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

**RBAC-forutsetning:** SecretStore bruker plattformens SA (`<tenant>-azure`) og dets tilhørende managed identity for å aksessere Key Vault. Denne identiteten provisjoneres av plattformteamet, men **tenanten må selv gi den `Key Vault Secrets User`-rollen** på sin Key Vault. Uten denne rollen feiler alle ExternalSecrets med 403 ForbiddenByRbac. Administrer dette via Terraform eller `az role assignment create`.

### ExternalSecret

Henter secrets fra Azure Key Vault:

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: tn-<tenant>
spec:
  refreshInterval: 1h
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

### RoleBinding (namespace-tilgang)

Plattformen provisjonerer normalt namespace-tilgang ved å binde tenantens Entra-gruppe til den kuraterte ClusterRole-en `skybert:tenant-admin`. Ikke opprett en egen binding til `cluster-admin` — tenant-admin holder ikke lenger den rollen, og Kubernetes' escalation-prevention vil avvise et forsøk på å binde den (du kan kun delegere et subsett av egne rettigheter).

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: entra-access
  namespace: tn-<tenant>
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: skybert:tenant-admin
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: "<entra-group-id>"
```

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/8aa3d7a71eb1209962ff3769a00a169cb3caec8e/tenants/exempl/base/entra-access-rolebinding.yaml

## Ingress-hostnavn

Støttede domener per miljø:

| Miljø | Domener |
|-------|---------|
| Test / Sandbox | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager.

Cert-manager cluster-issuere per domene:
| Domene | Issuer |
|--------|--------|
| `*.skytest.fhi.no` | `skytest-fhi-letsencrypt-azuredns-issuer` |
| `*.fhi-k8s.com` | `fhi-k8s-letsencrypt-azuredns-issuer` |
| `*.sky.fhi.no` | `sky-fhi-letsencrypt-azuredns-issuer` |

### To veier inn

**ingress-nginx** er produksjonsveien og kjører på alle klustere: `Ingress` med
`ingressClassName: nginx`. Dette er det `SkybertApp` (`skybert.fhi.no/v1alpha1`) genererer.

**Envoy Gateway** (v1.8.2, Gateway API standard channel) er utrullet parallelt på
ops-test, sandbox, yellow-test/prod, red-test/prod og norsyss — **ikke på green-test og
green-prod**, som bare har Envoy-namespacet. Tenanter får `httproutes`, `grpcroutes`,
`tlsroutes`, `listenersets` og Envoys `securitypolicies` — men **ikke `gateways`**.
Gateway-objektene eies av plattformen; tenanten fester en `ListenerSet` (eget hostnavn og
sertifikat) til en av dem, og henger `HTTPRoute`-er på den.

RBAC nevner også `tcproutes` og `udproutes`, men de CRD-ene er ikke installert — standard
channel har dem ikke. En slik ressurs feiler Flux' dry-run, som da avviser **hele**
Kustomizationen, ikke bare den ene fila.

Tre nettverk, som avgjør hvem som når appen:

| GatewayClass | Når | Hvor |
|--------------|-----|------|
| `fhinett` | FHI-interne brukere (default i beta-CRD-en) | Per-tenant Gateway i `tn-<tenant>`, lagt inn av plattformteamet |
| `helsenett` | Aktører på helsenettet — kommuner, HF | Delt Gateway i `envoy-gateway-system` |
| `internett` | Offentlig eksponering | Delt Gateway, kun ops-test, sandbox og yellow-test/prod |

Velg `helsenett` framfor `internett` når brukerne finnes på helsenettet.

**Gateway API når ikke tenant-pods i rød sone.** `base-tenant-ingress` (order 1200) slipper
kun inn trafikk fra `ingress-nginx`-namespacet og denyer resten, og det finnes ingen
GlobalNetworkPolicy for Envoy. Manifestene applyer fint og serverer ingenting. Bruk
`Ingress` på rød, eller be `#ext-fhi-skybert` om en åpning.

Tenanter har også `securitypolicies` (`gateway.envoyproxy.io`) i RBAC-settet — se
[Sikkerhet](references/security.md) for hva den dekker og forbeholdene som gjelder.

Gateway API-ressursene skriver du selv. `SkybertApp` som genererer `HTTPRoute` +
`ListenerSet` finnes som `skybert-beta.fhi.no/v1beta1`, men CRD-en er kun på
`aks-ops-test-01`, **og tenant-RBAC dekker den ikke** — rettighetene er gitt på API-gruppen
`skybert.fhi.no`, ikke `skybert-beta.fhi.no`. Regn den som plattform-intern inntil videre.

Se [Hostnavn og nettverk](references/hostnames-and-networking.md) for begge mønstrene i sin
helhet, inkludert external-dns for offentlige IP-er.

## Persistence / Data lagring

For databaser finnes tre støttede alternativer på samme nivå: **Azure managed database**,
**NHN Moderne Etatsplattform**, og **PostgreSQL i klusteret med CloudNativePG** (støttet på alle
ni aktive klustere — men teamet eier backup, restore-test og Azure Blob-kontoen selv).

For volumer finnes sju StorageClasses (`cloud-backed-sc`, `cloud-backed-retain-sc`,
`unbacked-sc`, `unbacked-retain-sc`, `default`, `ontap-nas`, `blob-fuse`) — `kubectl get sc` på
eget kluster er autoritativt. **Ingen StorageClass er backup** (ingen volume snapshots på
klusterne), og **`ontap-nas` (NFS) skal aldri brukes til databaser**.

Se [Persistence og CloudNativePG](references/persistence.md) for valg, reclaim-policy,
backup/restore og operative fallgruver.

> Kilde: https://docs.sky.fhi.no/persistence/
> Kilde: https://docs.sky.fhi.no/persistence/postgres/

### Postgres i klusteret (CloudNativePG)

CloudNativePG-operatøren er rullet ut til alle klustere (2026-08-17), og tenanter har RBAC
til å deklarere `Cluster`, `ScheduledBackup` og barman `ObjectStore` i eget namespace.
Backup går til Azure Blob med workload identity, uten secret i namespacet.

**Bruk aldri `ontap-nas` til PGDATA.** CloudNativePG støtter ikke NFS for datavolumer, og
klassen monteres med `nolock` — to postmastere kan da åpne samme PGDATA og korrumpere
databasen.

Hva som da er riktig StorageClass er uavklart: `default` er node-lokal block storage og
kan være riktig for CNPG med replikering og Blob-backup, men den er ikke deklarert i
infra-repoet og plattformens egen plan er å erstatte lagringen med ACSA. **Avklar med
`#ext-fhi-skybert` før du planlegger CNPG i produksjon.** Alternativene ellers er Azure
Database for PostgreSQL Flexible Server eller VM-Postgres.

Se [CloudNativePG](references/cloudnative-pg.md) for tenant-kontrakten, Azure-forutsetningene
og de to labelene rød sone krever.

## Azure Workload Identity

Skybert bruker Azure Workload Identity for passordløs autentisering mot Azure-tjenester (Key Vault, Blob Storage, etc.).

### Automatisk aktivering

**SkybertApp:** Workload Identity er alltid aktivert. Composition setter automatisk `azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure` på alle pods.

**Raw Deployment:** Du må sette label og serviceAccountName manuelt (se [Sikkerhet](references/security.md)).

### Hvordan det fungerer

1. Kubernetes ServiceAccount annoteres med Azure client ID
2. Pod bruker ServiceAccount
3. Azure AD utsteder tokens via OIDC federation
4. Applikasjon autentiserer mot Azure-tjenester uten secrets

## Brukervendt autentisering

Skybert har per nå ingen innebygd funksjonalitet for brukervendt autentisering eller maskin-til-maskin-autentisering for tenants. Bruk standard IAM-prosedyrer med OIDC via EntraID, IDPorten eller HelseID. Unngå legacy AD-autentisering.

> Kilde: https://docs.sky.fhi.no/auth/

> **Merk (per 2026-08-14):** Tenant-admin har nå skrivetilgang til Envoy `SecurityPolicy`
> (`gateway.envoyproxy.io`) på klustere der Gateway API er aktivert, noe som teknisk muliggjør
> OIDC-terminering i gateway-laget. Dette er **ikke** annonsert som en støttet plattformfunksjon i
> offisiell docs — avklar med `#ext-fhi-skybert` før du bygger på det. Rate limiting hører til
> `BackendTrafficPolicy` og er ikke omfattet. Se [Sikkerhet](references/security.md).

## Feilsøking av deployments

Etter push til `main`, følg disse stegene for å verifisere deployment.

**Viktig:** Du har kun tilgang til ressurser i ditt eget namespace (`tn-<tenant>`). Flux system-ressurser og rekonsiliering krever plattformteam-tilgang.

### 1. Sjekk GitHub Workflow

```bash
# List nylige workflow-kjøringer
gh run list

# Følg med på fullførelse (kjører på nytt hvert 5. sekund)
watch -n 5 'gh run list --limit 3'

# Se logger for en spesifikk kjøring
gh run view <run-id> --log
```

### 2. Vent på Flux-rekonsiliering

Flux rekonsilerer automatisk hvert 2. minutt. Etter at GitHub workflow lykkes, vent opptil 2 minutter for at endringer skal vises i klusteret.

### 3. Sjekk applikasjonsressurser

```bash
# List alle ressurser i namespace
kubectl get all -n tn-<tenant>

# Sjekk pod-status
kubectl get pods -n tn-<tenant>

# Se pod-logger
kubectl logs -n tn-<tenant> <pod-name>

# Beskriv en feilende pod
kubectl describe pod <pod-name> -n tn-<tenant>

# Sjekk events (nyttig for å se nylige problemer)
kubectl get events -n tn-<tenant> --sort-by='.lastTimestamp'
```

### 4. Sjekk External Secrets

```bash
# Verifiser ExternalSecret-status
kubectl get externalsecrets -n tn-<tenant>
kubectl describe externalsecret <name> -n tn-<tenant>

# Sjekk om den faktiske Secret ble opprettet
kubectl get secrets -n tn-<tenant>
```

## Flux-verktøy for utviklere

- **Flux Dashboard** — web-UI per kluster (`https://flux.<color>-<instance>.<domain>`) for å se Kustomization-status, suspendere/resumere, og trigge manuell rekonsiliering. Pålogging via FHI Entra ID.
- **Flux Operator MCP** — Model Context Protocol-server som lar AI-assistenter (Cursor, VS Code Copilot, Claude Desktop) lese kluster-tilstand og pod-logger. Anbefalt med `--read-only`.

Se [Flux-verktøy](references/flux-tooling.md) for URL-tabeller og oppsett.

## Filstruktur

Typisk tenant repository-struktur:

```
.github/workflows/
  oci-push.yaml
  update-tag.yaml
test/
  skybertapp.yaml
  rolebinding.yaml
README.md
```

For Helm-baserte deployments:

```
.github/workflows/
  oci-push.yaml
  update-tag.yaml
base/
  Chart.yaml
  values.yaml
  charts/               # Helm dependencies
test/
  Chart.yaml
  kustomization.yaml
  values.yaml
  secretstore.yaml
  externalsecret.yaml
  rolebinding.yaml
README.md
```

## Legal og compliance

- **ROS (risikovurdering):** Alle applikasjoner skal ha en applikasjons-ROS
- **DPIA:** Data Protection Impact Assessment for applikasjoner med persondata
- **Ansvarsfordeling:** Basert på HUKI-modellen - se offisiell docs for detaljer
- Se offisiell dokumentasjon på https://docs.sky.fhi.no/ for fullstendige krav (fallback: https://skybert.fhi.no/)

## Skybert-verdier i CLAUDE.md / AGENTS.md

> **Lokal repo-anbefaling** — denne seksjonen er ikke fra offisiell Skybert-docs, men en anbefaling for AI-agenter som jobber med Skybert-prosjekter.

For prosjekter som bruker Skybert, anbefaler vi å legge inn følgende verdier i prosjektets `CLAUDE.md` eller `AGENTS.md`:

| Nøkkel | Verdi |
|--------|-------|
| Tenant | `<tenant-navn>` |
| Sikkerhetssone | Grønn / Gul / Rød |
| Test namespace | `tn-<tenant>` |
| Prod namespace | `tn-<tenant>` |
| Test hostname | `<app>.skytest.fhi.no` |
| Prod hostname | `<app>.sky.fhi.no` |
| ACR image | `crfhiskybert.azurecr.io/<tenant>/<app>` |
| Deployment | `<app>-deployment` |
| Azure tenant ID | `<azure-tenant-id>` |

Dette gir AI-agenten kontekst for å generere korrekte konfigurasjoner uten å gjette.

## Referanser

| Dokument | Innhold |
|----------|---------|
| [SkybertApp CRD-spesifikasjon](references/skybertapp-crd.md) | Full SkybertApp felt-referanse |
| [SkybertApp rendering](references/skybertapp-render.md) | Kjør Composition lokalt med `crossplane render` for å se genererte manifester |
| [Persistence og CloudNativePG](references/persistence.md) | StorageClasses, databasevalg, CNPG-oppsett, backup/restore og fallgruver |
| [Secrets-mønstre](references/secrets.md) | SecretStore, ExternalSecret-mønstre |
| [Workflows](references/workflows.md) | GitHub Actions CI/CD workflows |
| [kubectl-tilgang](references/kubectl-access.md) | Kubectl-tilgang, k9s, kjøre containers lokalt |
| [Konfigurasjon](references/configuration.md) | WebApp, Deployment, Helm, Kustomize-eksempler |
| [Sikkerhet](references/security.md) | Workload Identity, sikkerhet, nettverkspolicyer |
| [Observability](references/observability.md) | Logging, metrics, Grafana |
| [Feilsøking](references/troubleshooting.md) | Feilsøking og debug-kommandoer |
| [Legacy: WebApp CRD og CSI driver (utdatert)](references/legacy-webapp-csi.md) | Legacy WebApp-referanse, migreringsguide og CSI driver-eksempler |
| [Plattformarkitektur](references/platform-architecture.md) | Flux, Crossplane, OCI-flyt, tenant-bootstrap |
| [Kyverno-policier](references/kyverno-policies.md) | Sikkerhetspolicier som påvirker tenanter |
| [Hostnavn og nettverk](references/hostnames-and-networking.md) | Domener, TLS, ingress-regler, nettverkspolicyer |
| [CloudNativePG](references/cloudnative-pg.md) | Postgres i klusteret: tenant-kontrakt, Blob-backup, storage-fellen |
| [Flux-verktøy](references/flux-tooling.md) | Flux Dashboard og Flux Operator MCP |

## Support

Kontakt Skybert plattformteam:
- NHN Slack: `#ext-fhi-skybert`

## Ansvarsfordeling

**Skybert (plattformteamet):** Kubernetes-infrastruktur, Flux, Crossplane, Observability, Azure-integrasjoner, plattform-sikkerhet

**Tenant (applikasjonsteam):** Applikasjonskode, GitOps-konfigurasjon, secrets management, applikasjons-ROS, monitorering

**Høy tilgjengelighet er applikasjonsteamets ansvar:** Kubernetes garanterer at *det finnes*
kjørende pods — ikke at *samme* pod består. Pod-restart og flytting uten forvarsel er normal
drift. Appen må håndtere brå shutdown korrekt, og kjøre flere identiske replikaer samtidig når
tilgjengelighetskravet tilsier det — plattformens PDB og autoskalering erstatter ikke
applikasjonsdesign for failover og reconnect.

> Kilde: https://docs.sky.fhi.no/explanations/what-is-skybert/

---

## Instruksjoner for Claude

Når du hjelper brukere med Skybert:

1. **Identifiser konteksten**: Onboarding eller eksisterende app? Sikkerhetssone? Miljø (test/prod)?

2. **Generer kode** når brukeren ber om konkrete konfigurasjoner eller eksempler

3. **Veilede** når konsepter må forklares eller flere tilnærminger er mulige

4. **Alltid**:
   - Bruk riktige navnekonvensjoner (`<tenant>`, `tn-<tenant>`)
   - Inkluder sikkerhetskonfigurasjon
   - Anbefal `SkybertApp` CRD fremfor `WebApp`

5. **Vær oppmerksom på**:
   - Sikkerhetssone-forskjeller (spesielt nettverkspolicyer i rød)
   - Azure Workload Identity-oppsett
   - GitOps-prinsippet (alt i Git)

6. **Ved usikkerhet**: Referer til plattformteamet (#ext-fhi-skybert)

