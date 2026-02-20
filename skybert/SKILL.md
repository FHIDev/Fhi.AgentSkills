---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, SkybertApp CRD, Azure Workload Identity, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---

# Skybert Platform Skill

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

> **Sist verifisert mot offisiell docs:** 2026-02-20
> **Offisiell dokumentasjon**: https://docs.sky.fhi.no/
> **Fallback-dokumentasjon**: https://skybert.fhi.no/
> Denne skillen er en kuratert oppsummering for AI-agenter. For fullstendig dokumentasjon, se offisiell wiki.

**KRITISK**: Alle endringer må gå gjennom Git -> GitHub Actions -> FluxCD. Bruk aldri `kubectl apply` for permanente endringer.

**KRITISK**: Du har kun tilgang til ditt eget namespace (`tn-<tenant>`). Du kan ikke aksessere andre namespaces eller kluster-ressurser.

**KRITISK**: Bruk det oppgitte service account-navnet nøyaktig for workload identity. Dette er forhåndskonfigurert av plattformteamet.

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
- `test/` - Testmiljø (standard, alltid til stede)
- `prod/` - Produksjonsmiljø (legges til når klar)
- `sandbox/` - Sandkassemiljø (kommer)

Hvert miljø er en toppnivå-mappe med egne manifester/verdier.

### Sikkerhetssoner
- **Grønn sone**: Åpne data og lavere sensitivitet
- **Gul sone**: Interne data med moderat sikkerhet (persondata)
- **Rød sone**: Svært sensitive data med strenge krav (identifiserbar helseinformasjon)

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
- For produksjonstilgang: PIM elevation
- Kjør `az logout && az login` etter tilgangsendringer

**Steg-for-steg (Blåløypa):**
1. **Onboarding med plattformteamet**: Tenant, namespace og tilganger etableres
2. **Søk tilgang via MyAccess**: Teammedlemmer søker riktig access package (f.eks. `FHI - Skybert - <Tenant>-Test-Yellow`)
3. **Verifiser GitOps-repo** (`Fhi.<Tenant>.GitOps`): oci-push og update-tag workflows er allerede satt opp
4. **Deploy med minimal SkybertApp**: Lag `test/skybertapp.yaml` og push til main
5. **Verifiser i klusteret**: Vent på Flux-rekonsiliering (hvert 2 min), sjekk pods og ingress

> Detaljert steg-for-steg finnes på https://docs.sky.fhi.no/get-started/blaloypa/ (noe innhold er under arbeid)

## Repository-oppsett

Nye tenants starter fra en mal som inneholder:
- `.github/workflows/oci-push.yaml` - Bygger og pusher OCI-artifakter
- `.github/workflows/update-tag.yaml` - Webhook for image tag-oppdateringer
- `test/` - Initialt testmiljø

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
      mountAsEnv: true
```

**Funksjoner:**
- Enhetlig secrets-håndtering - spesifiser bare vault-navn og nøkler
- Automatisk SecretStore + ExternalSecret-opprettelse
- Automatisk workload identity-kobling
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
| Key Vault | `<vault-navn>` (oppgitt av plattformteamet) | `kv-exempl-test` |
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
    name: "aks:jwt:<entra-group-id>"
    apiGroup: rbac.authorization.k8s.io
```

## Ingress-hostnavn

Støttede domener per miljø:

| Miljø | Domener |
|-------|---------|
| Test | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager.

## Persistence / Data lagring

**Anbefaling:** Hold persistent data utenfor Kubernetes. Avhengig av sikkerhetsklassifisering, lagre data i:
- **Azure public cloud** (for grønn/gul data)
- **NHN Datacenter** (for rød data eller strengere krav)

Plattformen planlegger å tilby tre StorageClass-nivåer med ulike nivåer av redundans, snapshot-retensjon og backup. Nåværende planlagte løsning er **ikke egnet for IO-intensive workloads** som aktive databaser.

## Azure Workload Identity

Skybert bruker Azure Workload Identity for passordløs autentisering mot Azure-tjenester (Key Vault, Blob Storage, etc.).

### Forhåndskonfigurert identitet

Når en ny tenant opprettes, gir plattformteamet en **forhåndskonfigurert workload identity** med:
- Et spesifikt service account-navn (`<tenant>-azure`)
- Federated credentials allerede satt opp
- Tilgang til Azure Key Vault for tenanten

**Du må bruke det oppgitte service account-navnet nøyaktig** - dette er påkrevet for at workload identity skal fungere.

### Hvordan det fungerer

1. Kubernetes ServiceAccount annoteres med Azure client ID
2. Pod bruker ServiceAccount
3. Azure AD utsteder tokens via OIDC federation
4. Applikasjon autentiserer mot Azure-tjenester uten secrets

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

## Referanser

| Dokument | Innhold |
|----------|---------|
| [SkybertApp CRD-spesifikasjon](references/skybertapp-crd.md) | Full SkybertApp felt-referanse |
| [Secrets-mønstre](references/secrets.md) | SecretStore, ExternalSecret-mønstre |
| [Workflows](references/workflows.md) | GitHub Actions CI/CD workflows |
| [kubectl-tilgang](references/kubectl-access.md) | Kubectl-tilgang, k9s, kjøre containers lokalt |
| [Konfigurasjon](references/configuration.md) | WebApp, Deployment, Helm, Kustomize-eksempler |
| [Sikkerhet](references/security.md) | Workload Identity, sikkerhet, nettverkspolicyer |
| [Observability](references/observability.md) | Logging, metrics, Grafana |
| [Feilsøking](references/troubleshooting.md) | Feilsøking og debug-kommandoer |

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

