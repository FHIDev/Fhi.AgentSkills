---
name: oppdater-skybert
description: Oppdaterer skybert-skillen basert på kilderepoene FHISkybert/Fhi.Skybert.Docs og FHISkybert/Fhi.Skybert.Infra, eller via web-scraping av docs.sky.fhi.no for de uten repo-tilgang. Sammenligner med alle eksisterende filer i skybert/ og lager en endringsplan til gjennomgang. Bruk denne skillen når skybert-skillen skal synkroniseres med nye kilder, eller når du mistenker at skillen er utdatert eller mangelfull.
---

# Oppdater Skybert-skillen

Denne skillen beskriver arbeidsflyten for å holde `skybert/`-skillen i dette repoet oppdatert og korrekt basert på:

- **FHISkybert/Fhi.Skybert.Docs** — MkDocs-basert dokumentasjon (publisert på docs.sky.fhi.no)
- **FHISkybert/Fhi.Skybert.Infra** — Flux GitOps infra-repo med CRD-definisjoner, Kyverno-policier, tenant-bootstrap

## Underdokumenter

Les ved behov — ikke les alt ved oppstart.

| Fil | Innhold | Les når |
|-----|---------|---------|
| [hovedprinsipper.md](references/hovedprinsipper.md) | 10 hovedregler, kildeautoritet, ikke-slett-regler, informasjonstypemerking | Alltid, etter steg 1 |
| [github-modus.md](references/github-modus.md) | API-kommandoer, discovery pass, leserekkefølge, seleksjonsregler, dekningsanalyse, CRD-versjonssporing | Når GitHub-tilgang er bekreftet |
| [webscraping-modus.md](references/webscraping-modus.md) | search_index.json, HTML-henting, scope-regler, forenklet metadata | Når GitHub-tilgang mangler |
| [routing-tabell.md](references/routing-tabell.md) | Kildefil → målfil-mapping for begge moduser | Under analyse (steg 5) |
| [analyseregler.md](references/analyseregler.md) | Endringskategorier, flagg, terskler, konfliktløsning, anonymisering | Under analyse (steg 5) |
| [implementeringsregler.md](references/implementeringsregler.md) | Patching-prinsipper, kildereferanser, MkDocs-konvertering, kontrollpunkter | Under implementering (steg 8) |

## Forutsetninger

