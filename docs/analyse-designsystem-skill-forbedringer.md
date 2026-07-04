# Analyse: forbedring av `designsystem`-skillen og `oppdater-designsystem`-skillen

**Dato:** 2026-07-03
**Analysert:** `designsystem/` (v0.40.0-basert, 41 filer, ~3160 linjer) og
`.claude/skills/oppdater-designsystem/SKILL.md` (692 linjer, monolittisk)

---

## Sammendrag

Skillene er gjennomarbeidede og følger i hovedsak god praksis (progressive disclosure,
per-komponent-referanser, kildehierarki, verifiseringsstatus). De viktigste
forbedringsmulighetene er:

1. **Versjonsmodellen skalerer dårlig**: «Missing vs latest»-innhold backfylles i inntil 9
   delta-filer per release. En felles feature-historikk-tabell fjerner dette helt (P1).
2. **Consumer-skillen bærer vedlikeholdsinnhold** som lastes inn i kontekst ved hver bruk,
   men bare er relevant ved oppdatering (P2, P3).
3. **`oppdater-designsystem` er monolittisk** (692 linjer) selv om det vanligste utfallet er
   «allerede à jour» etter steg 2 (P4).
4. **Deterministiske steg gjøres manuelt** i stedet for med script — dyrere og mer feilbart (P5).
5. **Informasjonsbevaring hviler på at kilden alltid er tilgjengelig**: hvis en npm-versjon
   avpubliseres eller en git-tag forsvinner, kan fakta ikke re-verifiseres. Arkivering av
   nøkkelartefakter per versjon lukker dette hullet (P6).

Tiltakene er prioritert til slutt. P1–P5 gir størst effekt.

---

## Nå-situasjon (fakta)

### `designsystem/` (consumer-skill)

| Del | Omfang | Vurdering |
|-----|--------|-----------|
| `SKILL.md` | 166 linjer | God, men inneholder vedlikeholdsseksjon og duplisert versjonsinstruks |
| `references/components/` | 16 filer, 23–101 linjer | God granularitet; 5 typografi-filer er nesten identiske |
| `references/` (øvrige) | 4 filer, 44–281 linjer | Gode; `icon-usage.md` har innbakt vedlikeholdsnote |
| `versions/` | INDEX + GUIDE + 18 delta-filer | Fungerer, men med økende vedlikeholdskostnad |

### `oppdater-designsystem`

- Én `SKILL.md` på 692 linjer, 9 steg + feilhåndtering. Ingen `references/`, ingen `scripts/`.
- Til sammenligning er `oppdater-skybert` allerede delt opp med 6 referansefiler — mønsteret
  finnes i repoet.

### Observert vedlikeholdsgjeld i versjonsmodellen

- Delta-filene v0.31–v0.34 er backfylt med nyere avvik («inkl. nyere 0.35–0.40-avvik» i
  INDEX). GUIDE-regelen krever at *alle* støttede delta-filer oppdateres når latest får nye
  public features — O(9) filendringer per release, og «Nøkkelavvik»-kolonnen i INDEX blir
  stadig vagere.
- Samme fakta («`fhi-tag` mangler `bordered`, innført i v0.40.0») står i dag i **opptil
  11 filer**: INDEX-kolonnen + 9 delta-filer + komponentreferansen. Én kildeendring →
  mange redigeringspunkter → risiko for inkonsistens.

---

## Fokusområde 1: Optimal organisering av designsystem-skillen

### P1 (størst effekt — men innføres etter P4/P5, se rekkefølgen): Erstatt backfill med en feature-historikk-tabell

**Problem:** «Missing vs latest»-seksjonene i delta-filene er avledbar informasjon:
alt som trengs er *hvilken versjon en feature ble innført i*. Dagens modell dupliserer
dette per gammel versjon og krever backfill ved hver release.

**Forslag:** Opprett `versions/FEATURES.md` — én tabell, én rad per public feature.
Tabellen skal være **maskinvennlig nok til scripting** (P5), ikke ny prosa. Minimum
faste kolonner: `feature`, `introduced`, `type` (komponent/attributt/slot/event/token/
entrypoint/deprecation), `scope` (hvilken komponent/område) og `source` (kildegrunnlag):

