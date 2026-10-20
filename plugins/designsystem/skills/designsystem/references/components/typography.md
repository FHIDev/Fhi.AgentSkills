# Typografikomponenter

Fem komponenter dekker all tekst: `fhi-display`, `fhi-title`, `fhi-headline`,
`fhi-body` og `fhi-label`. Hver importeres individuelt:

```typescript
import '@folkehelseinstituttet/designsystem/fhi-display';
import '@folkehelseinstituttet/designsystem/fhi-title';
import '@folkehelseinstituttet/designsystem/fhi-headline';
import '@folkehelseinstituttet/designsystem/fhi-body';
import '@folkehelseinstituttet/designsystem/fhi-label';
```

## Hvilken komponent skal jeg bruke?

| Komponent | Bruk | Font-weight |
|-----------|------|-------------|
| `fhi-display` | Display-tekst — stor, fremtredende (hero, kampanje) | 400 (regular) |
| `fhi-title` | Titler | 600 (bold) |
| `fhi-headline` | Overskrifter (h1–h6) — vanligste valget for sidestruktur | 500 (medium) |
| `fhi-body` | Brødtekst (erstatter `<p>`) | 400 (regular) |
| `fhi-label` | Kort, beskrivende tekst — skjemafelt, kategorier | 500 (medium) |

## Properties

Alle fem har `size` og `color`. De tre overskriftskomponentene (`fhi-display`,
`fhi-title`, `fhi-headline`) har i tillegg `level`:

| Property | Attributt | Type | Default | Gjelder | Beskrivelse |
|----------|-----------|------|---------|---------|-------------|
| `level` | `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | (påkrevd) | display, title, headline | Semantisk overskriftsnivå |
| `size` | `size` | `'large' \| 'medium' \| 'small'` | `'medium'` | alle | Visuell størrelse |
| `color` | `color` | `string \| undefined` | `undefined` | alle | CSS-farge (bruk design tokens). Uten `color` arver komponenten tekstfarge fra forelder (`currentcolor` via komponentens CSS — arv-atferden kom i v0.39.0) |
| `strong` | `strong` | `boolean` | `false` | body | Fet og semantisk viktig tekst (fra v0.46.0) |
| `emphasized` | `emphasized` | `boolean` | `false` | body | Kursiv og semantisk fremhevet tekst (fra v0.46.0) |

`level` og `size` er uavhengige: `level` styrer semantikken (hvilket
overskriftsnivå skjermlesere og dokumentstruktur ser), `size` styrer det visuelle.

**Farge via ekstern CSS (fra v0.40.7):** Når `color`-attributtet ikke er satt, setter
komponenten ingen inline-style, så vanlig CSS fungerer som fallback
(f.eks. `fhi-body { color: var(--fhi-color-neutral-text-subtle); }`).
I v0.39.0–v0.40.6 var property-defaulten strengen `'currentcolor'` som alltid ble satt
som inline-style.

**`strong` / `emphasized` (kun `fhi-body`, fra v0.46.0):** Slotten pakkes inn i `<strong>`
og/eller `<em>` i shadow DOM; de kan kombineres. `strong` gir `--fhi-font-weight-bold` (600).
`emphasized` gir kursiv via Roboto Flex' `slnt`-akse (`font-variation-settings: 'slnt' -8`,
`font-style: unset`) — med en fallback-font uten `slnt`-akse blir teksten ikke visuelt kursiv.

En `fhi-body` direkte i slotten til en annen `fhi-body` får `display: inline` (fra v0.46.0,
uten stabilitetsgaranti — upstream dokumenterer ikke mønsteret, og slotten beskrives som ren tekst).

## Eksempler

```html
<!-- Overskriftshierarki -->
<fhi-display level="1" size="large">Stor display-tekst</fhi-display>
<fhi-title level="1" size="large">Stor tittel</fhi-title>
<fhi-headline level="1" size="large">Sidetittel</fhi-headline>
<fhi-headline level="2" size="medium">Seksjonstittel</fhi-headline>
<fhi-headline level="3" size="small" color="var(--fhi-color-accent-text-default)">
  Undertittel
</fhi-headline>

<!-- Brødtekst og labels -->
<fhi-body>Standard brødtekst.</fhi-body>
<fhi-body size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten tilleggstekst.
</fhi-body>
<!-- v0.46.0+ -->
<fhi-body strong>Viktig informasjon.</fhi-body>
<fhi-body emphasized>Fremhevet tekst.</fhi-body>
<fhi-label>Standard label</fhi-label>
<fhi-label size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten label
</fhi-label>
```
