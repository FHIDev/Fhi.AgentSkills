# Web-scraping-modus — uten repo-tilgang

Denne modusen brukes når agenten **ikke** har tilgang til kilderepoene (gh api returnerer 403/404). All informasjon hentes fra den publiserte dokumentasjonen.

## Domene-strategi

```
Primærkilde:  https://docs.sky.fhi.no
Fallback:     https://skybert.fhi.no
```

Bruk `docs.sky.fhi.no` som autoritativ kilde. Hvis `docs.sky.fhi.no` er utilgjengelig, forsøk `skybert.fhi.no` — men noter i planen at fallback-kilde ble brukt.

---

## Steg 1 — Hent search_index.json

```
https://docs.sky.fhi.no/search/search_index.json
```

Lagre til `.tmp/oppdater-skybert/search_index.json`. Søkeindeksen inneholder metadata om alle sider — titler, URL-er og tekstutdrag.

Fallback:
```
https://skybert.fhi.no/search/search_index.json
```

## Steg 2 — Beregn global hash

For hvert dokument i `search_index.json`:
- Normaliser teksten: trim whitespace, kollapser mellomrom, konverter til lowercase
- Bygg objekt: `{ location, title, text_normalized }`

Sorter listen etter `location` (alfabetisk). Serialiser til JSON (stable key-order).
Beregn SHA-256 av den serialiserte strengen → `globalHash`.

Bygg per-side map: `{ [location]: { title, hash: sha256(location+title+text_normalized) } }`.

## Steg 3 — Sammenlign med forrige hash

Les `<!-- Kilde-hash: ... -->`-kommentaren fra `skybert/SKILL.md`.

**No-op:** Hvis `globalHash == previousGlobalHash` → rapporter "ingen endringer" og stopp.

## Steg 4 — Hent HTML-sider

Hent innholdet for relevante sider. URL-format: `https://docs.sky.fhi.no/<sti>/`

**Ekstraksjonsregler:**
- Trekk ut innhold fra `<article>`, `<main>` eller `.content`-element
- Behold: overskrifter (h1-h4), avsnitt, lister, tabeller, kodeblokker
- Fjern: `<nav>`, sidebars, footers, edit-lenker, breadcrumbs, søkefelt

Lagre til `.tmp/oppdater-skybert/pages/<sidenavn>.html`.

### Scope-regler

**Inkluder** sider som omhandler:
- Plattform-konsepter (onboarding, tenants, miljøer)
- SkybertApp CRD og konfigurasjon
- Deployment-metoder (Helm, Kustomize, raw manifests)
- Secrets og Key Vault-integrasjon
- Workload Identity og nettverkssikkerhet
- CI/CD og GitHub Actions-workflows
- kubectl-tilgang og verktøy
- Observabilitet (logging, metrics, tracing)
- Feilsøking og diagnostikk

**Ekskluder** sider som omhandler:
- Intern plattform-administrasjon som ikke er relevant for utviklere
- Utenfor-scope tjenester som ikke er Skybert-spesifikke

---

## Inkrementell vs FULL modus

### FULL modus (uten eksisterende state)

Hent `search_index.json`, beregn alle per-side hashes, hent HTML for alle sider i scope, analyser alt. Kjøres når `skybert/.oppdater-state.json` mangler eller ikke har `webscraping`-felt.

### INKREMENTELL modus (med eksisterende state i skybert/.oppdater-state.json)

1. Hent `search_index.json`, beregn nye per-side hashes
2. Sammenlign med `webscraping.pages[]` fra state-filen
3. Identifiser: nye sider (location finnes ikke i state), endrede sider (hash ulik), fjernede sider (location i state men ikke i ny index)
4. Hent kun HTML for nye/endrede sider
5. Analyser kun berørte skybert-filer basert på routing fra [routing-tabell.md](routing-tabell.md)

---

## Begrensninger

| Begrensning | Konsekvens |
|-------------|------------|
| Ingen infra-repo-tilgang | Ingen CRD-versjonssporing, ingen infra signal inventory |
| Ingen `docs/internal/`-tilgang | Kun publiserte sider er tilgjengelige |
| Kun publisert docs | Ingen tilgang til mkdocs.yml, workflows eller README |
| Inkrementell basert på per-side hash | Krever persistent state i `skybert/.oppdater-state.json` |

---

## Forenklet metadata-kontrakt

### Rask NO-OP-sjekk (metadata-kommentar)

I web-scraping-modus skrives en forenklet metadata-kommentar (uten infra-felter):

```html
<!-- Kilde-hash: <globalHash> -->
```

### Persistent state for inkrementell (skybert/.oppdater-state.json)

`skybert/.oppdater-state.json` lagrer per-side hashes for inkrementell sammenligning mellom kjøringer:

```json
{
  "schemaVersion": 2,
  "updatedAt": "<ISO-8601>",
  "mode": "webscraping",
  "webscraping": {
    "source": "docs.sky.fhi.no",
    "globalHash": "<sha256>",
    "pages": [
      { "location": "<location>", "title": "<title>", "hash": "<per-side sha256>" }
    ]
  }
}
```

Metadata-kommentaren brukes for rask NO-OP-sjekk (globalHash uendret → stopp). State-filen gir detaljert per-side info for å identifisere hvilke sider som faktisk endret seg ved INKREMENTELL modus.

---

## Forenklet dekningsanalyse

I web-scraping-modus utføres kun **Del A — Docs coverage-matrise**:

| Docs-side (fra search_index) | Hovedtema | Dekket i skillen hvor? | Dekningsgrad |
|---|---|---|---|
| `skybertapp/` | SkybertApp CRD | `references/skybertapp-crd.md` | Komplett |
| `auth/workload-identity/` | WI | `references/security.md` | Delvis |

Del B (infra signal inventory) og Del C (innhold uten kilde) kan ikke utføres uten repo-tilgang.

---

## Feilhåndtering (web-scraping-spesifikk)

| Problem | Handling |
|---------|----------|
| `docs.sky.fhi.no` utilgjengelig | Forsøk `skybert.fhi.no` som fallback; noter i planen |
| `skybert.fhi.no` også utilgjengelig | Stopp og informer bruker; ikke gjør endringer |
| `search_index.json` ikke funnet | Forsøk `/sitemap.xml` som alternativ |
| Side ikke funnet (404) | Hopp over siden; logg som manglende i planen |
| HTML uten meningsfullt innhold | Hopp over hvis `<article>`/`<main>` mangler |
