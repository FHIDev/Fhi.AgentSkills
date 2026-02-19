# fhi-display

Display-tekst (stor, fremtredende typografi). `level` styrer semantisk nivå, `size` styrer visuell størrelse.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-display';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `level` | `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | (påkrevd) | Semantisk overskriftsnivå |
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Visuell størrelse |
| `color` | `color` | `string` | arvet | CSS-farge (bruk design tokens) |

## Eksempler

```html
<fhi-display level="1" size="large">Stor display-tekst</fhi-display>
<fhi-display level="2" size="medium">Medium display-tekst</fhi-display>
<fhi-display level="3" size="small" color="var(--fhi-color-accent-text-default)">
  Liten display-tekst
</fhi-display>
```
