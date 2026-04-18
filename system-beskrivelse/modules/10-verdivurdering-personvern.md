# Modul 10 – Personvernvurdering (GDPR)

**Produserer:** `{systemnavn}/03-vurderinger/03_verdivurdering-personvern.md`  
**Avhenger av:** `01_funksjoner.md`, `02_informasjonsmodell.md`, `02_drift.md`  
**Neste steg:** 03_verdivurdering-automatiserte-beslutninger.md

> Denne modulen bruker behandlingsaktivitetene fra Funksjoner-modulen (`04-funksjoner.md`) og
> informasjonsmodellen (`03-informasjonsmodell.md`) direkte. Kjør disse først.

---

## Formål

Kartlegg personvernmessige forhold ved systemet: behandlingsgrunnlag, 
lagringstid, de registrertes rettigheter, og om det er behov for en 
fullstendig DPIA (Data Protection Impact Assessment / Personvernkonsekvensvurdering).

Dette er ikke en fullstendig DPIA — men det er en strukturert kartlegging 
som avdekker om DPIA er nødvendig og hva den må dekke.

---

## Spørsmål å stille brukeren

### Grunnleggende avklaring
- Behandler systemet **personopplysninger**? (navn, ID, adferd, helse, økonomi, lokasjon, ...)
- Hvem er **behandlingsansvarlig**? (organisasjonen som bestemmer formål og midler)
- Er det **databehandlere** involvert? (leverandører som behandler data på vegne av dere)
- Er det inngått **databehandleravtaler** med alle relevante leverandører?

### Per behandlingsaktivitet (fra Modul 03)
For hver aktivitet som involverer persondata — spør:
- Hva er **behandlingsgrunnlaget**? (se kategorier nedenfor)
- Hva er **formålet** med behandlingen?
- Hva er **lagringstiden**? (og hva er begrunnelsen for denne?)
- Hvem har **tilgang** til personopplysningene?
- Overføres data til **tredjeland** (utenfor EØS)?

### Behandlingsgrunnlag (GDPR artikkel 6 og 9)
Hjelp brukeren å identifisere riktig grunnlag:

**Artikkel 6 – alminnelige personopplysninger:**
- **6(1)(a)** – Samtykke fra den registrerte
- **6(1)(b)** – Oppfyllelse av avtale med den registrerte
- **6(1)(c)** – Rettslig forpliktelse
- **6(1)(d)** – Vitale interesser
- **6(1)(e)** – Allmennhetens interesse / offentlig myndighetsutøvelse

**Artikkel 9 – særlige kategorier (krever tilleggsgrunnlag):**
- Helse, genetikk, biometri, rase/etnisitet, politikk, religion, fagforeningsmedlemskap, seksuell orientering

**Sektorspesifikt (norsk lovgivning):**
- Helseregisterloven, Pasientjournalloven, Helsepersonelloven, Arkivloven m.fl.

### De registrertes rettigheter
- Er det rutiner for å håndtere **innsyn, retting og sletting**?
- Kan den registrerte **trekke samtykke** dersom samtykke er grunnlaget?
- Er det mekanismer for **dataportabilitet**?
- Er det **automatiserte beslutninger** (inkl. profilering) som den registrerte kan motsette seg?

### DPIA-vurdering
Systemet bør vurderes for fullstendig DPIA hvis noen av disse gjelder:
- [ ] Systematisk overvåking av offentlig tilgjengelig område
- [ ] Behandling i stor skala av særlige kategorier persondata
- [ ] Automatiserte beslutninger med rettslig eller tilsvarende virkning
- [ ] Profilering som danner grunnlag for beslutninger om personer
- [ ] Bruk av ny teknologi eller ny bruk av eksisterende teknologi (f.eks. AI)
- [ ] Behandling som kan medføre høy risiko for de registrertes rettigheter

---

## Output-format

Skriv filen `{systemnavn}/03-vurderinger/03_verdivurdering-personvern.md` med denne strukturen:

