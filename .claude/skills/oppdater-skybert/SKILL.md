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
├── .oppdater-state.json                     (persistent state for inkrementell oppdatering)
├── .claude-plugin/plugin.json               (plugin-manifest — vedlikeholdes IKKE av denne skillen)
└── references/
    ├── skybertapp-crd.md                    (SkybertApp XRD-spec)
    ├── legacy-webapp-csi.md                 (legacy WebApp CRD + CSI driver, migreringsguide)
    ├── configuration.md                     (deployment-metoder)
    ├── secrets.md                           (secrets-moenstre)
    ├── security.md                          (Workload Identity, sikkerhet)
    ├── workflows.md                         (CI/CD)
    ├── kubectl-access.md                    (kubectl, klusterliste)
    ├── observability.md                     (logging, metrics, tracing)
    ├── platform-architecture.md             (Flux, Crossplane, OCI-flyt, tenant-bootstrap)
    ├── kyverno-policies.md                  (policier som pavirker tenanter)
    ├── troubleshooting.md                   (feilsoeking)
    ├── hostnames-and-networking.md          (domener, TLS, ingress-regler)
    ├── flux-tooling.md                      (Flux dashboard, Flux MCP)
    ├── skybertapp-render.md                 (lokal rendering med crossplane render)
    └── skybertapp/                          (STATISKE KOPIER fra infra-repo — se github-modus.md)
        ├── xrd.yaml                         (kopi av infra/crossplane/base/xrds/skybertapp.yaml)
        ├── composition.yaml                 (kopi av infra/crossplane/base/compositions/skybertapp.yaml)
        └── functions.yaml                   (basert pa infra/crossplane/base/functions.yaml, omskrevet til public xpkg)

