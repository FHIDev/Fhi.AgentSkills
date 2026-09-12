# fhi-callout

Fremhever viktige beskjeder, status, advarsler eller feil. Innført i v0.42.0.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-callout';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `heading` | `heading` | `string \| undefined` | `undefined` | Valgfri tittel, rendres som `fhi-title` med fast `level="2"` |
| `color` | `color` | `'neutral' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Beskjedens farge |
| `variant` | `variant` | `'subtle' \| 'bordered'` | `'subtle'` | `bordered` gir synlig kantlinje |

Ugyldig `color` normaliseres til `neutral`, ugyldig `variant` til `subtle`.
`accent` og `info` er ikke støttede farger. Manifestet oppgir bare `string`;
verdiene og normaliseringen over er verifisert i TypeScript-koden.

## Slots

| Slot | Beskrivelse |
|------|-------------|
| Default | Beskjedens innhold |
| `icon` | Valgfritt ikon, importeres separat |

## Bruk

Budskapet skal være tydelig uten ikon og farge. Et ikon kan hjelpe brukeren å
skille meldingstyper, men kan utelates ved enkle, nøytrale beskjeder eller når
mange callouts vises samtidig. Vurder overskriftshierarkiet før du bruker
`heading`, siden komponenten ikke har et konfigurerbart `level`.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-icon-triangle-alert';
```

```html
<fhi-callout>Endringene gjelder fra neste rapporteringsperiode.</fhi-callout>

<fhi-callout heading="Kontroller filen" color="warning" variant="bordered">
  <fhi-icon-triangle-alert slot="icon" aria-hidden="true"></fhi-icon-triangle-alert>
  Filen mangler kolonneoverskrifter. Legg dem til før du prøver igjen.
</fhi-callout>
```

[Dokumentasjon](https://designsystem.fhi.no/?path=/docs/komponenter-callout--docs)
