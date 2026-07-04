# Steg 8–9 – Contract checks og kvalitetskontrakt

## Steg 8 – Contract checks

### 8a. Automatiserte sjekker

Kjør fra repo-roten:

```bash
node .claude/skills/oppdater-designsystem/scripts/contract-check.mjs          # offline-sjekker
node .claude/skills/oppdater-designsystem/scripts/contract-check.mjs --online # + npm-baserte sjekker
```

Scriptet dekker de mekaniske radene:

| Sjekk | Dekkes av |
|-------|-----------|
| Versjonskonsistens (`Basert på`, `Verifisert mot`, state-fil, INDEX-latest) | offline |
| Relative markdown-lenker peker på eksisterende filer | offline |
| INDEX-regler: sortering, ≤10 rader, ingen duplikater, delta-filer finnes | offline |
| FEATURES.md har gyldige kolonner og dekningsgrense | offline |
| `.claude/skills` ↔ `.agents/skills` identiske | offline |
| Komponent-entrypoints i tarball vs komponenttabellen i SKILL.md | `--online` |
| Ikonnavn i `icon-usage.md` vs ikon-entrypoints i tarball | `--online` |
| Theme-fil (`theme/default.css`) finnes i publisert pakke | `--online` |

### 8b. Skjønnsbaserte sjekker (manuelle)

| Sjekk | Fremgangsmåte |
|-------|---------------|
| Public API-manifest | Verifiser `custom-elements.json` / `web-types.json` hvis de finnes, og bruk dem for å kryssjekke tag-navn, attributter, events, metoder og slots |
| Exports / publiserte filer | Sjekk `package.json` `exports` hvis feltet finnes, ellers bruk tarball-filisten til å verifisere import-stier og entrypoints |
| Kompatibilitet | Sammenlign `peerDependencies` og eventuelle `engines`/andre kompatibilitetsfelt mellom gammel og ny versjon; dokumenter kun brukerrelevant endring |
| Runtime-defaults | For endrede komponenter: sjekk `update`/`updated`/valideringslogikk for effective defaults, normalisering og warnings som ikke alltid fremgår av manifests |
| Docs-dekning | Verifiser at relevant `.docs.mdx` / konsolidert docs er dekket i referansefilene: bruksscenarier, retningslinjer, kjente begrensninger, tilgjengelighet, rammeverk-notater |
| Stale versjonsstrenger | Verifiser at den samlede stale-sjekken (7e) er utført — ingen latest-referanser som skulle vært oppdatert peker fortsatt på forrige versjon |
| Design tokens vs `default.css` | Verifiser at `references/design-tokens.md` dekker alle primitive fargepaletter, semantisk→primitiv mapping, og eventuelle nye token-kategorier fra `default.css`. Sjekk spesielt at antall paletter, stopp-skala og rolle-mapping stemmer. |
| Eksterne ressurslenker | Verifiser at eventuelle Figma-lenker, docs-URL-er og andre eksterne ressurser nevnt i MDX-filer er inkludert i skillen der de gir verdi for brukeren |
| Konsistens hovedfil ↔ referansefiler | Verifiser: (1) Hver komponent i komponenttabellen i SKILL.md har en oppdatert referansefil under `references/components/`. (2) Token-mønster og terminologi i SKILL.md matcher `references/design-tokens.md`. (3) Ikonimport-mønster i SKILL.md matcher `references/icon-usage.md`. (4) Deprecations nevnt i komponentfiler er reflektert i SKILL.md når de er generelt viktige. |
| Domene-dekning | Gå gjennom domene-tabellen i [endringsplan.md](endringsplan.md) og verifiser at hvert domene er dekket med oppdatert innhold i både hovedfil og referansefil(er). |
| Rammeverk-råd | Verifiser at React-, Angular- og Blazor-rådene i `references/framework-setup.md` fortsatt samsvarer med publisert pakke og upstream get_started-docs. Fjern rammeverksspesifikke råd som ikke lenger er dokumentert eller implisert av upstream. |
| Upstream `ai-tooling/SKILL.md` | Verifiser at kontrollpunktet fra endringsplanen (sjekkliste-punkt 9) er gjennomført og at vurderingspunktene er avklart |

