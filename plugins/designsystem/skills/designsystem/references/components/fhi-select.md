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
| `value` | `value` | `string` | `''` | Valgt verdi. Settes automatisk til valgt/første option etter rendering |
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
| `value` | `value` | `string \| null` | `null` | Verdi sendt ved submit. Uten `value` brukes tekstinnholdet |
| `label` | `label` | `string \| null` | `null` | Visningstekst i listen. Med `label` vises denne i stedet for tekstinnholdet |
| `selected` | `selected` | `boolean` | `false` | Forhåndsvalgt alternativ |

Slot: tekstinnhold for alternativet.

## Verdisemantikk

- Verdien som sendes ved submit er `value`-attributtet på valgt `fhi-select-item`; hvis `value` ikke er satt, brukes tekstinnholdet.
- Hvis ingen `fhi-select-item` har `selected`, velges det **første** alternativet automatisk (native select-oppførsel).
- Komponenten rendrer en native `<select>` i shadow DOM; `fhi-select-item`-elementene er skjult og mappes til `<option>`-elementer.

## Kjente begrensninger

- `letter-spacing` fra designet er ikke implementert ennå pga. manglende nettleserstøtte (fra docs).

## Eksempler

```html
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
