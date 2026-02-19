# fhi-tag

Status- eller kategorimerke. Ikke-interaktiv.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-tag';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `color` | `color` | `'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | Fargevariant |

## Slot

Default slot — tekst, eventuelt med et ledende ikon.

## Eksempler

```html
<fhi-tag>Standard</fhi-tag>
<fhi-tag color="success">Aktiv</fhi-tag>
<fhi-tag color="warning">Venter</fhi-tag>
<fhi-tag color="danger">Feilet</fhi-tag>
<fhi-tag color="info">Informasjon</fhi-tag>
<fhi-tag color="accent">Fremhevet</fhi-tag>

<!-- Med ikon -->
<fhi-tag color="success">
  <fhi-icon-check></fhi-icon-check>
  Fullført
</fhi-tag>
```
