# Web-scraping-modus — uten repo-tilgang

Denne modusen brukes når agenten **ikke** har tilgang til kilderepoene (gh api returnerer 403/404). All informasjon hentes fra den publiserte dokumentasjonen.

## Domene-strategi

```
Lokal klon:   $LOCAL_SKYBERT_DOC_CLONE (hvis satt og katalogen eksisterer)
Primærkilde:  https://docs.sky.fhi.no
Fallback:     https://skybert.fhi.no
```

Sjekk først om miljøvariabelen `LOCAL_SKYBERT_DOC_CLONE` er satt og peker til en eksisterende katalog med en lokal klon av FHISkybert/Fhi.Skybert.Docs. Hvis ja, les dokumentasjon direkte fra den lokale klonen (raskere og fungerer offline). Bruk `docs/` undermappen for MkDocs-innhold og `mkdocs.yml` for sidestruktur.

Hvis lokal klon ikke er tilgjengelig, bruk `docs.sky.fhi.no` som autoritativ kilde. Hvis `docs.sky.fhi.no` er utilgjengelig, forsøk `skybert.fhi.no` — men noter i planen at fallback-kilde ble brukt.

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

Les `webscraping.globalHash` og `lastFullscanDate` fra `skybert/.oppdater-state.json`
(migrering fra gammel `<!-- Kilde-hash: ... -->`-kommentar: se State-kontrakt i SKILL.md).

**Periodisk FULL:** Hvis `lastFullscanDate` mangler eller er > 30 dager gammel → kjør FULL
modus selv om `globalHash` er uendret (samme regel som steg 1d i SKILL.md).

**No-op:** Ellers, hvis `globalHash == previousGlobalHash` → rapporter "ingen endringer"
og stopp (list ev. åpne `openItems`).

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
- Generisk Kubernetes/Azure/GitHub-stoff som docs-siden bare gjengir (f.eks. probe-implementasjon i C#) — lenk til siden, ikke kopier

---

## Inkrementell vs FULL modus

### FULL modus (uten eksisterende state)

Hent `search_index.json`, beregn alle per-side hashes, hent HTML for alle sider i scope, analyser alt. Kjøres når `skybert/.oppdater-state.json` mangler eller ikke har `webscraping`-felt, eller når `lastFullscanDate` mangler / er > 30 dager gammel (periodisk FULL, se steg 3).

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
| Ingen infra-repo-tilgang | Ingen CRD-versjonssporing, ingen infra signal inventory, infra-basert innhold kan ikke verifiseres |
| Ingen `docs/internal/`-tilgang | Kun publiserte sider er tilgjengelige |
| Kun publisert docs | Ingen tilgang til mkdocs.yml, workflows eller README |
| Inkrementell basert på per-side hash | Krever persistent state i `skybert/.oppdater-state.json` |
| Hash-normalisering lowercaser tekst | Rene case-endringer i docs (f.eks. feltnavn) oppdages ikke av no-op-sjekken |
| Kompletthet gjelder kun søkeindeksen | Sider/vedlegg som ikke er i `search_index.json` er usynlige for denne modusen |

### Vern av infra-basert innhold (kritisk)

Denne modusen kan IKKE verifisere innhold som har infra-repoet som kilde (kildereferanser mot `github.com/FHISkybert/Fhi.Skybert.Infra`). Derfor:

- Foreslå aldri `KORRIGER` eller `FJERN` med grunn `feil`/`utdatert`/`ustøttet` for infra-basert innhold i denne modusen — selv om publisert docs ser ut til å motsi det. Bruk `VURDER` med begge kilder sitert. `FJERN` med grunn `generisk`, `duplikat` eller `meta` krever ingen kildeverifikasjon og er tillatt også her.
- Merk alle infra-baserte seksjoner i UPDATE-PLAN.md som **«ikke verifisert i denne kjøringen»** — planen skal ikke gi inntrykk av at hele skillen er validert.
- Rør aldri `github`-feltet i `.oppdater-state.json` (commit SHAs og datoer for docs/infra beholdes uendret).
- De statiske kopiene i `references/skybertapp/` kan ikke oppdateres i denne modusen — noter alder (`github.infra.commitDate` i state-filen) i planen hvis den er over 30 dager gammel.

---

## State i web-scraping-modus

All state bor i `skybert/.oppdater-state.json` (se State-kontrakt i SKILL.md — det skrives
**ingen** HTML-kommentar i `skybert/SKILL.md`). Web-scraping-modus populerer
`webscraping`-feltet:

```json
{
  "schemaVersion": 3,
  "updatedAt": "<ISO-8601>",
  "mode": "webscraping",
  "lastFullscanDate": "<ISO-dato>",
  "sistVerifisert": "<ISO-dato>",
  "webscraping": {
    "source": "docs.sky.fhi.no",
    "globalHash": "<sha256>",
    "pages": [
      { "location": "<location>", "title": "<title>", "hash": "<per-side sha256>" }
    ]
  }
}
```

`globalHash` brukes for rask NO-OP-sjekk (uendret → stopp). Per-side hashes identifiserer
hvilke sider som faktisk endret seg ved INKREMENTELL modus. `github`-feltet (fra tidligere
GitHub-kjøringer) beholdes uendret. Migrering fra gammel `<!-- Kilde-hash: ... -->`-
kommentar: se State-kontrakt i SKILL.md.

---

## Forenklet dekningsanalyse

I web-scraping-modus utføres kun **Del A — Docs coverage-matrise**:

| Docs-side (fra search_index) | Hovedtema | Dekket i skillen hvor? | Dekningsgrad | Hva mangler | Foreslått målfil hvis udekket |
|---|---|---|---|---|---|
| `skybertapp/` | SkybertApp CRD | `references/skybertapp-crd.md` | Komplett | -- | -- |
| `auth/workload-identity/` | WI | `references/security.md` | Delvis | Federated credential-oppsett, token-utløp | -- |
| `new-topic/` | Nytt emne | Ikke dekket | Fraværende | Alt | ny `references/new-topic.md` |

**Regler for dekningsgrad:** se «Regler for dekningsgrad» i [analyseregler.md](analyseregler.md).

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
