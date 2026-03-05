---
name: oppdater-skybert
description: Oppdaterer skybert-skillen basert på kilderepoene FHISkybert/Fhi.Skybert.Docs og FHISkybert/Fhi.Skybert.Infra. Leser dokumentasjon og infra-definisjoner via gh api, sammenligner med alle eksisterende filer i skybert/, og lager en endringsplan til gjennomgang. Bruk denne skillen når skybert-skillen skal synkroniseres med nye kilder, eller når du mistenker at skillen er utdatert eller mangelfull.
---

# Oppdater Skybert-skillen

Denne skillen beskriver arbeidsflyten for å holde `skybert/`-skillen i dette repoet oppdatert og korrekt basert på kilderepoene:

- **FHISkybert/Fhi.Skybert.Docs** — MkDocs-basert dokumentasjon (markdown under `docs/`)
- **FHISkybert/Fhi.Skybert.Infra** — Flux GitOps infra-repo med CRD-definisjoner, Kyverno-policier, tenant-bootstrap

## Forutsetninger

```
Skybert-skill (oppdateres):
skybert/
├── SKILL.md                                 (onboarding, konsepter, Blåløypa, navnekonvensjoner)
└── references/
    ├── skybertapp-crd.md                    (SkybertApp XRD-spec)
    ├── webapp-crd.md                        (legacy WebApp XRD, migreringsguide)
    ├── configuration.md                     (deployment-metoder)
    ├── secrets.md                           (secrets-mønstre)
    ├── security.md                          (Workload Identity, sikkerhet)
    ├── workflows.md                         (CI/CD)
    ├── kubectl-access.md                    (kubectl, klusterliste)
    ├── observability.md                     (logging, metrics, tracing)
    ├── platform-architecture.md             (Flux, Crossplane, OCI-flyt, tenant-bootstrap)
    ├── kyverno-policies.md                  (policier som påvirker tenanter)
    ├── troubleshooting.md                   (feilsøking)
    └── hostnames-and-networking.md          (domener, TLS, ingress-regler)

Runtime-cache (opprettes, ikke committet):
.tmp/oppdater-skybert/
├── changed-files.json
├── state.json
└── UPDATE-PLAN.md
```

---

## Metadata-kontrakt

Metadata lagres som HTML-kommentar i `skybert/SKILL.md`, rett etter frontmatter:

```html
<!-- Oppdater-skybert-state:
schema_version=2
docs_repo=FHISkybert/Fhi.Skybert.Docs
docs_branch=main
docs_commit=<sha>
docs_commit_date=<YYYY-MM-DD>
infra_repo=FHISkybert/Fhi.Skybert.Infra
infra_branch=main
infra_commit=<sha>
infra_commit_date=<YYYY-MM-DD>
last_fullscan_date=<YYYY-MM-DD>
-->
```

Regler:
- Oppdateres kun etter vellykket Apply (steg 9)
- `last_fullscan_date` oppdateres kun ved FULL-modus
- `schema_version` muliggjør fremtidig migrering av metadata-formatet

**Migrering fra gammelt format:** Hvis `skybert/SKILL.md` inneholder `<!-- Kilde-hash: ... -->` i stedet for det nye formatet, behandles det som FULL modus. Det gamle formatet fjernes og erstattes med det nye etter vellykket Apply.

---

## Kildetilgang

Alle filer leses via `gh api` eller `raw.githubusercontent.com`. Ingen lokal clone.

**Hente commit SHA:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.sha'
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.sha'
```

**Hente commit-dato:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.commit.committer.date'
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.commit.committer.date'
```

**Hente filtree:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/git/trees/main?recursive=1 --jq '.tree[].path'
gh api repos/FHISkybert/Fhi.Skybert.Infra/git/trees/main?recursive=1 --jq '.tree[].path'
```

**Sammenligne commits (inkrementell):**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
gh api repos/FHISkybert/Fhi.Skybert.Infra/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
```

