# fhi-headline

Overskrift (h1-h6). `level` styrer semantisk nivå, `size` styrer visuell størrelse.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-headline';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `level` | `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | (påkrevd) | Semantisk overskriftsnivå |
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Visuell størrelse |
| `color` | `color` | `string` | `currentcolor` | CSS-farge (bruk design tokens). Default `currentcolor` arver tekstfarge fra forelder (endret i v0.39.0; CSS-keyword er case-insensitivt) |

## Eksempler

```html
<fhi-headline level="1" size="large">Sidetittel</fhi-headline>
<fhi-headline level="2" size="medium">Seksjonstittel</fhi-headline>
<fhi-headline level="3" size="small" color="var(--fhi-color-accent-text-default)">
  Undertittel
</fhi-headline>
```
