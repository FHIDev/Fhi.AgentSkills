# fhi-grid

CSS Grid layout-container.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-grid';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `columns` | `columns` | `number` | `12` | Antall like `1fr`-kolonner |
| `gap` | `gap` | `'small' \| 'medium' \| 'large' \| number \| string` | `'medium'` | Avstand mellom celler |

## Eksempler

```html
<fhi-grid columns="3" gap="large">
  <div>Kolonne 1</div>
  <div>Kolonne 2</div>
  <div>Kolonne 3</div>
</fhi-grid>
```
