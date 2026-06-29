# fhi-data-table

Tabell for strukturert visning av data. Innført i v0.37.0.

Komponentgruppen består av tre elementer som alltid brukes sammen:

- `fhi-data-table` — tabell-container
- `fhi-data-table-row` — rad
- `fhi-data-table-cell` — celle

```typescript
import '@folkehelseinstituttet/designsystem/fhi-data-table';
import '@folkehelseinstituttet/designsystem/fhi-data-table-row';
import '@folkehelseinstituttet/designsystem/fhi-data-table-cell';
```

## Viktig: ikke native HTML-tabell

Komponentene bruker **ikke** native `<table>`/`<tr>`/`<td>`/`<th>`. De rendres med CSS
`display: table` / `table-row` / `table-cell` og setter ARIA-roller for å bevare semantikk:

| Element | Rolle |
|---------|-------|
| `fhi-data-table` | `role="table"` |
| `fhi-data-table-row` | `role="row"` |
| `fhi-data-table-cell` (body) | `role="cell"` |
| `fhi-data-table-cell` (header) | `role="columnheader"` |

For tilgjengelighet: sett alltid `caption` på tabellen (gir både synlig bildetekst og
`aria-label`), og marker overskriftsrader med `variant="header"`.

## fhi-data-table

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `caption` | `caption` | `string` | — | Tabelltekst. Settes som synlig caption og som `aria-label` på tabellen |
| `striped` | `striped` | `boolean` | `false` | Vekslende radfarger for bedre lesbarhet |

Slot: `fhi-data-table-row`-elementer.

## fhi-data-table-row

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `variant` | `variant` | `'header' \| 'body'` | `'body'` | Radtype. `header` setter automatisk `variant="header"` på alle child-celler |

Slot: `fhi-data-table-cell`-elementer.

## fhi-data-table-cell

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `variant` | `variant` | `'header' \| 'body'` | `'body'` | Celletype. Styres normalt av forelderraden — sett sjelden manuelt |

Slot: vilkårlig innhold (tekst, `fhi-tag`, `fhi-checkbox`, osv.).

## Eksempler

```html
<fhi-data-table caption="Ansatte" striped>
  <fhi-data-table-row variant="header">
    <fhi-data-table-cell>Navn</fhi-data-table-cell>
    <fhi-data-table-cell>Avdeling</fhi-data-table-cell>
    <fhi-data-table-cell>Status</fhi-data-table-cell>
  </fhi-data-table-row>
  <fhi-data-table-row>
    <fhi-data-table-cell>Rad 1</fhi-data-table-cell>
    <fhi-data-table-cell>Smittevern</fhi-data-table-cell>
    <fhi-data-table-cell><fhi-tag color="success">Aktiv</fhi-tag></fhi-data-table-cell>
  </fhi-data-table-row>
</fhi-data-table>
```

Cellene kan inneholde andre komponenter (krever egen import, f.eks. `fhi-tag`).
