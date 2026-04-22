# Modul 01 – Oversikt

**Produserer:** `{systemnavn}/00_oversikt.md`  
**Avhenger av:** Ingenting — start her  
**Neste modul:** 02-brukere

---

## Formål

Etabler grunnleggende identitet og kontekst for systemet. 
Denne filen er ankeret alle andre moduler refererer tilbake til.

---

## Spørsmål å stille brukeren

Still disse spørsmålene. Noen kan besvares raskt, andre krever mer refleksjon.

### Identitet
- Hva er systemets **offisielle navn**? (og eventuelle kallenavn/forkortelser)
- Hva er systemets **formål** — hva løser det, og for hvem?
- Er dette et nytt system under vurdering, under utvikling, eller i drift?

### Eierskap og ansvar
- Hvem er **systemeier** (organisatorisk ansvarlig)?
- Hvem er **systemforvalter** (teknisk ansvarlig)?
- Hvilken **avdeling/enhet** forvalter systemet?
- Er det eksterne leverandører involvert?

### Kontekst
- Hvilket **organisasjon** eier/bruker systemet?
- Finnes det **koblede systemer** eller forgjengere dette erstatter?
- Er det kjente **lovkrav, avtaler eller standarder** systemet må følge?
  (f.eks. GDPR, Helseregisterloven, ISO 27001, NSM-krav)


### Status
- Hva er nåværende **livssyklusfase**?
  (Konsept / Planlegging / Utvikling / Pilot / Produksjon / Avvikling)
- Når ble/blir systemet satt i produksjon?
- Finnes det kjente **begrensninger eller åpne spørsmål** som påvirker dokumentasjonen?

---

## Output-format

Skriv filen `{systemnavn}/00_oversikt.md` med denne strukturen:

```markdown
# Oversikt

> {Én setning som beskriver hva systemet er og gjør}

| # | Beskrivelse |
|------|-------|
| Systemnavn | |
| Kallenavn/forkortelse | |
| Formål og kontekst | {2–4 setninger om hvorfor systemet eksisterer, hvilke problemer det løser 
og hvilken kontekst det opererer i.} |
| Organisasjon | |
| Avdeling/enhet | |
| Livssyklusfase | |
| Produksjonsdato | |

## Eierskap og ansvar

| Rolle | Navn/Enhet |
|-------|-----------|
| Systemeier | |
| Systemforvalter | |
| Leverandør(er) | |

## Krav og rammeverk

| Type | Beskrivelse |
|------|-------------|
| Lovkrav | |
| Avtaler | |
| Standarder/rammeverk | |
| Sikkerhetsgradering | |

## Koblede systemer

- {System A} – {relasjon}
- {System B} – {relasjon}

## Status og åpne spørsmål

**Nåværende status:** {kort beskrivelse}

**Kjente begrensninger eller åpne spørsmål:**

- 🔲 {spørsmål 1}
- 🔲 {spørsmål 2}

---
*Sist oppdatert: {dato} | Neste: [01_brukere](./01-funksjonell-beskrivelse/01_brukere.md)*
```

---

## Tips

- Hold formålsbeskrivelsen kort og ikke-teknisk — den skal kunne leses av ledere og jurister
- `Sikkerhetsgradering` settes foreløpig basert på det brukeren oppgir; den formelle vurderingen gjøres i modul 12 (verdivurdering-sikkerhetsgradering, sikkerhetsloven kap. 5 og 6) og oppdaterer dette feltet
- Marker alt som er ukjent med `🔲 Ikke kartlagt` — ikke la det stoppe fremdriften
- Spør til slutt: *"Vil du fortsette med Modul 02 (Brukere), eller er det noe her som skal justeres?"*