```markdown
| Feature | Introduced | Type | Scope | Source |
|---------|-----------|------|-------|--------|
| `fhi-data-table` (+row/cell) | 0.37.0 | komponent | data-table | tarball v0.37.0 |
| `variant="bordered"` | 0.40.0 | attributt | fhi-tag | fhi-tag.manifest.json v0.40.0 |
| Slots `start`/`end` | 0.35.0 | slot | fhi-text-input | fhi-text-input.component.ts v0.35.0 (ikke i manifests) |
| `fhi-icon-file-text` | 0.38.0 | komponent | ikoner | tarball v0.38.0 |
| `exports` + `.d.ts` per entrypoint | 0.34.0 | entrypoint | pakke | package.json v0.34.0 |
| Default `color: currentcolor` | 0.39.0 | atferd | typografi | CHANGELOG v0.39.0 |
| `icon-only` deprecated | 0.31.0 | deprecation | fhi-button | fhi-button.component.ts v0.31.0 |
```

Agenten beregner da «hva mangler i v0.33?» med ett oppslag: alle rader med
`Introduced > 0.33`. Konsekvenser:

- **Per release: 1 ny rad i FEATURES.md** i stedet for redigering av inntil 9 delta-filer.
- Delta-filene reduseres til det som *genuint* er per-versjon: atferdsforskjeller
  («Different vs latest»), legacy-only, patch-notes med API-impact, migreringstips.
  Flere av dagens deltaer (f.eks. v0.39.x) blir da nesten tomme — det er et sunnhetstegn.
- «Nøkkelavvik»-kolonnen i INDEX kan forenkles eller avledes.
- Den kompliserte «kumulativ delta-modell»-teksten i GUIDE.md (med unntak og presiseringer)
  kan erstattes av to enkle regler: *innføringsversjoner står i FEATURES.md; atferdsavvik
  står i delta-filen*.

**Innfør i to trinn** for å begrense PR-størrelse og risiko:

- **P1a:** FEATURES.md innføres for nye features fremover (fra og med neste release).
- **P1b:** Historiske «Missing vs latest»-data migreres inn i egen, senere PR.

I overgangsperioden **må** FEATURES.md deklarere sin dekningsgrense eksplisitt
(f.eks. «dekker features innført fra og med v0.41; for eldre features, se
delta-filene»). Uten denne grensen finnes det en periode der ingen av kildene er
komplette alene — det er den største risikoen ved todelingen.

**Presisering om informasjonsbevaring:** Rådataene tapes ikke (eksisterende
«Missing»-seksjoner beholdes som historikk i gamle delta-filer, jf. dagens regel om at
delta-filer aldri slettes) — men **beslutningsflyten endres**. GUIDE.md må eksplisitt si
at FEATURES.md leses *sammen med* delta-filen for eldre versjoner: FEATURES.md svarer på
«hva finnes ikke i din versjon», delta-filen på «hva oppfører seg annerledes».

### P8: Slå sammen typografi-referansene

`fhi-display.md`, `fhi-title.md`, `fhi-headline.md`, `fhi-body.md`, `fhi-label.md`
(23–25 linjer hver) har nesten identisk struktur, og det vanligste brukerspørsmålet er
nettopp «hvilken av dem skal jeg bruke?». Én `references/components/typography.md` med
felles props-tabell + valgmatrise gir bedre svar med færre filoppslag. Data Table er
allerede konsolidert på denne måten — mønsteret finnes.

### P9: Fjern overlapp mellom `INDEX.md` og `GUIDE.md`

Matching-reglene (minor-matching, semver-ranges, patch-policy) står i begge filer.
Behold dem ett sted (GUIDE) og la INDEX være ren tabell. Sparer vedlikehold og
fjerner risiko for at reglene divergerer.

### P12: `icon-only`-deprecation dokumentert tre steder

SKILL.md (13 linjer med eksempel), `fhi-button.md` og `icon-usage.md` forklarer alle
samme deprecation. Behold full forklaring i `fhi-button.md`; reduser SKILL.md til én
linje under Kritiske regler («`icon-only` er deprecated fra v0.31 — se fhi-button.md»)
og fjern dubletten i `icon-usage.md`.

---

## Fokusområde 2: Minst mulig kontekstbruk

### P2: Flytt vedlikeholdsinnhold ut av consumer-skillen

`designsystem/SKILL.md` lastes i sin helhet hver gang skillen trigges. I dag inneholder den:

- Seksjonen «Vedlikehold av denne skillen» (~20 linjer med npm/jq-kommandoer)
- Noten om «Publiserte artefakter (fra v0.36.0+)» (maintainer-informasjon)
- `icon-usage.md` har tilsvarende innbakt «Vedlikeholdsnote» med oppdateringskommando

