---
name: system-beskrivelse
description: >
  Lag en strukturert systembeskrivelsesfolder med Markdown-filer for et IKT-system, 
  verktøy eller tjeneste. Skillen orkestrerer et sett modulære arbeidsrunder 
  som til sammen produserer en komplett systemdokumentasjon — brukt som felles grunnlag 
  for risikovurdering, personvernvurdering, onboarding og arkitekturarbeid.

  Trigger ved: "beskriv systemet", "lag systemdokumentasjon", "systembeskriving", 
  "dokumenter arkitektur", "hvem bruker systemet", "hvilke komponenter", 
  "behandlingsaktiviteter", "lag en systemfolder", "dokumenter et nytt verktøy", 
  "vi skal vurdere et system", eller når brukeren vil kartlegge et system før 
  risikovurdering eller personvernvurdering.

  Produserer: en mappe {systemnavn}/ med én MD-fil per modul, organisert i
  beskrivelse/ og vurderinger/.
---

# System beskrivelse – Modulær Systemdokumentasjon

Skillen koordinerer modulære arbeidsrunder som produserer strukturert dokumentasjon av system/tjeneste og vurderinger av systemet/tjenesten.
Filene er organisert i to mapper: **beskrivelse** (hva er systemet) og **vurderinger** (hva er risikoen).

Modul 03 (Funksjoner) er navet — alle vurderingsmoduler refererer tilbake til behandlingsaktivitetene der.
Vurderingsmodulene annoterer også 03-funksjoner.md med klassifiseringer (KIT-nivå, GDPR-grunnlag).

---

## Prosessen

![](sikkerhetsprosess_illustrasjon_v8.svg)

## Mappestruktur

```
{systemnavn}/
├── 01-oversikt.md
├── beskrivelse/
│   ├── 01-funksjonell beskrivelse/
│   │   ├── 02-brukere.md           ← Brukergrupper, roller, tilgangsnivåer.
│   │   └── 03-funksjoner.md        ← KJERNEN. Behandlingsaktiviteter. Oppdateres med KIT og GDPR-grunnlag.
│   └── 02-teknisk beskrivelse/
│       ├── 04-komponenter.md        ← Tekniske komponenter, infrastruktur.
│       ├── 05-informasjonsmodell.md ← Logisk modell: informasjonsobjekter og attributter.
│       ├── 06-datamodell.md         ← Lagringsmodeller og entiteter.
│       ├── 07-dataflyt.md           ← Hvordan data flyter mellom komponenter.
│       └── 08-drift.md              ← Miljøer, SLA, beredskap, avhengigheter.
└── vurderinger/
    ├── verdivurdering-sikkerhetsgradering.md        ← Sikkerhetsloven kap. 5 og 6. Oppdaterer 01-oversikt.
    ├── verdivurdering-kit.md                        ← NSM KIT per behandlingsaktivitet.
    ├── verdivurdering-personvern.md                 ← GDPR/DPIA per behandlingsaktivitet.
    ├── verdivurdering-automatiserte-beslutninger.md ← Art. 22-vurdering.
    ├── trusselvurdering.md                          ← Hvem kan angripe verdiene?
    └── sårbarhetsvurdering.md                       ← Svakheter, inkl. leverandøravhengigheter.
```

> `README.md` genereres sist i roten av `{systemnavn}/`.

---

## Arbeidsrekkefølge

```
Funksjonell beskrivelse:    01-oversikt → 02-brukere → 03-funksjoner
Teknisk beskrivelse:        04-komponenter → 05-informasjonsmodell → 06-datamodell → 07-dataflyt → 08-drift

Vurderinger (etter at beskrivelsen er på plass):
  verdivurdering-sikkerhetsgradering → verdivurdering-kit → verdivurdering-personvern
  → verdivurdering-automatiserte-beslutninger → trusselvurdering → sårbarhetsvurdering

Vurderingsmodulene oppdaterer:
  - verdivurdering-sikkerhetsgradering → 01-oversikt.md (Sikkerhetsgradering)
  - verdivurdering-kit og verdivurdering-personvern → 03-funksjoner.md (KIT-nivå, GDPR-grunnlag)
```

