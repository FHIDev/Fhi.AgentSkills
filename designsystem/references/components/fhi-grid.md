# fhi-grid

CSS Grid layout-container.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-grid';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `columns` | `columns` | `number` | `12` | Antall like `1fr`-kolonner |
| `rows` | `rows` | `number` | `1` | Antall like `1fr`-rader. Setter `grid-template-rows: repeat(N, 1fr)`. |
| `gap` | `gap` | `'small' \| 'medium' \| 'large' \| number \| string` | `'medium'` | Avstand mellom celler |

## Eksempler

```html
<fhi-grid columns="3" gap="large">
  <div>Kolonne 1</div>
  <div>Kolonne 2</div>
  <div>Kolonne 3</div>
</fhi-grid>

<!-- Eksplisitte rader -->
<fhi-grid columns="2" rows="3" gap="medium">
  <div>Celle 1</div>
  <div>Celle 2</div>
  <div>Celle 3</div>
  <div>Celle 4</div>
  <div>Celle 5</div>
  <div>Celle 6</div>
</fhi-grid>
```
