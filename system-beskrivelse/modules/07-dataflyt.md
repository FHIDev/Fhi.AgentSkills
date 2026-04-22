# Modul 07 – Arkitektur: Dataflyt

**Produserer:** `{systemnavn}/02-teknisk-beskrivelse/02_dataflyt.md`  
**Avhenger av:** `02_komponenter.md`, `02_informasjonsmodell.md`, `01_funksjoner.md`  
**Neste modul:** 03_verdivurdering-kit eller 03_verdivurdering-personvern

---

## Formål

Kartlegg hvordan data flyter gjennom systemet: fra kilde til lagring til mottaker.
Dette er syntesen av informasjonsmodellen (formen på data) og behandlingsaktivitetene
(hva som gjøres med data) — sett som bevegelse gjennom komponenter.

---

## Spørsmål å stille brukeren

### Integrasjoner
- Hvilke **eksterne systemer** kommuniserer systemet med?
- Er det **inngående integrasjoner** (andre systemer sender data hit)?
- Er det **utgående integrasjoner** (dette systemet sender data ut)?
- Er det avhengigheter til **identitetstjenester** (AD, Entra ID, Feide)?
- Brukes det **felles infrastruktur** som andre systemer deler?

### Dataflyt
- Hvilke **inngangspunkter** har data? (bruker, eksternt system, hendelse, fil)
- Hvilke **transformasjoner** skjer underveis? (mapping, berikelse, validering, aggregering)
- Hvilke **utgangspunkter** har data? (lagring, ekstern tjeneste, brukergrensesnitt, logg)
- Er det data som **aldri forlater** systemet?
- Er det data som **midlertidig passerer** gjennom uten å lagres? (f.eks. proxy, kontekstvindu)
- Finnes det **alternative flytveier** (feilhåndtering, fallback)?

---

## Output-format

Skriv filen `{systemnavn}/02-teknisk-beskrivelse/02_dataflyt.md` med denne strukturen:

```markdown
# Dataflyt og Integrasjoner

## Oversikt

{Kort beskrivelse av de viktigste flytvegene og integrasjonene i systemet.}

## Integrasjoner

### Inngående (andre systemer sender til dette)

| System | Protokoll | Data som sendes | Formål |
|--------|-----------|----------------|--------|
| {System} | HTTPS / TCP / ... | | |

### Utgående (dette systemet sender til andre)

| System | Protokoll | Data som sendes | Formål |
|--------|-----------|----------------|--------|
| {System} | HTTPS / TCP / ... | | |

## Dataflytdiagram

Generer C4 System Context-diagram (SVG) iht. spesifikasjonen i `diagram-c4.md`, seksjon «System Context-diagram (nivå 1)».
Eksporter til `c4_system_context.svg` i samme mappe.

![Dataflytdiagram](c4_system_context.svg)

## Flytbeskrivelser

### {Flyt 1 – navn}

| Steg | Fra | Modell/DTO | Til | Transformasjon |
|------|-----|-----------|-----|----------------|
| 1 | {Kilde} | {DtoNavn} | {Komponent} | {Ingen / Validering / Mapping} |
| 2 | {Komponent} | {EntitetNavn} | {Database} | {Persistering} |

**Behandlingsaktivitet:** {Referanse til aktivitet i 01_funksjoner.md}

---

### {Flyt 2 – navn}

{gjenta struktur}

---

## Data som ikke lagres

{Beskriv data som kun er i transitt — passerer gjennom systemet uten persistering.}

| Data | Fra | Til | Hvorfor ikke lagret |
|------|-----|-----|---------------------|
| | | | |

---
*Sist oppdatert: {dato} | Forrige: [02_datamodell](./02_datamodell.md) | Neste: [02_drift](./02_drift.md)*
```

---

## Tips

- Fokuser på de **viktigste flytvegene** — ikke alle mulige stier
- Koble flytene eksplisitt til behandlingsaktivitetene i funksjoner-modulen
- Data i transitt (f.eks. AI-kontekstvindu, proxy-kall) er viktig å synliggjøre for personvernvurderingen
- Spør til slutt: *"Vil du fortsette med Modul 06 (Drift), eller er det noe her som skal justeres?"*