```markdown
# {Systemnavn} – Personvernvurdering

*Kartlegging av GDPR-relevante forhold. Erstatter ikke en fullstendig DPIA.*

## Behandlingsansvar og databehandlere

| Rolle | Organisasjon | Avtale på plass |
|-------|-------------|----------------|
| Behandlingsansvarlig | {organisasjon} | N/A |
| Databehandler | {leverandør} | Ja/Nei/🔲 |
| Underdatabehandler | | |

**Personvernombud:** {navn/rolle, eller "Ikke utpekt"}

## Behandlingsaktiviteter med persondata

*Hentet fra [01_funksjoner](../01-funksjonell-beskrivelse/01_funksjoner.md)*

### A1 – {Aktivitetsnavn}

| Aspekt | Innhold |
|--------|---------|
| Persondata som behandles | {kategori og konkret beskrivelse} |
| Særlige kategorier (art. 9) | Ja ({hvilke}) / Nei |
| Behandlingsgrunnlag | GDPR art. {6(1)(x)} – {beskrivelse} |
| Supplerende grunnlag (art. 9) | {hvis aktuelt} |
| Norsk lovhjemmel | {hvis aktuelt, f.eks. Helseregisterloven §x} |
| Formål | {konkret og avgrenset formål} |
| Lagringstid | {periode eller policy} |
| Begrunnelse for lagringstid | {lovkrav, formål oppfylt, annet} |
| Sletterutine | {automatisk/manuell, hvem, når} |
| Overføring til tredjeland | Ja ({land, grunnlag}) / Nei |
| Tilgang | {hvilke roller har tilgang} |

---

### A2 – {Aktivitetsnavn}

{gjenta struktur}

---

## Sammendragstabell – behandlingsgrunnlag

| Aktivitet | Persondata | Særlige kategorier | Grunnlag | Lagringstid |
|-----------|-----------|-------------------|----------|-------------|
| A1 – {navn} | | Ja/Nei | art. 6(1)({x}) | |
| A2 – {navn} | | | | |

## De registrertes rettigheter

| Rettighet | Rutine på plass | Ansvarlig | Merknad |
|-----------|----------------|-----------|---------|
| Innsyn (art. 15) | Ja/Nei/🔲 | | |
| Retting (art. 16) | | | |
| Sletting (art. 17) | | | |
| Begrensning (art. 18) | | | |
| Dataportabilitet (art. 20) | | | |
| Innsigelse (art. 21) | | | |
| Manuell overprøving av automatiserte beslutninger (art. 22) | Vurderes i [03_verdivurdering-automatiserte-beslutninger](./03_verdivurdering-automatiserte-beslutninger.md) | | |

## DPIA-vurdering

**Konklusjon:** {DPIA er nødvendig / DPIA er ikke nødvendig / Uavklart}

Gjeldende DPIA-kriterier (kryss av det som gjelder):
- [ ] Systematisk overvåking i stor skala
- [ ] Særlige kategorier persondata i stor skala  
- [ ] Automatiserte beslutninger med rettslig virkning
- [ ] Ny teknologi eller ny bruk (f.eks. AI i produksjon)
- [ ] Profilering som basis for beslutninger

**Begrunnelse:** {Kortfattet vurdering}

**Neste steg:** {Igangsett DPIA / Ikke nødvendig / Vurderes på nytt ved endring}

## Åpne spørsmål og risikoer

| Spørsmål/Risiko | Alvorlighet | Eier | Status |
|----------------|-------------|------|--------|
| 🔲 {ukjent lagringstid for X} | | | |
| 🔲 {manglende databehandleravtale med Y} | | | |

---
*Sist oppdatert: {dato} | Forrige: [03_verdivurdering-kit](./03_verdivurdering-kit.md) | Neste: [03_verdivurdering-automatiserte-beslutninger](./03_verdivurdering-automatiserte-beslutninger.md)*  
*GDPR-referanser: [Datatilsynet.no](https://www.datatilsynet.no)*
```

---

## Tips

- **Behandlingsgrunnlaget må foreligge før behandlingen starter** — ikke i etterkant
- For offentlige organer: artikkel 6(1)(f) (berettiget interesse) gjelder vanligvis **ikke**
- AI-systemer som tar beslutninger med konsekvenser for personer: artikkel 22 er ofte aktuell
- Lagringstid "så lenge vi trenger det" er **ikke** tilstrekkelig — formålet må avgrense tiden
- Manglende databehandleravtale er en vanlig svakhet — spesielt for skybaserte AI-tjenester
- Spør til slutt: *"Er du klar til å generere README.md med sammendrag av alle moduler?"*
