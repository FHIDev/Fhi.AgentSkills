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

## Slots

| Slot | Beskrivelse |
|------|-------------|
| Default | Tekstinnholdet i taggen |
| `icon` | Valgfritt ikon, plasseres foran teksten (fra v0.45.2) |

Et `fhi-icon-*`-element i `icon`-slotten får automatisk `size="1rem"` og `margin-inline-end: var(--fhi-spacing-050)`.

**Deprecated (fra v0.45.2):** Et `fhi-icon-*`-element som første innhold i default slot fungerer fortsatt
(får samme styling), men gir `console.warn` og vil ikke støttes i en fremtidig release. Bruk `slot="icon"`.

**Før v0.45.2:** `icon`-slotten finnes ikke. Legg ikonet først i default slot. Et element med `slot="icon"`
blir der ikke tildelt noen slot og vises ikke.

`text-wrap: nowrap` (v0.38.5–v0.45.1) er fjernet i v0.45.2.

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

<!-- Med ikon (v0.45.2+) -->
<fhi-tag color="success">
  <fhi-icon-check slot="icon"></fhi-icon-check>
  Fullført
</fhi-tag>
```
