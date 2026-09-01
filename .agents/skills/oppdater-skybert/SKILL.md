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
├── .oppdater-coverage.json                  (bevart matrise A; skrives først ved en komplett FULL — fravær er ikke strukturdrift)
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
    ├── persistence.md                       (StorageClasses, databasevalg, CloudNativePG)
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

Persistent state ligger i **nøyaktig to** committede filer, med hvert sitt ansvar:

| Fil | Innhold | Skrives |
|-----|---------|---------|
| `skybert/.oppdater-state.json` | Kjøringsstate: modus, SHA-er, datoer, `openItems` | Ved hver vellykket Apply |
| `skybert/.oppdater-coverage.json` | Bevart matrise A (dekning per docs-side) | Kun når matrise A er komplett |

Ingen annen persistent state finnes. `.tmp/oppdater-skybert/` er runtime-cache og skal aldri
leses som state. `skybert/SKILL.md` skal **ikke** inneholde noen state-HTML-kommentar.
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

### Dekningsmatrise-fil: `skybert/.oppdater-coverage.json`

Bevart matrise A, committet sammen med skybert-filene. Eneste gyldige grunnlag for videreført
dekning (se «Videreført dekning i FULL-modus» i steg 4).

```json
{
  "schemaVersion": 1,
  "generatedAt": "<ISO-8601>",
  "docsCommit": "<sha for docs-repo da matrisen ble laget>",
  "skillContentHash": "<sha256 over skybert/-innholdet, se under>",
  "pages": [
    {
      "path": "docs/get-started/index.md",
      "topic": "Onboarding",
      "coveredIn": ["SKILL.md#blåløypa-golden-path"],
      "coverage": "komplett|delvis|fraværende|utenfor-scope",
      "missing": "<hva som ev. mangler, ellers tom streng>"
    }
  ]
}
```

- `docsCommit` og `skillContentHash` er det som gjør videreføring **reproduserbar**: neste kjøring
  sammenligner mot nøyaktig disse, ikke mot `lastFullscanDate` eller state-SHA-ene.
- **`skillContentHash` er en innholdshash, ikke en commit-SHA.** En commit-SHA ville vært umulig:
  hashen lagres i en fil som selv inngår i commit-en, så verdien ville endret commit-SHA-en den
  peker på. Innholdshashen beregnes derfor over selve skill-innholdet, og eksplisitt **uten** de
  tre stiene som ikke er skill-innhold (`.oppdater-state.json`, `.oppdater-coverage.json`,
  `.claude-plugin/`) — de to første endres ved hver kjøring, og den tredje vedlikeholdes ikke av
  denne skillen:

  ```bash
  find skybert -type f \
    ! -path 'skybert/.oppdater-state.json' \
    ! -path 'skybert/.oppdater-coverage.json' \
    ! -path 'skybert/.claude-plugin/*' \
    | sort \
    | while read -r f; do printf '%s %s\n' "$f" "$(git hash-object "$f")"; done \
    | sha256sum | cut -d' ' -f1
  ```

  Kommandoen bruker git sine egne blob-hasher over arbeidstreet, så den kan kjøres når som helst
  — før commit, etter commit, eller ved neste kjørings verifikasjonssteg — og gir samme verdi så
  lenge innholdet er likt. `sort` gjør resultatet uavhengig av filsystemets rekkefølge.
- Hver docs-side i scope MÅ ha en rad. Sider bevisst utenfor scope føres med
  `coverage: "utenfor-scope"` og begrunnelse i `missing`, slik at de ikke dukker opp som åpne
  spørsmål ved hver kjøring.

### Regler

- State-filen oppdateres kun etter vellykket Apply (steg 9)
- `lastFullscanDate` oppdateres kun ved FULL-modus, og kun når matrise A faktisk er komplett
  (se steg 4). Ufullstendig gjennomgang → la `lastFullscanDate` stå urørt
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

Enumerér ALLE filer under `skybert/` rekursivt — inkludert undermapper og ikke-markdown-filer (f.eks. de statiske YAML-kopiene i `references/skybertapp/`). Unnta kun `.claude-plugin/` (plugin-manifest), `.oppdater-state.json` og `.oppdater-coverage.json`. Les deretter alt.

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

### Videreført dekning i FULL-modus

Ved FULL kan docs-sider som er **beviselig uendret** siden forrige fullscan videreføre forrige
dekningsvurdering i matrise A i stedet for å leses på nytt. Alle fire forutsetningene må være
oppfylt — er én av dem brutt, skal sidene leses på nytt:

