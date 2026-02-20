---
name: oppdater-skybert
description: Oppdaterer skybert-skillen basert på siste versjon av docs.sky.fhi.no. Henter dokumentasjon, sammenligner med alle eksisterende filer i skybert/, og lager en endringsplan til gjennomgang. Bruk denne skillen når skybert-skillen skal synkroniseres med ny dokumentasjon, eller når du mistenker at skillen er utdatert eller mangelfull.
---

# Oppdater Skybert-skillen

Denne skillen beskriver arbeidsflyten for å holde `skybert/`-skillen i dette repoet oppdatert og korrekt i henhold til siste versjon av offisiell Skybert-dokumentasjon.

## Forutsetninger

```
Skybert-skill (oppdateres):
skybert/
├── SKILL.md
└── references/
    ├── configuration.md       ← Helm, WebApp, raw manifests
    ├── kubectl-access.md      ← kubectl, k9s, proxy
    ├── observability.md       ← Logging, metrics, Grafana
    ├── secrets.md             ← SecretStore, ExternalSecret
    ├── security.md            ← Workload Identity, nettverkspolicyer
    ├── skybertapp-crd.md      ← SkybertApp CRD-spec
    ├── troubleshooting.md     ← Feilsøking
    ├── workflows.md           ← GitHub Actions CI/CD
    └── <nye filer kan legges til ved behov>

Runtime-state (opprettes, ikke committet):
.tmp/oppdater-skybert/
├── state.json
├── last-seen.hash
├── last-applied.hash
├── search_index.json
├── pages/*.html
└── UPDATE-PLAN.md
```

---

## Domene-strategi

```
Primærkilde:  https://docs.sky.fhi.no
Fallback:     https://skybert.fhi.no
```

Bruk `docs.sky.fhi.no` som autoritativ kilde. Hvis `docs.sky.fhi.no` er utilgjengelig,
forsøk `skybert.fhi.no` — men noter i planen at fallback-kilde ble brukt.

---

## Routing-tabell

Tabellen brukes for å mappe dokumentasjonssider til riktig målfil i `skybert/`:

| Emne i docs | Målfil i skybert/ |
|-------------|-------------------|
| SkybertApp CRD, felt-spec | `skybert/references/skybertapp-crd.md` |
| Secrets, Key Vault, ExternalSecret, SecretStore | `skybert/references/secrets.md` |
| Workload Identity, nettverkspolicyer, sikkerhet | `skybert/references/security.md` |
| GitHub Actions, CI/CD, oci-push, update-tag | `skybert/references/workflows.md` |
| kubectl, k9s, az connectedk8s proxy | `skybert/references/kubectl-access.md` |
| Logging, metrics, Grafana, Loki, Mimir, Tempo | `skybert/references/observability.md` |
| Helm, Kustomize, WebApp, Deployment, raw manifests | `skybert/references/configuration.md` |
| Feilsøking, diagnostikk | `skybert/references/troubleshooting.md` |
| Onboarding, Blåløypa, tenant-konsept, navnekonvensjoner, ingress, miljøer | `skybert/SKILL.md` |

**Regler:**
- Hvis en docs-side berører emner fra flere rader, kan den peke til flere målfiler.
- Hvis mapping er uklar → bruk `VURDER`-kategori i endringsplanen.
- Hvis docs inneholder et nytt emneområde som ikke passer inn i eksisterende referansefiler, skal agenten foreslå å opprette en ny fil under `skybert/references/` som en `NY`-kategori-oppføring i endringsplanen (med foreslått filnavn og innhold).

---

## Steg 1 – Hent search_index.json

Hent søkeindeksen fra primærkilden:

```
https://docs.sky.fhi.no/search/search_index.json
```

Lagre responsen til `.tmp/oppdater-skybert/search_index.json`.

Søkeindeksen inneholder metadata om alle sider i dokumentasjonen — titler, URL-er og tekstutdrag. Denne brukes i steg 3 til å identifisere hvilke sider som finnes og oppdage endringer.

