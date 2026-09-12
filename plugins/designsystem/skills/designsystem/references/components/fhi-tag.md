# fhi-tag

Status- eller kategorimerke. Ikke-interaktiv.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-tag';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `color` | `color` | `'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | Fargevariant |
| `variant` | `variant` | `'subtle' \| 'bordered'` | `'subtle'` | Visuell stil. `bordered` gir synlig kantlinje (fra v0.40.0) |

## Slot

Default slot — tekst, eventuelt med et ledende ikon.

Taggen bryter ikke teksten over flere linjer (nowrap, fra v0.38.5). Det første
`fhi-icon-*`-elementet i slotten får automatisk `size="1rem"` og en liten negativ
venstremargin slik at ikonet justeres mot teksten.

### Nødvendige importer for eksemplene

```typescript
// Ikoner brukt i eksemplene under:
import '@folkehelseinstituttet/designsystem/fhi-icon-check';
```

## Eksempler

```html
<fhi-tag>Standard</fhi-tag>
<fhi-tag color="success">Aktiv</fhi-tag>
<fhi-tag color="warning">Venter</fhi-tag>
<fhi-tag color="danger">Feilet</fhi-tag>
<fhi-tag color="info">Informasjon</fhi-tag>
<fhi-tag color="accent">Fremhevet</fhi-tag>

<!-- Med kantlinje (v0.40.0+) -->
<fhi-tag variant="bordered" color="accent">Fremhevet</fhi-tag>

<!-- Med ikon -->
<fhi-tag color="success">
  <fhi-icon-check></fhi-icon-check>
  Fullført
</fhi-tag>
```