1. **`skybert/.oppdater-coverage.json` finnes og er gyldig.** Uten bevart matrise finnes det ikke
   noe å videreføre *fra*: `openItems` sier bare hva som var udekket, ikke hvilke sider som var
   komplette eller hvor de var dekket. Mangler filen → full side-for-side-gjennomgang, og skriv
   matrisen ved denne kjøringens Apply.
2. **Kildesiden er verifisert uendret** med `gh api .../compare/<coverage.docsCommit>...<ny-sha>`,
   der `docsCommit` leses fra coverage-filen — ikke fra state.
3. **Målsiden er verifisert uendret:** innholdshashen beregnet med kommandoen i State-kontrakten
   skal være nøyaktig `coverage.skillContentHash`. Er skill-filene endret i mellomtiden, er
   dekningen ikke lenger kjent.
4. **Videreføringen merkes eksplisitt i planen** med hvilke commits sammenligningen ble gjort mot.

**Unntak som alltid leses på nytt:** endrede sider, nye sider, og sider med en åpen post i
`openItems`.

Matrise B og C, XRD-feltdekningssjekken, sammenligning av statiske kopier og re-validering av
operasjonelle antakelser kjøres uansett i full bredde — de er ikke omfattet av videreføringen.

**`lastFullscanDate` settes kun når matrise A faktisk er komplett** for alle docs-sider — enten
lest på nytt eller gyldig videreført etter reglene over. Er gjennomgangen ufullstendig, skal
`lastFullscanDate` stå urørt og `sistVerifisert` + kilde-SHA-ene oppdateres alene. Da forblir
dekningsgjelden synlig, og neste kjøring trigger FULL på nytt.

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

Skriv/oppdater `skybert/.oppdater-state.json` (kjøringsstate — den andre state-filen,
`.oppdater-coverage.json`, dekkes av punktet nederst i dette steget):
- **GitHub-modus:** Lagre commit SHAs og `commitDate` for begge repoer
- **Web-scraping-modus:** Lagre `globalHash` og per-side hashes fra `search_index.json`
  (rør ikke `github`-feltet)
- **Begge moduser:** Sett `sistVerifisert` til dagens dato. Ved FULL modus: oppdater også
  `lastFullscanDate` — men **kun hvis matrise A er komplett** for alle docs-sider (se steg 4).
  Ble gjennomgangen ufullstendig, la `lastFullscanDate` stå urørt og opprett en `openItems`-post
  som beskriver dekningsgjelden.
- **Skriv `skybert/.oppdater-coverage.json`** når matrise A er komplett: alle sider, `docsCommit`
  = docs-SHA fra denne kjøringen, `skillContentHash` = hashen beregnet etter at alle skill-endringer
  er implementert (se State-kontrakten for kommandoen). Er matrisen ufullstendig, skal filen ikke
  skrives — en delvis matrise ville blitt lest som komplett ved neste kjøring.
- **Ajourfør `openItems`:**
  - Legg til poster brukeren utsatte/avviste ikke-endelig i steg 7 (`status: "deferred"`)
  - Legg til godkjente poster som bare ble delvis implementert i steg 8 (`status: "partial"`)
  - Legg til poster der et kontrollpunkt i steg 8/9 slo feil (`status: "failed-verification"`)
  - Oppdater `lastSeen` på poster som ble tatt inn i planen på nytt
  - Fjern poster som ble avklart/fullført

Deretter: regenerer visningslinjen `> **Sist verifisert mot offisiell docs:** <dato>` i
`skybert/SKILL.md` fra `sistVerifisert`-feltet (dette er den eneste state-avledede teksten
i SKILL.md — aldri skriv noen HTML-state-kommentar).

`skybert/SKILL.md` og `skybert/.oppdater-state.json` committes sammen — og
`skybert/.oppdater-coverage.json` skal med i samme commit når den er skrevet eller oppdatert i
denne kjøringen. **Merk at coverage-filen er ny og utracket ved første komplette FULL**, så
`git commit -am` vil hoppe over den. Bruk eksplisitt `git add skybert/.oppdater-coverage.json`
(eller `git add skybert/`) før commit, og verifiser med `git status --porcelain skybert/` at
ingen av de tre står igjen som `??`.

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
   **Unntak:** manglende `.oppdater-coverage.json` er **ikke** strukturdrift og skal ikke gi
   selvoppdaterings-post. Filen skrives først ved en komplett FULL (se steg 4/9), så den er
   forventet fraværende inntil da.

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
