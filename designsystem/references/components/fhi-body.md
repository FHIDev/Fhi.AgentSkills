# fhi-body

Brødtekst (erstatter `<p>`).

```typescript
import '@folkehelseinstituttet/designsystem/fhi-body';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Skriftstørrelse |
| `color` | `color` | `string` | arvet | CSS-farge |

## Eksempler

```html
<fhi-body>Standard brødtekst.</fhi-body>
<fhi-body size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten tilleggstekst.
</fhi-body>
```
