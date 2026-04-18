# Modul 04 – Funksjoner (behandlingsaktiviteter)

**Produserer:** `{systemnavn}/01-funksjonell-beskrivelse/01_funksjoner.md`  
**Avhenger av:** `00_oversikt.md`, `01_brukere.md`  
**Neste modul:** 02_komponenter.md  
**Brukes av:** 03_verdivurdering-kit.md, 03_verdivurdering-personvern.md

> ⚠️ Dette er kjernemodelen. Behandlingsaktivitetene som defineres her 
> brukes direkte i KIT-vurdering (modul 07) og personvernanalyse (modul 08).
> Ta deg tid her — det lønner seg.

---

## Formål

Kartlegg hva systemet faktisk gjør: hvilke prosesser kjøres, hvilke 
funksjoner tilbys, og hvilke data flyter hvor. 
En behandlingsaktivitet er en avgrenset prosess med tydelig input, 
handling og output.

---

## Spørsmål å stille brukeren

### Identifiser aktivitetene / funksjonene
- Hva er de **viktigste tingene systemet gjør**? (be om 3–8 kjerneaktiviteter)
- Er det aktiviteter som bare skjer **periodisk** (batch, nattjobb, rapportering)?
- Er det aktiviteter som utføres **automatisk** uten menneskelig godkjenning?
- Er det aktiviteter som **påvirker andre systemer** (skriver til eksternt system, sender epost, etc.)?

### For hver aktivitet — spør:
- Hva er **formålet** med behandlingen/funksjonen?
- Hva **gjør** systemet — beskriv handlingen uten å skille på input/output?
- Hvem **utfører** aktiviteten? (brukergruppe fra modul 02, eller automatisk?)
- Hvilke **informasjonsobjekter** fra informasjonsmodellen (`02_informasjonsmodell.md`) behandles?
- Hva er **lagringstiden** for opplysningene som behandles i denne aktiviteten?
- Behandles **særlige kategorier av opplysninger** eller **sensitive data**?

### Dataflyt

- Flyter data **inn fra** eksterne systemer eller brukere?
- Flyter data **ut til** andre systemer, tjenester eller brukere?
- Er det data som **aldri forlater** systemet?

---

## Output-format

Skriv filen `{systemnavn}/01-funksjonell-beskrivelse/01_funksjoner.md` med denne strukturen:

```markdown
# Funksjoner (behandlingsaktiviteter)

## Oversikt over behandlingsaktiviteter

| Nr | Aktivitet | Formål | Data | Utføres av | 
|----|-----------|--------|------|------------|
| A1 | {navn} | {formål} | {informasjonsobjekt fra informasjonsmodellen} | {brukergruppe/automatisk} |
| A2 | | | | |

---

## Detaljert beskrivelse per aktivitet

### A1 – {Aktivitetsnavn}

| Felt | Innhold |
|------|---------|
| Formål | {Hva er formålet? Hva ønsker man å oppnå?}|
| Beskrivelse | {Hva skjer i denne aktiviteten?} |
| Utføres av | {Brukergruppe eller system} |
| Frekvens | {Kontinuerlig / On-demand / Periodisk (daglig, ukentlig)} |
| Automatiseringsgrad | {Manuell / Automatisk / Menneskelig godkjenning kreves} |
| Sensitive opplysninger | {Særlige kategorier av opplysninger, sensitive data} |
| Lagringstid | {Varighet eller policy} |
| Data | {Informasjonsobjekt fra informasjonsmodellen eller entitet fra datamodellen} |

**Særlige hensyn:** {Eventuelle merknader om sensitivitet, avhengigheter eller risiko}

---

### A2 – {Aktivitetsnavn}

{gjenta struktur}

---

---
*Sist oppdatert: {dato} | Forrige: [01_brukere](./01_brukere.md) | Neste: [02_komponenter](../02-teknisk-beskrivelse/02_komponenter.md)*
```

---

## Tips

- Aktivitetene bør være **avgrenset og navngitt** — ikke for grove ("systemet behandler data") 
  og ikke for granulære ("systemet validerer ett felt")
- Typisk 4–8 aktiviteter for et system av middels størrelse
- For AI-systemer: vær eksplisitt om hva som havner i **kontekstvinduet**
- Automatiserte beslutninger er særlig viktige for GDPR (artikkel 22) og NSM-vurdering
- Denne modulen produserer listen som 03_verdivurdering-kit.md og 03_verdivurdering-personvern.md bruker direkte — 
  hjelp brukeren å gi aktivitetene presise, gjenkjennbare navn
- Spør til slutt: *"Vil du fortsette med 02_komponenter.md eller 02_informasjonsmodell.md, 
  eller er det noe her som skal justeres?"*
