# Steg 6–7 – Versjonsinfrastruktur

## Steg 6 – Dokumenter versjonen som er brukt

### 6a. State-fil (autoritativ for scripting)

Oppdater `designsystem/.oppdater-state.json` med ny versjon. Kjør:

```bash
node .claude/skills/oppdater-designsystem/scripts/fetch-sources.mjs {ny-versjon}
```

Scriptet arkiverer nøkkelartefakter under `designsystem/versions/sources/v{versjon}/`
(hele upstream-filer uendret — aldri redigerte utdrag) og oppdaterer state-filen med
`version`, `gitTag`, `tarballUrl`, `distIntegrity`, `verifiedDate` og `archivedArtifacts`.

Kildearkivet gjør fremtidig verifisering/regenerering mulig selv om npm-versjoner
avpubliseres eller git-tagger forsvinner. Merk: arkivet supplerer — men erstatter ikke —
verifisering mot TypeScript-kilden (manifests har historisk vært ufullstendige, jf.
`start`/`end`-slottene i v0.35.0).

### 6b. Menneskelesbar kommentar

Oppdater linjen **rett etter frontmatter** (etter closing `---`) i `designsystem/SKILL.md`:

```markdown
<!-- Basert på @{pakkenavn} v{versjon} -->
```

---

## Steg 7 – Oppdater versjonsfilene

### 7a. FEATURES.md — nye public features

`designsystem/versions/FEATURES.md` er autoritativ kilde for **når public features ble
innført**. For hver ny public feature i ny latest (ny komponent, nytt attributt, ny slot,
nytt event, ny metode, nytt ikon, ny entrypoint, deprecation, endret default-atferd):

→ **Legg til én rad i FEATURES.md.** Kolonner: `Feature`, `Introduced`, `Type`, `Scope`,
`Source`. Kildegrunnlaget (`Source`) skal peke på konkret upstream-artefakt.

> **Viktig:** Eldre delta-filer skal **ikke** backfylles med «Missing vs latest»-notater
> for nye features — det er FEATURES.md sin jobb. Respekter dekningsgrensen som er
> deklarert øverst i FEATURES.md: features innført *før* grensen dokumenteres fortsatt
> i delta-filenes «Missing vs latest»-seksjoner og skal ikke flyttes uten eksplisitt
> beslutning (historisk migrering er et eget, separat tiltak).

### 7b. Les gjeldende INDEX.md

Les `designsystem/versions/INDEX.md` for å finne:
- Hvilken versjon som er markert som "Latest"
- Hvilke versjoner som er "Supported"
- Eldste "Supported"-versjon (for rotasjon)

### 7c. Opprett delta-filer for mellomliggende versjoner og forrige latest

**Algoritme (bruk alltid denne — også ved ett enkelt hopp):**

1. Les forrige latest fra `designsystem/versions/INDEX.md` (Latest-raden).
2. Bruk listen over mellomliggende minor-versjoner fra `check-version.mjs`.
3. **For HVER mellomliggende minor** (løkke, lavest versjon først):
   a. Beregn om minoren faller innenfor support-vinduet: de siste 9 minor-versjonene *under* ny latest.
      Hvis utenfor vinduet: hopp over (ingen delta-fil nødvendig for denne minoren).
   b. Finn høyeste patch-versjon for denne minoren (fra script-output).
   c. Les kildekode fra git-taggen for denne patch-versjonen (samme fremgangsmåte som
      [kildelesing.md](kildelesing.md)). Minimum: manifest-/tarball-diff — changelog alene
      er aldri nok.
   d. Opprett delta-fil `designsystem/versions/v{X.Y}.x.md` basert på standardmalen nedenfor.
4. Opprett til slutt delta-fil for **forrige latest** (normalt steg — utenfor løkken):
   - Lag `designsystem/versions/v{forrige-major}.{forrige-minor}.x.md`.
   - Fyll inn kjente avvik basert på endringer identifisert i steg 4–5.
   - Merk seksjonene med verifiseringsstatus.

**Standardmal for delta-fil** — kun seksjoner med reelt innhold tas med; alt som er
kontrollert og funnet uendret samles i «Verifisert uendret vs latest»:

```markdown
# Delta: v{X.Y}.x

## Scope

Gjelder v{X.Y}.x (alle patcher).
Skrevet mot: v{ny-versjon}. Innhold er kumulativt — gyldige avvik vs. enhver nyere latest.
Seksjoner uten avvik er utelatt — se «Verifisert uendret vs latest».

## Missing vs latest
(kun for features innført FØR dekningsgrensen i FEATURES.md; nyere features slås opp der)

## Different vs latest
(API, attributter, events som oppfører seg annerledes — kun hvis reelle avvik finnes)

## Legacy-only
(kun hvis noe fantes her men er fjernet/deprecated i latest)

## Verifisert uendret vs latest
- {område}: {kort konstatering, f.eks. "theme/default.css byte-identisk med v{ny}"}
(Skill mellom "verifisert uendret" og "ikke undersøkt": kun kontrollerte områder listes.
Bruk "ingen kjente" når verifiseringen er delvis.)

## Patch notes med API-impact
(kun hvis patches med event-/atferdsendringer finnes)

## Migrering ({X.Y} → {ny-versjon})
Korte tips for oppgradering til latest.

## Kilder og verifiseringsstatus
- **Kilder brukt:** GitHub release notes / kildekode / npm tarball
- **Verifisert:**
  - Komponenter: ja/nei
  - Imports/entrypoints: ja/nei
  - Tokens/theme: ja/nei
  - Events/API-atferd: ja/nei
```

Se [`versions/GUIDE.md`](../../../../designsystem/versions/GUIDE.md) for hvordan
delta-filer og FEATURES.md leses sammen (beslutningsflyt for versjonsspørsmål).

### 7d. Oppdater INDEX.md

1. Endre "Latest"-raden til å peke på ny versjon (slett delta-fil-lenke — latest har ingen delta).
2. Legg til ny rad for forrige latest med status "Supported" og lenke til den nye delta-filen.
3. **Rotasjon:** Fjern eldste "Supported"-rader til totalt antall rader i tabellen er ≤ 10 (latest + maks 9 Supported). Gjenta inntil kriteriet er oppfylt.
4. Oppdater baseline-kommentaren øverst (`Baseline er alltid SKILL.md (latest vX.Y.Z)`).

> **Viktig:** Rotasjon i `INDEX.md` betyr **ikke** at gamle delta-filer skal slettes fra disk.
> Historiske filer beholdes, men listes ikke lenger som støttet.

**Eksempel på oppdatert tabell:**

```markdown
| Versjon | Status      | Nøkkelavvik vs latest        | Delta-fil       |
|---------|-------------|------------------------------|-----------------|
| {ny}.x  | Latest      | —                            | —               |
| {gammel-latest}.x | Supported | [kort beskrivelse] | [v{gammel}.x.md](v{gammel}.x.md) |
| ...     | Supported   | ...                          | ...             |
```

### 7e. Oppdater SKILL.md og samlet stale-sjekk

Dette er det autoritative steget for alle versjonsstreng-oppdateringer i `designsystem/`.

**Faste oppdateringer i `designsystem/SKILL.md`:**
- Pakkenavnet og versjonsnummeret i toppkommentaren (`<!-- Basert på ... -->`)
- Feltet `Verifisert mot:` med ny versjon og dato
- Støttepolicyteksten hvis versjonsvinduet endres

**Samlet stale-sjekk i hele `designsystem/`:**

Bruk stale-listen fra kildelesingen (3.0) og søk i hele `designsystem/`
etter versjonsstrenger som peker på forrige latest. For hver treff, vurder:

- **Skal følge latest** (f.eks. `Verifisert mot`, vedlikeholdsnotater, installasjonsinstrukser)
  → oppdater til ny versjon.
- **Bevisst historisk** (f.eks. deltafiler, FEATURES-rader, versjonsspesifikke eksempler,
  migreringsnotater) → behold uendret.

> Ikke "normaliser" historiske referanser. Kun referanser som er ment å peke på gjeldende
> latest skal oppdateres.

### 7f. Valider lenker og filer

Kjør `contract-check.mjs` (se [kontraktsjekker.md](kontraktsjekker.md)) — den validerer
at delta-filer i INDEX.md finnes, at versjonene er sortert uten duplikater, og at alle
relative lenker peker på eksisterende filer.
