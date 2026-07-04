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
| `color` | `color` | `string` | `currentcolor` | alle | CSS-farge (bruk design tokens). Default `currentcolor` arver tekstfarge fra forelder (endret i v0.39.0; CSS-keyword er case-insensitivt) |

`level` og `size` er uavhengige: `level` styrer semantikken (hvilket
overskriftsnivå skjermlesere og dokumentstruktur ser), `size` styrer det visuelle.

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
<fhi-label>Standard label</fhi-label>
<fhi-label size="small" color="var(--fhi-color-neutral-text-subtle)">
  Liten label
</fhi-label>
```