**Lese enkeltfil:**
```bash
curl -sH "Authorization: token $(gh auth token)" \
  "https://raw.githubusercontent.com/FHISkybert/Fhi.Skybert.Docs/main/<filsti>"
```

**Retry-policy:** 3 forsøk med eksponentiell backoff (1s, 3s, 9s). Ved vedvarende feil på normativ fil (XRD, compositions): stopp kjøring med feilrapport. Ved feil på ikke-kritisk fil: logg som manglende og fortsett.

---

## Steg 1 — Hent commit SHAs og bestem modus

### 1a. Les metadata fra skybert/SKILL.md

Parse `<!-- Oppdater-skybert-state: ... -->`-kommentaren fra `skybert/SKILL.md`. Ekstraher alle felter.

Hvis kommentaren har gammelt format (`<!-- Kilde-hash: ... -->`) eller mangler helt → marker som "metadata mangler".

### 1b. Hent nåværende commit SHAs

```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.sha'
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.sha'
```

Hent også commit-datoer for begge.

### 1c. Bestem modus

| Betingelse | Modus |
|-----------|-------|
| Begge SHAs er like som lagret metadata | **NO-OP** — rapporter "ingen endringer" og stopp |
| Metadata mangler / ugyldig / gammelt format | **FULL** |
| `last_fullscan_date` er > 30 dager gammel | **FULL** |
| SHA endret, < 30 dager siden fullscan | **INKREMENTELL** |

**Første kjøring (migrering fra gammelt format):**
- ALL eksisterende informasjon i skybert/-filene bevares
- Manuelt lagt inn informasjon (uten `> Kilde:`-referanse) bevares alltid med mindre den er beviselig feil
- Nye filer (`webapp-crd.md`, `platform-architecture.md`, etc.) foreslås som `NY`/`ny-fil`-poster i planen — de erstatter ikke eksisterende innhold
- Metadata-kommentaren konverteres til nytt format etter vellykket Apply

---

## Steg 2 — Hent filtree og identifiser endrede filer

### FULL modus

Hent komplett filtree fra begge repoer:
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/git/trees/main?recursive=1 --jq '.tree[] | select(.type=="blob") | .path'
gh api repos/FHISkybert/Fhi.Skybert.Infra/git/trees/main?recursive=1 --jq '.tree[] | select(.type=="blob") | .path'
```

Filtrer mot seleksjonsreglene (se nedenfor). Alle filer i scope behandles som "endrede".

### INKREMENTELL modus

```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
gh api repos/FHISkybert/Fhi.Skybert.Infra/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
```

Hvis compare feiler (force-push, rebase) → fall tilbake til FULL modus og informer bruker.

### Output

Skriv `.tmp/oppdater-skybert/changed-files.json`:
```json
{
  "docs": { "added": [], "modified": [], "removed": [] },
  "infra": { "added": [], "modified": [], "removed": [] }
}
```

---

## Steg 3 — Les kildefiler

Les alle endrede filer i scope via `curl` med `gh auth token`.

### Docs-repo — Seleksjonsregler

**Alltid i scope:** `docs/**/*.md` (unntatt `docs/internal/`)

**`docs/internal/**` — selektiv inkludering:**
Inkluder filer med utvikler-impact (tenant/runtime/policy/CI-CD/feilsøking). Ekskluder drift/runbooks uten tenant-impact.

Eksempler:
- Inkluder: `docs/internal/flux.md` (rekonsiliering påvirker utviklere), `docs/internal/service-mesh.md` (nettverkstopologi)
- Ekskluder: `docs/internal/upgrade-component.md` (plattformdrift), `docs/internal/managing-tenants.md` (admin-operasjon)

### Infra-repo — Sti-baserte filtermønstre

```
# XRD-spesifikasjoner (SkybertApp + WebApp)
infra/crossplane/base/xrds/skybertapp.yaml
infra/crossplane/base/xrds/webapp.yaml

# Crossplane compositions
infra/crossplane/base/compositions/skybertapp.yaml
infra/crossplane/base/compositions/webapp.yaml

# Kyverno-policier som påvirker tenanter
infra/kyverno-policies/base/policies-*/**/*.yaml
# + relevante overlays per kluster der de avviker fra base

# GlobalNetworkPolicies (rød sone tenant-regler)
infra/globalnetworkpolicies/base/policies-red/*.yaml

# Tenant-bootstrap (normativ struktur)
tenants/*/base/{namespace,rolebinding,serviceaccount*,flux-kustomization}.yaml

