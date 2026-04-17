# Modul 12 – Verdivurdering: Sikkerhetsgradering (sikkerhetsloven)

**Produserer:** `{systemnavn}/03-vurderinger/03_verdivurdering-sikkerhetsgradering.md`  
**Avhenger av:** `00_oversikt.md`, `01_funksjoner.md`, `02_informasjonsmodell.md`  
**Oppdaterer:** `00_oversikt.md` → feltet `Sikkerhetsgradering`  
**Hjemmel:** Sikkerhetsloven §§ 5-1 – 5-4 (kapittel 5) og §§ 6-1 – 6-5 (kapittel 6)

---

## Formål

Vurder om systemet behandler **sikkerhetsgradert informasjon** (kapittel 5), og om systemet
selv er et **skjermingsverdig objekt eller infrastruktur** (kapittel 6).

Resultatet oppdaterer `Sikkerhetsgradering`-feltet i `00_oversikt.md` og
dokumenteres som en begrunnet vurdering i denne filen.

> **Merk:** Sikkerhetsloven gjelder for virksomheter underlagt loven (§ 1-3).
> Dersom virksomheten ikke er underlagt sikkerhetsloven, skal dette fremgå — men
> Beskyttelsesinstruksen-gradering kan likevel dokumenteres i oversikten.

---

## Del 1 – Sikkerhetsgradert informasjon (kapittel 5)

### Spørsmål å stille

- Behandler systemet informasjon som, hvis det **kommer på avveie**, kan **skade
  nasjonale sikkerhetsinteresser** — inkl. forsvarsevne, beredskap eller kritisk
  samfunnsinfrastruktur? (§ 5-1)
- Behandler systemet informasjon om **sikkerhetsgraderte systemer, operasjoner,
  installasjoner eller personer**?
- Er det informasjon som er mottatt gradert fra andre virksomheter eller myndigheter?
- Hvem har vurdert og besluttet eventuell gradering? (§ 5-4 — ansvar hos den som produserer informasjonen)

### Graderingsnivåer (§ 5-2)

| Nivå | Norsk betegnelse | Internasjonal ekvivalent | Terskel |
|------|-----------------|--------------------------|---------|
| 4 | STRENGT HEMMELIG | TOP SECRET | Kan volde alvorlig skade |
| 3 | HEMMELIG | SECRET | Kan volde betydelig skade |
| 2 | KONFIDENSIELT | CONFIDENTIAL | Kan volde skade |
| 1 | BEGRENSET | RESTRICTED | Kan volde begrenset skade |
| 0 | (Ugradert) | UNCLASSIFIED | Ikke underlagt gradering |

> Gradering skal settes til **lavest nødvendig nivå** (§ 5-3).

---

## Del 2 – Skjermingsverdig objekt og infrastruktur (kapittel 6)

### Spørsmål å stille

- Er systemet eller infrastrukturen det kjører på **av grunnleggende nasjonal betydning**
  for statens evne til å ivareta nasjonale sikkerhetsinteresser? (§ 6-1)
- Ville bortfall, kompromittering eller manipulering av systemet **vesentlig svekke**
  nasjonal sikkerhet, forsvarsevne, beredskap eller kritiske samfunnsfunksjoner?
- Er systemet allerede **utpekt som skjermingsverdig** av ansvarlig departement eller NSM?
- Hvilken **beskyttelseskategori** er eventuelt fastsatt? (§ 6-3: KRITISK / HØYT / LAVT)

---

## Output-format

```markdown
# Verdivurdering: Sikkerhetsgradering

**Hjemmel:** Sikkerhetsloven kapittel 5 og 6  
**Dato:** {dato}  
**Gjennomført av:** {rolle(r)}

---

## Del 1 – Sikkerhetsgradert informasjon (kap. 5)

**Er virksomheten underlagt sikkerhetsloven?** Ja / Nei / 🔲

**Behandler systemet sikkerhetsgradert informasjon?** Ja / Nei

| Vurderingspunkt | Vurdering |
|----------------|-----------|
| Informasjon som kan skade nasjonale sikkerhetsinteresser (§ 5-1) | Ja / Nei — {begrunnelse} |
| Mottatt gradert informasjon fra annen virksomhet | Ja / Nei |
| Ansvar for gradering avklart (§ 5-4) | Ja / Nei / Ikke aktuelt |

**Konklusjon kapittel 5:**

> {Ugradert / BEGRENSET / KONFIDENSIELT / HEMMELIG / STRENGT HEMMELIG}
>
> {Begrunnelse — 2–4 setninger som forklarer vurderingen.}

---

## Del 2 – Skjermingsverdig objekt/infrastruktur (kap. 6)

**Er systemet utpekt som skjermingsverdig?** Ja / Nei / Under vurdering

| Vurderingspunkt | Vurdering |
|----------------|-----------|
| Grunnleggende nasjonal betydning (§ 6-1) | Ja / Nei — {begrunnelse} |
| Bortfall/manipulering svekker nasjonale funksjoner vesentlig | Ja / Nei |
| Utpekt av departement/NSM | Ja / Nei / Ikke kartlagt |

**Beskyttelseskategori (§ 6-3):** KRITISK / HØYT / LAVT / Ikke aktuelt

**Konklusjon kapittel 6:**

> {Kort begrunnelse}

---

## Samlet sikkerhetsgradering

| Felt | Verdi |
|------|-------|
| Gradering (kap. 5) | {Ugradert / BEGRENSET / …} |
| Skjermingsverdig (kap. 6) | {Ja — kategori / Nei} |
| Beskyttelsesinstruksen | {Åpen / Intern / Skjermet / Strengt fortrolig} |
| Fastsatt av | {rolle} |
| Dato | {dato} |
| Neste revisjon | {dato eller hendelse} |

> Feltet `Sikkerhetsgradering` i `00_oversikt.md` oppdateres med konklusjonen ovenfor.

---
*Sist oppdatert: {dato} | Relatert: [00_oversikt](../00_oversikt.md) | [03_verdivurdering-kit](./03_verdivurdering-kit.md)*
```

---

## Tips

- Sikkerhetsloven kap. 5 gjelder primært informasjon knyttet til **nasjonal sikkerhet** — de fleste
  helse-IT-systemer vil konkludere med "ugradert" etter § 5-1, men vurderingen skal likevel gjøres
  og dokumenteres
- Kap. 6 er aktuelt for systemer som er **kritisk samfunnsinfrastruktur** (f.eks. helseregistre med
  nasjonal beredskapsrolle) — men ikke for interne fagsystemer
- Beskyttelsesinstruksen (Intern / Skjermet) er ikke sikkerhetsloven-gradering, men dokumenteres
  i samme tabell for å gi et komplett bilde
- Dersom virksomheten **ikke er underlagt sikkerhetsloven** (§ 1-3), dokumenter dette eksplisitt
  — da gjelder kun Beskyttelsesinstruksen og GDPR-klassifisering
- Spør til slutt: *"Vil du fortsette med neste vurderingsmodul, eller er det noe her som skal justeres?"*
