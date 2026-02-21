---
name: oppdater-designsystem
description: Oppdaterer designsystem-skillen i dette repoet basert på siste publiserte versjon av FHI Designsystem. Bruk denne skillen når designsystem-skillen skal synkroniseres med ny kildekode, eller når du mistenker at skillen er utdatert eller mangelfull.
---

# Oppdater Designsystem-skillen

Denne skillen beskriver arbeidsflyten for å holde `designsystem/`-skillen i dette repoet oppdatert og korrekt i henhold til siste **publiserte** versjon av FHI Designsystem.

## Oversikt

```
Fhi.AgentSkills (dette repoet)
└── designsystem/          ← skillen som skal oppdateres
    └── SKILL.md

Kilde:
└── github.com/FHIDev/Fhi.Designsystem  (leses kun fra publisert git-tag)
```

---

## Steg 1 – Les eksisterende designsystem-skill

Les alle filer i `designsystem/`-mappen i dette repoet. Disse filene er det nåværende grunnlaget – du trenger dem for å identifisere hva som mangler, er feil, eller kan forbedres.

Les `designsystem/SKILL.md` og finn versjons- og pakkenavn-informasjonen.

> Merk: Stien `designsystem/SKILL.md` er relativ til **repo-roten** (`Fhi.AgentSkills/`), ikke til skill-mappen.

Søk i denne rekkefølgen:

1. **Toppkommentar (kanonisk format):** Se etter en linje **rett etter frontmatter** (etter closing `---`) på formen:
   `<!-- Basert på @{pakkenavn} v{versjon} -->`
2. **Fallback:** Hvis kommentaren mangler, søk etter en linje som inneholder `Verifisert mot:` og parse pakkenavn og versjon derfra.

Notér pakkenavnet og versjonen – begge brukes i steg 2.

Notér også hvilke komponenter som er dokumentert i `designsystem/references/components/`
(filnavnene uten `.md`-ending, f.eks. `fhi-button`, `fhi-text-input`).
Denne listen brukes i Steg 3 til å finne alle TypeScript- og `.docs.mdx`-filer som
skal leses.

---

## Steg 2 – Finn siste publiserte versjon

### 2a. Finn npm-pakkenavnet

Hent rot-`package.json` fra:
```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/package.json
```

> ⚠️ Hent alltid denne filen fra `main`-branchen, **ikke** fra taggen. Rot-`package.json` finnes ikke nødvendigvis på alle git-tagger.

Les feltet `"name"`. Verifiser at dette er den faktiske, publiserte npm-pakken ved å sjekke:
- Matcher det pakkenavnet fra `designsystem/SKILL.md` (steg 1)?
- Ser det ut som en publisert pakke (f.eks. scopet med `@`, eller kjent pakkenavn)?

**Hvis rot-`package.json` ser ut som en monorepo-rot** (f.eks. `"name"` er uten `@`-scope, eller er ukjent), gjør følgende:

1. Les `pnpm-workspace.yaml` for å identifisere workspace-mapper:
   ```
   https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/pnpm-workspace.yaml
   ```
2. Bla i mappestrukturen under `packages/` ved å hente GitHub tree-URL for taggen:
   ```
   https://github.com/FHIDev/Fhi.Designsystem/tree/v{versjon}/packages
   ```
   Identifiser faktisk mappenavn. Les deretter `package.json` fra den mappen (ikke gjett på mappenavn).

Bruk pakkenavnet fra SKILL.md (steg 1) som hint for å identifisere riktig pakke raskt.

### 2b. Slå opp siste publiserte versjon på npm

Bruk npm-registeret:

```
https://registry.npmjs.org/<pakkenavn>/latest
```

Feltet `"version"` i JSON-svaret er siste publiserte versjon.

### 2c. Finn tilhørende git-tag

Versjonen fra npm tilsvarer en git-tag i repoet med formatet `v{versjon}`.
Eksempel: versjon `2.3.1` → tag `v2.3.1`.

Verifiser at taggen finnes:
```
https://github.com/FHIDev/Fhi.Designsystem/releases/tag/v{versjon}
```

### 2d. Sjekk om skillen allerede er oppdatert, og detekter multi-hopp ⚡

Sammenlign versjonen fra npm (steg 2b) med versjonen i skillen (steg 1).

> Hvis versjonene er **like** og brukeren **ikke** har bedt om full gjennomgang:
> → skillen er allerede basert på siste publiserte versjon.
> **Stopp her.** Informer bruker om at skillen er à jour og ikke trenger oppdatering.
> Ikke les kildekode, ikke lag endringsplan, ikke gjør endringer.
>
> Hvis versjonene er **like** men brukeren **eksplisitt** ber om gjennomgang av innhold
> (f.eks. "verifiser innholdet", "sjekk om alt er riktig", "gjennomgå kildekoden"):
> → fortsett til Steg 3. Versjonsinfrastruktur (Steg 7) hoppes over siden versjon er uendret.

