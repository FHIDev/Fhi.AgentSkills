# fhi-date-input

Datofelt med kalendervelger. Verdier i `YYYY-MM-DD`-format. Form-assosiert.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-date-input';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | Label over feltet |
| `value` | `value` | `string` | `''` | Dato i `YYYY-MM-DD`-format |
| `name` | `name` | `string \| undefined` | `undefined` | Form-nøkkel |
| `min` | `min` | `string \| undefined` | `undefined` | Tidligste dato (`YYYY-MM-DD`) |
| `max` | `max` | `string \| undefined` | `undefined` | Seneste dato (`YYYY-MM-DD`) |
| `message` | `message` | `string \| undefined` | `undefined` | Melding under feltet |
| `helpText` | `help-text` | `string \| undefined` | `undefined` | Hjelpetekst |
| `description` | `description` | `string \| undefined` | `undefined` | Beskrivelse under label |
| `status` | `status` | `'error' \| undefined` | `undefined` | Feilstatus |
| `readonly` | `readonly` | `boolean` | `false` | Skrivebeskyttet |
| `disabled` | `disabled` | `boolean` | `false` | Deaktivert |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `input` | Utløses når datoen endres |
| `change` | Utløses ved verdiendring |
| `focus` | Utløses når feltet får fokus |
| `blur` | Utløses når feltet mister fokus |

## Eksempler

```html
<fhi-date-input
  label="Fødselsdato"
  name="dob"
  min="1900-01-01"
  max="2025-12-31">
</fhi-date-input>

<!-- Med feil -->
<fhi-date-input
  label="Startdato"
  name="startDate"
  status="error"
  message="Startdato kan ikke være i fortiden">
</fhi-date-input>

<script>
  document.querySelector('fhi-date-input')
    .addEventListener('change', e => console.log(e.target.value)); // "2024-06-15"
</script>
```