Hvis `docs.sky.fhi.no` ikke svarer, forsøk:
```
https://skybert.fhi.no/search/search_index.json
```
Noter i planen at fallback-kilde ble brukt.

---

## Steg 2 – Beregn global hash og les forrige state

### 2a. Les forrige state

Les `.tmp/oppdater-skybert/state.json` (hvis den eksisterer) og lagre verdiene i minnet
som `previousState`. Disse brukes i steg 3 til no-op-sjekk og i no-op-rapporten.

### 2b. Beregn global hash

For hvert dokument i `search_index.json`:
- Normaliser teksten: trim whitespace, kollapser mellomrom, konverter til lowercase
- Bygg objekt: `{ location, title, text_normalized }`

Sorter listen etter `location` (alfabetisk). Serialiser til JSON (stable key-order).
Beregn SHA-256 av den serialiserte strengen. Dette er `globalHash`.

Bygg i tillegg en per-side map: `{ [location]: { title, hash: sha256(location+title+text_normalized) } }`.

### 2c. Skriv ny state

Skriv `.tmp/oppdater-skybert/state.json`:

```json
{
  "globalHash": "<sha256 av kanonisk innhold>",
  "fetchedAt": "<ISO-8601 tidspunkt>",
  "source": "docs.sky.fhi.no",
  "pages": [
    { "location": "<location>", "title": "<title>", "hash": "<per-side hash>" }
  ]
}
```

Oppdater `.tmp/oppdater-skybert/last-seen.hash` med `globalHash`.

---

## Steg 3 – Sammenlign hashes

Les `last-applied.hash` og sammenlign med `globalHash` fra steg 2.

**No-op-regel:** Hvis `globalHash == last-applied.hash` — skriv følgende rapport og stopp:

```
Ingen oppdatering nødvendig.
Dokumentasjonen er uendret siden siste godkjente oppdatering.
Global hash: <globalHash>
Sist hentet: <previousState.fetchedAt, eller "ukjent" hvis state ikke fantes>
```

Kun hvis hashene er **forskjellige** (eller `last-applied.hash` ikke eksisterer) → fortsett til steg 4.

---

## Steg 4 – Hent og analyser dokumentasjonssider

### 4a. Identifiser endrede sider

Analyser `search_index.json` for å finne alle unike docs-sider. Grupper dem etter routing-tabellen.

Sammenlign per-side hashes fra ny state (steg 2b) med `previousState.pages[]`:
- **Ny side:** `location` finnes ikke i `previousState.pages`
- **Endret side:** `location` finnes, men `hash` er ulik
- **Fjernet side:** `location` finnes i `previousState.pages`, men ikke i ny state
- **Uendret side:** `location` og `hash` er like → kan deprioriteres i analyse

Merk endringsstatus for hver side. Prioriter ny/endret/fjernet i analysen.
Uendrede sider trenger kun overfladisk sjekk (verifiser at skybert-innholdet fortsatt stemmer).

### 4b. Hent HTML-sider

Hent innholdet for relevante sider fra primærkilden. Lagre HTML til
`.tmp/oppdater-skybert/pages/<sidenavn>.html`.

URL-format: `https://docs.sky.fhi.no/<sti>/`

**Ekstraksjonsregler:** Trekk ut innhold fra `<article>`, `<main>` eller `.content`-element.
Behold: overskrifter (h1–h4), avsnitt, lister, tabeller, kodeblokker.
Fjern: `<nav>`, sidebars, footers, edit-lenker, breadcrumbs, søkefelt.

Eksempel: for siden `skybertapp/` → hent `https://docs.sky.fhi.no/skybertapp/`.

### 4c. Scope-regler

Inkluder sider som omhandler:
- Plattform-konsepter (onboarding, tenants, miljøer)
- SkybertApp CRD og konfigurasjon
- Deployment-metoder (Helm, Kustomize, raw manifests)
- Secrets og Key Vault-integrasjon
- Workload Identity og nettverkssikkerhet
- CI/CD og GitHub Actions-workflows
- kubectl-tilgang og verktøy
- Observabilitet (logging, metrics, tracing)
- Feilsøking og diagnostikk