Kun hvis versjonene er **forskjellige** → fortsett:

**Multi-hopp-deteksjon:** Hent fullstendig versjonsliste for pakken fra npm-registeret:

```
https://registry.npmjs.org/<pakkenavn>
```

Les nøklene i `versions`-objektet. Filtrer bort pre-release-versjoner (alpha, beta, rc, osv.).
Identifiser alle minor-versjoner mellom forrige latest (ekskl.) og ny latest (ekskl.).
Notér denne listen — den brukes i steg 7b.

Eksempel: Forrige latest er `0.31.2`, ny latest er `0.34.1`.
Faktisk publiserte minors fra npm: `0.32.0`, `0.32.1`, `0.33.0`.
Mellomliggende minors (ekskl. `0.31` og `0.34`): `0.32`, `0.33`.

Deretter → fortsett til steg 3.

---

## Steg 3 – Les kildekode fra taggen

> ⚠️ **Kritisk regel:** Les **alltid** kildekode fra den identifiserte git-taggen – **aldri** fra `main`-branchen eller HEAD. Nyere commits kan inneholde upubliserte endringer og er ikke autoritative.

Bruk følgende URL-format for å lese filer direkte fra taggen:

```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/v{versjon}/{filsti}
```

### Hvilke filer å lese

#### Alltid les — obligatorisk

Disse hentes alltid, for **alle** versjoner og scenarier:

| Filtype | Formål | Sti (relativ til pakke-undermappen) |
|---------|--------|--------------------------------------|
| `package.json` | Pakkenavn, versjon, peerDependencies, exports | `package.json` |
| `CHANGELOG.md` | Endringer mellom versjoner | `CHANGELOG.md` |
| TypeScript-kildefil per komponent | Autoritativ kilde for `@property`-dekoratorer (hvilke HTML-attributter finnes, typer, defaults). Verifiser mot Properties-tabellen i skillen. | `src/components/{komponent}/{komponent}.component.ts` |
| `.docs.mdx` per komponent | Variant-semantikk, bruksscenarier, kjente begrensninger og bugs — finnes ikke i TypeScript-koden | `src/components/{komponent}/{komponent}.docs.mdx` |
| `src/storybook/get_started/*.mdx` | Rammeverk-integrasjonsguider (React, Angular, Blazor, osv.) | `src/storybook/get_started/` |

**Komponent-listen** fra Steg 1 (`references/components/*.md` uten filending) brukes til å
finne riktige TypeScript- og `.docs.mdx`-filer. Hent én fil per komponent.

> **Merk:** TypeScript-kildefiler og `.docs.mdx`-filer utfyller hverandre.
> TypeScript gir deg det autoritative API-et; `.docs.mdx` gir deg semantikken og kjente
> fallgruver. Begge er nødvendige — ingen av dem kan erstattes av den andre.

> **Merk:** Filstier i FHI Designsystem-repoet følger mønsteret over, men kan avvike
> hvis repostrukturen endres. Finn riktig sti ved å se på mappestrukturen i pakke-undermappen
> (hent GitHub tree-URL for taggen om nødvendig).

#### Les om innholdet finnes — skjønnsbasert

| Filtype | Formål |
|---------|--------|
| `README.md` og andre `.md`-filer | Installasjon, oppsett, overordnet dokumentasjon |
| Storybook-stories (`.stories.ts` / `.stories.js`) | Brukseksempler og komponentvarianter — nyttig for å oppdage nye story-scenarier som bør dokumenteres |
| CSS / SCSS / token-filer | CSS-variabler, design tokens, theming — les ved mistanke om endringer i tokens |
| Andre `.mdx`-filer i `src/storybook/` | Tilgjengelighets-guider, FAQ, typografi-guider — les hvis disse endres mellom versjoner |

Start med å hente GitHub tree-URL for taggen for å se mappestrukturen, slik at du
finner riktige filstier:
```
https://github.com/FHIDev/Fhi.Designsystem/tree/v{versjon}/packages/{pakke-mappenavn}/src
```

---

## Steg 4 – Analyser og lag endringsplan

Sammenlign kildekoden fra taggen med innholdet i `designsystem/`-skillen. Lag en strukturert endringsplan som dekker:

### Mangler
Innhold som finnes i kildekoden, men ikke i skillen. Eksempler:
- Nye komponenter som ikke er dokumentert
- Props/API-endringer som ikke er reflektert
- Nye CSS-variabler eller design tokens
- Installasjonsinstruksjoner som mangler