```
Skybert-skill (oppdateres):
skybert/
├── SKILL.md                                 (onboarding, konsepter, Blaloypa, navnekonvensjoner)
└── references/
    ├── skybertapp-crd.md                    (SkybertApp XRD-spec)
    ├── webapp-crd.md                        (legacy WebApp XRD, migreringsguide)
    ├── configuration.md                     (deployment-metoder)
    ├── secrets.md                           (secrets-moenstre)
    ├── security.md                          (Workload Identity, sikkerhet)
    ├── workflows.md                         (CI/CD)
    ├── kubectl-access.md                    (kubectl, klusterliste)
    ├── observability.md                     (logging, metrics, tracing)
    ├── platform-architecture.md             (Flux, Crossplane, OCI-flyt, tenant-bootstrap)
    ├── kyverno-policies.md                  (policier som pavirker tenanter)
    ├── troubleshooting.md                   (feilsoeking)
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

**GitHub-modus:** `<!-- Oppdater-skybert-state: schema_version=2 docs_repo=... docs_commit=<sha> docs_commit_date=<dato> infra_repo=... infra_commit=<sha> infra_commit_date=<dato> last_fullscan_date=<dato> -->`

**Web-scraping-modus:** `<!-- Kilde-hash: <globalHash> -->`

Regler: Oppdateres kun etter vellykket Apply (steg 9). `last_fullscan_date` oppdateres kun ved FULL-modus. Gammelt `<!-- Kilde-hash: ... -->`-format → behandle som FULL modus.

---

## Steg 1 — Bestem tilgangsmodus

### 1a. Test GitHub-tilgang

```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.sha'
```

- **Suksess** → GitHub-modus. Les [github-modus.md](references/github-modus.md).
- **403/404** → Web-scraping-modus. Les [webscraping-modus.md](references/webscraping-modus.md).

### 1b. Les metadata fra skybert/SKILL.md

Parse `<!-- Oppdater-skybert-state: ... -->`-kommentaren. Ekstraher alle felter.
Hvis kommentaren har gammelt format eller mangler → marker som "metadata mangler".

### 1c. Bestem kjoringsmodus

| Betingelse | Modus |
|-----------|-------|
| SHAs/hash uendret fra lagret metadata | **NO-OP** — rapporter "ingen endringer" og stopp |
| Metadata mangler / ugyldig / gammelt format | **FULL** |
| `last_fullscan_date` > 30 dager gammel | **FULL** |
| SHA endret, < 30 dager siden fullscan | **INKREMENTELL** (kun GitHub-modus) |
| Web-scraping-modus | Alltid **FULL** |

**Les [hovedprinsipper.md](references/hovedprinsipper.md) for du fortsetter.**

---

## Steg 2 — Discovery og kildelesing

Hent og les alle relevante kildefiler basert på tilgangsmodus.

- **GitHub-modus:** Se [github-modus.md](references/github-modus.md) for discovery pass, detaljert leserekkefølge, seleksjonsregler og filhenting.
- **Web-scraping-modus:** Se [webscraping-modus.md](references/webscraping-modus.md) for search_index.json-henting, HTML-ekstraksjon og scope-regler.

**Forste kjoring (migrering fra gammelt format):**
- ALL eksisterende informasjon i skybert/-filene bevares
- Manuelt lagt inn informasjon (uten `> Kilde:`-referanse) bevares alltid med mindre den er beviselig feil
- Nye filer foreslås som `NY`/`ny-fil`-poster i planen — de erstatter ikke eksisterende innhold

---

## Steg 3 — Les eksisterende skybert/-filer

Les `skybert/SKILL.md` og alle `skybert/references/*.md`.

For hvert avsnitt:
- Noter innhold og struktur
- Identifiser kildereferanser (`> Kilde:`)
- Identifiser manuelt kuratert innhold (avsnitt uten `> Kilde:`-referanse)

---

## Steg 4 — Dekningsanalyse

Utfor dekningsanalyse basert på tilgangsmodus:

- **GitHub-modus:** 3 obligatoriske matriser (A: docs side-for-side, B: infra signal inventory, C: skill-innhold uten kilde). Se [github-modus.md](references/github-modus.md).
- **Web-scraping-modus:** Kun matrise A (docs coverage). Se [webscraping-modus.md](references/webscraping-modus.md).

---

## Steg 5 — Analyser endringer

Sammenlign kildeinnhold med eksisterende skybert/-filer. Bruk routing fra [routing-tabell.md](references/routing-tabell.md) og regler fra [analyseregler.md](references/analyseregler.md).

Kategoriser hver endring som: `NY`, `UTVID`, `KORRIGER`, `OMSTRUKTURER`, `FORBEDRING`, `FJERN` eller `VURDER`.

---

## Steg 6 — Skriv UPDATE-PLAN.md

Skriv `.tmp/oppdater-skybert/UPDATE-PLAN.md` med disse seksjonene:

1. **Header:** Generert-dato, modus (FULL/INKREMENTELL), tilgangsmodus (GitHub/Web-scraping), kilder med SHA og dato, CRD API-versjon
2. **Paavirkede filer:** Tabell med fil, antall endringer og kategorier
3. **Dekningsanalyse:** Matrise A, B, C (se [github-modus.md](references/github-modus.md) / [webscraping-modus.md](references/webscraping-modus.md))
4. **Endringer:** Per endring: fil, kategori, kilde, informasjonstype (dokumentert fakta / utledet monster / operasjonell antakelse), naavarende tekst, foreslatt tekst, begrunnelse
5. **Bevart innhold uten repo-kilde:** Se [implementeringsregler.md](references/implementeringsregler.md)

Skriv ogsaa `.tmp/oppdater-skybert/state.json`.

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

Implementer kun eksplisitt godkjente endringer. Se [implementeringsregler.md](references/implementeringsregler.md) for:
- Seksjonsbasert patching-prinsipper
- Kildereferanse-format
- MkDocs-syntakskonvertering
- Kontrollpunkter etter implementering

---

## Steg 9 — Oppdater metadata

Oppdater metadata-kommentaren i `skybert/SKILL.md` med nye SHAs/hash og datoer. Ved FULL modus: oppdater også `last_fullscan_date`. Oppdater `Sist verifisert mot offisiell docs:` med dagens dato.

**Kontrakt:** Metadata oppdateres KUN etter vellykket Apply.

---

## Selvoppdatering av oppdater-skybert

Ved **FULL** modus skal oppdater-skybert også vurdere om selve oppdateringsskillen trenger endringer.

### Hva sjekkes

1. **Routing-tabellen** — Nye docs-filer eller infra-mapper som ikke er mappet?
2. **Sti-baserte filtermoenstre** — Har mappestrukturen endret seg?
3. **Metadata-format** — Er `schema_version` konsistent?
4. **Nye emner** — Nye dokumentasjonsomrader uten dekning i routing eller filstruktur?

### Output

Rapporteres som egen seksjon i UPDATE-PLAN.md med per-endring: fil, type (routing/filter/metadata/scope), observasjon og foreslatt endring. Krever eksplisitt godkjenning.

---

## Feilhåndtering

| Problem | Handling |
|---------|----------|
| `gh api` feil / rate limit | Retry 3x med backoff. Ved vedvarende: stopp, foreslå `gh auth refresh` |
| Repo 403/404 | Fall tilbake til web-scraping-modus |
| Normativ fil 404 (XRD, compositions) | Stopp, rapporter (kun GitHub-modus) |
| Ikke-kritisk fil 404 | Logg som manglende, fortsett |
| SHA-compare feiler | Fall tilbake til FULL modus |
| Metadata ugyldig | Behandle som forste kjoring (FULL) |
| WIP/placeholder docs-side | `VURDER`, aldri bruk til å fjerne eksisterende |
| Sensitiv info oppdaget | Ekskluder per sikkerhetsfiltreringsreglene |
| Nye/ukjente filtyper i repoene | Les og vurder relevans via discovery pass |
