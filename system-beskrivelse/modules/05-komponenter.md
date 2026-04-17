# Modul 04 – Komponenter

**Produserer:** `{systemnavn}/beskrivelse/02-teknisk beskrivelse/2.1-komponenter.md`
**Avhenger av:** `01-oversikt.md`, `1.2-funksjoner.md`
**Neste modul:** 2.2-informasjonsmodell.md

---

## Formål

Kartlegg de tekniske byggesteinene i systemet: hva er systemet laget av,
hvilke tjenester brukes, og hvordan er komponentene strukturert.
Dette er grunnlaget for dataflyt-, sårbarhets- og driftsdokumentasjon.

---

## Spørsmål å stille brukeren

### Steg 1 — Avklar systemets deler (still dette først)

Spør alltid innledningsvis:

> "Består systemet av flere separate deler — f.eks. en frontend-app, et API, og en backend-tjeneste?
> Eller er det ett sammenhengende system?"

- Hvis **én del**: fortsett som normalt med én samlet komponentoversikt.
- Hvis **flere deler**: spør hvilke deler som finnes og hva de heter, f.eks.:
  - "Hva heter de ulike delene — og hva er rollen til hver del?" (f.eks. `MinApp-Web`, `MinApp-API`, `MinApp-Worker`)
  - "Er noen av delene egne repo, egne deployments, eller bygget med ulike teknologier?"
  - Lag én komponentoversikt per del (se output-format nedenfor).

### Steg 2 — Komponenter per del

For **hver del** av systemet:
- Hvilke **komponenter** inngår i denne delen? (f.eks. web-app, API-lag, database, cache, bakgrunnsjobb)
- Er det **skybaserte tjenester** involvert? (AWS, Azure, GCP, eller norske alternativer)

### Steg 3 — Infrastruktur (felles for hele systemet)

- Hvor **kjøres** systemet? (on-premise, sky, hybrid, utviklermaskin)
- Er det egne **nettverk eller soner** (f.eks. DMZ, intern sone, produksjonsnett)?
- Brukes **containere, VM-er eller serverless**?
- Er det **CI/CD-pipeline** for bygging og deploy?

---

## Output-format

Bruk **Variant A** hvis systemet er én sammenhengende enhet, **Variant B** hvis systemet har flere separate deler.

---

### Variant A — Enkelt system (én del)

```markdown
# Komponenter

## Arkitekturbeskrivelse

{2–4 setninger som beskriver hvordan komponentene henger sammen og hva som er hoveddataflytene mellom dem.}

## Komponentdiagram

Generer C4 container-diagram (SVG) iht. spesifikasjonen i `diagram-c4.md`, seksjon «Container-diagram (nivå 2)».
Eksporter til `c4_container.svg` i samme mappe.

![Komponentdiagram](c4_container.svg)

## Komponentoversikt

| Komponent | Type | Beskrivelse | Driftsform | Leverandør/Teknologi |
|-----------|------|-------------|-----------|---------------------|
| {Navn} | Frontend/Backend/Database/Agent/API/... | | Sky/On-prem/Hybrid | |

## Infrastruktur

| Aspekt | Beskrivelse |
|--------|-------------|
| Driftsplattform | {Sky-leverandør, on-prem, hybrid} |
| Kontainerisering | {Docker, Kubernetes, ingen} |
| CI/CD | {GitHub Actions, Azure DevOps, Jenkins, ingen} |
| Nettverk/soner | {Internett-eksponert, intern sone, DMZ} |

---
*Sist oppdatert: {dato} | Forrige: [1.2-funksjoner](../01-funksjonell%20beskrivelse/1.2-funksjoner.md) | Neste: [2.2-informasjonsmodell](./2.2-informasjonsmodell.md)*
```

---

### Variant B — Flerdelssystem (API + frontend, osv.)