### Feil eller utdatert innhold
Innhold i skillen som ikke lenger stemmer med kildekoden. Eksempler:
- Feil pakkenavn eller versjonsnummer
- Utgåtte props eller API-er
- Endrede importstier
- Gammel installasjonsmetode

### Andre forbedringer
Strukturelle, språklige eller pedagogiske forbedringer som ikke er direkte feil, men som gjør skillen mer nyttig for en AI-agent. Eksempler:
- Manglende kodeeksempler
- Uklar eller tvetydig formulering
- Dårlig organisering

### Format for endringsplanen

Presenter planen slik:

```
## Endringsplan – Designsystem-skill
Versjon analysert: v{versjon}
Dato: {dato}

### Mangler
- [ ] ...

### Feil / utdatert
- [ ] ...

### Forbedringer
- [ ] ...
```

**Vent på godkjenning fra bruker før du går videre til steg 5.**

---

## Steg 5 – Gjennomfør endringer

Etter godkjenning, oppdater filene i `designsystem/`-mappen. Skillen skal dekke følgende tema:

- **Installasjon og oppsett** – Hvordan installere pakken og komme i gang
- **Komponentoversikt med props/API** – Tilgjengelige komponenter, hvilke props de tar, events de emitter
- **Theming og CSS-variabler** – Tilgjengelige CSS-variabler og design tokens, og hvordan de brukes
- **Kodeeksempler** – Konkrete brukseksempler for de viktigste komponentene

### Prinsipper for god skill-innhold

- Skill-innhold skrives **for en AI-agent**, ikke for en menneskelig leser. Vær presis og unngå tvetydighet.
- Foretrekk **konkrete kodeeksempler** fremfor lange prosatekster.
- Ikke inkluder informasjon du ikke har verifisert i kildekoden fra taggen.
- Hold innhold relevant for den publiserte versjonen – ikke spekuler om fremtidige endringer.

### Kontrakt for endringer

> **Endre kun det som faktisk er feil, mangler eller er utdatert.**

Disse reglene er absolutte:

- **Behold eksisterende tekst uendret** hvis den fortsatt er korrekt i henhold til kildekoden fra taggen – selv om du ville formulert det annerledes selv.
- **Ikke omformuler, omstruktur eller "forbedre"** avsnitt som er faktariktige. Stilistiske preferanser er ikke et gyldig endringsgrunnlag.
- **Alle endringer skal begrunnes** med en konkret observasjon fra kildekoden – ikke med skjønn alene.
- Minimalt inngrep: Foretrekk å legge til nytt innhold fremfor å skrive om eksisterende.

---

## Steg 6 – Dokumenter versjonen som er brukt

Legg til eller oppdater en linje **rett etter frontmatter** (etter closing `---`) i `designsystem/SKILL.md` som angir hvilken versjon skillen er basert på:

```markdown
<!-- Basert på @{pakkenavn} v{versjon} -->
```

Dette gjør det enkelt å se om skillen er utdatert ved neste gjennomgang.

---

## Steg 7 – Oppdater versjonsinfrastruktur

Dette steget oppdaterer `versions/`-mappen slik at den reflekterer den nye latest-versjonen.

### 7a. Les gjeldende INDEX.md

Les `designsystem/versions/INDEX.md` for å finne:
- Hvilken versjon som er markert som "Latest"
- Hvilke versjoner som er "Supported"
- Eldste "Supported"-versjon (for rotasjon)

### 7b. Opprett delta-filer for mellomliggende versjoner og forrige latest

**Algoritme (bruk alltid denne — også ved ett enkelt hopp):**

1. Les forrige latest fra `designsystem/versions/INDEX.md` (Latest-raden).
2. Hent listen over faktisk publiserte minor-versjoner mellom forrige latest og ny latest fra npm-versjonslisten (steg 2d). Dette er listen over "mellomliggende minors".
3. **For HVER mellomliggende minor** (løkke, lavest versjon først):
   a. Beregn om minoren faller innenfor support-vinduet: de siste 9 minor-versjonene *under* ny latest.
      Hvis utenfor vinduet: hopp over (ingen delta-fil nødvendig for denne minoren).
   b. Finn høyeste patch-versjon for denne minoren via npm-versjonslisten.
   c. Les kildekode fra git-taggen for denne patch-versjonen (samme fremgangsmåte som steg 3).
   d. Opprett delta-fil `designsystem/versions/v{X.Y}.x.md` basert på standardmalen nedenfor.