Alt dette er kun relevant for `oppdater-designsystem` og bør flyttes dit (eller til
script, se P5). Behold bare én provenance-linje («Verifisert mot v0.40.0, 2026-06-28»).
Estimert besparelse: ~25–30 linjer per trigging av skillen — for alltid.

### P3: Dedupliser versjonsinstruksen og legg til fast path for latest

- Versjonshåndteringen står **to ganger** i SKILL.md (blockquoten linje 18–24 og
  «Instruksjoner for Claude» punkt 1). Behold én.
- Viktigere: i dagens instruks skal agenten *alltid* lese `versions/INDEX.md` + delta-fil,
  også når prosjektet bruker latest. Legg til eksplisitt fast path:

  > Hvis versjonen i `package.json` matcher versjonen i `<!-- Basert på ... -->`:
  > svar direkte fra SKILL.md + referansefiler. Ikke les `versions/`.

  Dette sparer 2 filoppslag (INDEX + GUIDE/delta) i det vanligste scenarioet.
  **Avgrensning:** Fast path-en gjelder API-/bruksspørsmål. Ved spørsmål som eksplisitt
  handler om migrering, eldre versjoner eller støttepolicy skal `versions/` fortsatt
  leses — også når prosjektet selv står på latest.
- Tilsvarende for eldre versjoner: INDEX-kolonnen «Nøkkelavvik» (eller FEATURES.md etter P1)
  er ofte nok til å avgjøre at spørsmålet er upåvirket av versjonen — da trengs ikke
  delta-filen. Gjør denne snarveien eksplisitt i GUIDE.

### P7: Slankere delta-mal — dropp tomme seksjoner

Malen tvinger frem 5+ seksjoner med «Ingen.» (v0.39.x har f.eks. bare ett reelt avvik,
men 54 linjer). Endre malen slik at seksjoner uten innhold utelates, og erstatt dem med
én samlet verifiseringslinje som bevarer det viktige skillet mellom «verifisert uendret»
og «ikke undersøkt»:

```markdown
## Verifisert uendret vs latest
Imports/entrypoints, theme/tokens (byte-identisk), Blazor, events/API-atferd.
```

Dette halverer typisk delta-fil-størrelse uten informasjonstap.

### P4: Del opp `oppdater-designsystem` med fast path først

692 linjer lastes i dag ved hver invokering — men det vanligste utfallet er at
steg 2d konkluderer «allerede à jour» og stopper. Restrukturer etter mønsteret fra
`oppdater-skybert`:

```
oppdater-designsystem/
├── SKILL.md                     (~120 linjer: oversikt, kildehierarki,
│                                 steg 1–2 komplett inkl. stopp-regelen,
│                                 pekere til referansefilene for resten)
├── references/
│   ├── kildelesing.md           (steg 3: triage, fillister, heuristikker)
│   ├── endringsplan.md          (steg 4–5: sjekklister, domene-tabell, kontrakt)
│   ├── versjonsinfrastruktur.md (steg 6–7: delta-mal, INDEX-rotasjon, stale-sjekk)
│   ├── kontraktsjekker.md       (steg 8–9: contract checks, kvalitetskontrakt)
│   └── feilhandtering.md        (feilhåndteringstabellen)
└── scripts/                     (se P5)
```

Fast path-en (versjonssjekk → stopp) koster da ~120 linjer i stedet for 692.
Full oppdatering leser referansefilene sekvensielt etter behov — samme totale innhold,
men bare når det trengs.

---

## Fokusområde 3: Informasjon skal aldri tapes fra kilden

Dagens sterke sider: delta-filer slettes aldri (kun ut av INDEX), «Kontrakt for
endringer» forbyr omskriving av korrekt innhold, «Kilder og verifiseringsstatus»
dokumenterer provenance per delta. Dette bør bevares. Hullene:

### P6: Arkiver upstream-nøkkelartefakter per versjon

I dag kan fakta bare re-verifiseres så lenge kilden finnes. npm-versjoner kan
avpubliseres/deprecates, git-tagger kan slettes eller flyttes, og repoet har allerede
vist at mappestrukturen endres over tid. Hvis skillen en gang må regenereres eller en
påstand betviles, finnes det ingen lokal fasit.

**Forslag:** Ved hver oppdatering, lagre et lite kildearkiv i repoet, f.eks.:

```
designsystem/versions/sources/v0.40.0/
├── custom-elements.json      (eller manifest-samlingen — hele filer, uendret)
├── tarball-files.txt         (npm pack --dry-run-filisten)
└── package.json              (publisert pakke)
```

Arkiver **hele upstream-filer uendret** (eller metadata-pekere + tarball-manifest) —
ikke redigerte utdrag. Frie tekstutdrag (f.eks. et «CHANGELOG-utdrag») skaper en ny
kurateringsflate som selv kan miste informasjon; hvis changelog skal bevares, bevar
hele filen. Filene er små (noen titalls KB), maskinlesbare, og gjør at enhver fremtidig
verifisering/regenerering har en lokal, uforanderlig fasit — uavhengig av om upstream
endrer eller fjerner noe. Viktig presisering: v0.34-erfaringen viste at manifests kan
være *ufullstendige* (slots manglet), så arkivet supplerer — men erstatter ikke —
verifisering mot TypeScript-kilden ved oppdatering.

**I tillegg: en maskinlesbar state-fil**, etter mønster fra `skybert/.oppdater-state.json`
(mønsteret finnes allerede i repoet og brukes aktivt av `oppdater-skybert`):

```json
// designsystem/.oppdater-state.json
{
  "package": "@folkehelseinstituttet/designsystem",
  "version": "0.40.0",
  "gitTag": "v0.40.0",
  "tarballUrl": "...",
  "distIntegrity": "sha512-...",
  "verifiedDate": "2026-06-28",
  "archivedArtifacts": ["custom-elements.json", "tarball-files.txt", "package.json"]
}
```

Dette gir P5-scriptene et stabilt parse-mål (i stedet for å regexe
`<!-- Basert på ... -->`-kommentaren), og `distIntegrity`/`tarballUrl` gjør provenance
kryptografisk etterprøvbar. HTML-kommentaren i SKILL.md beholdes som menneskelesbar
visning, men state-filen blir autoritativ for scripting.

### Styrk «flyttet/konsolidert kilde»-vernet med diff-krav

Regelen «ikke kast informasjon når upstream konsoliderer filer» finnes allerede, men er
ren instruks. Med kildearkivet (over) kan den gjøres verifiserbar: sammenlign forrige
versjons artefaktliste med den nye — alt som forsvinner fra kilden skal eksplisitt
vurderes («flyttet hvor? fortsatt gyldig? bevart i skillen hvor?») før planen godkjennes.
Legg dette som eget punkt i endringsplan-sjekklisten.

### P1 bidrar også her

Én autoritativ rad i FEATURES.md per feature er langt mer robust mot informasjonstap
enn samme fakta spredt over mange delta-filer som skal huskes oppdatert.

---

## Fokusområde 4: Optimal virkemåte (ytelse og presisjon)

### P5: Script de deterministiske stegene

Flere steg i `oppdater-designsystem` er rene mekaniske operasjoner som i dag gjøres
med WebFetch/manuelle kommandoer — tregt, token-dyrt og feilbart (skillen har allerede
en egen feilhåndteringsrad for trunkerte registry-svar). Bundle scripts under
`.claude/skills/oppdater-designsystem/scripts/`:

1. **`check-version`** (steg 1–2 komplett): leser `Basert på`-versjonen fra SKILL.md,
   slår opp npm latest, lister mellomliggende minors (filtrert for pre-releases),
   finner høyeste patch per minor, verifiserer git-tag — og skriver JSON.
   Fast path-en («à jour, stopp») blir da én scriptkjøring i stedet for en manuell
   flertrinnsprosedyre. Løser samtidig trunkeringsproblemene ved store registry-svar.
2. **`contract-check`** (steg 7e + 8, de mekaniske radene): entrypoints i tarball vs.
   komponenttabellen, ikonliste-diff, versjonsstreng-konsistens
   (`Basert på` ↔ `Verifisert mot` ↔ INDEX-latest), relative lenker peker på
   eksisterende filer, INDEX-regler (sortering, ≤10 rader, delta-filer finnes),
   `.claude`↔`.agents`-diff. Kjøres før PR og rapporterer avvik.
3. **`fetch-sources`** (P6): laster ned og arkiverer nøkkelartefaktene for en gitt versjon.

De skjønnsbaserte sjekkene (docs-dekning, runtime-defaults, domene-dekning) forblir
sjekkliste for agenten — det er riktig arbeidsdeling.

### P11: Automatiser `.claude` ↔ `.agents`-synkroniseringen — obligatorisk og tidlig