Runtime-cache (opprettes, ikke committet):
.tmp/oppdater-skybert/
├── changed-files.json
└── UPDATE-PLAN.md
```

**Treet over er illustrativt, ikke autoritativt.** I steg 3 skal faktisk innhold i `skybert/` enumereres (alle filer, inkludert undermapper og ikke-markdown-filer). Avvik mellom faktisk filliste og treet over → opprett selvoppdaterings-post for denne filen (se [Selvoppdatering](#selvoppdatering-av-oppdater-skybert)).

---

## State-kontrakt

All persistent state bor i **én** fil: `skybert/.oppdater-state.json` (committes sammen
med skybert-filene). `skybert/SKILL.md` skal **ikke** inneholde noen state-HTML-kommentar.
Linjen «Sist verifisert mot offisiell docs» i `skybert/SKILL.md` er ren visning for
mennesker: den genereres fra `sistVerifisert`-feltet i state-filen i steg 9 og skal aldri
redigeres manuelt eller brukes som maskinlesbar kilde.

```json
{
  "schemaVersion": 3,
  "updatedAt": "<ISO-8601>",
  "mode": "github|webscraping",
  "lastFullscanDate": "<ISO-dato>",
  "sistVerifisert": "<ISO-dato>",
  "github": {
    "docs": { "repo": "FHISkybert/Fhi.Skybert.Docs", "branch": "main", "commit": "<sha>", "commitDate": "<ISO-dato>" },
    "infra": { "repo": "FHISkybert/Fhi.Skybert.Infra", "branch": "main", "commit": "<sha>", "commitDate": "<ISO-dato>" }
  },
  "webscraping": {
    "source": "docs.sky.fhi.no",
    "globalHash": "<sha256>",
    "pages": [
      { "location": "skybertapp/", "title": "SkybertApp", "hash": "<per-side sha256>" }
    ]
  },
  "openItems": [
    {
      "id": "<kort-slug>",
      "status": "deferred|partial|failed-verification",
      "category": "NY|UTVID|KORRIGER|OMSTRUKTURER|FORBEDRING|FJERN|VURDER",
      "target": "<målfil i skybert/>",
      "source": "<kildereferansen som utløste posten>",
      "summary": "<kort beskrivelse / beslutningsspørsmål>",
      "firstSeen": "<ISO-dato>",
      "lastSeen": "<ISO-dato>"
    }
  ]
}
```

- Kun ett av `github`/`webscraping`-feltene populeres per kjøring. I web-scraping-modus
  beholdes `github`-feltet uendret (kan ikke verifiseres i den modusen).
- `openItems` lagrer **alle** endringsposter som ikke nådde fullført tilstand — ikke bare
  utsatte `VURDER`-poster. Se [analyseregler.md](references/analyseregler.md) for
  status-verdiene og livssyklusen.

### Regler

- State-filen oppdateres kun etter vellykket Apply (steg 9)
- `lastFullscanDate` oppdateres kun ved FULL-modus (begge moduser)
- **Migrering fra eldre format:**
  - Finnes en gammel state-HTML-kommentar (`<!-- Oppdater-skybert-state: ... -->` eller
    `<!-- Kilde-hash: ... -->`) i `skybert/SKILL.md` → parse den én gang, flytt verdiene
    inn i state-filen (schemaVersion 3), og fjern kommentaren i samme Apply.
  - State-fil med `schemaVersion: 2` → migrer: hent `last_fullscan_date` fra kommentaren
    (finnes den ikke → kjør FULL), konverter `openVurder`-poster til `openItems` med
    `status: "deferred"`, `category: "VURDER"`.
  - Verken state-fil eller kommentar → FULL (første kjøring).

---

## Steg 1 — Bestem tilgangsmodus

### 1a. Sjekk lokal docs-klon

Hvis miljøvariabelen `LOCAL_SKYBERT_DOC_CLONE` er satt og peker til en eksisterende katalog:
- Bruk lokal klon som docs-kilde (raskere, fungerer offline)
- Les filer direkte fra `$LOCAL_SKYBERT_DOC_CLONE/docs/` (MkDocs-innhold)
- Hent commit SHA fra den lokale klonen: `git -C "$LOCAL_SKYBERT_DOC_CLONE" rev-parse HEAD`
- Test fortsatt GitHub-tilgang for infra-repo (steg 1b)

Hvis variabelen ikke er satt eller katalogen ikke eksisterer → gå til steg 1b.

### 1b. Test GitHub-tilgang

```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.sha'
```

- **Suksess** → GitHub-modus. Les [github-modus.md](references/github-modus.md).
- **403/404** og ingen lokal klon → Web-scraping-modus. Les [webscraping-modus.md](references/webscraping-modus.md).

### 1c. Les state fra skybert/.oppdater-state.json

Les og parse `skybert/.oppdater-state.json`. Hvis filen mangler eller er ugyldig: sjekk om
`skybert/SKILL.md` har en gammel state-HTML-kommentar (migreringstilfelle — se
State-kontrakt). Finnes ingen av delene → behandle som første kjøring.

### 1d. Bestem kjoringsmodus

Betingelsene evalueres ovenfra og ned — første treff vinner:

| Betingelse | Modus |
|-----------|-------|
| State-fil mangler / ugyldig (ev. kun gammel HTML-kommentar finnes) | **FULL** (med migrering til schemaVersion 3) |
| State-fil har `schemaVersion: 2` | Migrer til 3 (se State-kontrakt), fortsett deretter med radene under |
| `lastFullscanDate` > 30 dager gammel | **FULL** — kjøres selv om SHAs/hash er uendret |
| SHAs/hash uendret fra state | **NO-OP** — rapporter "ingen endringer" og stopp. Har state-filen åpne `openItems`, skal de likevel listes for brukeren med `firstSeen`-dato |
| SHA/hash endret | **INKREMENTELL** (begge moduser) |

Periodisk FULL ved uendrede kilder er ikke bortkastet: det er mekanismen som fanger akkumulert drift fra inkrementelle kjøringer (delvis godkjente planer, avledede påstander som ble oversett) og re-validerer dekningsmatrisene og selve denne skillen.

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

Enumerér ALLE filer under `skybert/` rekursivt — inkludert undermapper og ikke-markdown-filer (f.eks. de statiske YAML-kopiene i `references/skybertapp/`). Unnta kun `.claude-plugin/` (plugin-manifest) og `.oppdater-state.json`. Les deretter alt.

Sammenlign den faktiske fillisten med Forutsetninger-treet i denne filen — avvik gir selvoppdaterings-post.

For hvert avsnitt:
- Noter innhold og struktur
- Identifiser kildereferanser (`> Kilde:`)
- Identifiser manuelt kuratert innhold (avsnitt uten `> Kilde:`-referanse)

For statiske kopier (YAML): noter provenance (commit i `skybertapp-render.md`) og sammenlign med gjeldende kildefil i infra-repo — se «Statiske kopier» i [github-modus.md](references/github-modus.md).

---

## Steg 4 — Dekningsanalyse

Utfor dekningsanalyse basert på tilgangsmodus:

- **GitHub-modus:** 3 obligatoriske matriser (A: docs side-for-side, B: infra signal inventory, C: skill-innhold uten kilde). Se [github-modus.md](references/github-modus.md).
- **Web-scraping-modus:** Kun matrise A (docs coverage). Se [webscraping-modus.md](references/webscraping-modus.md).

---

## Steg 5 — Analyser endringer

Sammenlign kildeinnhold med eksisterende skybert/-filer. Bruk routing fra [routing-tabell.md](references/routing-tabell.md) og regler fra [analyseregler.md](references/analyseregler.md).

Kategoriser hver endring som: `NY`, `UTVID`, `KORRIGER`, `OMSTRUKTURER`, `FORBEDRING`, `FJERN` eller `VURDER`.

**Ved INKREMENTELL:** Routing-tabellen er ikke nok — utfør også konsekvenssjekken beskrevet i [github-modus.md](references/github-modus.md) (søk i hele `skybert/` etter avledede påstander som berøres av endrede nøkkelverdier). Inkluder alle åpne poster fra `openItems` i state-filen i planen på nytt (utsatte, delvis implementerte og poster som feilet verifikasjon).

---

## Steg 6 — Skriv UPDATE-PLAN.md

Skriv `.tmp/oppdater-skybert/UPDATE-PLAN.md` med disse seksjonene:

1. **Header:** Generert-dato, modus (FULL/INKREMENTELL), tilgangsmodus (GitHub/Web-scraping), kilder med SHA og dato, CRD API-versjon
2. **Paavirkede filer:** Tabell med fil, antall endringer og kategorier
3. **Dekningsanalyse:** Matrise A, B, C (se [github-modus.md](references/github-modus.md) / [webscraping-modus.md](references/webscraping-modus.md))
4. **Endringer:** Per endring: fil, kategori, kilde, informasjonstype (dokumentert fakta / utledet monster / operasjonell antakelse), naavarende tekst, foreslatt tekst, begrunnelse
5. **Bevart innhold uten repo-kilde:** Se [implementeringsregler.md](references/implementeringsregler.md)

State-informasjon for inkrementell oppdatering skrives til `skybert/.oppdater-state.json` i steg 9.

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

## Steg 9 — Oppdater state-fil

Skriv/oppdater `skybert/.oppdater-state.json` (eneste maskinlesbare state):
- **GitHub-modus:** Lagre commit SHAs og `commitDate` for begge repoer
- **Web-scraping-modus:** Lagre `globalHash` og per-side hashes fra `search_index.json`
  (rør ikke `github`-feltet)
- **Begge moduser:** Sett `sistVerifisert` til dagens dato. Ved FULL modus: oppdater også
  `lastFullscanDate`.
- **Ajourfør `openItems`:**
  - Legg til poster brukeren utsatte/avviste ikke-endelig i steg 7 (`status: "deferred"`)
  - Legg til godkjente poster som bare ble delvis implementert i steg 8 (`status: "partial"`)
  - Legg til poster der et kontrollpunkt i steg 8/9 slo feil (`status: "failed-verification"`)
  - Oppdater `lastSeen` på poster som ble tatt inn i planen på nytt
  - Fjern poster som ble avklart/fullført

Deretter: regenerer visningslinjen `> **Sist verifisert mot offisiell docs:** <dato>` i
`skybert/SKILL.md` fra `sistVerifisert`-feltet (dette er den eneste state-avledede teksten
i SKILL.md — aldri skriv noen HTML-state-kommentar).

Begge filer (`skybert/SKILL.md` og `skybert/.oppdater-state.json`) committes sammen.

**Kontrakt:** State-filen oppdateres KUN etter vellykket Apply.

---

## Selvoppdatering av oppdater-skybert

Ved **FULL** modus skal oppdater-skybert også vurdere om selve oppdateringsskillen trenger endringer.

Ved **INKREMENTELL** modus trigges selvoppdatering når compare-output inneholder nye stier (added-filer eller nye mapper) som ikke matcher noen rad i routing-tabellen eller noe filtermønster — da skal de nye stiene leses (mini-discovery) og routing-/filteroppdatering foreslås.

### Hva sjekkes

1. **Routing-tabellen** — Nye docs-filer eller infra-mapper som ikke er mappet? Nye målfiler i `skybert/` uten routing-rad?
2. **Sti-baserte filtermoenstre** — Har mappestrukturen endret seg?
3. **State-format** — Er `schemaVersion` i `.oppdater-state.json` konsistent med State-kontrakten? Har `skybert/SKILL.md` fått en state-kommentar den ikke skal ha?
4. **Nye emner** — Nye dokumentasjonsomrader uten dekning i routing eller filstruktur?
5. **Forutsetninger-treet** — Stemmer det med faktisk filliste i `skybert/` (fra steg 3)?

### Output

Rapporteres som egen seksjon i UPDATE-PLAN.md med per-endring: fil, type (routing/filter/metadata/scope), observasjon og foreslatt endring. Krever eksplisitt godkjenning.

**Speiling:** Godkjente endringer i `.claude/skills/oppdater-skybert/` skal alltid speiles identisk til `.agents/skills/oppdater-skybert/` (kompatibilitetskopi for Codex — se repoets CLAUDE.md).

---

## Feilhåndtering

| Problem | Handling |
|---------|----------|
| `gh api` feil / rate limit | Retry 3x med backoff. Ved vedvarende: stopp, foreslå `gh auth refresh` |
| Repo 403/404 | Fall tilbake til web-scraping-modus |
| Normativ fil 404 (XRD, compositions) | Stopp, rapporter (kun GitHub-modus) |
| Ikke-kritisk fil 404 | Logg som manglende, fortsett |
| SHA-compare feiler | Fall tilbake til FULL modus |
| State-fil ugyldig/uparsebar | Behandle som forste kjoring (FULL); migrer fra ev. gammel HTML-kommentar |
| WIP/placeholder docs-side | `VURDER`, aldri bruk til å fjerne eksisterende |
| Sensitiv info oppdaget | Ekskluder per sikkerhetsfiltreringsreglene |
| Nye/ukjente filtyper i repoene | Les og vurder relevans via discovery pass |
