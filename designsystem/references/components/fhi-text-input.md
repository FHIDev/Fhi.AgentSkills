# fhi-text-input

Tekstfelt med label, hjelpetekst og validering. Form-assosiert.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-text-input';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | Label over feltet (anbefalt for tilgjengelighet) |
| `value` | `value` | `string` | `''` | Feltets verdi |
| `name` | `name` | `string \| undefined` | `undefined` | Form-nøkkel for FormData |
| `placeholder` | `placeholder` | `string \| undefined` | `undefined` | Plassholdertekst |
| `message` | `message` | `string \| undefined` | `undefined` | Melding under feltet (f.eks. feilmelding) |
| `helpText` | `help-text` | `string \| undefined` | `undefined` | Hjelpetekst mellom label og felt |
| `status` | `status` | `'error' \| undefined` | `undefined` | Feilstatus — farger label, border og melding rødt |
| `readonly` | `readonly` | `boolean` | `false` | Skrivebeskyttet (sendes med i FormData) |
| `disabled` | `disabled` | `boolean` | `false` | Deaktivert (ekskluderes fra FormData) |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `input` | Utløses ved hvert tastetrykk |
| `change` | Utløses når feltet mister fokus etter verdiendring |

> Fokusrelaterte hendelser håndteres som native DOM-events og kan variere mellom rammeverk. I Blazor: bruk `@onfocusin`/`@onfocusout`.

## Eksempler

```html
<fhi-text-input
  label="E-postadresse"
  name="email"
  placeholder="navn@example.com"
  help-text="Vi deler aldri e-posten din">
</fhi-text-input>

<!-- Feilvisning -->
<fhi-text-input
  label="Brukernavn"
  name="username"
  status="error"
  message="Brukernavnet er allerede i bruk">
</fhi-text-input>

<!-- Skrivebeskyttet -->
<fhi-text-input
  label="Kontonummer"
  value="NO12 3456 7890"
  readonly>
</fhi-text-input>

<script>
  const input = document.querySelector('fhi-text-input');
  input.addEventListener('input', e => console.log(e.target.value));
</script>
```
