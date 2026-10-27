# fhi-segmented-control

Gruppe med knapper der brukeren velger ett alternativ for å filtrere eller bytte
visning av innhold i samme område. Innført i v0.47.0. **Ikke form-assosiert.**

Komponentgruppen består av to elementer som brukes sammen:

- `fhi-segmented-control` — gruppen (`role="radiogroup"`)
- `fhi-segmented-control-item` — ett alternativ (knapp med `role="radio"` og `aria-checked`)

```typescript
import '@folkehelseinstituttet/designsystem/fhi-segmented-control';
import '@folkehelseinstituttet/designsystem/fhi-segmented-control-item';
```

Import av `fhi-segmented-control` registrerer også `fhi-segmented-control-item`
(verifisert i publisert v0.47.0), men begge entrypoints finnes og kan importeres eksplisitt.

**Når brukes Segmented Control** (fra docs): lokal filtrering eller endring av
presentasjon («Dag, uke eller måned»), eller bytte mellom visningstyper («Liste,
tabell eller graf»). Endringen vises umiddelbart. **Ikke** til navigasjon mellom
sider/paneler med eget innhold, **ikke** i skjemaer der data lagres eller valideres
(bruk [`fhi-radio`](fhi-radio.md)), og **ikke** til binære av/på-valg.

## Innhold

- [fhi-segmented-control](#fhi-segmented-control-1)
- [fhi-segmented-control-item](#fhi-segmented-control-item)
- [Verdisemantikk og `change`](#verdisemantikk-og-change)
- [Tilgjengelighet og tastatur](#tilgjengelighet-og-tastatur)
- [Eksempler](#eksempler)

---

## fhi-segmented-control

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string` | (valgt alternativs verdi) | Valgt verdi. Reflekteres til attributtet og oppdateres når brukeren velger |
| `variant` | `variant` | `'strong' \| 'subtle'` | `'strong'` | Visuell stil. Settes automatisk på alle items |

Det finnes **ikke** `name`, `disabled`, `size` eller `label`. Komponenten deltar ikke
i `FormData`. Tom `variant` blir `strong`; en ugyldig verdi beholdes og arves av
items, og da vises verken hover- eller valgt-stil.

| Event | Beskrivelse |
|-------|-------------|
| `change` | Utløses når valgt alternativ endres. `event.target.value` er allerede oppdatert. Ingen `input`-event |

Slot: `fhi-segmented-control-item`-elementer.

## fhi-segmented-control-item

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string \| null` | `null` | Verdi. Uten `value` brukes trimmet tekstinnhold |
| `selected` | `selected` | `boolean` | `false` | Forhåndsvalgt alternativ |
| `variant` | `variant` | `'strong' \| 'subtle'` | `'strong'` | Arves fra gruppen — ikke sett manuelt |

| Slot | Beskrivelse |
|------|-------------|
| Default | Knappens tekst |
| `icon` | Valgfritt ikon foran teksten |

Bruk ikon i alle eller ingen av alternativene i en gruppe. Ikon uten tekst gir
`console.warn`. `click()` velger alternativet.

## Verdisemantikk og `change`

- Valgt alternativ er det med `selected`, eller det som matcher gruppens `value`.
  Er ingen valgt, velges det **første** alternativet automatisk.
- `value` som ikke matcher noe alternativ ignoreres: gjeldende valg beholdes og
  `value` settes tilbake til det.
- `change` utløses også **uten brukerhandling**: ved første automatiske valg (hvis
  lytteren er registrert før elementet kobles til, slik rammeverk ofte gjør), ved
  programmatisk `value` og ved `item.selected = true`. Ved toveis binding: sammenlign
  med forrige verdi før du oppdaterer state.
- `change` følger **valgt element**, ikke verdien: endres `value` (eller tekst) på
  alternativet som allerede er valgt, oppdateres gruppens `value` **uten** `change`.
  Bytte til et annet alternativ med samme verdi (f.eks. når det valgte fjernes)
  utløser derimot `change`. Ved dynamiske alternativer: les `value` på nytt etter
  endringer, ikke bare i `change`-lytteren.
- Endringer i items' `selected`, `value` og tekstinnhold, og items som legges til
  eller fjernes, fanges opp automatisk.

## Tilgjengelighet og tastatur

Gi gruppen et tilgjengelig navn: en synlig `fhi-label` koblet med
`aria-labelledby`, eller `aria-label`. Tab går til valgt alternativ. Piltastene
flytter **bare fokus** (rundt i ring); Enter/Space velger.

## Eksempler

```typescript
import '@folkehelseinstituttet/designsystem/fhi-label';
import '@folkehelseinstituttet/designsystem/fhi-icon-sheet';
import '@folkehelseinstituttet/designsystem/fhi-icon-chart-line';
```

```html
<fhi-segmented-control aria-label="Periode" value="week">
  <fhi-segmented-control-item value="day">Dag</fhi-segmented-control-item>
  <fhi-segmented-control-item value="week">Uke</fhi-segmented-control-item>
  <fhi-segmented-control-item value="month">Måned</fhi-segmented-control-item>
</fhi-segmented-control>

<!-- Visningsbytte: startinnholdet står i markup og matcher value="table".
     Handleren er idempotent, så et ekstra change ved første valg gjør ingen skade. -->
<fhi-label id="visning-label">Visning</fhi-label>
<fhi-segmented-control id="visning" aria-labelledby="visning-label" variant="subtle" value="table">
  <fhi-segmented-control-item value="table">
    <fhi-icon-sheet slot="icon"></fhi-icon-sheet>
    Tabell
  </fhi-segmented-control-item>
  <fhi-segmented-control-item value="chart">
    <fhi-icon-chart-line slot="icon"></fhi-icon-chart-line>
    Graf
  </fhi-segmented-control-item>
</fhi-segmented-control>
<div id="tabell">…tabellvisning…</div>
<div id="graf" hidden>…grafvisning…</div>

<script>
  document.getElementById('visning').addEventListener('change', e => {
    document.getElementById('tabell').hidden = e.target.value !== 'table';
    document.getElementById('graf').hidden = e.target.value !== 'chart';
  });
</script>
```

[Dokumentasjon](https://designsystem.fhi.no/?path=/docs/komponenter-segmented-control--docs)
