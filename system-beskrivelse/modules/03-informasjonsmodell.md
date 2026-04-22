# Modul 03 – Arkitektur: Informasjonsmodell (logisk modell)

**Produserer:** `{systemnavn}/02-teknisk-beskrivelse/02_informasjonsmodell.md`  
**Avhenger av:** `02_komponenter.md`  
**Neste modul:** 02_datamodell.md

---

## Formål

Kartlegg den logiske informasjonsmodellen: hvilke informasjonselementer systemet opererer med,
hva de representerer, og hvordan de henger sammen.

Dette er en **logisk modell** — ikke en teknisk API-beskrivelse. Fokuset er på
*hva* dataene er og *hvilke attributter* de har, ikke på DTOer, endepunkter
eller request/response-format. Tekniske API-detaljer (Swagger/OpenAPI) dokumenteres separat.

---

## Spørsmål å stille brukeren

- Hvilke **informasjonsobjekter** (entiteter/begreper) opererer systemet med?
- Er det informasjonsobjekter som finnes i **flere varianter** (f.eks. identifisert vs. pseudonymisert)?
- Er det **relasjoner** mellom informasjonsobjektene?
- Er det **historikk** som bevares for noen objekter?
- Hvilke felter er **særlig sensitive**?

---

## Output-format

Skriv filen `{systemnavn}/02-teknisk-beskrivelse/02_informasjonsmodell.md` med denne strukturen:

```markdown
# Informasjonsmodell (logisk modell)

> Logisk modell over informasjonselementer systemet behandler.
> Tekniske API-detaljer finnes i Swagger/OpenAPI-dokumentasjonen.

## Oversikt

| Informasjonsobjekt | Beskrivelse | Varianter |
|-------------------|-------------|-----------|
| {Navn} | {Hva representerer det} | Identifisert / Pseudonymisert / Ingen |

---

## {Informasjonsobjektnavn}

**Beskrivelse:** {Hva representerer dette objektet?}  
**Varianter:** {Identifisert / Pseudonymisert / Aggregert / Ingen}  
**Historikk:** {Ja / Nei — beskriv hva som bevares}

| Attributt | Type | Beskrivelse | Sensitiv |
|-----------|------|-------------|---------|
| {attributtnavn} | {datatype} | {Hva inneholder det} | Ja ⚠️ / Nei |

**Relasjoner:**
- {Koblet til: andre informasjonsobjekter}

---

*Sist oppdatert: {dato} | Forrige: [02_komponenter](./02_komponenter.md) | Neste: [02_datamodell](./02_datamodell.md)*
```

---

## Tips

- Bruk domainspråk — ikke tekniske klassenavn eller DTO-navn
- Ikke referer til endepunkter, HTTP-metoder eller request/response
- Sensitive attributter *identifiseres* her, men *kategoriseres* i behandlingsaktivitetene (Modul 03)
- Varianter (identifisert vs. pseudonymisert) dokumenteres som egne seksjoner når de skiller seg vesentlig
- Spør til slutt: *"Vil du fortsette med Datamodell, eller er det noe her som skal justeres?"*
