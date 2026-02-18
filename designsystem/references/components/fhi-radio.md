# fhi-radio

Radioknapp. Grupper radioer ved å gi dem samme `name`-attributt. Form-assosiert.

**Merk:** Det finnes ingen `fhi-radio-group`-komponent. Radioer med samme `name` håndterer automatisk gjensidig ekskludering og piltast-navigasjon.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-radio';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | Label ved siden av knappen |
| `name` | `name` | `string \| undefined` | `undefined` | Gruppenøkkel — radioer med samme name er en gruppe |
| `value` | `value` | `string` | `'on'` | Verdi sendt når valgt |
| `checked` | `checked` | `boolean` | `false` | Valgt tilstand |
| `status` | `status` | `'error' \| undefined` | `undefined` | Feilstatus |
| `disabled` | `disabled` | `boolean` | `false` | Deaktivert |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `change` | Utløses når denne radioen velges |
| `input` | Utløses når denne radioen velges |

## Eksempler

```html
<!-- Radiogruppe: samme name = gjensidig ekskluderende -->
<fhi-radio name="size" value="small" label="Liten"></fhi-radio>
<fhi-radio name="size" value="medium" label="Medium" checked></fhi-radio>
<fhi-radio name="size" value="large" label="Stor"></fhi-radio>

<script>
  document.querySelectorAll('fhi-radio[name="size"]').forEach(radio => {
    radio.addEventListener('change', e => {
      if (e.target.checked) console.log('Valgt:', e.target.value);
    });
  });
</script>
```