Ekskluder sider som omhandler:
- Intern plattform-administrasjon som ikke er relevant for utviklere
- Utenfor-scope tjenester som ikke er Skybert-spesifikke

---

## Steg 5 – Les alle eksisterende skillfiler

Les alle filer i `skybert/`. Dette inkluderer `skybert/SKILL.md` og alle filer under `skybert/references/`. Forstå hvilke emner som er dokumentert i hvilke filer — dette er nødvendig for å kunne angi riktig målfil i endringsplanen.

For hvert dokument: noter nåværende innhold, struktur og eventuelle foreldede referanser.

---

## Steg 6 – Analyser endringer

Sammenlign innholdet fra docs-sidene (steg 4) med innholdet i skybert/-filene (steg 5).

### Endringskategorier

| Kategori | Definisjon |
|----------|-----------|
| `NY` | Innhold i docs som ikke er dokumentert i noen skybert-fil |
| `UTDATERT` | Innhold i skybert-fil som ikke lenger stemmer med docs |
| `FORBEDRING` | Innhold i skybert-fil som er riktig men kan gjøres mer presist eller komplett |
| `FJERN` | Innhold i skybert-fil der docs positivt angir at det er utdatert, fjernet eller feil (f.eks. via «deprecated»-notat, erstattet av annen funksjon, eller eksplisitt fjerning) |
| `VURDER` | Mulig endring som krever menneskelig vurdering (mapping uklar, tolkning usikker) |
| `OK` | Innhold som er korrekt og komplett — ingen endring nødvendig |

### Terskler

- **FORBEDRING** brukes kun når docs gir vesentlig bedre eller mer korrekt formulering — ikke for stilistiske preferanser.
- **FJERN** brukes kun ved positiv evidens fra docs: eksplisitt «deprecated», «fjernet», «bruk X i stedet», eller tilsvarende. Fravær i docs alene er ikke tilstrekkelig — bruk `VURDER` hvis du er usikker.
- **WIP/TBA/skeleton-innhold:** Dokumentasjon eksplisitt markert som «under arbeid», «coming
  soon», «not yet ready», «TBD», «placeholder» eller lignende er **ikke normativ**. Slike sider
  skal:
  - Klassifiseres som `VURDER`, ikke `NY` eller `FORBEDRING`
  - Ha en begrunnelse som eksplisitt nevner at kildesiden er ufullstendig
  - Ikke brukes som grunnlag for å fjerne eksisterende skill-innhold

### Hva hører hjemme i SKILL.md vs. references/

- `SKILL.md` skal dekke: onboarding-konsepter, tenant-modell, overordnede prinsipper, kritiske regler, miljøoversikt, Blåløypa.
- `references/`-filene skal dekke: tekniske detaljer, CRD-spec, kommandoeksempler, konfigurasjonssyntaks.

---

## Steg 7 – Skriv UPDATE-PLAN.md

Skriv endringsplanen til `.tmp/oppdater-skybert/UPDATE-PLAN.md`.

### Format

Start planen med en tabell over påvirkede filer:

```markdown
# UPDATE-PLAN – Skybert-skill

Generert: <ISO-8601 dato>
Kilde: <docs.sky.fhi.no eller skybert.fhi.no>
Global hash: <globalHash>

## Påvirkede filer

| Fil | Antall endringer |
|-----|-----------------|
| skybert/SKILL.md | 2 |
| skybert/references/skybertapp-crd.md | 1 |
```

Deretter én oppføring per foreslått endring:

```markdown
#### N. <Kort tittel>

- **Fil:** skybert/references/skybertapp-crd.md
- **Kategori:** NY | UTDATERT | FORBEDRING | FJERN | VURDER
- **Kilde-side:** <docs location, f.eks. skybertapp/>
- **Nåværende tekst (linje ~N):** <sitat eller "–" hvis NY>
- **Foreslått tekst:**

  <Ny tekst eller utkast>

- **Begrunnelse:** <konkret observasjon fra docs>
```

