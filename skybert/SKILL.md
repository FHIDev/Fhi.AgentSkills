---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, SkybertApp CRD, Azure Workload Identity, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---
<!-- Oppdater-skybert-state:
schema_version=2
docs_repo=FHISkybert/Fhi.Skybert.Docs
docs_branch=main
docs_commit=e7f41eca2e5ec7ba1818075e8e314839f8ebaff9
docs_commit_date=2026-04-15
infra_repo=FHISkybert/Fhi.Skybert.Infra
infra_branch=main
infra_commit=adef9e78918862cd7fedfc2476242e286aadc992
infra_commit_date=2026-04-17
last_fullscan_date=2026-04-17
-->

# Skybert Platform Skill

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

> **Sist verifisert mot offisiell docs:** 2026-04-17
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
- **Kubernetes** via Azure Arc-connected Kubernetes (IKKE vanlig AKS)
- **GitOps** med Flux for deklarativ konfigurasjon
- **Azure-integrasjon** (Workload Identity, Key Vault, ACR)
- **Observability** (Loki for logging, Mimir for metrics, Tempo for tracing, Grafana for visualisering)

**Viktig:** Skybert bruker Azure Arc-connected Kubernetes, ikke vanlig Azure Kubernetes Service (AKS). Dette betyr at `az aks get-credentials` IKKE fungerer - du må bruke `az connectedk8s proxy` for kubectl-tilgang.

## Nøkkelkonsepter

### Tenant
En **Tenant** er den grunnleggende organisasjonsenheten i Skybert - et mellomnivå mellom team og applikasjon. Hver tenant har sitt eget Kubernetes namespace (`tn-<tenant>`) med isolerte ressurser og administreres via GitOps. Tenant-navnet tildeles av plattformteamet.

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
| **Gul** | Interne data, persondata | aks-yellow-test-01 | aks-yellow-prod-01 |
| **Rød** | Identifiserbar helseinformasjon | aks-red-test-01 | aks-red-prod-01 |

Sandbox (`aks-sandbox-01`) er et unntak — ett felles kluster delt av alle fargesoner, med grønn sone-policyer.

**Grønn og gul sone** bruker identisk policy-sett (Kyverno `policies-green`): Pod Security Standards, Flux-relatert image/source-signaturverifisering, ressurskrav, og standard nettverkspolicyer. Tenanter kan opprette egne `NetworkPolicy`-ressurser.

> Kilde (policy-sett): https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-green/

**Rød sone** har en fundamentalt annerledes sikkerhetsmodell:
- **Default DENY** — all nettverkstrafikk blokkert som utgangspunkt
- Kun intern kommunikasjon innenfor eget namespace og DNS er automatisk tillatt
- Egress til eksterne tjenester krever eksplisitte IP-baserte whitelists (GlobalNetworkPolicy), opprettet av plattformteamet
- Tenanter kan **ikke** opprette egne `NetworkPolicy`-ressurser (blokkeres av Kyverno)
- NFS egress (port 2049) er blokkert for alle soner

> Kilde (rød sone-policyer): https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-red/

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
- Applikasjon som kan kjøre på Linux (.NET er standard)
- Azure subscription for Key Vault eller andre Azure-integrasjoner
- Ekstern database (anbefalt), enten fra NHN Moderne Etatsplattform eller Azure
- For rød data: Kontroll av utgående trafikk + risikovurderingsdokumentasjon

*Teknisk:*
- GitHub-organisasjon: FHIDev
- Azure-tilganger fra plattformteamet
- Tilgangspakke via MyAccess-portalen (myaccess.microsoft.com)
- For prod og foreløpig red-test (`aks-red-test-01`): PIM elevation (se `references/kubectl-access.md` for presis regel)
- Kjør `az logout && az login` etter tilgangsendringer

**Steg-for-steg (Blåløypa):**
1. **Onboarding med plattformteamet**: Tenant, namespace og tilganger etableres
2. **Søk tilgang via MyAccess**: Teammedlemmer søker riktig access package (f.eks. `FHI - Skybert - <Tenant>-Test-Yellow`)
   - Access package-tilgang er tidsbegrenset (typisk 1 år) og må fornyes
   - Én av tenantens approvere må godkjenne søknader i access package-flyten
   - Tenant owner/approvere må følge opp access reviews (kvartalsvis) innen frist for å unngå at medlemmer mister tilgang

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
| `GH_PAT` | Personal Access Token for workflow chaining i GitOps-repo |
| `GITOPS_PAT` | Personal Access Token for repository_dispatch på tvers av repoer |

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
curl -X POST \
  -H "Authorization: Bearer ${{ secrets.GITOPS_PAT }}" \
  "https://api.github.com/repos/${{ vars.GITOPS_REPO }}/dispatches" \
  -d '{"event_type":"update_tag","client_payload":{
    "env": "test",
    "updates": [{"repository": "${{ github.event.repository.name }}", "tag": "abc1234"}]
  }}'
```

`repository` skal være GitHub repo-navnet (ikke ACR-pathen). Primærkilden og andre `update-tag.yaml`-varianter bruker feltet for å velge riktig manifest; default-varianten dokumentert i `references/workflows.md` leser kun `env` og `tag` og bytter alle `tag:`-linjer i en fast fil. Send GitHub repo-navnet for å være kompatibel med begge. Se `references/workflows.md` for komplett payload-format.

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
  secrets:
    - vault: my-keyvault
      keys:
        - remote: database-password
          local: DB_PASSWORD
      mountAsEnv: false
```

**Funksjoner:**
- Enhetlig secrets-håndtering - spesifiser bare vault-navn og nøkler
- Automatisk SecretStore + ExternalSecret-opprettelse
- Automatisk workload identity (alltid aktivert for alle SkybertApp-deployments)
- `writableDirs`-støtte for sikkerhetshardening
- Renere konfigurasjonssyntaks (objekt vs array)
- HPA-støtte

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

