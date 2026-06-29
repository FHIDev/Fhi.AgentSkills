# fhi-label

Label-tekst (kort, beskrivende tekst — f.eks. for skjemafelt eller kategorier).

```typescript
import '@folkehelseinstituttet/designsystem/fhi-label';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Skriftstørrelse |
| `color` | `color` | `string` | `currentcolor` | CSS-farge (bruk design tokens). Default `currentcolor` arver tekstfarge fra forelder (endret i v0.39.0; CSS-keyword er case-insensitivt) |

## Eksempler

```html
<fhi-label>Standard label</fhi-label>
<fhi-label size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten label
</fhi-label>
```