**Regler for planen:**
- Alle felter er obligatoriske.
- `Nåværende tekst` skal inneholde et sitat fra filen (med omtrentlig linjenummer) eller `–` hvis det er nytt innhold.
- `Foreslått tekst` skal være komplett og klar til å implementere.
- `Begrunnelse` skal referere konkret til hva i docs som begrunner endringen.
- Oppføringer med kategori `OK` inkluderes ikke i planen.

---

## Steg 8 – Presenter planen og vent på godkjenning

Presenter innholdet i `.tmp/oppdater-skybert/UPDATE-PLAN.md` for brukeren. Inkluder:

1. Sammendrag: antall foreslåtte endringer per kategori og per fil
2. Fullstendig UPDATE-PLAN.md

Vent på eksplisitt godkjenning fra brukeren. Brukeren kan:
- **Godkjenne alle** endringer → gå til steg 9
- **Godkjenne delvis** → noter hvilke endringer som er godkjent, gå til steg 9 med kun disse
- **Avvise alle** → stopp, ikke endre noen filer, ikke oppdatere `last-applied.hash`

**Ikke gjør endringer i skybert/-filer uten eksplisitt godkjenning.**

---

## Steg 9 – Implementer godkjente endringer

Implementer de godkjente endringene i skybert/-filene.

### Prinsipper for implementering

- Endre kun innhold som er eksplisitt godkjent.
- Behold eksisterende tekst uendret hvis den fortsatt er korrekt — selv om du ville formulert det annerledes.
- Ikke omformuler eller omstruktur avsnitt som er faktariktige.
- Alle endringer skal begrunnes med en konkret observasjon fra docs.
- Skill-innhold skrives for en AI-agent, ikke for en menneskelig leser. Vær presis og unngå tvetydighet.
- Foretrekk konkrete kodeeksempler fremfor lange prosatekster.

### Kilde-referanser

Når nytt innhold legges til eller eksisterende innhold oppdateres i en skybert/-fil,
skal det alltid legges inn en kilde-referanse til den aktuelle docs-siden.

Format:
> Kilde: https://docs.sky.fhi.no/<sti>/

Referansen plasseres direkte etter avsnittet/seksjonen den gjelder.
Hvis et avsnitt allerede har en kilde-referanse, oppdater URL-en hvis den har endret seg.

### Oppdater dato i SKILL.md

Oppdater feltet `Sist verifisert mot offisiell docs:` i `skybert/SKILL.md` med dagens dato.

---

## Steg 10 – Oppdater last-applied.hash

> **Kontrakt:** `last-applied.hash` oppdateres **kun** etter at:
> 1. Brukeren har godkjent planen (helt eller delvis)
> 2. Endringene faktisk er skrevet til `skybert/`-filene uten feil
>
> Avvisning av planen, delvis godkjenning uten implementering, eller teknisk feil
> under skriving → `last-applied.hash` forblir uendret.

Skriv `globalHash` til `.tmp/oppdater-skybert/last-applied.hash`.

---

## Feilhåndtering

| Problem | Håndtering |
|---------|------------|
| `docs.sky.fhi.no` utilgjengelig | Forsøk `skybert.fhi.no` som fallback; noter i planen at fallback ble brukt |
| `skybert.fhi.no` også utilgjengelig | Stopp og informer bruker; ikke gjør endringer |
| `search_index.json` ikke funnet | Forsøk å hente `/sitemap.xml` eller `/sitemap_index.xml` som alternativ |
| Side ikke funnet (404) | Hopp over siden; logg den som manglende i planen |
| HTML uten meningsfullt innhold | Ekstraher fra `<article>` eller `<main>`; hopp over siden hvis disse mangler |
| `last-applied.hash` mangler | Behandle som første kjøring; fortsett uten no-op-sjekk |
| Mapping uklar for en side | Bruk `VURDER`-kategori med begrunnelse |
