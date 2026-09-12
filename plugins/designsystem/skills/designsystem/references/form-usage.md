# Bruk i HTML forms

Alle form-komponenter (fhi-button, fhi-text-input, fhi-date-input, fhi-checkbox, fhi-radio, fhi-select fra v0.41.0) deltar automatisk i native HTML `<form>` via ElementInternals API.

## FormData

```typescript
import '@folkehelseinstituttet/designsystem/fhi-text-input';
import '@folkehelseinstituttet/designsystem/fhi-date-input';
import '@folkehelseinstituttet/designsystem/fhi-checkbox';
import '@folkehelseinstituttet/designsystem/fhi-radio';
import '@folkehelseinstituttet/designsystem/fhi-select';
import '@folkehelseinstituttet/designsystem/fhi-select-item';
import '@folkehelseinstituttet/designsystem/fhi-button';
```

```html
<form id="myForm">
  <fhi-text-input label="Navn" name="name" value="Ola Nordmann"></fhi-text-input>
  <fhi-checkbox label="Aktiv" name="active" value="yes" checked></fhi-checkbox>
  <fhi-radio name="role" value="admin" label="Admin" checked></fhi-radio>
  <fhi-radio name="role" value="user" label="Bruker"></fhi-radio>
  <fhi-select label="Fylke" name="county">
    <fhi-select-item value="03" selected>Oslo</fhi-select-item>
    <fhi-select-item value="50">Trøndelag</fhi-select-item>
  </fhi-select>
  <fhi-button type="submit">Send inn</fhi-button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(Object.fromEntries(data));
    // { name: "Ola Nordmann", active: "yes", role: "admin", county: "03" }
  });
</script>
```

## Form reset

`<fhi-button type="reset">` utløser komponentenes reset-callbacker. De
gjenoppretter ikke alltid opprinnelig tilstand:

- `fhi-checkbox` setter alltid `checked=false`, også når boksen var
  forhåndsavkrysset.
- `fhi-radio` gjenoppretter gruppens forhåndsvalg når et alternativ hadde
  `checked`-attributtet. Uten forhåndsvalg beholdes brukerens valg etter reset,
  også i FormData.
- `fhi-select` tilbakestiller til opprinnelig valgt alternativ (eller `''`).

Checkbox- og radio-avvikene er bekreftet i publiserte pakker fra v0.41.2 til
v0.43.5 som ble prøvd under oppdateringen; de er ikke nye i v0.43.

## Programmatisk Select-verdi

Når `fhi-select.value` endres programmatisk etter initialisering, kan den
synlige verdien endres uten at FormData oppdateres. For eksempel kan feltet
vise `b` mens skjemaet fortsatt sender `a`. Dette er bekreftet i v0.43.5.
Kontroller innsendt verdi i slike forløp; native form-assosiering alene er
ikke en garanti for synkronisering. Se [Select](components/fhi-select.md)
for forskjellen mellom feltets `value` og endringer på alternativene.

## Disabled

Deaktiverte felt ekskluderes automatisk fra FormData.

## Enter-submit

Trykk Enter i `fhi-text-input` eller `fhi-date-input` sender automatisk inn skjemaet.
