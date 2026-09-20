# fhi-text-area

Tekstområde for svar over flere linjer, for eksempel beskrivelser. Innført i
v0.45.0. Form-assosiert, med native `<textarea>` i shadow DOM.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-text-area';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | Synlig label; sett den for tilgjengelighet |
| `name` | `name` | `string \| undefined` | `undefined` | Nøkkel i FormData |
| `value` | `value` | `string` | `''` | Feltets verdi |
| `placeholder` | `placeholder` | `string \| undefined` | `undefined` | Hint når feltet er tomt; erstatter ikke label |
| `helpText` | `help-text` | `string \| undefined` | `undefined` | Hjelpetekst over feltet |
| `message` | `message` | `string \| undefined` | `undefined` | Melding under feltet |
| `status` | `status` | `'error' \| undefined` | `undefined` | Visuell feilstatus |
| `readonly` | `readonly` | `boolean` | `false` | Kan fokuseres og sendes med i FormData, men ikke redigeres av brukeren |
| `disabled` | `disabled` | `boolean` | `false` | Kan ikke redigeres/fokuseres og utelates fra FormData |
| `rows` | `rows` | `number` | `2` | Antall synlige tekstlinjer |

Feltet kan størrelsesjusteres vertikalt. Komponenten har ingen innholdsslots;
sett tekst med `value`, ikke mellom taggene. `required` og `maxlength` er ikke
implementert som komponentattributter. `status="error"` viser feil visuelt,
men validerer ikke innholdet eller blokkerer innsending.

## Events og verdi

| Event | Beskrivelse |
|-------|-------------|
| `input` | Ved brukerens redigering; `event.target.value` er oppdatert |
| `change` | Når feltet mister fokus etter brukerens verdiendring |

Begge sendes som vanlige `Event` med `bubbles: true` og `composed: true`.
Programmatisk `element.value = '…'` oppdaterer både visning og FormData,
men sender ikke `input` eller `change`. Enter gir linjeskift.

## Form reset

`formResetCallback()` kalles automatisk ved reset. Den leser det **gjeldende**
`value`-attributtet, eller bruker `''` hvis attributtet mangler. En verdi satt
bare via JavaScript-propertyen blir ikke reset-verdien, siden `value` ikke
reflekteres til attributtet.

## Eksempler

```html
<fhi-text-area
  label="Beskrivelse"
  name="description"
  help-text="Beskriv hvilke endringer som er gjort."
  rows="4">
</fhi-text-area>

<fhi-text-area
  label="Begrunnelse"
  name="reason"
  status="error"
  message="Skriv en begrunnelse før du fortsetter.">
</fhi-text-area>
```

[Dokumentasjon](https://designsystem.fhi.no/?path=/docs/komponenter-text-area--docs)
