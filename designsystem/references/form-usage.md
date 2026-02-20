# Bruk i HTML forms

Alle form-komponenter (fhi-button, fhi-text-input, fhi-date-input, fhi-checkbox, fhi-radio) deltar automatisk i native HTML `<form>` via ElementInternals API.

## FormData

```typescript
import '@folkehelseinstituttet/designsystem/fhi-text-input';
import '@folkehelseinstituttet/designsystem/fhi-date-input';
import '@folkehelseinstituttet/designsystem/fhi-checkbox';
import '@folkehelseinstituttet/designsystem/fhi-radio';
import '@folkehelseinstituttet/designsystem/fhi-button';
```

```html
<form id="myForm">
  <fhi-text-input label="Navn" name="name" value="Ola Nordmann"></fhi-text-input>
  <fhi-checkbox label="Aktiv" name="active" value="yes" checked></fhi-checkbox>
  <fhi-radio name="role" value="admin" label="Admin" checked></fhi-radio>
  <fhi-radio name="role" value="user" label="Bruker"></fhi-radio>
  <fhi-button type="submit">Send inn</fhi-button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(Object.fromEntries(data));
    // { name: "Ola Nordmann", active: "yes", role: "admin" }
  });
</script>
```

## Form reset

`<fhi-button type="reset">` tilbakestiller alle feltene til opprinnelige verdier.

## Disabled

Deaktiverte felt ekskluderes automatisk fra FormData.

## Enter-submit

Trykk Enter i `fhi-text-input` eller `fhi-date-input` sender automatisk inn skjemaet.
