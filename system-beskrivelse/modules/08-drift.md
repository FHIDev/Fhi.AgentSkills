# Modul 10 – Operasjonell Drift

**Produserer:** `{systemnavn}/drift/10-drift.md`  
**Avhenger av:** `01-oversikt.md`, `04-komponenter.md`  
**Neste modul:** README.md (avsluttende oppsummering) 

---

## Formål

Kartlegg hvordan systemet driftes, hvilke miljøer som finnes, 
hvem som er ansvarlig for hva, og hvilke krav som stilles til 
tilgjengelighet og beredskap. Dette er grunnlaget for 
tilgjengelighetsvurdering (T i KIT) og hendelseshåndtering.

---

## Spørsmål å stille brukeren

### Miljøer
- Hvilke **miljøer** finnes? (dev, test, staging, produksjon, sandbox)
- Er miljøene **isolert fra hverandre** nettverksmessig?
- Brukes **produksjonsdata** i test- eller dev-miljøer?
- Hvem har tilgang til **produksjonsmiljøet**?

### Drift og ansvar
- Hvem **drifter** systemet — intern IT, leverandør, eller en kombinasjon?
- Er det en **driftsavtale (SLA)** med leverandør?
- Hvem kontaktes ved **tekniske problemer**? (support-linje, kontaktperson)
- Er det **vaktordning** for kritiske feil utenfor arbeidstid?

### Tilgjengelighet og ytelse
- Hva er krav til **oppetid**? (f.eks. 99,5 % i kontortid)
- Hva er **akseptabel nedetid** per hendelse? (RTO – Recovery Time Objective)
- Hva er **akseptabelt datatap** ved en hendelse? (RPO – Recovery Point Objective)
- Er det **planlagte vedlikeholdsvinduer**?

### Oppdatering og endringshåndtering
- Hvordan håndteres **oppdateringer** — automatisk, manuelt, planlagt?
- Er det en **endringsprosess** (change management) for produksjonsmiljøet?
- Hvem **godkjenner** endringer i produksjon?
- Er det **versjonskontroll** på konfigurasjon og kode?

### Hendelseshåndtering
- Finnes det en **beredskapsplan** eller prosedyre for sikkerhetshendelser?
- Er det definert hvem som varsles ved **brudd på personvern** (GDPR-brudd)?
- Hvem har **myndighet til å stenge** systemet ved en alvorlig hendelse?
- Er det **øvelser** på beredskapsplanene?

### Overvåking
- Hva **overvåkes** i systemet? (oppetid, ytelse, feil, sikkerhetshendelser)
- Hvem **mottar varsler** ved avvik?
- Er det **sentralisert logging** og SIEM?

---

## Output-format

Skriv filen `{systemnavn}/drift/06-drift.md` med denne strukturen:

```markdown
# Operasjonell Drift

## Miljøoversikt

| Miljø | Formål | Isolert fra prod | Prod-data tillatt | Hvem har tilgang |
|-------|--------|-----------------|------------------|-----------------|
| Produksjon | Produksjonsdrift | N/A | N/A | |
| Test | Funksjonell testing | Ja/Nei/🔲 | Ja/Nei/🔲 | |
| Dev | Utvikling | Ja/Nei/🔲 | Ja/Nei/🔲 | |
| Sandbox | | | | |

## Driftsansvar

| Rolle | Ansvarlig | Kontakt | Tilgjengelighet |
|-------|-----------|---------|----------------|
| Driftsansvarlig | | | Arbeidstid / 24/7 |
| Teknisk kontakt (leverandør) | | | |
| Sikkerhetsansvarlig | | | |
| Brukeradministrasjon | | | |

**Driftsavtale (SLA):** {Leverandørnavn og avtalereferanse, eller "Ingen formell avtale"}

## Tilgjengelighetskrav

| Parameter | Krav | Aktuell ytelse |
|-----------|------|----------------|
| Oppetid (SLA) | {f.eks. 99,5 %} | 🔲 |
| Planlagt vedlikeholdsvindu | {f.eks. søndager 02–06} | |
| RTO (maks nedetid ved hendelse) | | |
| RPO (maks akseptabelt datatap) | | |

## Oppdatering og endringshåndtering

| Aspekt | Beskrivelse |
|--------|-------------|
| Oppdateringsstrategi | {Automatisk / Manuell / Planlagt} |
| Godkjenningsprosess | {Hvem godkjenner endringer i produksjon?} |
| Versjonskontroll | {Git / Ingen / 🔲} |
| Deploy-pipeline | {CI/CD-verktøy eller manuelt} |

## Overvåking og logging

| Hva overvåkes | Verktøy/Metode | Varsling til | Oppbevaringstid |
|--------------|---------------|-------------|----------------|
| Oppetid | | | |
| Feilmeldinger | | | |
| Sikkerhetslogger | | | |
| Brukeraktivitet | | | |

## Beredskap og hendelseshåndtering

**Beredskapsplan:** {Finnes / Finnes ikke / Under utarbeidelse}  
**Referanse:** {Lenke eller dokumentnavn}

| Hendelsestype | Ansvarlig | Varslingsprosess | Myndighet til å stenge |
|--------------|-----------|-----------------|----------------------|
| Teknisk feil | | | |
| Sikkerhetsbrudd | | | |
| GDPR-brudd | | | |
| Datakorrupsjon | | | |

**Varslingsplikt ved personvernbrudd:** GDPR artikkel 33 krever varsling til 
Datatilsynet innen 72 timer. Ansvarlig: {navn/rolle}

## Backup og gjenoppretting

| Datatype | Backup-frekvens | Lagringssted | Testet | Retensjonstid |
|----------|----------------|-------------|--------|---------------|
| | | | Ja/Nei/🔲 | |

---
*Sist oppdatert: {dato} | Forrige: [05-informasjonsmodell](../arkitektur/05-informasjonsmodell.md) | Neste: [07-kit-verdivurdering](../vurderinger/07-kit-verdivurdering.md)*
```

---

## Tips

- **Produksjonsdata i testmiljø** er et veldig vanlig personvernproblem — vær eksplisitt
- RTO og RPO er ofte ukjent — det er viktig informasjon å avdekke, selv om svaret er "ikke definert"
- 72-timersregelen for GDPR-varsling er absolutt — sjekk at noen eier dette ansvaret
- Spør til slutt: *"Vil du fortsette med Modul 07 (KIT-verdivurdering) eller 08 (Personvern)?"*
