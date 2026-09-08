# Vurdering av UPDATE-DESIGNSYSTEM-PLAN.md

Dato: 2026-09-08
Vurdert mot: `.claude/skills/oppdater-designsystem/` (SKILL.md + referansefiler),
gjeldende innhold i `designsystem/`, og publiserte npm-tarballs for
0.41.2, 0.41.3, 0.42.0, 0.42.1, 0.42.2, 0.43.0, 0.43.1, 0.43.2, 0.43.3 og 0.43.5.

## Konklusjon

Planen holder høy kvalitet. Alle faktapåstander jeg kunne kontrollere mot publiserte
pakker stemmer — inkludert de detaljerte påstandene om Select-normalisering, callouts
default-verdier og checkbox' `formResetCallback`. Jeg fant **ingen materielle feil**.

Det er seks hull. Punkt 1 og 2 endrer rådene skillen gir. Punkt 6 gir en stille
inkonsistens i `INDEX.md` som `contract-check.mjs` ikke fanger. Punkt 3–5 er
presiseringer. Ingenting i planen bør fjernes. Planen kan godkjennes med punktene i
«Mangler» lagt til.

## Verifisert korrekt

Alt nedenfor er kontrollert mot publiserte tarballs, ikke bare mot changelog.

| Planens påstand | Kontroll |
|---|---|
| 0.43.5 er siste publiserte versjon | `dist-tags.latest = 0.43.5` ✓ |
| `fhi-callout` innført i 0.42.0 | Entrypoint finnes fra 0.42.0, ikke i 0.41.2 ✓ |
| Callout: default `neutral`/`subtle`, normalisering av ugyldige verdier | `update()` har `switch` med fallback til `neutral`/`subtle` ✓ |
| Callout: gyldige farger `neutral/success/warning/danger`, `accent`/`info` ikke støttet | Bekreftet i `update()` og CSS ✓ |
| Callout: heading rendres som `<fhi-title level="2">` | Bekreftet i `render()` ✓ |
| `fhi-link` innført i 0.43.0 | Entrypoint finnes fra 0.43.0 ✓ |
| Link: `target` uten default (`undefined`) | Ingen initialisering i constructor ✓ |
| Link: `rel` er readonly getter som gir `noopener noreferrer` når `target` er satt og ≠ `_self` | `get rel(){return this.target && this.target!=="_self" ? "noopener noreferrer" : void 0}` ✓ |
| Alle ni primitive paletter har stopp `150` | blue, green, greybeige, greyblue, orange, purple, red, teal, yellow ✓ |
| `warning-text-inverted` peker på mørk `orange-900` | `--fhi-color-warning-text-inverted: var(--fhi-orange-900)` ✓ |
| Fontstørrelsesskalaen er `--fhi-font-size-1`–`14` | 14 tokens ✓ |
| «Alle 300 token-navn og verdier er uendret» | 300 tokens i alle tre versjoner; `theme/default.css` avviker kun i `@tokens`-kommentarer ✓ |
| `formResetCallback()` i checkbox setter alltid `checked=false` | `formResetCallback(){this.checked=!1,...}` — identisk i 0.41.2 og 0.43.5 ✓ |
| Feilen finnes faktisk i skillen | `references/form-usage.md:42`: «tilbakestiller alle feltene til opprinnelige verdier» ✓ |
| `fhi-text-input` og `fhi-select` gjenoppretter korrekt opprinnelig verdi | `this.value = this.getAttribute("value") \|\| ""` hhv. `this._initialSelectedElement?.value ?? ""` ✓ (`fhi-radio` er ikke like enkel — se Mangler #2) |
| Select: ikke-tom select-verdi prioriteres foran barnas `selected` | `?selected="${this.value ? t === this.value : e.selected}"` ✓ |
| Select: trimming av tekst brukt som fallback-verdi fra 0.43.2 | `textContent?.trim()` innført i 0.43.2 ✓ |
| Select: patch-avviket 0.43.2 → 0.43.3 for `label` | 0.43.2: `label="${e.label ?? t ?? ""}"` (kodeverdi); 0.43.3: `e.textContent?.trim()` ✓ |
| Modal gjenoppretter scroll fra 0.42.1 | `open ||= (this._triggerElement=..., this._bodyOverflowStyle=..., !0)` innført i 0.42.1 ✓ |
| Fokus-styling i checkbox/radio krever ingen API-endring | Diff 0.41.2→0.43.5 er ren CSS (`outline-color` under `:not(:focus-visible)`) ✓ |
| Tooltip-bundlene er hash-navngitte og entrypointet består | `fhi-tooltip.js` uendret bortsett fra bundle-hash ✓ |
| `ai-tooling/SKILL.md` er byte-identisk mellom versjonene | Samme MD5 i 0.41.2, 0.42.2 og 0.43.5 — også lik arkivet i `versions/sources/v0.41.2/` ✓ |
| Ingen entrypoints fjernet; 104 ikoner i begge versjoner | Diff av entrypoint-lister gir kun `fhi-callout` og `fhi-link` som tillegg ✓ |
| Avhengighetskrav uendret | `dependencies`, `peerDependencies` og `engines` identiske 0.41.2 vs 0.43.5 ✓ |
| Støttevinduet blir `0.34.x`–`0.43.x` | Latest + 9 minor = 0.43…0.34 ✓ |
| Planens stale-fil-liste er komplett | `grep` etter `0.41.2`/`2026-07-05` utenom `sources/` gir kun filer planen allerede lister; treffene i `versions/v0.40.x.md` er bevisst historiske og skal stå ✓ |

Jeg har også kontrollert planens antagelse om evals: ingen av de sju fasitene brytes av
oppdateringen. Eval 2 (0.34.0) og eval 7 (0.39.x) ligger fortsatt innenfor det nye
støttevinduet, og eval 6 (0.28.0) er fortsatt utenfor. Planens formulering
«fasit endres bare hvis det nye kildegrunnlaget krever det» holder.

## Mangler

### 1. `--fhi-modal-dialog-width` er en ny public kontrakt planen ikke fanger

Dette er det eneste hullet som endrer rådene skillen gir.

I 0.42.2 ble hele CSS-en i `fhi-modal-dialog` skrevet om. De interne
`--dimension-dialog-*`-variablene ble fjernet, og bredden ble flyttet til en ny,
`--fhi-`-prefikset custom property:

```css
:host { --fhi-modal-dialog-width: unset; }
dialog { width: var(--fhi-modal-dialog-width); }
:host([size='small'])  { --fhi-modal-dialog-width: 28rem; }
:host([size='medium']) { --fhi-modal-dialog-width: 40rem; }
```

Konsekvenser planen ikke dekker:

- Fra 0.42.2 kan modalbredden overstyres utenfra med `--fhi-modal-dialog-width`.
  Skillen dokumenterer i dag bare at `size` gir 28rem/40rem
  (`references/components/fhi-modal-dialog.md:18`). En agent som får spørsmålet
  «hvordan setter jeg egen bredde på modalen?» vil svare feil uten dette.
- De gamle `--dimension-dialog-*`-variablene lå på `:host` og var de facto
  overstyrbare. Eventuelle overstyringer slutter stille å virke fra 0.42.2. Dette
  hører hjemme i «Legacy-only»/«Migrering» i den nye `v0.41.x.md`.
- Steg 7a krever én FEATURES.md-rad per ny public feature. Raden mangler i planen.

Planen ser ut til å ha klassifisert dette under setningen «Interne token-refaktoreringer
… krever ingen endring av eksisterende API-råd». Det stemmer for de øvrige variablene,
men ikke for `--fhi-modal-dialog-width`, som er navngitt som public.

**Foreslått tillegg:** eget punkt under «Mangler».
Filer: `designsystem/references/components/fhi-modal-dialog.md`,
`designsystem/versions/FEATURES.md`, ny `designsystem/versions/v0.41.x.md`.
Kilde: CSS-en i publisert `fhi-modal-dialog.js`, diff 0.42.1 → 0.42.2.

Samme mønster gjelder `--fhi-link-color`, innført sammen med `fhi-link` i 0.43.0.
Den bør nevnes i `fhi-link`-punktet, som i dag bare lister `href`, `target` og `rel`.

Skillen dokumenterer i dag ingen komponent-nivå custom properties i det hele tatt
(`--fhi-flex-gap`, `--fhi-data-table-*`, `--fhi-checkbox-color`, `--fhi-radio-color`,
`--fhi-tag-border-color`, `--fhi-text-input-placeholder-color` mangler også).
Det er et eldre hull som ligger utenfor denne oppdateringens mandat — nevnes bare
som kontekst, ikke som noe som må ryddes nå.

### 2. `fhi-radio` har også et reset-avvik planen ikke fanger

Planen retter form-reset-påstanden i `references/form-usage.md:42` kun for checkbox.
Men `fhi-radio` har et beslektet avvik i ett konkret tilfelle:

```js
formResetCallback() {
  this._getRadioGroup()
    .filter(e => typeof e.getAttribute("checked") == "string")
    .pop() === this && (this.checked = !0), this._updateFormValue();
}
```

Callbacken setter `checked = true` på den radioen som *har* `checked`-attributtet.
Ingen radio settes til `false` her — gjensidig utelukkelse skjer indirekte, via
`updated()` som kaller `uncheckGroupMembers()` når noen settes til `true`.

Det gir to utfall:

- **Gruppe med forhåndsvalgt alternativ** (én radio har `checked`-attributt):
  reset gjenoppretter korrekt. Den attributt-merkede settes til `true`, og
  `uncheckGroupMembers()` nullstiller brukerens valg. Fungerer som forventet.
- **Gruppe uten forhåndsvalgt alternativ** (ingen har `checked`-attributt):
  ingen radio settes til `true`, og dermed nullstiller ingenting brukerens valg.
  Radioen brukeren krysset av forblir avkrysset etter reset. Native
  `<input type="radio">` nullstiller alle i dette tilfellet.

Dette er den vanligste oppstillingen i skjemaer — radiogruppe uten default. Påstanden
i `form-usage.md:42` er altså feil på to måter, ikke bare én, og planens formulering
«Gi denne konkrete begrensningen ved form-reset og i checkbox-referansen» blir for
snever.

**Foreslått tillegg:** utvid checkbox-punktet, eller eget punkt.
Filer: `designsystem/references/form-usage.md`,
`designsystem/references/components/fhi-radio.md`.
Kilde: `formResetCallback()`, `updated()` og `uncheckGroupMembers()` i publisert
`fhi-radio.js`. Kodeverifisert, ikke reprodusert i nettleser (se «Ikke verifisert»).

### 3. Planen oppgir ikke eksakte innføringsversjoner for FEATURES.md

Planen sier «registrer nye komponenter og Select-atferd med riktige
innføringsversjoner», men oppgir dem ikke. Tre av dem er innført i **patch**, ikke
minor, og er lette å bomme på. Verifiserte tall:

| Feature | Innført |
|---|---|
| `fhi-callout` + entrypoint | 0.42.0 |
| Modal: `show()`/`close()` gjenoppretter `body.style.overflow` | 0.42.1 |
| `--fhi-modal-dialog-width` (og fjerning av `--dimension-dialog-*`) | 0.42.2 |
| `fhi-link` + entrypoint + `--fhi-link-color` | 0.43.0 |
| Select: `MutationObserver` på `selected`/`value`/`label` | 0.43.2 |
| Select: `value` prioriteres foran barnas `selected` | 0.43.2 |
| Select: trimming av `textContent` som fallback-verdi | 0.43.2 |
| Select: `label` faller tilbake på tekstinnhold igjen (regresjon i 0.43.2) | 0.43.3 |

### 4. `MutationObserver` i Select er en ny mekanisme, ikke bare en konsekvens

Planen beskriver riktig at «dynamisk `selected` ikke overstyrer en eksisterende
select-verdi», men beskriver ikke at 0.43.2 innførte en `MutationObserver` som
observerer `selected`, `value` og `label` på slot-elementene og re-rendrer ved
endring. Det er ny public atferd: før 0.43.2 skjedde ingen re-render i det hele tatt
ved attributtendring på barna.

Dette gjør også prøvematrisen litt misvisende. Raden «Sett andre barns `selected=true`
etter initialt valg a» gir «Forblir a» i alle fire versjoner, men av to ulike grunner:
i 0.41.2/0.42.2 fordi ingenting observerer endringen, i 0.43.x fordi `this.value`
vinner. Verdt en fotnote, siden en agent ellers kan trekke feil slutning om hva som
skjer når `value` er tom.

### 5. `0.41.3` er utelatt fra kildegrunnlaget

Planen skriver «fra v0.41.2, via v0.42.2» og nevner aldri 0.41.3, som er høyeste
patch i 0.41.x. Delta-filens scope er per mal «Gjelder v{X.Y}.x (alle patcher)», og
steg 7c krever eksplisitt at høyeste patch per minor leses.

Min egen kontroll av 0.41.2 → 0.41.3 var ufullstendig. Jeg konkluderte at patchen
bare bumper `@floating-ui/utils` 0.2.11 → 0.2.12. Den fjerner i tillegg tooltipens
`:host`-variabler (`--color-background`, `--color-text`, `--dimension-padding` m.fl.)
til fordel for globale tokens direkte, slik at overstyringer av dem slutter å virke.
Implementasjonen fanget dette; det gjorde ikke jeg. Poenget står likevel: planen bør
si noe om 0.41.3, ikke være taus om versjonen.

### 6. Catch-all-raden i INDEX.md må også oppdateres

Planen sier «Fjern bare radene for `0.32.x` og `0.33.x` fra indeksen». Den siste raden
i `versions/INDEX.md` er i dag `| < 0.32 | Ikke støttet | ... |`. Fjernes 0.32 og 0.33
uten at denne raden endres til `< 0.34`, blir 0.32.x og 0.33.x hverken listet som
Supported eller dekket av catch-all-teksten.

`contract-check.mjs` fanger ikke dette — regexen på linje 79 matcher bare rader på
formen `X.Y.x` med status `Latest`/`Supported`, så catch-all-raden telles ikke og
valideres ikke.

## Feil

Jeg fant ingen materielle feil i planen. Alle kontrollerbare påstander stemmer.

## Noe som ikke burde være der

Nei. Ingen post i planen ligger utenfor skillens mandat, og ingen bør fjernes. Alle
poster er forankret i konkrete observasjoner fra kildene, slik `endringsplan.md` krever,
og ingen av dem er stilistisk omskriving forkledd som forbedring. Det nærmeste er
kategoriseringsnittene nedenfor — poster som står under feil overskrift, ikke poster som
ikke hører hjemme.

Planen holder seg også innenfor «Fjern støy»-regelen: den avviser eksplisitt å
dokumentere de hash-navngitte tooltip-bundlene og tooltipens `section`→`div`-bytte som
brukerrettede endringer. Begge avvisningene er riktige.

## Kategorisering og format

Dette er småting som ikke påvirker om planen er riktig, men avviker fra skillens mal.

- **Format:** `references/endringsplan.md` foreskriver én linje per post
  (`- [ ] {beskrivelse} — Fil: ... — Kilde: ...`). Planen bruker avsnitt med separate
  **Filer:**/**Kilder:**-linjer. Avviket er en forbedring — postene er sammensatte og
  ville ikke fått plass på én linje — men det er et bevisst avvik verdt å nevne.
- **Kategorisering:** to poster under «Feil / utdatert» er ikke egentlig feil:
  - «Oppdater versjonsgrunnlag og støttevindu» er rutinemessig versjonsinfrastruktur
    (steg 6–7), ikke noe som er galt i skillen i dag.
  - «Dokumenter modalens relevante versjonsforskjell» er en mangel, ikke en feil.
    Skillen påstår ikke noe galt om scroll-oppførsel i dag.
- **Seksjonsnavn:** planen bruker «Forbedringer og vurderingspunkter»; malen sier
  «Forbedringer». Uproblematisk.

## Ikke verifisert

- **Reset-oppførselen i `fhi-radio` (Mangler #2).** Kodeverifisert i publisert
  `fhi-radio.js`, ikke reprodusert i nettleser. Konklusjonen bygger på at
  `formResetCallback()` kun setter `checked = true` på den attributt-merkede radioen, og
  at `uncheckGroupMembers()` bare kalles når noen settes til `true`. Bør bekreftes med en
  faktisk reset-test før teksten skrives inn i skillen.
- **Chromium-prøvene i «Utført verifisering».** Jeg har ikke reprodusert dem. Jeg har
  verifisert at kildekoden i de publiserte bundlene er konsistent med hver rad i
  tabellen, men de faktiske `FormData`-observasjonene — særlig «Visning b, FormData a»
  ved programmatisk `value`-endring — er ikke kjørt på nytt her.
- **Safari-workarounden.** Planen sier selv at den er dokumentasjonsverifisert, ikke
  reproduksjonstestet. Jeg har heller ikke testet den.
- **Git-taggen `v0.43.5` = `6ac015de35a28bb545cb772af3e78e18f5754d82`.** Ikke kontrollert
  mot GitHub; all min verifisering er gjort mot publiserte npm-tarballs.
- **Innholdet i `.docs.mdx`-filene og Storybook-dokumentasjonen.** Ikke lest. Planens
  påstander om upstreams *bruksråd* (typografikomponenter først, ikke overskriv tokens,
  FHIs visuelle profil ved fontvalg, kontrast mellom tekst- og bakgrunnsfarger) er
  derfor ikke etterprøvd av meg. Alle påstander om *kode og atferd* er det.
