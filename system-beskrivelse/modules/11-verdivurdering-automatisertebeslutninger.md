# Modul 11 – Vurdering: Automatiserte beslutninger

**Produserer:** `{systemnavn}/03-vurderinger/3.4-verdivurdering-automatiserte-beslutninger.md`
**Avhenger av:** `1.2-funksjoner.md`, `2.2-informasjonsmodell.md`
**Neste modul:** 3.5-trusselvurdering.md

> Kjør Modul 03 (Funksjoner) og 05 (Informasjonsmodell) før denne.

---

## Formål

Kartlegg om systemet tar beslutninger — eller bidrar til beslutninger —
uten meningsfull menneskelig kontroll, og hvilke konsekvenser dette kan ha
for enkeltpersoner.

Modulen dekker tre nivåer:
1. **Systemets egne beslutninger** — hva systemet gjør autonomt
2. **Beslutningsstøtte** — data eller utdata systemet leverer som grunnlag for andre
3. **GDPR art. 22** — om noen av beslutningene utløser rettighetsplikt overfor de registrerte

---

## Fremgangsmåte

Gå gjennom behandlingsaktivitetene fra Modul 03. For hver aktivitet:
- Avgjør **beslutningstypen** (se skala nedenfor)
- Beskriv **konsekvensen** for enkeltpersoner
- Vurder **menneskelig kontroll** (ingen / i etterkant / godkjenning før utførelse)
- Konkluder på **art. 22-relevans**

### Beslutningsskala

| Nivå | Beskrivelse | Eksempel |
|------|-------------|---------|
| Ingen beslutning | Systemet kopierer, lagrer eller videresender data uten å tolke dem | Synkronisering av folkeregisterdata |
| Beslutningsstøtte | Systemet leverer data som mennesker bruker som grunnlag for beslutninger | Populasjonsliste for innkallingsregister |
| Automatisert anbefaling | Systemet rangerer, filtrerer eller foreslår uten å beslutte | Risikoskår, prioriteringsliste |
| Autonom beslutning | Systemet beslutter og handler uten menneskelig involvering | Avslag på søknad, utsendelse av brev |

### Art. 22 – når er det aktuelt?

GDPR art. 22 gjelder når **alle tre** vilkår er oppfylt:
1. Beslutningen er **utelukkende automatisert** (ingen meningsfull menneskelig vurdering)
2. Beslutningen **produserer rettslig virkning** eller tilsvarende vesentlig påvirkning
3. Beslutningen gjelder en **enkeltperson** (ikke statistikk eller aggregat)

---

## Output-format

```markdown
# {Systemnavn} – Automatiserte beslutninger

*Basert på behandlingsaktiviteter fra [1.2-funksjoner](../beskrivelse/01-funksjonell%20beskrivelse/1.2-funksjoner.md).*

## Oversikt

| Aktivitet | Beslutningstype | Konsekvens for person | Art. 22 aktuell |
|-----------|----------------|-----------------------|----------------|
| A1 – {navn} | Ingen / Støtte / Anbefaling / Autonom | {beskrivelse} | Ja / Nei |

---

## Vurdering per aktivitet

### A1 – {Aktivitetsnavn}

**Beslutningstype:** {fra skalaen over}

**Beskrivelse:** {Hva gjør systemet, og hva skjer med resultatet?}

| Aspekt | Vurdering |
|--------|-----------|
| Menneskelig kontroll | Ingen / I etterkant / Godkjenning før utførelse |
| Konsekvens for enkeltperson | {direkte / indirekte / ingen} |
| Kan person motsette seg? | Ja / Nei / Ikke aktuelt |
| Art. 22 aktuell | Ja / Nei — {begrunnelse} |

**Særlige hensyn:** {Risiko, mangler, anbefalinger}

---

## Samlet vurdering

**Systemets beslutningsprofil:** {Passiv videreformidling / Beslutningsstøtte / Blanding}

**Art. 22-konklusjon:** {Ingen aktiviteter utløser art. 22 / Følgende aktiviteter må vurderes nærmere: ...}

**Anbefalinger:**
- {tiltak 1}
- {tiltak 2}

---
*Sist oppdatert: {dato} | Forrige: [3.3-verdivurdering-personvern](./3.3-verdivurdering-personvern.md) | Neste: [3.5-trusselvurdering](./3.5-trusselvurdering.md)*
```

---

## Tips

- **Beslutningsstøtte er ikke det samme som ingen beslutning** — data som avgjør hvem som innkalles til helseundersøkelse har reell konsekvens selv om et menneske trykker "send"
- Art. 22 krever *utelukkende* automatisert beslutning — ett menneskelig steg bryter vilkåret, men steg uten reell overprøving teller ikke
- For AI-systemer: vurder om modellen selv er en beslutningskomponent
- Spør til slutt: *"Vil du fortsette med 3.5-trusselvurdering.md, eller er det noe her som skal justeres?"*