4. Opprett til slutt delta-fil for **forrige latest** (normalt steg — utenfor løkken):
   - Lag `designsystem/versions/v{forrige-major}.{forrige-minor}.x.md`.
   - Fyll inn kjente avvik basert på endringer identifisert i steg 4–5.
   - Merk seksjonene med verifiseringsstatus.

> **Kumulativ delta-modell (fast regel):** Delta-filer backfylles ikke. Nye public komponenter som legges til i ny latest dokumenteres **ikke** retroaktivt i eldre delta-filer.
> Se [`versions/GUIDE.md`](../../designsystem/versions/GUIDE.md) for beslutningsflyt om kumulativ delta-modell.

**Standardmal for delta-fil:**

```markdown
# Delta: v{X.Y}.x

## Scope

Gjelder v{X.Y}.x (alle patcher).
Skrevet mot: v{ny-versjon}. Innhold er kumulativt — gyldige avvik vs. enhver nyere latest.

## Missing vs latest

(Komponenter som finnes i latest, men ikke i denne versjonen)

## Different vs latest

(API, attributter, events som oppfører seg annerledes)

## Legacy-only

(Ting som fantes her, men er fjernet/deprecated i latest)

## Import/entrypoints

Endringer i import-stier eller modulnavn.

## Theme/tokens

Token-navn-endringer, theme-path-endringer.

## Rammeverk-notater (Blazor)

Særheter som avviker fra latest.

## Patch notes med API-impact

Patches med event-/atferdsendringer.

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

### 7c. Oppdater INDEX.md

1. Endre "Latest"-raden til å peke på ny versjon (slett delta-fil-lenke — latest har ingen delta).
2. Legg til ny rad for forrige latest med status "Supported" og lenke til den nye delta-filen.
3. **Rotasjon:** Fjern eldste "Supported"-rader til totalt antall rader i tabellen er ≤ 10 (latest + maks 9 Supported). Gjenta inntil kriteriet er oppfylt.
4. Oppdater baseline-kommentaren øverst (`Baseline er alltid SKILL.md (latest vX.Y.Z)`).

**Eksempel på oppdatert tabell:**

```markdown
| Versjon | Status      | Nøkkelavvik vs latest        | Delta-fil       |
|---------|-------------|------------------------------|-----------------|
| {ny}.x  | Latest      | —                            | —               |
| {gammel-latest}.x | Supported | [kort beskrivelse] | [v{gammel}.x.md](v{gammel}.x.md) |
| ...     | Supported   | ...                          | ...             |
```

### 7d. Oppdater SKILL.md med ny versjonsinformasjon

Oppdater følgende i `designsystem/SKILL.md`:
- Pakkenavnet og versjonsnummeret i toppkommentaren
- Feltet `Verifisert mot:` med ny versjon og dato
- Støttepolicyteksten hvis versjonsvinduet endres

### 7e. Valider lenker og filer

Kjør disse sjekkene manuelt:
- Alle delta-filer som er listet i INDEX.md eksisterer faktisk under `designsystem/versions/`
- Alle versjoner i tabellen er korrekt sortert (høyeste versjon øverst)
- Ingen duplikate versjoner i tabellen

---

## Steg 8 – Contract checks

Kjør følgende sjekker for å verifisere at SKILL.md er korrekt for ny versjon:

| Sjekk | Kommando / Fremgangsmåte |
|-------|--------------------------|
| Theme-fil finnes | Verifiser at `theme/default.css` er eksportert i npm-pakken |
| Komponent-entrypoints | Alle komponenter i komponenttabellen har en entrypoint i pakken |
| Ikon-eksempler | Sjekk at ikonnavnene i SKILL.md faktisk finnes i pakken |
| Versjonsnummer | `designsystem/SKILL.md`, `versions/INDEX.md` og `<!-- Basert på ... -->` er konsistente |

### Synkronisering av `.claude`- og `.codex`-versjonene

`.codex/skills` er en symlink til `.claude/skills` — de er fysisk samme mappe. Ingen manuell synkronisering er nødvendig. Endringer i `.claude/skills/` reflekteres automatisk i `.codex/skills/`.

---

## Feilhåndtering

| Problem | Håndtering |
|---|---|
| Git-tag ikke funnet | Sjekk releases-siden og prøv varianter som `{versjon}` uten `v`-prefiks |
| npm-registeret returnerer ingen `latest` | Prøv `https://registry.npmjs.org/{pakkenavn}` og les `dist-tags.latest` |
| Fil ikke funnet på taggen | Sjekk mappestrukturen i repoet for å finne riktig filsti |
| Kildekoden er uleselig / minifisert | Let etter `.ts`-kildefiler i `src/`-mappen fremfor kompilerte filer |
| Delta-fil for forrige latest er uklar | Bruk "verifisering kreves"-markering for usikre seksjoner |
