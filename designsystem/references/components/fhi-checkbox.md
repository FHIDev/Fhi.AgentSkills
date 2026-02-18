# fhi-checkbox

Avkrysningsboks. Form-assosiert — sender `name=value` når avkrysset, ingenting når ikke avkrysset.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-checkbox';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | Label ved siden av boksen |
| `name` | `name` | `string \| undefined` | `undefined` | Form-nøkkel |
| `value` | `value` | `string` | `'on'` | Verdi sendt når avkrysset |
| `checked` | `checked` | `boolean` | `false` | Avkrysset tilstand |
| `status` | `status` | `'error' \| undefined` | `undefined` | Feilstatus |
| `disabled` | `disabled` | `boolean` | `false` | Deaktivert |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `change` | Utløses når tilstand endres |
| `input` | Utløses når tilstand endres |

## Eksempler

```html
<fhi-checkbox label="Godta vilkårene" name="terms" value="accepted"></fhi-checkbox>

<fhi-checkbox label="Nyhetsbrev" name="newsletter" checked></fhi-checkbox>

<fhi-checkbox label="Påkrevd felt" name="required" status="error"></fhi-checkbox>

<script>
  document.querySelector('fhi-checkbox')
    .addEventListener('change', e => console.log(e.target.checked));
</script>
```