Manuell kopiering + manuell diff er dagens instruks, og drift her er en klassisk *stille*
feil: ingenting knekker synlig, Codex-brukere får bare gradvis utdaterte instruksjoner.
Repo-instruksen sier `.claude` er kanonisk — da bør det håndheves maskinelt, ikke ved
disiplin. Innfør en **GitHub Action som feiler PR-en** hvis trærne divergerer, som del av
den *første* tiltaksbatchen (den er liten, uavhengig av alt annet, og beskytter alle
senere endringer). `contract-check`-scriptet (P5) kjører samme diff lokalt.
(Full avvikling av dupliseringen er en egen diskusjon — repoet har allerede notert at
symlinks er upålitelige på enkelte Windows-oppsett.)

### Mindre presisjonsforbedringer i `oppdater-designsystem`

- **Multi-hopp blir billigere med P1**: for mellomliggende minors er full
  komponentgjennomgang bare nødvendig når noe indikerer *atferdsendring* — nye features
  er én FEATURES-rad. Men minimumsnivået per minor er fortsatt **manifest-/tarball-diff**,
  ikke changelog alene: changelog er hint, ikke kontrakt (dette er allerede en etablert
  regel i skillen, og den skal ikke svekkes av effektiviseringen).
- Steg 5s «Retningslinjer for token-dokumentasjon» beskriver i praksis fasiten for
  `design-tokens.md` — vurder å flytte dette til en kommentar/kontrakt i selve
  referansefilen, slik at dokument og krav bor sammen.
- **Fast kontrollpunkt for upstreams `ai-tooling/SKILL.md`:** pakken skiper fra v0.36 sin
  egen agent-skill. Legg inn som fast regel i endringsplan-sjekklisten (steg 4) at denne
  skal *leses som kildeinput* ved hver oppdatering — den kan avsløre hull eller nye
  anbefalinger — men at den **aldri automatisk overskriver** lokal kuratert kunnskap.
  Avvik mellom upstream-skillen og repo-skillen tas inn i endringsplanen som
  vurderingspunkter, ikke som automatiske endringer.

---

## Andre forbedringer (kvalitet)

### P10: Innfør regresjonstest-spørsmål (evals)

Det finnes i dag ingen systematisk måte å oppdage at en oppdatering *forverret* skillen.
Opprett `designsystem/evals/evals.json` (eller tilsvarende) med 6–10 representative
spørsmål med fasit, f.eks.:

- «Hvordan legger jeg et søkeikon inni et tekstfelt?» — på latest *og* «vi bruker 0.34»
  (fasit: slots finnes ikke i 0.34; skillen skal si det)
- «Hvilken CSS-variabel bruker jeg for feiltekst?» (fasit: semantisk token, ikke hex/primitiv)
- «Sett opp designsystemet i Blazor»
- «Hvorfor rendres knappene uten styling?» (fasit: theme-import mangler)
- Et spørsmål om en versjon utenfor support-vinduet (fasit: best effort + oppgraderingsråd)

Legg «kjør eval-spørsmålene mot oppdatert skill» inn som del av steg 9 i
`oppdater-designsystem`. Dette fanger både faktafeil og tilfeller der
versjonsrutingen (INDEX/GUIDE/delta) ikke følges.

**P10 skal omfatte to eval-typer:**

1. **Svar-evals** (over): gir skillen riktige svar?
2. **Trigger-evals**: trigges skillen i det hele tatt? Et lite sett realistiske prompts
   med forventet trigger/ikke-trigger, inkludert ord brukere faktisk skriver:
   «Storybook», «FHI-komponent», «designsystem.fhi.no», og norske formuleringer som
   «lag et skjema med FHI-komponenter». Beskrivelsen i `designsystem/SKILL.md` nevner
   i dag ingen av disse — en liten utvidelse reduserer under-trigging, og trigger-evals
   gjør effekten målbar (skill-creators beskrivelse-optimalisering støtter akkurat
   denne løkken).

### Vurder på sikt: generert kjerne + kuratert overlay

Upstream publiserer nå `custom-elements.json`, per-komponent `*.manifest.json` og en
egen `ai-tooling/SKILL.md`. På sikt kan props/events/slots-tabellene i
`references/components/*.md` genereres deterministisk fra manifests (script), mens
håndskrevet semantikk (bruksscenarier, fallgruver, runtime-avvik) ligger i en tydelig
markert seksjon som aldri regenereres. Fordel: API-tabeller blir alltid korrekte og
oppdatering nesten gratis. Forbehold: manifests har beviselig vært ufullstendige
(v0.34-slots), så verifisering mot TypeScript-kilden må bestå som kontrollpunkt.

