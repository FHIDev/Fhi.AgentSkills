---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, SkybertApp CRD, Azure Workload Identity, Linkerd, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---

# Skybert Platform Skill

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

> **Offisiell dokumentasjon**: https://skybert.fhi.no/
> Denne skillen er en kuratert oppsummering for AI-agenter. For fullstendig dokumentasjon, se offisiell wiki.

**KRITISK**: Alle endringer må gå gjennom Git -> GitHub Actions -> FluxCD. Bruk aldri `kubectl apply` for permanente endringer.

**KRITISK**: Du har kun tilgang til ditt eget namespace (`tn-<team>-<app>`). Du kan ikke aksessere andre namespaces eller kluster-ressurser.

**KRITISK**: Bruk det oppgitte service account-navnet nøyaktig for workload identity. Dette er forhåndskonfigurert av plattformteamet.

**VIKTIG**: Bruk `SkybertApp` CRD for deployments. `WebApp` CRD er utdatert og skal ikke brukes.

**VIKTIG**: Flux rekonsilerer hvert 2. minutt. For å tvinge umiddelbar rekonsiliering, annoter kustomization:
```bash
kubectl annotate kustomization <name> -n tn-<team>-<app> reconcile.fluxcd.io/requestedAt="$(date +%s)" --overwrite
```

---

## Om Skybert

Skybert er en Kubernetes-basert applikasjonsplattform hos FHI, bygget på:
- **Kubernetes** via Azure Arc-connected Kubernetes (IKKE vanlig AKS)
- **GitOps** med Flux for deklarativ konfigurasjon
- **Azure-integrasjon** (Workload Identity, Key Vault, ACR)
- **Service Mesh** (Linkerd med automatisk mTLS)
- **Observability** (Loki for logging, Mimir for metrics, Grafana for visualisering)

**Viktig:** Skybert bruker Azure Arc-connected Kubernetes, ikke vanlig Azure Kubernetes Service (AKS). Dette betyr at `az aks get-credentials` IKKE fungerer - du må bruke `az connectedk8s proxy` for kubectl-tilgang.

## Nøkkelkonsepter

### Tenant
En **Tenant** er et Kubernetes namespace (mønster: `tn-<team>-<app>`) som inneholder alle ressurser for én applikasjon. Hver tenant er isolert og administreres via GitOps.

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
- **Grønn sone**: Internett-eksponerte tjenester
- **Gul sone**: Interne tjenester uten persondata
- **Rød sone**: Sensitive data, strenge nettverkspolicyer

### Blåløypa (Golden Path)

Blåløypa er den anbefalte veien for å komme i gang på Skybert.

**Forutsetninger:**