Tenant-navnet tildeles av plattformteamet. Bruk disse mønstrene:

| Ressurs | Mønster | Eksempel |
|---------|---------|----------|
| Namespace | `tn-<tenant>` | `tn-exempl` |
| Service Account | `<tenant>-azure` | `exempl-azure` |
| Managed Identity | `<tenant>-skybert-sa-<env>` | `exempl-skybert-sa-test` |

**Utlede tenant-navn fra repository** (ett eksempel):
- Repository: `Fhi.Fida.MyApp.GitOps`
- Tenant-navn kan f.eks. være: `fida-myapp`, `fida`, eller annet format tildelt av plattformteamet
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

Gi brukere/grupper tilgang til namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: rb-<tenant>-admins
  namespace: tn-<tenant>
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: User
    name: "user@fhi.no"
    apiGroup: rbac.authorization.k8s.io
  - kind: Group
    name: "<entra-group-id>"
    apiGroup: rbac.authorization.k8s.io
```

## Ingress-hostnavn

Støttede domener per miljø:

| Miljø | Domener |
|-------|---------|
| Test / Sandbox | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager.

### Public DNS-oppslag (external-dns)

Som standard resolves ingress-hostnavn til interne 10.x-adresser. For at DNS skal peke til en offentlig IP, legg til annotasjonen `external-dns.alpha.kubernetes.io/target` på Ingress-objektet:

| Cluster | Annotation-verdi |
|---------|-----------------|
| green-prod | `external-dns.alpha.kubernetes.io/target: 83.118.177.234` |
| green-test | `external-dns.alpha.kubernetes.io/target: 83.118.177.220` |

**Merk:** SkybertApp CRD eksponerer ikke denne annotasjonen på Ingress-objektet. Du må derfor opprette tre separate objekter: en SkybertApp (uten ingress), en Service, og et raw Ingress-objekt.

Mønsteret er:

1. **SkybertApp** — kun app-definisjon, ingen ingress-konfigurasjon:
```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-app
  namespace: tn-my-tenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/my-app
    tag: "latest"
  port: 8080
  resources:
    cpu: "500m"
    memory: "512Mi"
```

2. **Service** — kobler til SkybertApp sine pods via label `skybert.fhi.no/webapp`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
  namespace: tn-my-tenant
spec:
  type: ClusterIP
  selector:
    skybert.fhi.no/webapp: my-app
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

3. **Ingress** — med external-dns-annotasjon og cert-manager:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: tn-my-tenant
  annotations:
    cert-manager.io/cluster-issuer: skytest-fhi-letsencrypt-azuredns-issuer
    external-dns.alpha.kubernetes.io/target: "83.118.177.234"
spec:
  ingressClassName: nginx
  rules:
    - host: my-app.skytest.fhi.no
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-svc
                port:
                  number: 8080
  tls:
    - hosts:
        - my-app.skytest.fhi.no
      secretName: my-app-tls
```

Cert-manager cluster-issuere per domene:
| Domene | Issuer |
|--------|--------|
| `*.skytest.fhi.no` | `skytest-fhi-letsencrypt-azuredns-issuer` |
| `*.fhi-k8s.com` | `fhi-k8s-letsencrypt-azuredns-issuer` |
| `*.sky.fhi.no` | `sky-fhi-letsencrypt-azuredns-issuer` |

## Persistence / Data lagring

**Anbefaling:** Hold persistent data utenfor Kubernetes. Avhengig av sikkerhetsklassifisering, lagre data i:
- **Azure public cloud** (for grønn/gul data)
- **NHN Datacenter** (for rød data eller strengere krav)

Plattformen planlegger å tilby tre StorageClass-nivåer med ulike nivåer av redundans, snapshot-retensjon og backup. Nåværende planlagte løsning er **ikke egnet for IO-intensive workloads** som aktive databaser.

> Kilde: https://docs.sky.fhi.no/persistence/

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
| [Secrets-mønstre](references/secrets.md) | SecretStore, ExternalSecret-mønstre |
| [Workflows](references/workflows.md) | GitHub Actions CI/CD workflows |
| [kubectl-tilgang](references/kubectl-access.md) | Kubectl-tilgang, k9s, kjøre containers lokalt |
| [Konfigurasjon](references/configuration.md) | WebApp, Deployment, Helm, Kustomize-eksempler |
| [Sikkerhet](references/security.md) | Workload Identity, sikkerhet, nettverkspolicyer |
| [Observability](references/observability.md) | Logging, metrics, Grafana |
| [Feilsøking](references/troubleshooting.md) | Feilsøking og debug-kommandoer |
| [WebApp CRD (utdatert)](references/webapp-crd.md) | Legacy WebApp-referanse og migreringsguide |
| [Plattformarkitektur](references/platform-architecture.md) | Flux, Crossplane, OCI-flyt, tenant-bootstrap |
| [Kyverno-policier](references/kyverno-policies.md) | Sikkerhetspolicier som påvirker tenanter |
| [Hostnavn og nettverk](references/hostnames-and-networking.md) | Domener, TLS, ingress-regler, nettverkspolicyer |

## Support

Kontakt Skybert plattformteam:
- NHN Slack: `#ext-fhi-skybert`

## Ansvarsfordeling

**Skybert (plattformteamet):** Kubernetes-infrastruktur, Flux, Crossplane, Observability, Azure-integrasjoner, plattform-sikkerhet

**Tenant (applikasjonsteam):** Applikasjonskode, GitOps-konfigurasjon, secrets management, applikasjons-ROS, monitorering

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

