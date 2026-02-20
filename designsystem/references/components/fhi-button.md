# fhi-button

Knapp med farger, varianter og størrelser. Form-assosiert — default `type="submit"`.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-button';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `color` | `color` | `'accent' \| 'neutral' \| 'danger'` | `'accent'` | Fargepalett |
| `variant` | `variant` | `'strong' \| 'subtle' \| 'outlined' \| 'text'` | `'strong'` | Visuell stil |
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | Størrelse |
| `disabled` | `disabled` | `boolean` | `false` | Deaktiverer knappen |
| `iconOnly` | `icon-only` | `boolean` | `false` | **Deprecated siden v0.31.0** — Knappen detekterer automatisk om den kun inneholder et ikon. Vil fjernes i en fremtidig versjon. |
| `type` | `type` | `'button' \| 'submit' \| 'reset'` | `'submit'` | HTML button-type; styrer form-oppførsel |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `click` | Utløses ved klikk eller tastatur (Enter/Space) |

## Slot

Default slot — tekst, ikon, eller tekst + ikon. Ikoner auto-dimensjoneres.

### Nødvendige importer for eksemplene

```typescript
// Ikoner brukt i eksemplene under:
import '@folkehelseinstituttet/designsystem/fhi-icon-plus';
import '@folkehelseinstituttet/designsystem/fhi-icon-search';
```

## Eksempler

```html
<fhi-button>Lagre</fhi-button>
<fhi-button color="neutral" variant="outlined" size="large">Avbryt</fhi-button>
<fhi-button color="danger" variant="subtle">Slett</fhi-button>
<fhi-button variant="text">Les mer</fhi-button>

<!-- Med ikon -->
<fhi-button><fhi-icon-plus></fhi-icon-plus> Legg til</fhi-button>

<!-- Kun ikon (icon-only oppdages automatisk) -->
<fhi-button variant="subtle" color="neutral">
  <fhi-icon-search></fhi-icon-search>
</fhi-button>

<!-- Form-knapper -->
<form>
  <fhi-button type="submit">Send inn</fhi-button>
  <fhi-button type="reset" variant="text">Nullstill</fhi-button>
  <fhi-button type="button">Egendefinert</fhi-button>
</form>
```