# Tenant-scripts (normativ bootstrap-logikk)
scripts/tenant--*.sh
```

**Ekskludert fra infra:** `crds/`, `infra/alloy/`, `infra/loki/`, `infra/mimir/`, `infra/grafana/`, `infra/cert-manager/`, `infra/external-secrets/`, `infra/ingress-nginx/`, øvrige drifts-scripts.

---

## Routing-tabell: Kildefiler → Skybert-målfiler

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

### Routing-regler

- Én kildefil kan mappe til flere målfiler
- Uklar mapping → `VURDER`-kategori i endringsplanen
- Nye emner som ikke passer eksisterende filer → foreslå ny fil med `ny-fil`-flagg
- Filer i docs-repo som ikke matcher noen rad ovenfor → vurder om emnet passer en eksisterende målfil eller trenger ny fil

---

## Steg 4 — Les alle eksisterende skybert/-filer

Les `skybert/SKILL.md` og alle `skybert/references/*.md`.

For hvert avsnitt:
- Noter innhold og struktur
- Identifiser kildereferanser (`> Kilde:`)
- Identifiser manuelt kuratert innhold (avsnitt uten `> Kilde:`-referanse)

---

## Steg 5 — Analyser endringer

### Endringskategorier

| Kategori | Definisjon |
|----------|-----------|
| `NY` | Innhold i kilderepoer som ikke er dokumentert i noen skybert-fil. Flagg `ny-fil` hvis en helt ny referansefil foreslås. |
| `UTDATERT` | Innhold i skybert-fil som ikke stemmer med kilderepoene. Flagg `crd-versjon` hvis API-versjon endres. |
| `FORBEDRING` | Innhold som er riktig men kan gjøres mer presist/komplett basert på kildene |
| `FJERN` | Innhold der kilder positivt viser at det er feil/deprecated/erstattet |
| `VURDER` | Mulig endring som krever menneskelig vurdering |
| `OK` | Korrekt og komplett — inkluderes ikke i planen |

### Flagg

- `crd-versjon` — CRD API-versjon har endret seg (tillegg til UTDATERT)
- `ny-fil` — En helt ny referansefil foreslås (tillegg til NY)

### Terskler

- `FORBEDRING` kun ved vesentlig bedre/mer korrekt formulering — ikke stilistiske preferanser
- `FJERN` KUN med positiv evidens: eksplisitt "deprecated", "fjernet", "bruk X i stedet", fjernet fra XRD-spec
- Fravær i kildene er ALDRI grunn til FJERN — bruk `VURDER`
- WIP/placeholder-sider → `VURDER` med begrunnelse, aldri brukt til å fjerne eksisterende innhold
- Innhold uten `> Kilde:`-referanse antas manuelt kuratert — ekstra forsiktighet

### Konfliktløsning (Docs vs Infra)

- **Normative tekniske forhold** (CRD-felter, defaults, security contexts, policier): Infra vinner
- **Konsept/veiledning/onboarding**: Docs supplerer
- **Uoppløselig konflikt**: `VURDER` med begge kilder sitert

### CRD-versjonssporing

I `infra/crossplane/base/xrds/skybertapp.yaml`, les:
```yaml
spec:
  versions:
    - name: v1alpha1    # ← dette er SkybertApp API-versjonen
      served: true
      referenceable: true
```

Parse `spec.versions[].name` der `served: true` og `referenceable: true`. Sammenlign med metadata i `skybert/SKILL.md`.

Ved endring (f.eks. v1alpha1 → v1beta1):
- Opprett endringspost med `crd-versjon`-flagg
- Inkluder: gammel versjon, ny versjon, alle feltendringer, migreringsveiledning
- Oppdater alle eksempler i `skybertapp-crd.md` og `SKILL.md`

### Anonymisering

Azure Subscription IDs og kluster-IP-ranges anonymiseres med plassholdere (`<subscription-id>`, `<ip-range>`) med mindre de allerede er i eksisterende skillfiler. Tenant-navn fra `tenants/`-mappen brukes som eksempler.

---

## Steg 6 — Skriv endringsplan

Skriv `.tmp/oppdater-skybert/UPDATE-PLAN.md`:

```markdown
# UPDATE-PLAN — Skybert-skill

Generert: <ISO-8601 dato>
Modus: FULL | INKREMENTELL
Kilder:
  - FHISkybert/Fhi.Skybert.Docs @ <sha kort> (<dato>)
  - FHISkybert/Fhi.Skybert.Infra @ <sha kort> (<dato>)
CRD API-versjon: <nåværende> (forrige: <forrige>)

## Påvirkede filer

| Fil | Antall endringer | Kategorier |
|-----|-----------------|------------|
| skybert/SKILL.md | 3 | NY, UTDATERT |
| ... | ... | ... |

## Endringer

#### 1. <Kort tittel> [flagg: crd-versjon|ny-fil]

- **Fil:** skybert/references/skybertapp-crd.md
- **Kategori:** NY | UTDATERT | FORBEDRING | FJERN | VURDER
- **Kilde:** <docs-URL> + <GitHub blob-URL>
- **Nåværende tekst (linje ~N):** <sitat eller "–" hvis NY>
- **Foreslått tekst:**
  <Komplett tekst klar til implementering>
- **Begrunnelse:** <konkret observasjon fra kildefil>
```

Skriv også `.tmp/oppdater-skybert/state.json`:
```json
{
  "schemaVersion": 2,
  "fetchedAt": "<ISO-8601>",
  "mode": "incremental|fullscan",
  "reason": "missing_state|age_gt_30d|structure_changed|normal_incremental",
  "docs": { "repo": "FHISkybert/Fhi.Skybert.Docs", "branch": "main", "commit": "<sha>", "date": "<YYYY-MM-DD>" },
  "infra": { "repo": "FHISkybert/Fhi.Skybert.Infra", "branch": "main", "commit": "<sha>", "date": "<YYYY-MM-DD>" }
}
```

---

## Steg 7 — Presenter og vent på godkjenning

Presenter:
1. Sammendrag: antall endringer per kategori og per fil
2. CRD-versjonsstatus (endret/uendret)
3. Fullstendig endringsplan
4. Advarsel om `VURDER`-poster

Brukeren kan: godkjenne alle, godkjenne delvis, eller avvise alle.
**Ingen endringer i skybert/-filer uten eksplisitt godkjenning.**

---

## Steg 8 — Implementer godkjente endringer

### Prinsipper

- Seksjonsbasert patching — oppdater kun seksjoner med evidensbasert grunnlag, behold øvrige uendret
- Behold eksisterende tekst som er korrekt — selv om du ville formulert det annerledes
- Ikke omformuler/omstruktur avsnitt som er faktariktige
- Skill-innhold skrives for AI-agent — presis, unngå tvetydighet
- Foretrekk konkrete kodeeksempler fremfor prose

### Kildereferanser

- Docs-repo: `> Kilde: https://docs.sky.fhi.no/<sti>/`
- Infra-repo: `> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/<commit>/<filsti>`
- Inkluder begge der relevant (docs-URL for lesbarhet + blob-URL for sporbarhet)

### MkDocs-syntakskonvertering

- `!!! note "Tittel"` → `> **Tittel:** ...`
- `!!! warning` → `> **Advarsel:** ...`
- `=== "Tab 1"` → Separate kodeblokker med overskrifter
- Mermaid-diagrammer → Behold som mermaid-kodeblokker

### Nye filer

Opprettes kun ved godkjente `ny-fil`-poster. Standard overskrift + kildereferanser.

### Skybert-verdier i CLAUDE.md / AGENTS.md

Skybert-skillen (`skybert/SKILL.md`) skal inneholde en seksjon som anbefaler brukere å legge inn prosjektspesifikke Skybert-verdier i sin `CLAUDE.md` eller `AGENTS.md`. Anbefalt tabell-format:

```markdown
## Skybert-verdier

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
```

Ved fullscan: sjekk om `skybert/SKILL.md` inneholder en "Skybert-verdier i CLAUDE.md"-seksjon. Hvis den mangler → opprett som `NY`-post i planen. Hvis den finnes → sjekk at alle nøkler er med.

---

## Steg 9 — Oppdater metadata i skybert/SKILL.md

Oppdater metadata-kommentaren med nye SHAs og datoer. Ved FULL modus: oppdater også `last_fullscan_date`. Oppdater `Sist verifisert mot offisiell docs:` med dagens dato.

**Kontrakt:** Metadata oppdateres KUN etter vellykket Apply.

---

## Selvoppdatering av oppdater-skybert

Ved **FULL** modus skal oppdater-skybert også vurdere om selve oppdateringsskillen (`.claude/skills/oppdater-skybert/SKILL.md`) trenger endringer.

### Hva sjekkes

1. **Routing-tabellen** — Finnes det nye docs-filer i kilderepoene som ikke er mappet? Finnes det nye mapper/filer i infra-repoet som matcher sti-filtrene men ikke er i tabellen?
2. **Sti-baserte filtermønstre** — Har mappestrukturen i kilderepoene endret seg slik at eksisterende globs ikke treffer?
3. **Metadata-format** — Er `schema_version` i skillen konsistent med metadata i `skybert/SKILL.md`?
4. **Nye emner** — Finnes det nye dokumentasjonsområder i kilderepoene som verken routing-tabellen eller filstrukturen dekker?

### Output

Rapporteres som egen seksjon i UPDATE-PLAN.md:

```markdown
## Foreslåtte endringer i oppdater-skybert-skillen

#### S1. <Kort tittel>
- **Fil:** .claude/skills/oppdater-skybert/SKILL.md
- **Type:** routing | filter | metadata | scope
- **Observasjon:** <hva som er funnet>
- **Foreslått endring:** <konkret forslag>
```

Disse endringene krever også eksplisitt godkjenning.

---

## Beskyttelse av manuelt redigert innhold

1. **Fravær er ikke evidens** — innhold som ikke finnes i kilderepoene er IKKE feil; det kan være manuelt lagt til
2. **FJERN krever positiv evidens** — eksplisitt deprecated, erstattet, eller fjernet fra XRD
3. **Innhold uten kildereferanse** antas manuelt kuratert — ekstra forsiktighet
4. **Ved tvil** → `VURDER`, la brukeren avgjøre
5. **Sammenslåing, ikke overskrivning** — ny info integreres med eksisterende, erstatter det ikke
6. **Seksjonsbasert patching** — aldri rewrite hele filer; oppdater kun seksjoner med endringsgrunnlag

---

## Feilhåndtering

| Problem | Håndtering |
|---------|-----------|
| `gh api` nettverksfeil / rate limit | Retry: 3 forsøk med eksponentiell backoff (1s, 3s, 9s). Ved vedvarende feil: stopp, rapporter, foreslå `gh auth refresh` |
| Repo 404 | Stopp, rapporter manglende tilgang |
| Enkeltfil 404 (ikke-kritisk) | Logg som manglende i plan, fortsett |
| Enkeltfil 404 (kritisk: XRD, compositions) | Stopp, rapporter |
| SHA-compare feiler (force-push, rebase) | Fall tilbake til FULL modus, informer bruker |
| Metadata ugyldig/ukjent format | Behandle som første kjøring (FULL modus) |
| Ugyldig YAML i infra-fil | Rapporter parsing-feil, vis råinnhold |
| WIP/placeholder docs-side | `VURDER`-kategori, aldri bruk til å fjerne |
| Strukturendring i kilderepo | Trigger FULL modus, rapporter ny struktur |
