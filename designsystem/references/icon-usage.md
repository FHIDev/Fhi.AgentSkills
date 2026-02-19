# Ikonbruk

Veiledning for å bruke ikoner fra FHI Designsystem. Alle ikoner er basert på [Lucide Icons](https://lucide.dev/icons/).

---

## Importere ikoner

Hvert ikon er en egen web component og importeres individuelt:

```typescript
import '@folkehelseinstituttet/designsystem/fhi-icon-search';
import '@folkehelseinstituttet/designsystem/fhi-icon-check';
import '@folkehelseinstituttet/designsystem/fhi-icon-plus';
import '@folkehelseinstituttet/designsystem/fhi-icon-trash';
```

## Bruk i HTML

```html
<fhi-icon-search></fhi-icon-search>
<fhi-icon-check color="var(--fhi-color-success-text-default)"></fhi-icon-check>
<fhi-icon-trash size="large"></fhi-icon-trash>
```

---

## Properties

| Property | Type | Default | Beskrivelse |
|----------|------|---------|-------------|
| `color` | `string` | `'currentcolor'` | Ikonfarge (bruk design tokens) |
| `size` | `'xsmall' \| 'small' \| 'medium' \| 'large' \| number \| string` | `'medium'` | Ikonstørrelse |

### Størrelsestabell

| Verdi | Størrelse |
|-------|----------|
| `xsmall` | 1rem (16px) |
| `small` | 1.25rem (20px) |
| `medium` | 1.5rem (24px) |
| `large` | 2rem (32px) |
| Tall (f.eks. `48`) | px-verdi |
| String (f.eks. `'3rem'`) | Brukes direkte |

---

## Bruk med andre komponenter

### I fhi-button

```typescript
// Husk å importere komponenten:
import '@folkehelseinstituttet/designsystem/fhi-button';
```

Ikoner inne i `fhi-button` dimensjoneres automatisk:

```html
<fhi-button><fhi-icon-plus></fhi-icon-plus> Legg til</fhi-button>

<fhi-button icon-only variant="subtle" color="neutral">
  <fhi-icon-search></fhi-icon-search>
</fhi-button>
```

### I fhi-tag

```typescript
// Husk å importere komponenten:
import '@folkehelseinstituttet/designsystem/fhi-tag';
```

```html
<fhi-tag color="success">
  <fhi-icon-check></fhi-icon-check>
  Fullført
</fhi-tag>
```

---

## Tilgjengelige ikoner

Alle importeres som `@folkehelseinstituttet/designsystem/fhi-icon-{navn}` og brukes som `<fhi-icon-{navn}>`.

### Piler og navigasjon
`arrow-down` `arrow-down-left` `arrow-down-right` `arrow-left` `arrow-right` `arrow-right-left` `arrow-up` `arrow-up-down` `arrow-up-left` `arrow-up-right` `chevron-down` `chevron-left` `chevron-right` `chevron-up` `chevrons-down` `chevrons-left` `chevrons-right` `chevrons-up` `circle-arrow-down` `circle-arrow-left` `circle-arrow-right` `circle-arrow-up` `circle-chevron-down` `circle-chevron-left` `circle-chevron-right` `circle-chevron-up` `expand` `external-link`

### Status og varsler
`check` `circle-check` `circle-check-big` `circle-exclamation` `circle-info` `circle-minus` `circle-plus` `circle-question` `circle-x` `exclamation` `info` `octagon-alert` `question` `square-check` `square-check-big` `triangle-alert`

### Handling og redigering
`copy` `download` `filter` `grip-horizontal` `grip-vertical` `link` `link-2` `link-2-off` `lock` `lock-open` `log-in` `log-out` `minus` `paperclip` `pencil` `pin` `pin-off` `plus` `refresh` `rotate-left` `rotate-right` `search` `send` `share` `square-pen` `square-x` `trash` `upload` `x`

### Grafer og data
`chart-bar` `chart-bar-stacked` `chart-column` `chart-column-stacked` `chart-line` `chart-no-axes-combined` `chart-pie` `sheet`

### Kommunikasjon
`bell` `mail` `message` `phone` `printer`

### Objekter og figurer
`calendar` `calendar-clock` `clock` `circle` `ellipsis` `ellipsis-vertical` `eye` `eye-off` `file` `folder` `gear` `grid-9-dots` `history` `map-pin` `menu` `square` `user`
