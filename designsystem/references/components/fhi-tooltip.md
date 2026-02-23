# fhi-tooltip

Tooltip med auto-posisjonering (Floating UI). Vises ved hover/fokus eller klikk.

**Bruksregel:** Tooltip skal ikke brukes til kritisk informasjon brukeren er avhengig av. Bruk tooltip kun til supplerende, ikke-essensiell hjelp.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-tooltip';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `message` | `message` | `string` | `''` | Tooltip-teksten. Ingen tooltip vises om tom. |
| `placement` | `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` (+ `-start`/`-end`) | `'top'` | Foretrukket posisjon. Justerer seg automatisk. |
| `delay` | `delay` | `number` (ms) | `500` | Forsinkelse for visning |
| `trigger` | `trigger` | `'hover' \| 'click'` | `'hover'` | Utløsertype |
| `maxWidth` | `max-width` | `string` (CSS) | `'18.75rem'` | Maks bredde på tooltip-boblen |

## Slot

Default slot — elementet som tooltipet er knyttet til.

### Nødvendige importer for eksemplene

```typescript
// Komponenter og ikoner brukt i eksemplene under:
import '@folkehelseinstituttet/designsystem/fhi-button';
import '@folkehelseinstituttet/designsystem/fhi-icon-circle-info';
```

## Eksempler

```html
<fhi-tooltip message="Lagrer alle endringer">
  <fhi-button>Lagre</fhi-button>
</fhi-tooltip>

<fhi-tooltip message="Klikk for mer informasjon" trigger="click" placement="bottom">
  <fhi-icon-circle-info></fhi-icon-circle-info>
</fhi-tooltip>
```
