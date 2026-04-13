# Modul 08 – KIT-verdivurdering

**Produserer:** `{systemnavn}/vurderinger/07-kit-verdivurdering.md`  
**Avhenger av:** `03-funksjoner.md` (behandlingsaktiviteter), `05-informasjonsmodell.md`  
**Neste modul:** 08-personvern

> Denne modulen bruker behandlingsaktivitetene fra Modul 03 direkte.
> Kjør Modul 03 før denne.

---

## Formål

Gjennomfør en KIT-klassifisering (Konfidensialitet, Integritet, Tilgjengelighet) 
per behandlingsaktivitet, i tråd med NSM trekantmodell. 
Resultatet er grunnlaget for trusselvurdering og sårbarhetsvurdering.

For detaljert KIT-skala, les: `../references/kit-skala.md`

---

## Fremgangsmåte

1. Hent listen over behandlingsaktiviteter fra `03-funksjoner.md`
2. For **hver aktivitet** — gå gjennom K, I og T med brukeren
3. Still kontrollspørsmålene for hvert nivå (se nedenfor)
4. Sett nivå og skriv en konkret begrunnelse
5. Beregn samlet konsekvens og systemklassifisering

---

## Kontrollspørsmål per dimensjon

### Konfidensialitet (K) — "Hva skjer om denne informasjonen kommer på avveie?"
- **Lav:** Bare ulempe for noen få, ingen personvern- eller sikkerhetskonsekvenser
- **Moderat:** Personvernskrenkelse for enkeltpersoner, begrenset omdømmeskade
- **Høy:** Store personvernskader, negativ nasjonal omtale, store økonomiske tap
- **Alvorlig:** Liv og helse truet, sensitiv helseinformasjon for mange, trussel mot nasjonal sikkerhet

### Integritet (I) — "Hva skjer om dataene endres uten at noen oppdager det?"
- **Lav:** Ingen synlig effekt, kan enkelt rettes
- **Moderat:** Feil i enkeltvedtak eller enkeltpersoners data
- **Høy:** Feil i data som gir feil utbetalinger eller vedtak for mange
- **Alvorlig:** Liv og helse truet (feil helseinfo, giftige råd), straffesaker, nasjonal sikkerhet

### Tilgjengelighet (T) — "Hva skjer om systemet er nede i [X timer]?"
- **Lav:** Under 5 min forsinkelse, ingen vesentlig påvirkning
- **Moderat:** Noen minutter til 1 time nedetid, håndterbart
- **Høy:** 1–6 timer nedetid, redusert tjenesteleveranse, store kostnader
- **Alvorlig:** Over 6 timer, bortfall av essensielle tjenester, samfunnskonsekvenser

---

## Output-format

Skriv filen `{systemnavn}/vurderinger/07-kit-verdivurdering.md` med denne strukturen:

```markdown
# {Systemnavn} – KIT-verdivurdering (NSM)

*Behandlingsaktiviteter hentet fra 
[03-funksjoner](../funksjoner/03-funksjoner.md).*

## Overordnet systemvurdering

| Dimensjon | Nivå | Begrunnelse |
|-----------|------|-------------|
| Konfidensialitet | | |
| Integritet | | |
| Tilgjengelighet | | |
| **Samlet konsekvens** | **{høyeste}** | |

**Sikkerhetsgradering:** {Åpen / Intern / Skjermet / Strengt hemmelig}

---

## KIT per behandlingsaktivitet

### A1 – {Aktivitetsnavn}

| Dimensjon | Nivå | Begrunnelse |
|-----------|------|-------------|
| Konfidensialitet | | |
| Integritet | | |
| Tilgjengelighet | | |
| **Samlet** | **{høyeste}** | |

**Informasjonsverdier:** {hentet fra 03-funksjoner}  
**Særlige hensyn:** {f.eks. AI-kontekstvindu, tredjepartseksponering, kritiske data}

---

### A2 – {Aktivitetsnavn}

{gjenta struktur}

---

## Sammendragstabell

| Aktivitet | K | I | T | Samlet | Kritiske hensyn |
|-----------|---|---|---|--------|----------------|
| A1 – {navn} | | | | | |
| A2 – {navn} | | | | | |

## Verdier og samlet eksponeringsflate

{Oppsummer hvilke informasjonsverdier som er mest kritiske, 
og hva som driver den samlede klassifiseringen.}

## Anbefalte neste steg

- **Trusselvurdering:** Hvem kan ønske å angripe disse verdiene?
- **Sårbarhetsvurdering:** Hvilke svakheter kan utnyttes?
- **Personvern:** Se [08-personvern](./08-personvern.md) for GDPR-analyse

---
*Metodikk: NSM trekantmodell – [nsm.no](https://nsm.no)*  
*Sist oppdatert: {dato} | Forrige: [06-drift](../drift/06-drift.md) | Neste: [08-personvern](./08-personvern.md)*
```

---

## Oppdater 03-funksjoner.md

Etter at KIT-vurderingen er ferdig, **oppdater KIT-kolonnen i oversiktstabellen i `03-funksjoner.md`**
slik at hver rad lenker til riktig aktivitet i vurderingsfilen:

```markdown
| [K:Alvorlig I:Høy T:Lav](../vurderinger/verdivurdering-kit.md#a1) |
```

Bruk anker som matcher aktivitetens overskrift i vurderingsfilen (`#a1`, `#a2` osv.).

---

## Oppdater 01-oversikt.md

Etter at KIT-vurderingen er ferdig, **legg til Sammendragstabell i `01-oversikt.md` på slutten av Oversikt seksjonen**

---
## Tips

- Klassifiser **per aktivitet** — ikke systemet som helhet i én runde
- Den samlede systemklassifiseringen er **den høyeste** enkeltklassifiseringen
- **Integritet** er ofte undervurdert — vær eksplisitt om hva som skjer ved feil i data
- For AI-systemer: vurder **kontekstvinduet** som en egen eksponeringsflate
- Spør til slutt: *"Vil du fortsette med Modul 08 (Personvern), eller er det noe her som skal justeres?"*
