# Endringsplan – Designsystem-skill

Versjon analysert: v0.43.5 (fra lokal v0.41.2; også kontrollert høyeste patch v0.41.3 og mellomliggende minor v0.42.2)
Dato: 2026-09-08
Status: Implementert og verifisert 2026-09-08. Ingen commit, push eller publisering er utført.

## Kildegrunnlag

- npm-registeret oppgir `0.43.5` som siste publiserte versjon av `@folkehelseinstituttet/designsystem`.
- Git-tag `v0.43.5`: `6ac015de35a28bb545cb772af3e78e18f5754d82`.
- Publiserte tarballs for `0.41.2`, `0.42.2` og `0.43.5`: sammenlignet filister, exports, komponentmanifester, `web-types.json`, avhengigheter og theme-tokens. `0.43.2` er i tillegg undersøkt for Select-oppførsel.
- Ved etterprøving av vurderingen er også pakkene `0.41.3`, `0.42.0`, `0.42.1`, `0.43.0` og `0.43.3` undersøkt. `0.41.3` har samme komponentmanifest, theme, agent-skill og package-felt bortsett fra versjon som `0.41.2`. Tooltip-bundelen endrer både CSS og medfølgende Floating UI-kode; endringen er ikke begrenset til en avhengighetsversjon. Deltaen for `0.41.x` skal inkludere denne patchen.
- TypeScript, komponentdokumentasjon, rammeverksguider og token-dokumentasjon er lest fra git-taggene. Alle eksisterende markdown-filer i den lokale skillen utenom kildearkivene er gjennomgått.
- Upstream-stier nedenfor er relative til `packages/fhi-designsystem/` i [taggen v0.43.5](https://github.com/FHIDev/Fhi.Designsystem/tree/v0.43.5/packages/fhi-designsystem), med mindre annen versjon er oppgitt.

## Mangler

- [x] **Dokumenter `fhi-callout`, innført i 0.42.0.** Ta med import, `heading`, fargene `neutral/success/warning/danger`, variantene `subtle/bordered`, default-slot og `icon`-slot. Ugyldige farger og varianter normaliseres til `neutral` og `subtle`; `accent` og `info` er ikke støttet. Den valgfrie tittelen rendres med fast overskriftsnivå 2. Vis et kort eksempel og råd om at budskapet må forstås uten ikon og farge.
  **Filer:** `designsystem/references/components/fhi-callout.md` (ny), komponenttabellen i `designsystem/SKILL.md`.
  **Kilder:** publisert `fhi-callout.manifest.json` og `package.json`; `src/components/fhi-callout/fhi-callout.component.ts`, `fhi-callout.docs.mdx`; `CHANGELOG.md`.

- [x] **Dokumenter `fhi-link`, innført i 0.43.0.** Ta med import, `href`, `target`, tekstslot og beskrivende lenketekst. Faktisk property-default for `target` er `undefined`; komponenten setter automatisk intern `rel="noopener noreferrer"` når `target` er satt og forskjellig fra `_self`. `rel` er en beregnet getter, ikke et konfigurerbart attributt. Beskriv også den verifiserte CSS-tilpasningen `--fhi-link-color`: en ekstern overstyring påvirker både normal- og hover-fargen. Skill denne komponentvariabelen fra globale theme-tokens, og ikke fremstill den som en dokumentert stabil stylingkontrakt.
  **Filer:** `designsystem/references/components/fhi-link.md` (ny), komponenttabellen i `designsystem/SKILL.md`.
  **Kilder:** publisert `fhi-link.manifest.json` og `package.json`; `src/components/fhi-link/fhi-link.component.ts`, `fhi-link.docs.mdx`; `CHANGELOG.md`.

- [x] **Dokumenter egendefinert modalbredde fra 0.42.2.** Vis at `--fhi-modal-dialog-width` satt på vertselementet overstyrer bredden fra `size`. Dokumenter migrering fra faktiske eldre CSS-overstyringer: `--dimension-dialog-width-small/medium` og øvrige fjernede `--dimension-dialog-*` har ikke lenger effekt fra 0.42.2. Bredden kan flyttes til den nye variabelen; øvrige gamle overstyringer har ikke nødvendigvis en direkte erstatning. Dette er verifisert atferd i publisert CSS, ikke en stabil API-garanti utledet av `--fhi-`-prefikset. Variabelen er ikke beskrevet i komponentens MDX eller `cssProperties` i manifestet.
  **Filer:** `designsystem/references/components/fhi-modal-dialog.md`, `designsystem/versions/FEATURES.md`, nye `designsystem/versions/v0.41.x.md` og `v0.42.x.md` (inkludert patch-grensen 0.42.1 → 0.42.2).
  **Kilder:** publisert `fhi-modal-dialog.js`; diff av `src/components/fhi-modal-dialog/fhi-modal-dialog.component.ts` mellom `v0.42.1` og `v0.42.2`; nettleserprøvene nedenfor.

- [x] **Dokumenter modalens relevante versjonsforskjell.** `show()` etterfulgt av `close()` gjenoppretter sidens scrolling fra 0.42.1. Eldre versjoner kan etterlate `body.style.overflow='hidden'`. Behold Safari-workarounden; problemet er fortsatt dokumentert upstream. Legg inn et kort bruksråd om avgrenset innhold og å unngå stablede dialoger.
  **Filer:** `designsystem/references/components/fhi-modal-dialog.md`, nye `designsystem/versions/v0.41.x.md` og `v0.42.x.md`, `designsystem/versions/FEATURES.md`.
  **Kilder:** `src/components/fhi-modal-dialog/fhi-modal-dialog.component.ts`, `fhi-modal-dialog.docs.mdx`, `CHANGELOG.md`; nettleserprøvene nedenfor.

- [x] **Ta inn manglende råd om tokens og typografi.** Dokumenter sammenhengen mellom tekst- og bakgrunnsfarger, begrensningen ved `border-subtle` som eneste avgrensning, og at feil må formidles med mer enn farge. Ta inn upstreams råd om å bruke typografikomponenter først, unngå å overskrive designsystemets tokens og konsultere FHIs visuelle profil ved fontvalg for allment åpne løsninger. Beskriv sistnevnte som upstreams bruksråd, ikke som en lisensbegrensning. Legg til den manglende fontstørrelsesskalaen `--fhi-font-size-1`–`14`.
  **Filer:** `designsystem/references/design-tokens.md`, en kort henvisning ved fontomtalen i `designsystem/SKILL.md`.
  **Kilder:** `src/storybook/design-tokens/design-tokens-colors.mdx`, `design-tokens-typography.mdx`, `introduction.mdx`; publisert `theme/default.css`.

## Feil / utdatert

- [x] **Presiser Select-verdier og dokumenter bekreftede begrensninger.** Ta med forhåndsvalg via `fhi-select value`, prioriteten til en ikke-tom select-verdi foran barnas `selected`, og trimming av tekst som brukes som fallback-verdi fra 0.43.2. Beskriv den nye observeringen av barnas `selected`-, `value`- og `label`-attributter fra 0.43.2: en `MutationObserver` utløser ny rendering. Observeringen omfatter disse attributtene, ikke vilkårlige tekstendringer. Beskriv at programmatisk endring av select-feltets egen `value` alene ikke oppdaterer `FormData`, og at dynamisk `selected` ikke overstyrer en eksisterende ikke-tom select-verdi. Når select-verdien er tom, kan derimot en observert `selected`-endring velge et annet alternativ. Dokumenter patch-avviket i 0.43.2: uten eksplisitt `label` vises alternativets kodeverdi; fra 0.43.3 brukes tekstinnholdet igjen. Ikke beskriv disse endringene utelukkende ut fra changelog-titlene.
  **Filer:** `designsystem/references/components/fhi-select.md`, `designsystem/references/form-usage.md`, nye `designsystem/versions/v0.41.x.md` og `v0.42.x.md`, `designsystem/versions/FEATURES.md`.
  **Kilder:** `src/components/select/fhi-select/fhi-select.component.ts` ved taggene `v0.41.2`, `v0.42.2`, `v0.43.2` og `v0.43.5`; `src/components/select/fhi-select.docs.mdx`; publisert runtime-JS og nettleserprøvene nedenfor.

- [x] **Rett påstanden om at form-reset alltid gjenoppretter opprinnelige verdier.** `fhi-checkbox.formResetCallback()` setter `checked=false`, også når boksen opprinnelig hadde `checked`. I en `fhi-radio`-gruppe uten forhåndsvalgt alternativ beholdes brukerens valg etter reset, også i `FormData`. Har gruppen et forhåndsvalg via `checked`-attributtet, gjenopprettes dette. Gi begge begrensningene ved form-reset og i komponentreferansene.
  **Filer:** `designsystem/references/form-usage.md`, `designsystem/references/components/fhi-checkbox.md`, `designsystem/references/components/fhi-radio.md`.
  **Kilder:** `formResetCallback()` i `src/components/fhi-checkbox/fhi-checkbox.component.ts`; `formResetCallback()`, `updated()` og `uncheckGroupMembers()` i `src/components/fhi-radio/fhi-radio.component.ts`, bekreftet med publiserte pakker i Chromium. Dette er eksisterende dokumentasjonsfeil, ikke ny oppførsel i 0.43.

- [x] **Rett to unøyaktigheter i token-beskrivelsen.** Alle ni primitive paletter har også stoppet `150`. `text-inverted` betyr kontrast mot rollens `base`-farger, ikke nødvendigvis lys tekst: `warning-text-inverted` peker på mørk `orange-900`. Presiser at rådet om semantiske fargetokens ikke utelukker designsystemets primitive spacing-tokens.
  **Filer:** `designsystem/references/design-tokens.md`, token-regelen i `designsystem/SKILL.md`.
  **Kilder:** publisert `theme/default.css`; `src/storybook/design-tokens/introduction.mdx` og `design-tokens-colors.mdx`.

## Versjonsinfrastruktur

- [x] **Oppdater versjonsgrunnlag og støttevindu.** Sett latest til `0.43.5`, opprett deltaer for `0.41.x` (til og med 0.41.3) og `0.42.x`, og registrer atferden med innføringsversjonene nedenfor i `FEATURES.md`. Støttevinduet blir `0.34.x`–`0.43.x`. Fjern radene for `0.32.x` og `0.33.x` fra indeksen og endre raden «Ikke støttet» fra `< 0.32` til `< 0.34`; behold historiske filer. Arkiver publiserte kildeartefakter for `0.42.2` og `0.43.5`, med state-filen til slutt på `0.43.5`. Oppdater latest-notater i hovedfil, token- og ikonreferanse.
  **Filer:** `designsystem/.oppdater-state.json`, `designsystem/SKILL.md`, `designsystem/versions/INDEX.md`, `FEATURES.md`, nye `v0.41.x.md` og `v0.42.x.md`, `versions/sources/v0.42.2/`, `versions/sources/v0.43.5/`, `references/design-tokens.md`, `references/icon-usage.md`.
  **Kilder:** npm-versjonssjekken, publiserte tarballs, git-tagger og skillens eksisterende støttepolicy.

Eksakte innføringsversjoner for `FEATURES.md` (én rad per atferd/feature; observermekanismen beskrives som årsak, ikke som et eget API):

| Feature / atferd | Innført | Konkret kilde |
|---|---|---|
| `fhi-callout` med entrypoint | 0.42.0 | Publisert `package.json`, `fhi-callout.manifest.json` og runtime-JS |
| Modalens `show()`/`close()` gjenoppretter scrolling | 0.42.1 | `fhi-modal-dialog.component.ts`, diff v0.42.0 → v0.42.1 |
| Overstyrbar modalbredde via `--fhi-modal-dialog-width` | 0.42.2 | Publisert `fhi-modal-dialog.js`, diff 0.42.1 → 0.42.2 |
| `fhi-link` med entrypoint | 0.43.0 | Publisert `package.json`, `fhi-link.manifest.json` og runtime-JS |
| Overstyrbar lenkefarge via `--fhi-link-color` | 0.43.0 | Publisert `fhi-link.js` |
| Select reagerer på endringer i barnas `selected`/`value`/`label` | 0.43.2 | `fhi-select.component.ts`, diff v0.43.1 → v0.43.2; publisert runtime-JS |
| Ikke-tom select-verdi prioriteres foran barnas `selected` | 0.43.2 | Samme diff og publisert `fhi-select.js` |
| Trimming av tekst brukt som fallback-verdi | 0.43.2 | Samme diff og publisert `fhi-select.js` |
| Select-label bruker igjen tekstinnhold som fallback etter regresjon i 0.43.2 | 0.43.3 | Publisert `fhi-select.js`, diff 0.43.2 → 0.43.3 |

CSS-radene skal merkes som verifiserte komponenttilpasninger uten dokumentert stabilitetsgaranti. Fjerning av eldre CSS-overstyringer beskrives i deltaenes migrerings-/patch-notater. Det er ingen nye globale theme-tokens.

## Forbedringer og vurderingspunkter

- [x] **Avklar avvik fra upstreams agent-skill.** `ai-tooling/SKILL.md` er byte-identisk mellom de tre hovedversjonene. Den anbefaler komponentmanifester, dokumentasjonslenker og å utelate unødvendige default-attributter. Ta inn en kort instruksjon om dokumentasjonslenker når relevante og om manifestoppslag ved mangler i lokale referanser. Behold lokal versjonsruting og kuraterte eksempler; upstreams lenke til `main` skal ikke erstatte verifisering mot installert versjon eller publisert tag.
  **Fil:** `designsystem/SKILL.md`.
  **Kilde:** publisert `ai-tooling/SKILL.md`, vurdert mot den lokale skillens versjonsregler.

## Kontroll av fjernet eller flyttet innhold

- De arkiverte kildetypene `package.json`, `custom-elements.json`, `web-types.json` og `ai-tooling/SKILL.md` finnes fortsatt i den nye pakken.
- Filene som forsvinner fra tarballene er hash-navngitte tooltip-bundler, erstattet av nye bundler. Det offentlige entrypointet `fhi-tooltip` består. Ingen migreringsinstruksjon trengs for denne interne endringen.
- Select-dokumentasjonen er omdøpt fra `select/docs.mdx` til `select/fhi-select.docs.mdx`. Innholdet er bevart og utvidet.
- Tre separate typografisider er samlet i `design-tokens-typography.mdx`. Fontfamilie, størrelsesskala og tekststiler består. Eksisterende lokale token-eksempler beholdes; manglende størrelsesskala legges til som beskrevet ovenfor.
- Modalens CSS-refaktorering i 0.42.2 endrer faktisk overstyrbar bredde og tas derfor inn som beskrevet ovenfor. Tooltipens CSS-refaktorering i 0.41.3 fjerner også tidligere vertselement-variabler, blant annet `--color-background` og `--dimension-padding`. Ta med et avgrenset migreringsnotat i `v0.41.x.md` for apper som brukte slike udokumenterte overstyringer; ikke presenter dette som fjerning av et lovet public API. Attributter, events og globale theme-tokens er uendret.
- Tooltipens bytte fra `section` til `div`, fokus-styling i checkbox/radio og modalens tittelfarge er gjennomgått; de krever ikke nye attributter eller importmønstre.

## Domene-dekning

| Domene | Resultat |
|---|---|
| Installasjon/imports | Eksisterende exports og avhengighetskrav er uendret. To nye komponent-entrypoints legges til. Ingen CSS-reset-endring. |
| Theme/tokens | Alle 300 globale theme-token-navn og verdier er uendret. Komponentenes CSS-tilpasninger for modalbredde og lenkefarge dokumenteres separat. Dokumentasjonsfeil og manglende bruksråd rettes. |
| Komponent-API | To nye komponenter; begrensninger og atferdsforskjeller i Select, checkbox-/radio-reset og modal dokumenteres. |
| Ikoner | Samme 104 ikon-entrypoints. Bare verifisert-versjon oppdateres. |
| Skjemabruk | FormData ved programmatisk Select-endring og checkbox-/radio-reset presiseres. |
| React/Angular/Blazor | Oppsett og eksisterende rammeverkskrav består. Theme- og fontfil ligger på samme stier. |
| Versjonsstøtte | Nye deltaer, feature-historikk, kildearkiv og latest + ni tidligere minor. |

## Utført verifisering

Publiserte pakker er prøvd i Chromium med de samme scenariene. Tabellen viser observerte resultater, ikke bare changelog-påstander.

| Scenario | 0.41.2 | 0.42.2 | 0.43.2 | 0.43.5 |
|---|---|---|---|---|
| Initial `select.value='b'`, alternativer a/b | a | a | b | b |
| Sett andre barns `selected=true` etter initialt valg a | Forblir a | Forblir a | Forblir a | Forblir a |
| Sett `select.value='b'` etter initialt valg a | Visning b, FormData a | Visning b, FormData a | Visning b, FormData a | Visning b, FormData a |
| Fallback fra tekst med innledende/etterfølgende mellomrom | Beholdes | Beholdes | Trimmes | Trimmes |
| Alternativer har `value` og tekst, men ikke `label` | Tomt option-label-attributt | Tomt option-label-attributt | Kodeverdi i option-label | Tekst i option-label |
| Reset av forhåndsavkrysset checkbox | Blir false | Blir false | Blir false | Blir false |
| Modal `show()`/`close()`, opprinnelig overflow auto | Etterlater hidden | Gjenoppretter auto | Gjenoppretter auto | Gjenoppretter auto |

Raden om dynamisk `selected` har samme resultat av ulike årsaker: før 0.43.2 observeres ikke barnas attributtendringer; fra 0.43.2 observeres endringen, men eksisterende ikke-tom select-verdi prioriteres. Resultatet skal ikke generaliseres til tom select-verdi.

Supplerende prøver etter vurderingen er kjørt mot `0.41.2`, `0.41.3`, `0.42.0`, `0.42.1`, `0.42.2`, `0.43.0`, `0.43.2`, `0.43.3` og `0.43.5`. Alle testforventninger bestod:

- Radio uten forhåndsvalg: velg b og kjør form-reset → b forblir valgt og sendes i `FormData` i alle prøvde versjoner. Med a forhåndsvalgt → reset gjenoppretter a.
- Endre andre Select-barns `label` og `value`: native option oppdateres fra 0.43.2; tidligere prøvde versjoner beholder gammel label/verdi.
- Select med tom verdi: sett `selected` på alternativ b → både valgt verdi og `FormData` blir b fra 0.43.2; tidligere prøvde versjoner forblir tomme.
- Sett `--fhi-modal-dialog-width: 32rem` i ekstern CSS: gir 512px fra 0.42.2, mens tidligere prøvde versjoner beholder standard 640px. Den gamle `--dimension-dialog-width-medium: 32rem` har motsatt effekt: virker til og med 0.42.1, ignoreres fra 0.42.2. Målt med nettleserens standard rotstørrelse 16px.
- Sett `--fhi-link-color` i ekstern CSS: overstyringen gjelder både normal- og hover-fargen i alle prøvde versjoner fra 0.43.0.

Prøvene dekker disse konkrete scenarioene i Chromium. Safari-problemet er dokumentasjonsverifisert, ikke reproduksjonstestet.

## Verifisering etter godkjenning og oppdatering

1. Kjør `contract-check.mjs` både offline og med `--online` for versjonskonsistens, lenker, støttevindu, komponenter, ikoner og speiling av vedlikeholds-skills.
2. Gjennomfør de syv eksisterende svar-evalene med versjonsruting; fasit endres bare hvis det nye kildegrunnlaget krever det.
3. Kontroller nye komponenteksempler mot manifester og TypeScript, og at Select-, radio-reset- og CSS-notatene samsvarer med prøvene over. Verifiser innføringsversjonene mot tabellen over.
4. Kontroller diff og stale latest-referanser. Behold korrekt eksisterende tekst og alle historiske delta-filer.
5. Kontroller manuelt at «Ikke støttet»-raden er `< 0.34` og samsvarer med eldste Supported-rad. Dagens `contract-check.mjs` validerer bare `Latest`/`Supported`-radene og fanger ikke denne grensen.

## Behandling av vurderingen

Alle seks hovedpunktene i `VURDERING-AV-UPDATE-DESIGNSYSTEM-PLAN.md` er tatt inn, med to korrigeringer etter egen verifisering:

- **Punkt 1:** enig i at overstyrbar modalbredde og lenkefarge må dekkes, men `--fhi-`-prefikset alene etablerer ikke en dokumentert stabil kontrakt. Planen skiller derfor faktisk verifisert CSS-atferd fra en API-garanti.
- **Punkt 5:** enig i å inkludere høyeste patch 0.41.3, men påstanden om at bare `@floating-ui/utils` endres er feil. Både git-taggen og publisert bundle viser tooltipens CSS-refaktorering og fjerning av eldre overstyringer.

Modalens scroll-notat er flyttet til «Mangler», og versjonsinfrastrukturen har fått egen seksjon. Ingen av de opprinnelige tiltakene er fjernet.

Brukeren godkjente implementering av planen. Ingen commit, push eller publisering inngår.

## Sluttkontroll etter implementering

- Alle ti tiltak er gjennomført. Baseline og state er `0.43.5`; støttevinduet er `0.34.x`–`0.43.x`.
- `contract-check.mjs`: 5 OK, 1 forventet advarsel om utelatt online-sjekk, 0 feil.
- `contract-check.mjs --online`: 8 OK, 0 advarsler, 0 feil. Kontrollerer blant annet 44 kuraterte markdown-filer, 22 komponent-entrypoints, 104 ikoner og identiske vedlikeholds-skills.
- `skill-creator/scripts/quick_validate.py designsystem`: bestått (`Skill is valid!`).
- Kildearkivenes `package.json`, `custom-elements.json`, `web-types.json` og `ai-tooling/SKILL.md` for `0.42.2` og `0.43.5` er byte-identiske med de publiserte pakkefilene.
- Nye Callout-/Link-eksempler er prøvd i Chromium: ikon-slot, overskriftsnivå, normalisering av ugyldige verdier og beregnet `rel` består. Modaleksempelets token-baserte bredde gir 512px som forventet.
- Nedre støttegrense `< 0.34` er kontrollert separat. Alle historiske deltafiler `0.28.x`–`0.40.x` er bevart og uendret.
- Diff og gamle latest-markører er gjennomgått; `git diff --check` gir ingen whitespace-feil. Historiske versjonsreferanser er beholdt.

De syv eksisterende svar-evalene er gjennomgått manuelt mot ruting og forventet svar, ikke kjørt som automatiserte modell-evalueringer. Ingen fasit er endret:

| Scenario | Ruting og kontrollert svar | Resultat |
|---|---|---|
| Latest: ikon i tekstfelt | Komponent-/ikonreferanse; separat ikonimport og `start`/`end`-slot | Bestått |
| 0.34.0: ikon i tekstfelt | Indeks, guide, features og 0.34-delta; ikon-slots krever 0.35+, foreslå ikon utenfor feltet eller oppgradering | Bestått |
| Feiltekst med semantisk farge | Tokenreferanse; `--fhi-color-danger-text-default`, ingen hardkodet rødfarge; avklar installert versjon ved behov | Bestått |
| Komponenter uten styling | Installasjonsinstruksjon; importer `theme/default.css` | Bestått |
| Blazor-oppsett | Rammeverksreferanse; publiserte filer under `wwwroot`, theme/font-stier og én modulimportstrategi | Bestått |
| 0.28: modal-dialog | Ikke støttet, historisk delta som best effort; modal krever 0.29+, anbefal oppgradering | Bestått |
| ^0.39.0: bordered tag | Matcher 0.39.x; delta viser at `bordered` krever 0.40, skill mellom installert versjon og latest | Bestått |

Begrensning: nettleserprøvene dekker utvalgte scenarioer i Chromium, ikke en full nettleser-/rammeverksmatrise. Safari-workarounden er kildeverifisert, ikke reproduksjonstestet.
