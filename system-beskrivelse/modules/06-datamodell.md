# Modul 06 – Arkitektur: Datamodell

**Produserer:** `{systemnavn}/beskrivelse/02-teknisk beskrivelse/2.3-datamodell.md`  
**Avhenger av:** `2.2-informasjonsmodell.md`  
**Neste modul:** dataflyt

---

## Formål

Kartlegg hvilke datastrukturer som faktisk lagres i systemet: tabeller, dokumenter,
blobs og mellomlagre. Dette er den interne representasjonen — ikke det som eksponeres utad.

---

## Spørsmål å stille brukeren

### Lagringsmodeller
- Hvilke **entiteter eller dokumenter** lagres? (tabeller, collections, blobs)
- Er noen lagrede modeller **direkte mappet** til API-kontrakter/DTOs, eller er de transformert?
- Er det **mellomlagrede modeller** (cache, kø, hendelseslogg) som skiller seg fra kildedataen?

### Relasjoner
- Er det **koblinger mellom entiteter**? (f.eks. "en sak tilhører en person")
- Refererer modellen til **IDer eller nøkler fra andre systemer**?

---

## Output-format

Skriv filen `{systemnavn}/beskrivelse/02-teknisk beskrivelse/2.3-datamodell.md` med denne strukturen:

```markdown
# Datamodell

## Oversikt

| Entitet / Dokument | Lagringstype | Mappe til DTO | Beskrivelse |
|-------------------|--------------|---------------|-------------|
| {Entitetsnavn} | SQL-tabell / JSON-dokument / Blob / ... | {DtoNavn / Nei} | {Hva representerer den} |

---

## {Entitetsnavn}

**Lagringstype:** {SQL-tabell, dokument, blob, ...}  
**Mappe til DTO:** {Ja — {DtoNavn} / Nei — transformert}

| Felt | Type | Beskrivelse |
|------|------|-------------|
| {feltnavn} | {datatype} | {Hva feltet inneholder} |

**Relasjoner:**
- {Koblet til: andre entiteter eller IDer fra andre systemer}

---

*Sist oppdatert: {dato} | Forrige: [2.2-informasjonsmodell](./2.2-informasjonsmodell.md) | Neste: [2.4-dataflyt](./2.4-dataflyt.md)*
```

---

## Tips

- Skillet mellom **DTO og lagringsmodell** er viktig — de trenger ikke matche 1:1
- Feltlisten trenger ikke være uttømmende — fokuser på felter som er viktige for forståelsen
- Sensitive felter *identifiseres* her, men *kategoriseres* i behandlingsaktivitetene (Modul 03)
- Spør til slutt: *"Vil du fortsette med Dataflyt, eller er det noe her som skal justeres?"*
