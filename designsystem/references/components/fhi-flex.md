# fhi-flex

Flexbox layout-container.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-flex';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `direction` | `direction` | `'row' \| 'column'` | `'row'` | Hovedakse |
| `gap` | `gap` | `'small' \| 'medium' \| 'large' \| number \| string` | `'medium'` | Avstand mellom elementer |
| `wrap` | `wrap` | `boolean` | `false` | Tillat linjebryting |
| `justify` | `justify` | `'start' \| 'center' \| 'end'` | `'start'` | Justering langs hovedaksen |
| `align` | `align` | `'stretch' \| 'start' \| 'center' \| 'end' \| 'baseline'` | `'stretch'` | Justering langs kryssaksen |

## Eksempler

```html
<fhi-flex direction="row" gap="small" align="center">
  <fhi-button>Lagre</fhi-button>
  <fhi-button variant="outlined" color="neutral">Avbryt</fhi-button>
</fhi-flex>

<fhi-flex direction="column" gap="medium">
  <fhi-text-input label="Fornavn" name="firstName"></fhi-text-input>
  <fhi-text-input label="Etternavn" name="lastName"></fhi-text-input>
</fhi-flex>
```