---

## Hvem gjør hva — og når

| Fase | Rolle | Moduler |
|------|-------|---------|
| Plan og design | Produkteier | 01-oversikt, 02-brukere, 03-funksjoner |
| Plan og design | Techlead + produkteier | 05-informasjonsmodell |
| Implementasjon | Techlead / utvikler | 04-komponenter, 06-datamodell, 07-dataflyt |
| Drift | Techlead / utvikler | 08-drift |
| Vurdering | Sikkerhetsansvarlig | verdivurdering-sikkerhetsgradering |
| Vurdering | Techlead + sikkerhetsansvarlig | verdivurdering-kit, trusselvurdering, sårbarhetsvurdering |
| Vurdering | Techlead + personvernombud | verdivurdering-personvern, verdivurdering-automatiserte-beslutninger |

---

## Modulinstruksjoner

| Modul | Instruksjonsfil | Les når... |
|-------|----------------|-----------|
| 01 Oversikt | `modules/01-oversikt.md` | Starter nytt system |
| 02 Brukere | `modules/02-brukere.md` | Kartlegger hvem som bruker systemet |
| 03 Funksjoner | `modules/04-funksjoner.md` | Kartlegger behandlingsaktiviteter |
| 04 Komponenter | `modules/05-komponenter.md` | Kartlegger teknisk arkitektur, komponenter og infrastruktur |
| 05 Informasjonsmodell | `modules/03-informasjonsmodell.md` | Logisk modell over informasjonselementer |
| 06 Datamodell | `modules/06-datamodell.md` | Kartlegger lagringsmodeller og entiteter |
| 07 Dataflyt | `modules/07-dataflyt.md` | Kartlegger hvordan data flyter mellom komponenter |
| 08 Drift | `modules/08-drift.md` | Kartlegger miljøer og driftskrav |
| Verdivurdering Sikkerhetsgradering | `modules/12-verdivurdering-sikkerhetsgradering.md` | Sikkerhetsloven kap. 5 og 6 — oppdaterer 01-oversikt |
| Verdivurdering KIT | `modules/09-verdivurdering-kit.md` | NSM KIT-vurdering — oppdaterer 03-funksjoner |
| Verdivurdering Personvern | `modules/10-verdivurdering-personvern.md` | GDPR/DPIA — oppdaterer 03-funksjoner |
| Verdivurdering Automatiserte beslutninger | `modules/11-verdivurdering-automatisertebeslutninger.md` | Art. 22-vurdering |
| Trusselvurdering | `modules/13-trusselvurdering.md` | Kartlegger trusselaktører og angrepsvektorer |
| Sårbarhetsvurdering | 🔲 Ikke laget ennå | Kartlegger svakheter og leverandørrisiko |
| README (avslutning) | `modules/00-readme-generator.md` | Genererer sammendrag når moduler er ferdige |
| Konsistensgjennomgang | `modules/00-review.md` | Kjøres etter at ønskede moduler er ferdig — sjekker konsistens på tvers av alle filer |

---

## Generelle prinsipper

- **Vær konkret** — bruk systemets faktiske navn, ikke generiske plassholdere
- **Vær konsistent** — referer til samme komponent, rolle eller aktivitet med samme navn gjennom alle moduler
- **Vær eksplisitt** — ikke anta at leseren vet hva en "komponent" eller "behandlingsaktivitet" er — beskriv det i klartekst
- **Still spørsmål til brukeren om det som er uklart** — det er bedre å ha en ufullstendig beskrivelse enn en feilaktig en
- **Ufullstendig er OK** — marker ukjent informasjon med `🔲 Ikke kartlagt`
- **Modul 03 er nøkkelen** — behandlingsaktivitetene brukes i alle vurderingsmoduler
- **Vurderinger annoterer 03-funksjoner** — KIT-nivå og GDPR-grunnlag føres tilbake til oversiktstabellen
- **README genereres sist** — når alle ønskede moduler er ferdig
- Spør alltid: *"Vil du fortsette med neste modul, eller er det noe her som skal justeres først?"*

@~/.claude/skills/system-beskrivelse/shared/diagram-c4.md