*Organisatorisk:*
- Avklaring om hvilken sikkerhetssone
- ROS (risikovurdering) for applikasjonen
- Tilgang til NHN Slack (#ext-fhi-skybert)

*Teknisk:*
- GitHub-organisasjon: FHIDev
- Azure-tilganger fra plattformteamet

**Steg-for-steg:**
1. **GitOps-repo**: Opprettes av plattformteamet (`Fhi.<Team>.<App>.GitOps`)
2. **Konfigurer secrets**: Sett `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
3. **Opprett SkybertApp**: Lag `test/skybertapp.yaml` med din konfigurasjon
4. **Deploy**: Commit og push til main - Flux synkroniserer automatisk (hvert 2 min)

## Repository-oppsett

Nye tenants starter fra en mal som inneholder:
- `.github/workflows/oci-push.yaml` - Bygger og pusher OCI-artifakter
- `.github/workflows/update-tag.yaml` - Webhook for image tag-oppdateringer
- `test/` - Initialt testmiljø

### Påkrevde GitHub Repository-variabler

Før workflows kan kjøre, må disse secrets konfigureres:

| Secret | Beskrivelse |
|--------|-------------|
| `AZURE_CLIENT_ID` | Managed Identity client ID for ACR push |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

**For å verifisere at secrets eksisterer:**
```bash
gh secret list --repo <owner>/<repo>
```

**For å sette secrets** (krever admin-tilgang til repoet):
```bash
gh secret set AZURE_CLIENT_ID --body "<verdi>"
gh secret set AZURE_TENANT_ID --body "<verdi>"
gh secret set AZURE_SUBSCRIPTION_ID --body "<verdi>"
```

## SkybertApp CRD

Bruk `SkybertApp` for alle applikasjoner. Den håndterer secrets, ingress, autoskalering og sikkerhetshardening i én ressurs.

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-app
  namespace: tn-myteam-myapp
spec:
  image:
    repository: crfhiskybert.azurecr.io/myteam/myapp
    tag: "1.0.0"
  hostname: myapp.skytest.fhi.no
  secrets:
    - vault: kv-myteam-test
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

Når du oppretter ressurser, bruk disse mønstrene:

| Ressurs | Mønster | Eksempel |
|---------|---------|----------|
| Namespace | `tn-<team>-<app>` | `tn-fida-airflow` |
| Key Vault | `kv-<team>-<app>-<env>` | `kv-fida-airflow-test` |
| Service Account | `<team>-<app>-azure` | `fida-airflow-azure` |
| Managed Identity | `<team>-<app>-skybert-sa-<env>` | `fida-airflow-skybert-sa-test` |

**Utlede navn fra repository:**
- Repository: `Fhi.Fida.MyApp.GitOps`
- Team: `fida` (andre segment, lowercase)
- App: `myapp` (tredje segment, lowercase)
- Namespace: `tn-fida-myapp`

## Vanlige ressurser

### SecretStore (for WebApp eller manuelle secrets)

Påkrevet når du bruker `WebApp` CRD eller håndterer secrets manuelt:

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: myapp-secret-store
  namespace: tn-myteam-myapp
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://kv-myteam-test.vault.azure.net"
      serviceAccountRef:
        name: myteam-azure
```

### ExternalSecret

Henter secrets fra Azure Key Vault:

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: tn-myteam-myapp
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
  name: rb-myteam-admins
  namespace: tn-myteam-myapp
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

## Azure Workload Identity

Skybert bruker Azure Workload Identity for passordløs autentisering mot Azure-tjenester (Key Vault, Blob Storage, etc.).

### Forhåndskonfigurert identitet

Når en ny tenant opprettes, gir plattformteamet en **forhåndskonfigurert workload identity** med:
- Et spesifikt service account-navn (typisk `<team>-azure` eller lignende)
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

**Viktig:** Du har kun tilgang til ressurser i ditt eget namespace (`tn-<team>-<app>`). Du kan ikke aksessere Flux system-ressurser eller tvinge rekonsiliering.

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
kubectl get all -n tn-<team>-<app>

# Sjekk pod-status
kubectl get pods -n tn-<team>-<app>

# Se pod-logger
kubectl logs -n tn-<team>-<app> <pod-name>

# Beskriv en feilende pod
kubectl describe pod <pod-name> -n tn-<team>-<app>

# Sjekk events (nyttig for å se nylige problemer)
kubectl get events -n tn-<team>-<app> --sort-by='.lastTimestamp'
```

### 4. Sjekk External Secrets

```bash
# Verifiser ExternalSecret-status
kubectl get externalsecrets -n tn-<team>-<app>
kubectl describe externalsecret <name> -n tn-<team>-<app>

# Sjekk om den faktiske Secret ble opprettet
kubectl get secrets -n tn-<team>-<app>
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
| [Eksempler](examples/) | YAML eksempel-filer |

## Support

Kontakt Skybert plattformteam:
- NHN Slack: `#ext-fhi-skybert`

## Ansvarsfordeling

**Skybert (plattformteamet):** Kubernetes-infrastruktur, Flux, Linkerd, Observability, Azure-integrasjoner, plattform-sikkerhet

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
   - Linkerd er obligatorisk
   - GitOps-prinsippet (alt i Git)

6. **Ved usikkerhet**: Referer til plattformteamet (#ext-fhi-skybert)
