# Endringsplan – Designsystem-skill

Versjon analysert: v0.45.0, fra lokal v0.43.5, inkludert mellomversjon v0.44.0.
Dato: 2026-09-20.
Status: Godkjent og implementert. Verifisert 2026-09-20.

## Kildegrunnlag og avgrensning

- Versjonsscriptet bekrefter npm-latest 0.45.0 og at git-taggen finnes.
- Publiserte npm-pakker for 0.43.5, 0.44.0 og 0.45.0 er hentet til en midlertidig mappe. Filister, exports, komponentmanifester, `custom-elements.json`, `web-types.json`, theme og avhengighetskrav er sammenlignet for begge versjonshopp.
- GitHub compare og kildearkiver fra de tre publiserte taggene viser bare endringer i checkbox/radio for 0.44.0 og nytt tekstområde for 0.45.0, i tillegg til versjon/changelog. Berørt TypeScript og MDX er lest, sammen med rammeverksguider, token-dokumentasjon og eksisterende lokale markdown-filer.
- [0.44.0-endringen](https://github.com/FHIDev/Fhi.Designsystem/compare/v0.43.5...v0.44.0) kommer fra [PR #482](https://github.com/FHIDev/Fhi.Designsystem/pull/482). [0.45.0-endringen](https://github.com/FHIDev/Fhi.Designsystem/compare/v0.44.0...v0.45.0) kommer fra [PR #438](https://github.com/FHIDev/Fhi.Designsystem/pull/438). PR-identitet er kontrollert direkte.
- Upstream-stier nedenfor er relative til `packages/fhi-designsystem/` i [tag v0.45.0](https://github.com/FHIDev/Fhi.Designsystem/tree/v0.45.0/packages/fhi-designsystem), med mindre annet er oppgitt.
- Lokale stier under `references/` og `versions/` er relative til `plugins/designsystem/skills/designsystem/`.

## Mangler

- [x] **Dokumenter `fhi-text-area`, innført i 0.45.0.** Opprett `references/components/fhi-text-area.md` med separat import, bruk for tekst over flere linjer, `label`, `name`, `value`, `placeholder`, `help-text`, `message`, `status`, `readonly`, `disabled` og `rows` (default 2). Ta med `input`/`change`, form-assosiering, vertikal størrelsesjustering og et kort eksempel med label. `status="error"` er visuell status; komponenten implementerer ikke `required`, `maxlength` eller egen constraint-validering. Den har ingen innholdsslots.
  **Filer:** ny komponentreferanse og komponenttabellen i `SKILL.md`.
  **Kilder:** publisert `package.json`, `fhi-text-area.manifest.json`, `custom-elements.json`; `src/components/fhi-text-area/fhi-text-area.component.ts` og `fhi-text-area.docs.mdx`; PR #438.

- [x] **Dokumenter tekstområdets verdi- og skjemaatferd.** Programmatisk `value` oppdaterer ElementInternals, men sender ikke i seg selv `input`/`change`. Reset leser det gjeldende `value`-attributtet, eller bruker tom streng; det er ikke en separat lagret initialverdi. Bruk `value`, ikke tekst mellom taggene. `readonly` beholdes i FormData, `disabled` utelates. Enter brukes til linjeskift.
  **Filer:** `references/components/fhi-text-area.md`, `references/form-usage.md` og listen over form-komponenter i `SKILL.md`.
  **Kilder:** tekstområdets TypeScript (`value`-setter, event-håndtering, `formResetCallback`, render) og MDX fra v0.45.0.

- [x] **Legg til `helpText` / `help-text` på checkbox og radio fra 0.44.0.** Type `string | undefined`, default `undefined`, vises under label. Når ikke-tom hjelpetekst brukes uten label, logger komponenten `console.error`; renderingen avbrytes ikke. Vis ett eksempel per komponent med begge attributtene.
  **Filer:** `references/components/fhi-checkbox.md` og `references/components/fhi-radio.md`.
  **Kilder:** publiserte manifester fra 0.44.0/0.45.0; de to komponentenes TypeScript (`updated` og render), MDX og PR #482. MDX-tekstene er uendret; label-kravet fremgår av runtime-koden.

## Feil / utdatert

- [x] **Oppdater baseline og verifiseringsreferanser til 0.45.0.** Oppdater toppkommentar, pakkeversjon og verifiseringsdato i `SKILL.md`, versjonsreferansen for palettmapping i `references/design-tokens.md` og ikonlistens verifiseringslinje i `references/icon-usage.md`. Historiske innføringsversjoner og tidligere testresultater beholdes. Eksisterende notater om Select og reset skal ikke merkes nettlesertestet på 0.45.0 uten en ny prøve.
  **Kilder:** npm-oppslag og byte-/manifestdiff av publiserte pakker.

- [x] **Oppdater versjonsdekning.** Legg inn separate FEATURES-rader for checkbox-hjelpetekst (0.44.0), radio-hjelpetekst (0.44.0) og tekstområde med entrypoint (0.45.0), med konkrete kildereferanser. Opprett `versions/v0.43.x.md` og `versions/v0.44.x.md`. Bevar Select-patchgrensene før 0.43.2 og i 0.43.2/0.43.3 i deltaen for 0.43. Nye manglende features styres gjennom FEATURES, uten backfylling av eldre deltaer.
  **Filer:** `versions/FEATURES.md`, de to nye deltafilene og `versions/INDEX.md`.
  **Kilder:** manifester og tarball-diff for begge hopp, taggenes changelog og eksisterende kildebelagte Select-patchnotater.

- [x] **Roter støttevinduet til 0.36–0.45.** Sett 0.45 som latest, 0.36–0.44 som supported og grensen til `< 0.36`. Fjern bare indeksradene for 0.34/0.35; behold deltafilene på disk.
  **Filer:** `versions/INDEX.md`. Presiser i `evals/evals.json`, scenario 2, at 0.34 nå er utenfor støttevinduet og at deltaen er historisk oppslag.
  **Kilder:** eksisterende policy «latest + 9 tidligere minor», ny publisert minor og versjonsguidens ruting for historiske versjoner.

## Vedlikehold og verifisering

- [x] Arkiver 0.44.0 og 0.45.0 under `maintenance/designsystem/sources/`; oppdater `maintenance/designsystem/.oppdater-state.json` til 0.45.0 til slutt. Behold eksisterende kildearkiver.
- [x] Øk `plugins/designsystem/.claude-plugin/plugin.json` fra **1.0.0 til 1.1.0**, siden oppdateringen gir ny komponentdekning. Kilde: versjonsreglene i `docs/plugins.md`.
- [x] Kjør `contract-check.mjs --online`, inkludert versjonskonsistens, lenker, komponenttabell, ikoner og speilkontroll; kjør `git diff --check` og relevante plugin-/repo-valideringer.
- [x] Gjennomgå alle eksisterende svar-evals. Kontroller også at råd om hjelpetekst avgrenses til 0.44+, og tekstområde til 0.45+.
- [x] Prøv tekstområdets programmatisk verdi, brukerinput, events, reset etter endret `value`-attributt, readonly/disabled og Enter i en nettleser mot den publiserte pakken. Prøv checkbox/radio med og uten label når hjelpetekst brukes. Rapporter eksplisitt dersom nettleserprøvene ikke kan kjøres; kildeanalyse skal ikke omtales som kjørt test.
- [x] Kontroller slutt-diffen for tap av eksisterende innhold og feilaktig endring av historiske versjonsreferanser. Ingen endringer i vedlikeholds-skillene er planlagt.

## Domene-dekning og vurderingspunkter

| Domene | Resultat / planlagt handling |
|---|---|
| Installasjon og imports | Eksisterende exports og importmønstre beholdes. `./fhi-text-area` er eneste nye export og har JS, `.d.ts` og manifest. Samle-entrypointet `index.js` importerer også tekstområdet. |
| Theme og tokens | `theme/default.css` er byte-identisk i alle tre pakker. Paletter, stopp-skala, semantisk mapping, typografi og øvrige tokens samsvarer med referansen; bare latest-versjonen oppdateres. |
| Komponent-API | De eneste substansielle manifestendringene er hjelpetekst på to komponenter og nytt tekstområde. Oppdateringene over dekker disse. |
| Ikoner | Alle 104 ikon-entrypoints beholdes. Ingen nye eller fjernede ikoner. |
| Skjemabruk | Utvid med tekstområdet. Reset-koden for checkbox/radio og Select-kilden er ellers uendret; eksisterende begrensninger skal bevares. |
| React, Angular, Blazor | Get-started-dokumentasjonen og avhengighetskravene er uendret, inkludert `lit ~3.2.0`. Ingen nye oppsettkrav. Ikke legg til uprøvde rammeverksspesifikke bindingsoppskrifter. |
| Versjoner | Ny baseline, to nye deltaer, tre FEATURES-rader og korrekt rotasjon til ti minor-versjoner. |

**Kildearkiv og informasjonstap:** Forrige kildearkiv for 0.43.5 samsvarer byte-for-byte med de tilsvarende publiserte artefaktene, og fillisten stemmer. Ingen filer er fjernet i noen av de to versjonshoppene. Bare de fire `fhi-text-area`-artefaktene er lagt til i filisten.

**Upstreams agent-skill:** `ai-tooling/SKILL.md` er byte-identisk gjennom begge hopp. Råd om manifester, tokens, docs-lenker og å unngå unødvendige default-attributter er allerede dekket lokalt. Upstream lenker til `main`; den lokale regelen om publisert tag beholdes for versjonsriktige råd. Ingen nye vurderingspunkter som krever innholdsendring.

**Eksterne ressurser:** Oversikt og token-/rammeverksdokumentasjon er uendret. Eksisterende Figma- og fontprofilreferanser beholdes. Teams, gamle Angular-docs og verktøyet for beregning av fontskala gir ingen nye råd for denne oppdateringen.

## Gjennomført verifisering

- `contract-check.mjs --online`: 8 OK, 0 advarsler, 0 feil. Omfatter 23 komponenter, 104 ikoner, ti minor-versjoner, lenker og identiske vedlikeholds-skills.
- `validate_plugins.py claude` og `validate_plugins.py codex`: begge bestod. Versjonskontrollen godtar designsystem 1.0.0 → 1.1.0; Skybert er uendret.
- Publiserte tarballs for 0.44.0 og 0.45.0: SHA-512 stemmer med npm-integritet. Arkiverte artefakter er byte-identiske med de undersøkte pakkene; fillistene stemmer.
- Chromium mot publisert 0.45.0: programmatisk Text Area-verdi oppdaterer både felt og FormData uten events; brukerredigering sender `input` og `change` med riktig verdi, bubbling og composed. Reset følger gjeldende attributt og bruker tom streng uten attributt. Readonly sendes med, disabled utelates og inkluderes igjen når deaktivert tilstand fjernes. Enter lager linjeskift uten submit.
- Chromium: checkbox/radio viser hjelpetekst med label uten feillogg. Fjernes label, logges den forventede feilen mens hjelpeteksten fortsatt vises.
- Nettleserprøvene ble kjørt fra midlertidig mappe, ikke lagt til som repo-tester. Safari/WebKit og rammeverksintegrasjoner er ikke kjørt.
- Slutt-diff og stale-søk: historiske deltafiler og tidligere testversjoner beholdt. Ingen endring i vedlikeholds-skillene. `git diff --check` bestod.

## Svar-evals – manuell gjennomgang

Skillens versjonsruting og relevante referanser er fulgt for hvert spørsmål. Dette er en manuell gjennomgang, ikke en separat modellkjøring.

| Scenario | Svar kontrollert mot fasit | Resultat |
|---|---|---|
| 1: Ikon i tekstfelt, latest | Bruk `start`/`end`, importer felt og ikon; ikonet er visuelt, uten pointer-events. Latest krever ikke delta-oppslag. | OK |
| 2: Ikon i tekstfelt, 0.34 | Slottene finnes først fra 0.35. Bruk ekstern ikonplassering og anbefal oppgradering; 0.34 er utenfor støttevinduet og deltaen er historisk oppslag. | OK etter godkjent fasitjustering |
| 3: Feiltekst-token | `var(--fhi-color-danger-text-default)`, semantisk token fremfor hex eller primitiv palett. | OK |
| 4: Manglende styling | Importer `@folkehelseinstituttet/designsystem/theme/default.css` før bruk. | OK |
| 5: Blazor | Følg Blazor-referansen: kopier pakkefiler inkludert font, last CSS og velg samlet eller individuell komponentimport; bruk focusin/focusout. | OK |
| 6: Modal i 0.28 | Utenfor støttevinduet; modal finnes først fra 0.29. Gi best effort med native dialog og anbefal oppgradering. | OK |
| 7: Bordered tag i 0.39 | Ikke tilgjengelig før 0.40. Svar med versjonstilpasset råd og migreringsnotat. | OK |
| Nye versjonsgrenser | Checkbox-/radio-hjelpetekst krever 0.44+, Text Area krever 0.45+. FEATURES og deltaer gir riktig skille. | OK |

Trigger-evals er ikke nødvendige: frontmatter-beskrivelsen er uendret.