**Forutsetning før dette innføres — en kontrakt for genererte filer:**

- Genererte seksjoner markeres eksplisitt, f.eks.
  `<!-- generated:start (source: fhi-button.manifest.json v0.41.0) -->` …
  `<!-- generated:end -->`.
- Manuelle endringer *inni* markerte seksjoner er forbudt (de overskrives ved neste
  generering); kuratert innhold bor alltid utenfor markørene.
- `contract-check` (P5) kan da verifisere at genererte seksjoner er byte-identiske med
  regenerert output — avvik betyr at noen har redigert i feil seksjon.

Dette er en større omlegging — anbefales først etter at P1–P5 er på plass.

---

## Prioritert tiltaksliste

| # | Tiltak | Effekt | Innsats |
|---|--------|--------|---------|
| P1 | `versions/FEATURES.md` erstatter backfill av «Missing vs latest» (todelt: P1a nye features, P1b historisk migrering) | Stor: O(1) i stedet for O(9) filendringer per release; mindre duplisering; enklere GUIDE | Middels |
| P2 | Flytt vedlikeholdsinnhold ut av consumer-skillen (SKILL.md, icon-usage.md) | Kontekstbesparelse ved hver bruk | Liten |
| P3 | Dedupliser versjonsinstruks + fast path når prosjektversjon = latest (avgrenset: gjelder ikke migrerings-/policyspørsmål) | 2 færre filoppslag i vanligste scenario | Liten |
| P4 | Del opp `oppdater-designsystem` i SKILL.md + references/ med fast path først | ~120 i stedet for 692 linjer for «à jour»-sjekken | Middels |
| P5 | Scripts: `check-version`, `contract-check`, `fetch-sources` | Raskere, billigere, færre feil; løser trunkeringsproblemer | Middels |
| P6 | Kildearkiv per versjon + `designsystem/.oppdater-state.json` | Re-verifiserbarhet selv om upstream forsvinner; stabilt parse-mål for scripts | Liten |
| P7 | Slankere delta-mal (dropp tomme seksjoner, samlet verifiseringslinje) | Mindre kontekst ved versjonsspørsmål | Liten |
| P8 | Konsolider typografi-referansene til én fil | Ryddighet; mindre risikoreduksjon enn de øvrige — utsettes | Liten |
| P9 | Fjern INDEX/GUIDE-overlapp (matching-regler ett sted) | Mindre vedlikehold, ingen divergensrisiko | Liten |
| P10 | Svar-evals + trigger-evals, kjøring i steg 9 | Regresjonssikkerhet for kvalitet og trigging | Middels |
| P11 | Obligatorisk CI-sjekk `.claude`↔`.agents` (GitHub Action) + lokal diff i contract-check | Fjerner kjent *stille* driftrisiko; beskytter alle senere endringer | Liten |
| P12 | `icon-only`-deprecation dokumentert ett sted | Mindre duplisering | Liten |
| — | Fast kontrollpunkt: upstreams `ai-tooling/SKILL.md` som kildeinput (aldri auto-overskriving) | Fanger hull/nye anbefalinger uten å miste kuratert kunnskap | Liten |

**Anbefalt rekkefølge:**

1. **P2/P3/P7/P9/P12** — raske gevinster, kan tas i én PR.
2. **P4/P5/P11** — restrukturering av oppdater-skillen + automatiserte kontroller.
   P11 legges her (tidlig) fordi CI-sjekken beskytter alle påfølgende endringer, og
   P5-scriptene gjør P1/P6 trygge å innføre etterpå.
3. **P1/P6** — versjonsmodell-omleggingen (P1a først, P1b som egen PR) + provenance.
   Gjøres samlet og gjerne i forbindelse med neste release-oppdatering, med
   `check-version`/`contract-check` på plass som sikkerhetsnett.
4. **P10** — evals (svar + trigger).
5. **P8** — typografi-konsolidering.
6. **Generert kjerne + kuratert overlay** — på sikt, med generert-kontrakten som
   forutsetning.

Merk: endringer i `.claude/skills/oppdater-designsystem/` må speiles til
`.agents/skills/oppdater-designsystem/` (repo-regel), og P1/P7 krever samsvarende
oppdatering av malene og reglene i både `oppdater-designsystem` og `versions/GUIDE.md`.
