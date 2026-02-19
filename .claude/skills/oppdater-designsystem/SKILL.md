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

Les `designsystem/SKILL.md` og finn versjons- og pakkenavn-informasjonen. Søk i denne rekkefølgen:

1. **Toppkommentar (kanonisk format):** Se etter en linje øverst på formen:
   `<!-- Basert på @{pakkenavn} v{versjon} -->`
2. **Fallback:** Hvis kommentaren mangler, søk etter en linje som inneholder `Verifisert mot:` og parse pakkenavn og versjon derfra.

Notér pakkenavnet og versjonen – begge brukes i steg 2.

---

## Steg 2 – Finn siste publiserte versjon

### 2a. Finn npm-pakkenavnet

Hent rot-`package.json` fra:
```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/package.json
```

Les feltet `"name"`. Verifiser at dette er den faktiske, publiserte npm-pakken ved å sjekke:
- Matcher det pakkenavnet fra `designsystem/SKILL.md` (steg 1)?
- Ser det ut som en publisert pakke (f.eks. scopet med `@`, eller kjent pakkenavn)?

**Hvis rot-`package.json` ser ut som en monorepo-rot** (f.eks. `"name"` er uten `@`-scope, eller er ukjent), gjør følgende:

1. Les `pnpm-workspace.yaml` for å identifisere workspace-mapper:
   ```
   https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/pnpm-workspace.yaml
   ```
2. Les `package.json` i aktuelle undermapper (typisk `packages/*/package.json`) for å finne pakken med:
   - Et scopet `"name"` (starter med `@`)
   - Og/eller et `"publishConfig"`-felt som indikerer at den er publisert på npm

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

### 2d. Sjekk om skillen allerede er oppdatert ⚡

Sammenlign versjonen fra npm (steg 2b) med versjonen i skillen (steg 1).

> Hvis versjonene er **like** → skillen er allerede basert på siste publiserte versjon.  
> **Stopp her.** Informer bruker om at skillen er à jour og ikke trenger oppdatering.  
> Ikke les kildekode, ikke lag endringsplan, ikke gjør endringer.

Kun hvis versjonene er **forskjellige** → fortsett til steg 3.

---

## Steg 3 – Les kildekode fra taggen

> ⚠️ **Kritisk regel:** Les **alltid** kildekode fra den identifiserte git-taggen – **aldri** fra `main`-branchen eller HEAD. Nyere commits kan inneholde upubliserte endringer og er ikke autoritative.

Bruk følgende URL-format for å lese filer direkte fra taggen:

```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/v{versjon}/{filsti}
```

### Hvilke filer å lese

Bruk skjønn basert på hva som finnes i repoet. Relevante kildefiltyper:

| Filtype | Formål |
|---|---|
| `README.md` og andre `.md`-filer | Installasjon, oppsett, overordnet dokumentasjon |
| `package.json` | Pakkenavn, versjon, peerDependencies, exports |
| TypeScript/JavaScript-kildefiler | Komponentdefinisjon, props, events, eksporterte typer |
| Storybook-stories (`.stories.ts` / `.stories.js`) | Brukseksempler og komponentvarianter |
| CSS / SCSS-filer | CSS-variabler, design tokens, theming |
| Changelog (`CHANGELOG.md`) | Hva som er endret mellom versjoner |

Start med et overblikk over mappestrukturen i repoet for å forstå hvor de ulike filene ligger.

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

Legg til eller oppdater en linje øverst i `designsystem/SKILL.md` som angir hvilken versjon skillen er basert på:

```markdown
<!-- Basert på @{pakkenavn} v{versjon} -->
```

Dette gjør det enkelt å se om skillen er utdatert ved neste gjennomgang.

---

## Feilhåndtering

| Problem | Håndtering |
|---|---|
| Git-tag ikke funnet | Sjekk releases-siden og prøv varianter som `{versjon}` uten `v`-prefiks |
| npm-registeret returnerer ingen `latest` | Prøv `https://registry.npmjs.org/{pakkenavn}` og les `dist-tags.latest` |
| Fil ikke funnet på taggen | Sjekk mappestrukturen i repoet for å finne riktig filsti |
| Kildekoden er uleselig / minifisert | Let etter `.ts`-kildefiler i `src/`-mappen fremfor kompilerte filer |