### Manuelle kommandoer (fallback hvis scriptene feiler)

```bash
# Siste publiserte versjon
npm view @folkehelseinstituttet/designsystem version

# Komponent-entrypoints i publisert pakke (unntatt ikoner og theme)
npm pack @folkehelseinstituttet/designsystem --dry-run --json \
  | jq -r '.[0].files[].path' \
  | grep -E '^fhi-[^i]' | grep -v 'fhi-icon' | sort

# Ikon-entrypoints i publisert pakke
npm pack @folkehelseinstituttet/designsystem --dry-run --json \
  | jq -r '.[0].files[].path' \
  | grep 'fhi-icon-' | sed 's/fhi-icon-//;s/\.js//' | sort
```

> **Publiserte artefakter (fra v0.36.0+):** Pakken inneholder `ai-tooling/SKILL.md`
> (upstreams egen, mer overordnede agent-skill) og per-komponent `*.manifest.json` i tarballen.
> Merk: manifestfilene er **ikke** egne exports — kun `./custom-elements.json` og
> komponent-/ikon-entrypoints er deklarert i `package.json` `exports`. Repo-skillen
> er fortsatt den lokale, mer detaljerte kilden; upstream-skillen erstatter den ikke.

---

## Steg 9 – Kvalitetskontrakt for sluttresultatet

Etter at alle steg er utført, verifiser at den oppdaterte designsystem-skillen oppfyller
disse kravene. En oppdatering er ikke ferdig før alle punkter er bekreftet.

### Versjonskonsistens

Følgende skal vise **samme versjon** etter oppdatering (verifiseres av `contract-check.mjs`):
- `designsystem/.oppdater-state.json` (`version`)
- `<!-- Basert på ... -->` i `designsystem/SKILL.md`
- `Verifisert mot:`-feltet i `designsystem/SKILL.md`
- Latest-raden i `versions/INDEX.md`
- Vedlikeholdsnotater i referansefiler som er ment å følge latest

### Evals — regresjonstest

Kjør spørsmålene i `designsystem/evals/evals.json` mot den oppdaterte skillen:
les skillen slik en agent ville gjort (følg versjonsrutingen i SKILL.md) og besvar
hvert spørsmål. Sammenlign med `expected_output`. Avvik betyr at oppdateringen har
introdusert en regresjon eller at eval-fasiten må oppdateres (begrunn i så fall hvorfor
fasiten er utdatert — typisk fordi ny versjon faktisk endrer riktig svar).

Trigger-evals (`designsystem/evals/trigger-evals.json`) brukes når skill-beskrivelsen
i frontmatter endres: verifiser at should-trigger-promptene fortsatt matcher
beskrivelsen og at should-not-trigger-promptene ikke gjør det.

### Innholdskvalitet

Designsystem-skillen er skrevet for en AI-agent som skal svare brukere. Etter oppdatering
skal innholdet gi agenten nok informasjon til å:

- Installere pakken og sette opp theme korrekt
- Velge riktig komponent og sette riktige attributter/props
- Bruke semantiske design tokens (og forstå hvorfor primitiver ikke skal brukes direkte)
- Importere og bruke ikoner med riktig mønster
- Sette opp pakken i React, Angular og Blazor
- Gi versjonsspesifikke råd når brukerens versjon avviker fra latest

### Hva som ikke skal inn

Ikke gjør skillen bredere ved hver release uten at det gir bedre beslutningsstøtte:
- Ikke dokumenter interne refaktorer eller repo-flyttinger med mindre de påvirker public kontrakt
- Ikke dokumenter alt som finnes i koden — dokumenter det som hjelper agenten gi riktige svar
- Ikke legg til innhold bare fordi upstream har det; vurder om det faktisk endrer rådene agenten gir