```markdown
# Komponenter

## Arkitekturbeskrivelse

{2–4 setninger som beskriver systemets overordnede arkitektur, hvilke deler det består av, og hvordan de samhandler.}

## Systemdeler

| Del | Rolle | Repo / Deployment |
|-----|-------|-------------------|
| {Del 1 — f.eks. MinApp-Web} | {Frontend-applikasjon for sluttbrukere} | {lenke eller navn} |
| {Del 2 — f.eks. MinApp-API} | {HTTP API og forretningslogikk} | {lenke eller navn} |
| {Del 3 — f.eks. MinApp-Worker} | {Bakgrunnsjobb for dataprosessering} | {lenke eller navn} |

## Overordnet komponentdiagram

Generer C4 container-diagram (SVG) iht. spesifikasjonen i `diagram-c4.md`, seksjon «Container-diagram (nivå 2)».
Eksporter til `c4_container.svg` i samme mappe.

![Komponentdiagram](c4_container.svg)

## Infrastruktur (felles)

| Aspekt | Beskrivelse |
|--------|-------------|
| Driftsplattform | {Sky-leverandør, on-prem, hybrid} |
| Kontainerisering | {Docker, Kubernetes, ingen} |
| CI/CD | {GitHub Actions, Azure DevOps, Jenkins, ingen} |
| Nettverk/soner | {Internett-eksponert, intern sone, DMZ} |

---

## Del 1 – {Navn} ({Rolle})

### Komponentdiagram

Generer C4 container-diagram for denne delen (SVG) iht. `diagram-c4.md`.
Eksporter til `c4_container_del1.svg` i samme mappe.

![Komponentdiagram Del 1](c4_container_del1.svg)

### Komponenter

| Komponent | Type | Beskrivelse | Driftsform | Leverandør/Teknologi |
|-----------|------|-------------|-----------|---------------------|
| {Navn} | Frontend/Backend/Database/... | | Sky/On-prem/Hybrid | |

### Infrastruktur

| Aspekt | Beskrivelse |
|--------|-------------|
| Driftsplattform | |
| Kontainerisering | |
| CI/CD | |
| Nettverk/soner | |

---

## Del 2 – {Navn} ({Rolle})

### Komponentdiagram

Generer C4 container-diagram for denne delen (SVG) iht. `diagram-c4.md`.
Eksporter til `c4_container_del2.svg` i samme mappe.

![Komponentdiagram Del 2](c4_container_del2.svg)

### Komponenter

| Komponent | Type | Beskrivelse | Driftsform | Leverandør/Teknologi |
|-----------|------|-------------|-----------|---------------------|
| {Navn} | Frontend/Backend/Database/... | | Sky/On-prem/Hybrid | |

### Infrastruktur

| Aspekt | Beskrivelse |
|--------|-------------|
| Driftsplattform | |
| Kontainerisering | |
| CI/CD | |
| Nettverk/soner | |

---

*(legg til flere Del-seksjoner etter behov)*

---
*Sist oppdatert: {dato} | Forrige: [1.2-funksjoner](../01-funksjonell%20beskrivelse/1.2-funksjoner.md) | Neste: [2.2-informasjonsmodell](./2.2-informasjonsmodell.md)*
```

---

## Tips

- Bruk C4 container-diagram (SVG) iht. `diagram-c4.md` — støtter klikkbare bokser og C4-konvensjoner
- **IKKE legg til logging eller overvåking** — dette hører til **08-drift.md**, ikke her
- **IKKE legg til integrasjoner med eksterne systemer** — dette hører til **07-dataflyt.md**, ikke her
- Autentisering og tilgangskontroll beskrives i **sikkerhetskontroller** — ikke i komponentoversikten
- For AI-systemer: vær presis om **hva som sendes til AI-tjenesten** — kritisk for personvern
- Spør til slutt: *"Vil du fortsette med Modul 05 (Informasjonsmodell), eller er det noe her som skal justeres?"*
