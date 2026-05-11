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

## Slots (fra v0.35.0)

| Slot | Beskrivelse |
|------|-------------|
| `start` | Ikon på venstre side i inputfeltet |
| `end` | Ikon på høyre side i inputfeltet |

**Begrensninger og runtime-atferd:**

- Slottene aksepterer **kun FHI-ikoner** (`fhi-icon-*`). Komponenten sjekker første assigned node i slotten og krever en tag som starter med `fhi-icon`. Ugyldig innhold gir `console.error` ved runtime — det er **ikke** en manifest-deklarert kontrakt (`custom-elements.json`/`web-types.json` viser ikke disse slotene i v0.35.0).
- Ikonet får automatisk `size="1.5rem"` satt som attributt; egne `size`-verdier overstyres.
- Input får `padding-{left|right}: var(--fhi-spacing-500)` for å gi plass til ikonet.
- Slottene er **visuelle, ikke interaktive**: slot-elementene har `pointer-events: none`. Ikon kan ikke være en klikkbar handling i denne implementasjonen.
- Ikon-fargen følger input-tilstanden automatisk for `start`-slotten:
  - Standard: `--fhi-color-neutral-text-subtle`
  - Hover: `--fhi-color-accent-text-subtle`
  - Focus/active: `--fhi-color-accent-text-default`
  - Error (`status="error"`): `--fhi-color-danger-text-subtle`
- `end`-slotten har konstant `--fhi-color-neutral-text-subtle` og endrer seg **ikke** med hover, focus eller error-status. Hvis du trenger statusfarge på et høyre-ikon, må du style det selv via tokens — komponenten gir det ikke automatisk.

**Retningslinjer fra docs:**

- Venstre (`start`): visuell kontekst om hva feltet ber om (mail, lock, user).
- Høyre (`end`): visuell felttypeindikasjon. Merk at `end` ikke får automatisk error-farge — ikke bruk slotten alene som valideringsindikator; bruk `status="error"` + `message` for det.
- Hvert ikon legger til kognitiv last — bruk kun når det gir reell verdi.

```html
<!-- Ikon på venstre -->
<fhi-text-input label="Brukernavn" name="username">
  <fhi-icon-user slot="start"></fhi-icon-user>
</fhi-text-input>

<!-- Ikon på høyre -->
<fhi-text-input label="Søk" name="q">
  <fhi-icon-search slot="end"></fhi-icon-search>
</fhi-text-input>
```

> Husk å importere ikon-komponenten: `import '@folkehelseinstituttet/designsystem/fhi-icon-user';`

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
