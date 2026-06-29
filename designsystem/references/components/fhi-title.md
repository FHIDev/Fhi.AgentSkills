# fhi-title

Tittel-tekst. `level` styrer semantisk nivå, `size` styrer visuell størrelse.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-title';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `level` | `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | (påkrevd) | Semantisk overskriftsnivå |
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Visuell størrelse |
| `color` | `color` | `string` | `currentcolor` | CSS-farge (bruk design tokens). Default `currentcolor` arver tekstfarge fra forelder (endret i v0.39.0; CSS-keyword er case-insensitivt) |

## Eksempler

```html
<fhi-title level="1" size="large">Stor tittel</fhi-title>
<fhi-title level="2" size="medium">Medium tittel</fhi-title>
<fhi-title level="3" size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten tittel
</fhi-title>
```
