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
  01-funksjonell-beskrivelse/, 02-teknisk-beskrivelse/ og 03-vurderinger/.
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
├── README.md
├── 00_oversikt.md
├── 01-funksjonell-beskrivelse/
│   ├── 01_brukere.md              ← Brukergrupper, roller, tilgangsnivåer.
│   ├── 01_roller-og-rettigheter.md ← Detaljert rolletabell og tilgangsnivåer.
│   └── 01_funksjoner.md           ← KJERNEN. Behandlingsaktiviteter. Oppdateres med KIT og GDPR-grunnlag.
├── 02-teknisk-beskrivelse/
│   ├── 02_komponenter.md        ← Tekniske komponenter, infrastruktur.
│   ├── 02_informasjonsmodell.md ← Logisk modell: informasjonsobjekter og attributter.
│   ├── 02_datamodell.md         ← Lagringsmodeller og entiteter.
│   ├── 02_dataflyt.md           ← Hvordan data flyter mellom komponenter.
│   └── 02_drift.md              ← Miljøer, SLA, beredskap, avhengigheter.
└── 03-vurderinger/
    ├── 03_verdivurdering-sikkerhetsgradering.md        ← Sikkerhetsloven kap. 5 og 6. Oppdaterer 00_oversikt.
    ├── 03_verdivurdering-kit.md                        ← NSM KIT per behandlingsaktivitet.
    ├── 03_verdivurdering-personvern.md                 ← GDPR/DPIA per behandlingsaktivitet.
    ├── 03_verdivurdering-automatiserte-beslutninger.md ← Art. 22-vurdering.
    ├── 03_trusselvurdering.md                          ← Hvem kan angripe verdiene?
    └── 03_sårbarhetsvurdering.md                       ← Svakheter, inkl. leverandøravhengigheter.
```

> `README.md` genereres sist i roten av `{systemnavn}/`.

---

## Arbeidsrekkefølge

```
Funksjonell beskrivelse:    00_oversikt → 01_brukere + 01_roller-og-rettigheter → 01_funksjoner
Teknisk beskrivelse:        02_komponenter → 02_informasjonsmodell → 02_datamodell → 02_dataflyt → 02_drift

Vurderinger (etter at beskrivelsen er på plass):
  03_verdivurdering-sikkerhetsgradering → 03_verdivurdering-kit → 03_verdivurdering-personvern
  → 03_verdivurdering-automatiserte-beslutninger → 03_trusselvurdering → 03_sårbarhetsvurdering

Vurderingsmodulene oppdaterer:
  - 03_verdivurdering-sikkerhetsgradering → 00_oversikt.md (Sikkerhetsgradering)
  - 03_verdivurdering-kit og 03_verdivurdering-personvern → 01_funksjoner.md (KIT-nivå, GDPR-grunnlag)
```

---

## Hvem gjør hva — og når

| Fase | Rolle | Moduler |
|------|-------|---------|
| Plan og design | Produkteier | 00_oversikt, 01_brukere + 01_roller-og-rettigheter, 01_funksjoner |
| Plan og design | Techlead + produkteier | 02_informasjonsmodell |
| Implementasjon | Techlead / utvikler | 02_komponenter, 02_datamodell, 02_dataflyt |
| Drift | Techlead / utvikler | 02_drift |
| Vurdering | Sikkerhetsansvarlig | 03_verdivurdering-sikkerhetsgradering |
| Vurdering | Techlead + sikkerhetsansvarlig | 03_verdivurdering-kit, 03_trusselvurdering, 03_sårbarhetsvurdering |
| Vurdering | Techlead + personvernombud | 03_verdivurdering-personvern, 03_verdivurdering-automatiserte-beslutninger |

---

## Modulinstruksjoner

| Modul | Instruksjonsfil | Outputsti |
|-------|----------------|-----------|
| 00 Oversikt | `modules/01-oversikt.md` | `00_oversikt.md` |
| 01 Brukere | `modules/02-brukere.md` | `01-funksjonell-beskrivelse/01_brukere.md` + `01_roller-og-rettigheter.md` |
| 01 Funksjoner | `modules/04-funksjoner.md` | `01-funksjonell-beskrivelse/01_funksjoner.md` |
| 02 Komponenter | `modules/05-komponenter.md` | `02-teknisk-beskrivelse/02_komponenter.md` |
| 02 Informasjonsmodell | `modules/03-informasjonsmodell.md` | `02-teknisk-beskrivelse/02_informasjonsmodell.md` |
| 02 Datamodell | `modules/06-datamodell.md` | `02-teknisk-beskrivelse/02_datamodell.md` |
| 02 Dataflyt | `modules/07-dataflyt.md` | `02-teknisk-beskrivelse/02_dataflyt.md` |
| 02 Drift | `modules/08-drift.md` | `02-teknisk-beskrivelse/02_drift.md` |
| 03 Verdivurdering Sikkerhetsgradering | `modules/12-verdivurdering-sikkerhetsgradering.md` | `03-vurderinger/03_verdivurdering-sikkerhetsgradering.md` |
| 03 Verdivurdering KIT | `modules/09-verdivurdering-kit.md` | `03-vurderinger/03_verdivurdering-kit.md` |
| 03 Verdivurdering Personvern | `modules/10-verdivurdering-personvern.md` | `03-vurderinger/03_verdivurdering-personvern.md` |
| 03 Verdivurdering Automatiserte beslutninger | `modules/11-verdivurdering-automatisertebeslutninger.md` | `03-vurderinger/03_verdivurdering-automatiserte-beslutninger.md` |
| 03 Trusselvurdering | `modules/13-trusselvurdering.md` | `03-vurderinger/03_trusselvurdering.md` |
| 03 Sårbarhetsvurdering | 🔲 Ikke laget ennå | `03-vurderinger/03_sårbarhetsvurdering.md` |
| README (avslutning) | `modules/00-readme-generator.md` | `README.md` |
| Konsistensgjennomgang | `modules/00-review.md` | — |

---

## Generelle prinsipper

- **Vær konkret** — bruk systemets faktiske navn, ikke generiske plassholdere
- **Vær konsistent** — referer til samme komponent, rolle eller aktivitet med samme navn gjennom alle moduler
- **Vær eksplisitt** — ikke anta at leseren vet hva en "komponent" eller "behandlingsaktivitet" er — beskriv det i klartekst
- **Still spørsmål til brukeren om det som er uklart** — det er bedre å ha en ufullstendig beskrivelse enn en feilaktig en
- **Ufullstendig er OK** — marker ukjent informasjon med `🔲 Ikke kartlagt`
- **Modul 03 er nøkkelen** — behandlingsaktivitetene i `01_funksjoner.md` brukes i alle vurderingsmoduler
- **Vurderinger annoterer 01_funksjoner** — KIT-nivå og GDPR-grunnlag føres tilbake til oversiktstabellen
- **README genereres sist** — når alle ønskede moduler er ferdig
- Spør alltid: *"Vil du fortsette med neste modul, eller er det noe her som skal justeres først?"*

@~/.claude/skills/system-beskrivelse/shared/diagram-c4.md
