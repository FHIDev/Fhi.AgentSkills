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

## Alltid FULL modus

Web-scraping-modus kjører alltid som FULL — ingen inkrementell sammenligning er mulig uten commit-SHAs.

Per-side hashes fra `search_index.json` brukes til å identifisere endrede/nye/fjernede sider sammenlignet med forrige `state.json`.

---

## Begrensninger

| Begrensning | Konsekvens |
|-------------|------------|
| Ingen infra-repo-tilgang | Ingen CRD-versjonssporing, ingen infra signal inventory |
| Ingen `docs/internal/`-tilgang | Kun publiserte sider er tilgjengelige |
| Kun publisert docs | Ingen tilgang til mkdocs.yml, workflows eller README |
| Ingen inkrementell modus | Alltid FULL — per-side hash brukes for endringsdeteksjon |

---

## Forenklet metadata-kontrakt

I web-scraping-modus skrives en forenklet metadata-kommentar (uten infra-felter):

```html
<!-- Kilde-hash: <globalHash> -->
```

`state.json` i web-scraping-modus:
```json
{
  "globalHash": "<sha256>",
  "fetchedAt": "<ISO-8601>",
  "source": "docs.sky.fhi.no",
  "pages": [
    { "location": "<location>", "title": "<title>", "hash": "<per-side hash>" }
  ]
}
```

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
