# fhi-modal-dialog

Modal dialog med fokus-fangst, bakgrunnsklikk-lukking og Escape-lukking.

**Påkrevd:** Både `heading` og `close-button-label` MÅ settes (tilgjengelighet).

```typescript
import '@folkehelseinstituttet/designsystem/fhi-modal-dialog';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `open` | `open` | `boolean` | `false` | Synlighet |
| `heading` | `heading` | `string` | `''` | **Påkrevd.** Dialogtittel. |
| `closeButtonLabel` | `close-button-label` | `string` | `''` | **Påkrevd.** Tilgjengelig label for X-knappen. |
| `size` | `size` | `'small' \| 'medium'` | `'medium'` | Maks bredde: `small` = 28rem, `medium` = 40rem |

## Metoder

| Metode | Beskrivelse |
|--------|-------------|
| `show()` | Åpner dialogen |
| `close()` | Lukker dialogen |

## Events

| Event | Beskrivelse |
|-------|-------------|
| `toggle` | Utløses ved åpning og lukking. `event.newState` er `'open'` eller `'closed'`. |
| `close` | Utløses kun ved lukking |

## Slots

| Slot | Beskrivelse |
|------|-------------|
| `body` | Hovedinnhold |
| `footer` | Handlingsknapper (skjules automatisk om tom) |

### Nødvendige importer for eksemplene

```typescript
// Komponenter brukt i eksemplene under:
import '@folkehelseinstituttet/designsystem/fhi-button';
```

## Eksempler

```html
<fhi-button id="open-btn">Åpne dialog</fhi-button>

<fhi-modal-dialog
  id="dialog"
  heading="Bekreft sletting"
  close-button-label="Lukk dialog"
  size="small">

  <div slot="body">
    <p>Er du sikker på at du vil slette denne posten?</p>
  </div>

  <div slot="footer">
    <fhi-button color="danger">Slett</fhi-button>
    <fhi-button color="neutral" variant="outlined" id="cancel">Avbryt</fhi-button>
  </div>
</fhi-modal-dialog>

<script>
  const dialog = document.getElementById('dialog');
  document.getElementById('open-btn').addEventListener('click', () => dialog.show());
  document.getElementById('cancel').addEventListener('click', () => dialog.close());
</script>
```

## Kjente problemer

**Safari: tekst fjernes ved dialoglukking**
I Safari kan tekst i andre komponenter bli fjernet når dialogen lukkes. Workaround: wrap berørt tekst i `<span>` eller en annen HTML-tag.

```html
<!-- Workaround for Safari-bug -->
<p><span>Tekst som kan forsvinne</span></p>
```
