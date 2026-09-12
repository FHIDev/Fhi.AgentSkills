# fhi-select

Nedtrekksliste for å velge ett alternativ fra en liste. Innført i v0.41.0. Form-assosiert.

Komponentgruppen består av to elementer som brukes sammen:

- `fhi-select` — selve select-feltet
- `fhi-select-item` — ett alternativ i listen

```typescript
import '@folkehelseinstituttet/designsystem/fhi-select';
import '@folkehelseinstituttet/designsystem/fhi-select-item';
```

> Importer **begge** entrypoints — `fhi-select` registrerer ikke `fhi-select-item` automatisk.

**Når brukes Select** (fra docs): når listen er større enn det som passer for `fhi-radio`, eller når det ikke er plass til en radiogruppe i konteksten.

## fhi-select

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string` | `''` | Label over feltet. Uten label: sett `aria-label` eller `aria-labelledby` på `fhi-select` (f.eks. i tabeller eller når select er del av en setning) |
| `name` | `name` | `string` | `''` | Form-nøkkel for FormData |
| `value` | `value` | `string` | `''` | Valgt verdi. Ikke-tom verdi prioriteres foran barnas `selected` fra v0.43.2; se verdisemantikk og FormData-begrensning nedenfor |
| `helpText` | `help-text` | `string \| undefined` | `undefined` | Hjelpetekst mellom label og felt |
| `message` | `message` | `string \| undefined` | `undefined` | Melding under feltet (f.eks. valideringsmelding) |
| `status` | `status` | `'error' \| undefined` | `undefined` | Feilstatus — farger label, felt og melding rødt |
| `disabled` | `disabled` | `boolean` | `false` | Deaktivert — kan ikke endres/fokuseres, ekskluderes fra FormData |

Det finnes **ikke** noe `placeholder`-attributt.

### Metoder

| Metode | Beskrivelse |
|--------|-------------|
| `formResetCallback()` | Kalles automatisk ved form reset — tilbakestiller til opprinnelig valgt alternativ (eller `''`) |

### Events

| Event | Beskrivelse |
|-------|-------------|
| `input` | Utløses når valgt alternativ endres |
| `change` | Utløses når valgt alternativ endres |

### Slot

Default slot — `fhi-select-item`-elementer. Andre elementer ignoreres.

## fhi-select-item

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string \| null` | `null` | Verdi sendt ved submit. Uten `value` brukes trimmet tekstinnhold (trimming fra v0.43.2) |
| `label` | `label` | `string \| null` | `null` | Visningstekst i listen. Med `label` vises denne i stedet for tekstinnholdet |
| `selected` | `selected` | `boolean` | `false` | Forhåndsvalgt alternativ |

Slot: tekstinnhold for alternativet.

## Verdisemantikk

- Ved initialisering og brukerens valg sendes `value` fra valgt `fhi-select-item`; hvis `value` ikke er satt, brukes tekstinnholdet med innledende og etterfølgende mellomrom fjernet fra v0.43.2. Eksplisitt `value` trimmes ikke.
- Fra v0.43.2 prioriteres en ikke-tom `value` på `fhi-select` foran barnas `selected`. Uten en slik verdi brukes barnas `selected`; dersom ingen er markert, velges det **første** alternativet automatisk (native select-oppførsel).
- Komponenten rendrer en native `<select>` i shadow DOM; `fhi-select-item`-elementene er skjult og mappes til `<option>`-elementer.

### Dynamiske endringer (fra v0.43.2)

Komponenten observerer barnas `selected`-, `value`- og `label`-attributter med
`MutationObserver` og rendrer alternativene på nytt ved endring. Observeringen
omfatter disse attributtene, ikke vilkårlige endringer i tekstinnhold.

En eksisterende ikke-tom select-verdi vinner fortsatt foran barnas `selected`.
Å sette `selected` på et annet barn bytter derfor ikke nødvendigvis valg.
Er select-verdien tom, kan endringen derimot velge et nytt alternativ.

### Patch-avvik

- Før v0.43.2 kan en initial `value` på `fhi-select` bli overskrevet av første
  alternativ, og barnas attributtendringer observeres ikke.
- I **v0.43.2** brukes alternativets kodeverdi som visningstekst når `label`
  mangler. Fra **v0.43.3** brukes tekstinnholdet igjen. En eksplisitt `label`
  unngår dette patch-avviket.

## Kjente begrensninger

- **Programmatisk `value` og FormData (verifisert i v0.43.5):** Etter initialt
  valg `a` kan `select.value = 'b'` vise `b`, mens `new FormData(form)` fortsatt
  inneholder `a`. `value`-endringen alene oppdaterer ikke ElementInternals sin
  skjemaverdi. Ikke anta at visning og FormData er synkronisert etter en slik
  endring; kontroller verdien som faktisk sendes. Samme begrensning er bekreftet
  i v0.41.2, v0.42.2 og v0.43.2.
- `letter-spacing` fra designet er ikke implementert ennå pga. manglende nettleserstøtte (fra docs).

## Eksempler

```html
<!-- Forhåndsvalg via select-verdi (fra v0.43.2; bruk v0.43.3+ for riktig tekst uten label) -->
<fhi-select label="Format" name="format" value="csv">
  <fhi-select-item value="json">JSON</fhi-select-item>
  <fhi-select-item value="csv">CSV</fhi-select-item>
</fhi-select>

<fhi-select label="Fylke" name="county" help-text="Velg fylket du bor i">
  <fhi-select-item value="03">Oslo</fhi-select-item>
  <fhi-select-item value="50" selected>Trøndelag</fhi-select-item>
  <fhi-select-item value="11">Rogaland</fhi-select-item>
</fhi-select>

<!-- Uten value: tekstinnholdet brukes som verdi -->
<fhi-select label="Frukt" name="fruit">
  <fhi-select-item>Eple</fhi-select-item>
  <fhi-select-item>Banan</fhi-select-item>
</fhi-select>

<!-- Feilvisning -->
<fhi-select label="Land" name="country" status="error" message="Du må velge et land">
  <fhi-select-item value="no">Norge</fhi-select-item>
  <fhi-select-item value="se">Sverige</fhi-select-item>
</fhi-select>

<!-- Uten synlig label (f.eks. i tabell): bruk aria-label -->
<fhi-select aria-label="Rader per side" name="pageSize">
  <fhi-select-item>10</fhi-select-item>
  <fhi-select-item>25</fhi-select-item>
</fhi-select>

<script>
  document.querySelector('fhi-select')
    .addEventListener('change', e => console.log(e.target.value));
</script>
```
