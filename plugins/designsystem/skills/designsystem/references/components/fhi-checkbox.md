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
| `helpText` | `help-text` | `string \| undefined` | `undefined` | Hjelpetekst under label (fra v0.44.0) |

Når du bruker ikke-tom `help-text`, må du også sette `label`. Uten label logger
komponenten `console.error`, men viser fortsatt hjelpeteksten.

## Events

| Event | Beskrivelse |
|-------|-------------|
| `change` | Utløses når tilstand endres |
| `input` | Utløses når tilstand endres |

## Form reset

Reset setter alltid `checked=false`, også når boksen opprinnelig hadde
`checked`-attributtet. Den opprinnelige avkrysningen gjenopprettes ikke.
Dette er bekreftet i v0.41.2 og v0.43.5.

## Eksempler

```html
<fhi-checkbox label="Ta med vedlegg" name="attachments" value="yes"
  help-text="Legger ved underlagsfilene i eksporten."></fhi-checkbox>

<fhi-checkbox label="Godta vilkårene" name="terms" value="accepted"></fhi-checkbox>

<fhi-checkbox label="Nyhetsbrev" name="newsletter" checked></fhi-checkbox>

<fhi-checkbox label="Påkrevd felt" name="required" status="error"></fhi-checkbox>

<script>
  document.querySelector('fhi-checkbox')
    .addEventListener('change', e => console.log(e.target.checked));
</script>
```
