# Design Tokens

FHI Designsystem bruker CSS custom properties (design tokens) for farger, typografi, spacing og mer. Tokenene er tilgjengelige når `theme/default.css` er importert.

**Bruk alltid semantiske tokens** — aldri hardkodede verdier.

## Innhold

- [Farger](#farger) — Roller, bruksområder, eksempler
- [Typografi](#typografi) — Font, vekter, typografi-tokens
- [Spacing](#spacing) — Spacing-skala
- [Border radius](#border-radius)
- [Border width](#border-width)
- [Motion / animasjon](#motion--animasjon)
- [Opacity](#opacity)

---

## Farger

### Navnemønster

```
--fhi-color-{rolle}-{bruk}-{tilstand}
```

### Roller

| Rolle | Bruk |
|-------|------|
| `neutral` | Standard/nøytral |
| `accent` | Primær/fremhevet |
| `info` | Informasjon |
| `success` | Suksess/bekreftet |
| `warning` | Advarsel |
| `danger` | Fare/feil |

### Bruksområder (fra lys til mørk)

| Bruk | Typisk bruk | Eksempel |
|------|-------------|----------|
| `background-default` | Sidebakgrunn, lysest | `--fhi-color-neutral-background-default` |
| `background-subtle` | Lett tonet bakgrunn | `--fhi-color-neutral-background-subtle` |
| `surface-default` | Flater (kort, felt) | `--fhi-color-neutral-surface-default` |
| `surface-hover` | Flater ved hover | `--fhi-color-neutral-surface-hover` |
| `surface-active` | Flater ved aktiv/trykk | `--fhi-color-neutral-surface-active` |
| `border-subtle` | Svak border | `--fhi-color-neutral-border-subtle` |
| `border-default` | Standard border | `--fhi-color-neutral-border-default` |
| `border-strong` | Sterk border | `--fhi-color-neutral-border-strong` |
| `base-default` | Basisfarge (knapper, checkboxer) | `--fhi-color-accent-base-default` |
| `base-hover` | Basisfarge ved hover | `--fhi-color-accent-base-hover` |
| `base-active` | Basisfarge ved aktiv | `--fhi-color-accent-base-active` |
| `text-subtle` | Svakere/sekundær tekst | `--fhi-color-neutral-text-subtle` |
| `text-default` | Standard tekst | `--fhi-color-neutral-text-default` |
| `text-inverted` | Lys tekst på mørk bakgrunn | `--fhi-color-neutral-text-inverted` |

### Eksempler på bruk i egen CSS

```css
.my-element {
  /* Tekstfarger */
  color: var(--fhi-color-neutral-text-default);        /* Standard tekst */
  color: var(--fhi-color-neutral-text-subtle);          /* Sekundær tekst */
  color: var(--fhi-color-accent-text-default);          /* Fremhevet tekst */
  color: var(--fhi-color-danger-text-default);          /* Feiltekst */
  color: var(--fhi-color-success-text-default);         /* Suksesstekst */

  /* Bakgrunner */
  background-color: var(--fhi-color-neutral-background-default);  /* Sidebakgrunn */
  background-color: var(--fhi-color-accent-background-subtle);    /* Fremhevet seksjon */
  background-color: var(--fhi-color-danger-background-default);   /* Feilfelt */

  /* Borders */
  border: 1px solid var(--fhi-color-neutral-border-default);      /* Standard border */
  border: 1px solid var(--fhi-color-danger-border-default);       /* Feilborder */
}

/* Interaktive elementer */
.my-interactive {
  background-color: var(--fhi-color-accent-base-default);
}
.my-interactive:hover {
  background-color: var(--fhi-color-accent-base-hover);
}
.my-interactive:active {
  background-color: var(--fhi-color-accent-base-active);
}
```

---

## Typografi

### Font

Fonten Roboto Flex lastes automatisk med `theme/default.css`.

```css
font-family: var(--fhi-font-family-default);
/* → 'Roboto Flex', system-ui, sans-serif */
```

### Font-vekter

| Token | Verdi | Bruk |
|-------|-------|------|
| `--fhi-font-weight-light` | 300 | Lett |
| `--fhi-font-weight-regular` | 400 | Normal tekst |
| `--fhi-font-weight-medium` | 500 | Labels, overskrifter |
| `--fhi-font-weight-bold` | 600 | Titler, uthevet |

### Typografi-tokens

Mønster: `--fhi-typography-{kategori}-{størrelse}-{egenskap}`

**Kategorier:**

| Kategori | Bruk | Font-weight |
|----------|------|-------------|
| `label` | Knappetekst, labels | 500 (medium) |
| `body` | Brødtekst | 400 (regular) |
| `headline` | Overskrifter | 500 (medium) |
| `title` | Titler | 600 (bold) |
| `display` | Store display-tekster | 400 (regular) |

**Størrelser:** `small`, `medium`, `large`

**Egenskaper:** `font-size`, `font-weight`, `line-height`, `letter-spacing`

### Eksempel: bruk typografi-tokens i egen CSS

```css
.my-label {
  font-size: var(--fhi-typography-label-medium-font-size);
  font-weight: var(--fhi-typography-label-medium-font-weight);
  line-height: var(--fhi-typography-label-medium-line-height);
  letter-spacing: var(--fhi-typography-label-medium-letter-spacing);
}

.my-heading {
  font-size: var(--fhi-typography-headline-large-font-size);
  font-weight: var(--fhi-typography-headline-large-font-weight);
  line-height: var(--fhi-typography-headline-large-line-height);
}
```

**Tips:** For brødtekst og overskrifter, bruk heller komponentene `<fhi-body>` og `<fhi-headline>` i stedet for å sette typografi-tokens manuelt.

---

## Spacing

Konsistent spacing-skala for padding, margin og gap:

| Token | Verdi | Piksel |
|-------|-------|--------|
| `--fhi-spacing-0` | 0rem | 0px |
| `--fhi-spacing-050` | 0.25rem | 4px |
| `--fhi-spacing-100` | 0.5rem | 8px |
| `--fhi-spacing-150` | 0.75rem | 12px |
| `--fhi-spacing-200` | 1rem | 16px |
| `--fhi-spacing-250` | 1.25rem | 20px |
| `--fhi-spacing-300` | 1.5rem | 24px |
| `--fhi-spacing-400` | 2rem | 32px |
| `--fhi-spacing-500` | 2.5rem | 40px |
| `--fhi-spacing-600` | 3rem | 48px |
| `--fhi-spacing-800` | 4rem | 64px |
| `--fhi-spacing-1000` | 5rem | 80px |

```css
padding: var(--fhi-spacing-200);                      /* 1rem */
gap: var(--fhi-spacing-100);                           /* 0.5rem */
margin-bottom: var(--fhi-spacing-300);                 /* 1.5rem */
```

---

## Border radius

| Token | Verdi | Piksel |
|-------|-------|--------|
| `--fhi-border-radius-050` | 0.25rem | 4px |
| `--fhi-border-radius-100` | 0.5rem | 8px |
| `--fhi-border-radius-150` | 0.75rem | 12px |
| `--fhi-border-radius-200` | 1rem | 16px |
| `--fhi-border-radius-250` | 1.25rem | 20px |
| `--fhi-border-radius-300` | 1.5rem | 24px |
| `--fhi-border-radius-full` | 999rem | Pille/sirkel |

```css
border-radius: var(--fhi-border-radius-100);           /* Standard avrunding */
border-radius: var(--fhi-border-radius-full);          /* Pilleform */
```

---

## Border width

| Token | Verdi | Bruk |
|-------|-------|------|
| `--fhi-dimension-border-width` | 0.0625rem (1px) | Standard border |
| `--fhi-dimension-border-width-active` | 0.125rem (2px) | Aktiv tilstand |
| `--fhi-dimension-border-width-focus` | 0.25rem (4px) | Fokus-tilstand |

---

## Motion / animasjon

| Token | Verdi |
|-------|-------|
| `--fhi-motion-ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--fhi-motion-duration-quick` | 150ms |
| `--fhi-motion-duration-medium` | 250ms |
| `--fhi-motion-duration-slow` | 350ms |

```css
transition: background-color var(--fhi-motion-duration-quick) var(--fhi-motion-ease-default);
```

---

## Opacity

| Token | Verdi | Bruk |
|-------|-------|------|
| `--fhi-opacity-disabled` | 60% | Deaktiverte elementer |

```css
opacity: var(--fhi-opacity-disabled);
```
