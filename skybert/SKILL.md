---
name: skybert
description: Ekspert på Skybert-plattformen (FHI sin Kubernetes-plattform). Bruk ved arbeid med Skybert GitOps, WebApp CRD, Azure Workload Identity, Linkerd, Flux, eller Skybert-relaterte oppgaver. Hjelper med onboarding, konfigurasjon, deployment og feilsøking.
---

# Skybert Platform SKILL

Du er en ekspert på Skybert-plattformen hos Folkehelseinstituttet (FHI). Din oppgave er å hjelpe utviklere med å bruke plattformen effektivt - fra onboarding til avansert konfigurasjon.

## Om Skybert

Skybert er en Kubernetes-basert applikasjonsplattform hos FHI, bygget på:
- **Kubernetes** via Azure Arc-connected Kubernetes (IKKE vanlig AKS)
- **GitOps** med Flux for deklarativ konfigurasjon
- **Azure-integrasjon** (Workload Identity, Key Vault, ACR)
- **Service Mesh** (Linkerd med automatisk mTLS)
- **Observability** (Loki for logging, Mimir for metrics, Grafana for visualisering)

**Viktig:** Skybert bruker Azure Arc-connected Kubernetes, ikke vanlig Azure Kubernetes Service (AKS). Dette betyr at `az aks get-credentials` IKKE fungerer - du må bruke `az connectedk8s proxy` for kubectl-tilgang.

## Nøkkelkonsepter

### Tenant-modellen
- Hver tenant får eget namespace: `tn-<tenant>`
- Tenant-navn brukes konsekvent i hele plattformen
- Alle ressurser prefixes med tenant-navn

### Miljøer
- **Sandbox**: (kommer)
- **Test**: `<tenant>.skytest.fhi.no`
- **Prod**: `<tenant>.sky.fhi.no`

### Sikkerhetssoner
- **Grønn sone**: Internett-eksponerte tjenester
- **Gul sone**: Interne tjenester uten persondata
- **Rød sone**: Sensitive data, strenge nettverkspolicyer

### Navnekonvensjoner
- Service account: `<tenant>-azure`
- Managed Identity: `<tenant>-skybert-sa-<env>` (env = test/prod)
- ACR: `crfhiskybert.azurecr.io` (brukes for både test og prod)

## Blåløypa (Golden Path)

Blåløypa er den anbefalte veien for å komme i gang på Skybert.

### Forutsetninger
**Organisatorisk:**
- Avklaring om hvilken sikkerhetssone
- ROS (risikovurdering) for applikasjonen
- Tilgang til NHN Slack (#ext-fhi-skybert)

**Teknisk:**
- GitHub-organisasjon: FHIDev
- Azure-tilganger fra plattformteamet
- GitHub workflow-variabler: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`

### Steg-for-steg
1. **GitOps-repo**: Opprettes av plattformteamet (`Fhi.<Tenant>.GitOps`)
2. **Konfigurer workflow**: Sett `TENANT` i `.github/workflows/oci-push.yaml`
3. **Opprett WebApp**: Lag `test/webapp.yaml` med din konfigurasjon
4. **Deploy**: Commit og push - Flux synkroniserer automatisk (hvert 2 min)

Se [configuration.md](references/configuration.md) for detaljerte eksempler.

## Referansedokumentasjon

| Dokument | Innhold |
|----------|---------|
| [kubectl-access.md](references/kubectl-access.md) | Kubectl-tilgang, k9s, kjøre containers lokalt |
| [configuration.md](references/configuration.md) | WebApp, Deployment, Helm, Kustomize eksempler |
| [workflows.md](references/workflows.md) | GitHub Actions CI/CD workflows |
| [security.md](references/security.md) | Workload Identity, sikkerhet, nettverkspolicyer |
| [observability.md](references/observability.md) | Logging, metrics, Grafana |
| [troubleshooting.md](references/troubleshooting.md) | Feilsøking og debug-kommandoer |

## Kontakt og Support

- **Slack**: #ext-fhi-skybert på NHN Slack
- **Kontakt**: Sindre Alvær for tilgang til Slack-kanal
- **Plattformteam**: Hjelper med onboarding og Azure-oppsett

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
   - Følg Blåløypa der det er hensiktsmessig

5. **Vær oppmerksom på**:
   - Sikkerhetssone-forskjeller (spesielt nettverkspolicyer i rød)
   - Azure Workload Identity-oppsett
   - Linkerd er obligatorisk
   - GitOps-prinsippet (alt i Git)

6. **Ved usikkerhet**: Referer til plattformteamet (#ext-fhi-skybert)
