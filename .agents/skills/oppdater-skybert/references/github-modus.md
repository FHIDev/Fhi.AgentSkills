# GitHub-modus — kildetilgang via GitHub API / lokal clone

Denne modusen brukes når agenten har tilgang til kilderepoene via `gh api`, `curl` med `gh auth token`, eller lokal `git clone`.

## Kildetilgang

### Docs-repo

Kildeprioritet for docs (sjekkes i rekkefølge):

1. **Lokal klon via `$LOCAL_SKYBERT_DOC_CLONE`** — Hvis miljøvariabelen er satt og katalogen eksisterer, les filer direkte fra `$LOCAL_SKYBERT_DOC_CLONE/docs/`. Hent commit SHA med `git -C "$LOCAL_SKYBERT_DOC_CLONE" rev-parse HEAD` og commit-dato med `git -C "$LOCAL_SKYBERT_DOC_CLONE" log -1 --format=%cI`. Raskest og fungerer offline.
2. **`gh api`** — `gh api repos/FHISkybert/Fhi.Skybert.Docs/...` (standard ved GitHub-tilgang uten lokal klon).
3. **Temporær clone** — `git clone https://github.com/FHISkybert/Fhi.Skybert.Docs ".tmp/oppdater-skybert/docs-repo"` (siste utvei, tregest).

### Infra-repo

Infra-repo hentes alltid via GitHub API (ingen lokal klon-støtte):
```bash
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.sha'
```

Alternativ: `git clone https://github.com/FHISkybert/Fhi.Skybert.Infra ".tmp/oppdater-skybert/infra-repo"`

**Hente commit SHA:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.sha'
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.sha'
```

**Hente commit-dato:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/commits/main --jq '.commit.committer.date'
gh api repos/FHISkybert/Fhi.Skybert.Infra/commits/main --jq '.commit.committer.date'
```

**Hente filtree:**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/git/trees/main?recursive=1 --jq '.tree[] | select(.type=="blob") | .path'
gh api repos/FHISkybert/Fhi.Skybert.Infra/git/trees/main?recursive=1 --jq '.tree[] | select(.type=="blob") | .path'
```

**Lese enkeltfil:**
```bash
curl -sH "Authorization: token $(gh auth token)" \
  "https://raw.githubusercontent.com/FHISkybert/Fhi.Skybert.Docs/main/<filsti>"
```

**Sammenligne commits (inkrementell):**
```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
gh api repos/FHISkybert/Fhi.Skybert.Infra/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
```

**Retry-policy:** 3 forsøk med eksponentiell backoff (1s, 3s, 9s). Ved vedvarende feil på normativ fil (XRD, compositions): stopp kjøring med feilrapport. Ved feil på ikke-kritisk fil: logg som manglende og fortsett.

---

## Discovery pass (obligatorisk ved FULL modus)

Før detaljert lesing: oppdage hva som faktisk finnes.

### Docs-repo discovery

1. List komplett mappestruktur.
2. Les `mkdocs.yml` for å forstå navigasjon og informasjonsarkitektur.
3. Identifiser alle docs-sider (fullstendig liste).
4. Noter eventuelle nye mapper, filtyper eller dokumentasjonsformer som ikke var forventet.

### Infra-repo discovery

1. List komplett mappestruktur (toppnivå + relevante undermapper).
2. Les `README.md` for repoets formål.
3. Identifiser alle filtyper og mapper som kan inneholde dokumenterende verdi:
   - Markdown/docs-mapper, ADR-er, examples/, templates/
   - Scripts av alle typer (sh, py, ps1, bash, etc.)
   - Workflows med alle filendelser (.yaml, .yml)
   - Helm charts, JSON/YAML-skjemaer, policyfiler
   - CUE, Jsonnet, Rego eller andre policy/config-språk
   - CRD-er og API-definisjoner utover de forventede stiene
4. Lag et **signal inventory**: Hvilke filer/mønstre inneholder agentnyttig kunnskap, og hvilke er støy?

**Output fra discovery:** En oversikt over begge repoers faktiske innhold, ikke bare det som var forventet.

---

## Detaljert leserekkefølge — Docs-repo

1. `mkdocs.yml` — navigasjonsstruktur
2. Alle `docs/**/*.md` i rekkefølge fra navigasjonsstrukturen
3. `README.md`
4. `.github/workflows/*.yml` — publiseringskontekst
5. Eventuelle andre filer oppdaget i discovery som har dokumentasjonsverdi

**Nedprioritert:** `site/**` (generert output), `overrides/`, CSS/HTML, `pyproject.toml`, `Makefile`, `Dockerfile`

**Adaptiv:** Hvis discovery avdekket nye relevante filer — les dem. Ikke ignorer noe bare fordi det ikke var forventet.

## Detaljert leserekkefølge — Infra-repo

1. `README.md`
2. `.github/workflows/*` (alle endelser)
3. `scripts/*` (alle scripttyper)
4. `infra/flux-system/base/*.yaml`
5. `**/kustomization.yaml`
6. `infra/*/base/*-values.yaml`, `infra/*/base/*-helm.yaml`
7. `tenants/*/base/*.yaml`
8. `infra/crossplane/base/xrds/*.yaml`, `infra/crossplane/base/compositions/*.yaml`
9. `crds/base/*.yaml` og andre CRD-/API-definisjoner
10. Alle filer identifisert i signal inventory som "agentnyttig kunnskap"

**Nedprioritert:** Trivielle cluster-overlays som bare peker til base, vendor CRD-dumps uten forklaringsverdi, repo-hygiene, gjentatt YAML der mønsteret allerede er forklart.

---

## Seleksjonsregler

### Docs-repo

**Alltid i scope:** `docs/**/*.md` (unntatt `docs/internal/`)

**`docs/internal/**` — selektiv inkludering:**
Inkluder filer med utvikler-impact (tenant/runtime/policy/CI-CD/feilsøking). Ekskluder drift/runbooks uten tenant-impact.

Eksempler:
- Inkluder: `docs/internal/flux.md` (rekonsiliering påvirker utviklere), `docs/internal/service-mesh.md` (nettverkstopologi)
- Ekskluder: `docs/internal/upgrade-component.md` (plattformdrift), `docs/internal/managing-tenants.md` (admin-operasjon)

### Infra-repo — Sti-baserte filtermønstre

```
# XRD-spesifikasjoner (SkybertApp + WebApp)
infra/crossplane/base/xrds/skybertapp.yaml
infra/crossplane/base/xrds/webapp.yaml

# Crossplane compositions
infra/crossplane/base/compositions/skybertapp.yaml
infra/crossplane/base/compositions/webapp.yaml

# Kyverno-policier som påvirker tenanter
infra/kyverno-policies/base/policies-*/**/*.yaml
# + relevante overlays per kluster der de avviker fra base

# Tenant-admin RBAC (aggregerte ClusterRole-fragmenter — hva tenanter kan administrere)
infra/skybert-system/base/tenant-admin-clusterroles/*.yaml

# GlobalNetworkPolicies (rød sone tenant-regler)
infra/globalnetworkpolicies/base/policies-red/*.yaml

# Tenant-bootstrap (normativ struktur)
tenants/*/base/{namespace,rolebinding,serviceaccount*,flux-kustomization}.yaml

# ResourceSet-basert tenant-bootstrap
infra/tenant-bootstrap/base/*.yaml
infra/tenant-bootstrap/base/tenants/*.yaml

# Flux Operator og FluxInstance
infra/flux-operator/base/*.yaml
infra/flux-system/*/flux-instance.yaml

# Tenant-scripts (normativ bootstrap-logikk)
scripts/tenant--*.sh
# Hjelpebibliotek sourcet av tenant-scriptene — bærer avledede fakta (f.eks.
# X-Scope-OrgID, org_mapping) etter refaktorering. Følg disse når en provenance-
# referanse peker på et tenant-script og logikken er flyttet hit.
scripts/lib/grafana/*.sh
# Andre scripts/lib/*.sh leses selektivt bare når de sources av en endret
# tenant-scriptflyt og inneholder dokumentasjonsrelevant logikk.
```

**Lavprioritet i infra (ikke hardt ekskludert):** `crds/`, `infra/alloy/`, `infra/loki/`, `infra/mimir/`, `infra/grafana/`, `infra/cert-manager/`, `infra/external-secrets/`, `infra/ingress-nginx/`, `infra/traefik/`, `infra/tenant-repositories/`, øvrige drifts-scripts.

**Ny tenant vs. innholdsendring:** `infra/tenant-repositories/base/ocirepos/*.yaml` (OCIRepository pr. tenant) og `infra/grafana/*/patch-orgs.yaml` (Entra-gruppe→org-mapping) endres typisk når en **ny tenant** legges til. Da følger de et allerede dokumentert mønster og gir normalt ingen skill-endring — og UUID-er/Entra-gruppe-IDer i `patch-orgs.yaml` filtreres bort per sikkerhetsreglene. Behandle dem kun som skill-relevante hvis selve mønsteret endres (nytt felt, ny provider, endret URL-konvensjon), ikke når en ny tenant-instans tilføyes.

Disse mappene skal IKKE dypleses, men skannes for tenant-impact i discovery pass (FULL) og når compare viser endringer i dem (INKREMENTELL). Tenant-impact betyr konfigurasjon som endrer hva utviklere kan bruke eller observere, f.eks.:
- `crds/` — hvilke CRD-er som er tilgjengelige for tenanter (ExternalSecret, ServiceMonitor, osv.) og deres versjoner
- `infra/external-secrets/` — ClusterSecretStore-navn og oppsett som tenant-manifester refererer til
- `infra/ingress-nginx/` — ingress-klasser, annotasjoner og TLS-oppsett som påvirker tenant-ingress
- `infra/grafana/`, `infra/loki/`, `infra/mimir/`, `infra/alloy/` — datasource-navn, retention, label-konvensjoner som påvirker observability-veiledningen
- `infra/cert-manager/` — issuer-navn og sertifikatflyt
- `infra/traefik/` — ingress-klasse (`ingressClassName: traefik`) og om Gateway API er aktivert, som påvirker tenant-ingress

Toppnivå-mappen `manifests/` (migreringsplaner og frittstående manifester) skannes for tenant-impact: dokumenter med konkrete tenant-steg (f.eks. `httproute-migration.md` med `httpRoute.enabled`/`ingress.enabled`) er skill-relevante; rene plattform-runbooks er støy.

Ren driftskonfigurasjon (replicas, resources, intern tuning) i disse mappene er støy og hoppes over.

---

## Sikkerhetsfiltreringsregler

| Kategori | Handling |
|----------|----------|
| **ALDRI inkluder** | Credentials, tokens, connection strings, passord |
| **ALDRI inkluder** | Spesifikke IP-adresser for interne systemer |
| **ALDRI inkluder** | Azure tenant IDs, subscription IDs som ikke allerede er i skillen |
| **ALDRI inkluder** | Service principal secrets eller certificate thumbprints |
| **VURDER med forsiktighet** | Interne hostnavn, DNS-oppføringer, ACR-URLer |
| **OK å inkludere** | Arkitekturmønstre, navnekonvensjoner, generelle strukturer, CRD-skjemaer, arbeidsflyter |

Azure Subscription IDs og kluster-IP-ranges anonymiseres med plassholdere (`<subscription-id>`, `<ip-range>`) med mindre de allerede er i eksisterende skillfiler. Tenant-navn fra `tenants/`-mappen brukes som eksempler.

---

## Inkrementell vs FULL modus

### FULL modus
Hent komplett filtree fra begge repoer. Alle filer i scope behandles som "endrede". Kjører discovery pass.

### INKREMENTELL modus

Bruker commit SHAs fra `skybert/.oppdater-state.json` (persistent, committet) for å sammenligne:

```bash
gh api repos/FHISkybert/Fhi.Skybert.Docs/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
gh api repos/FHISkybert/Fhi.Skybert.Infra/compare/<old_sha>...<new_sha> --jq '.files[] | {filename, status}'
```

- Bare endrede filer (i scope) leses og analyseres — men se konsekvenssjekken under
- Discovery pass hoppes over ved INKREMENTELL, MED UNNTAK: nye stier i compare-output (added-filer/nye mapper) som ikke matcher routing-tabellen eller filtermønstrene skal leses (mini-discovery), og routing-/filteroppdatering foreslås som selvoppdaterings-post
- Hvis compare feiler (force-push, rebase) → fall tilbake til FULL modus og informer bruker

### Konsekvenssjekk (obligatorisk ved INKREMENTELL)

Routing-tabellen sier hvilke målfiler en endret kildefil *primært* ruter til — men avledede påstander kan ligge hvor som helst i skillen. Etter å ha lest de endrede kildefilene:

1. Identifiser **endrede nøkkelverdier**: feltnavn, defaults, enum-verdier, versjonsnumre, hostnames, image-stier, intervaller, namespace-/navnekonvensjoner, policy-navn.
2. Søk etter hver nøkkelverdi (gammel OG ny form) i **alle** filer under `skybert/` — ikke bare målfilene fra routing.
3. Hvert treff i en fil utenfor primær-routing vurderes: er påstanden der fortsatt korrekt? Hvis ikke → egen endringspost (`KORRIGER`/`UTVID`) for den filen.

Eksempel: endres rekonsilieringsintervallet i `flux-instance.yaml`, berører det ikke bare `platform-architecture.md` (routing), men også «Flux rekonsilerer hvert 2. minutt»-påstanden i `SKILL.md`.

**Runtime output:** Skriv `.tmp/oppdater-skybert/changed-files.json` (ephemeral):
```json
{
  "docs": { "added": [], "modified": [], "removed": [] },
  "infra": { "added": [], "modified": [], "removed": [] }
}
```

### State-fil etter vellykket Apply

Etter vellykket implementering (steg 9) oppdateres `skybert/.oppdater-state.json` med nye commit SHAs:

```json
{
  "schemaVersion": 2,
  "updatedAt": "<ISO-8601>",
  "mode": "github",
  "github": {
    "docs": { "repo": "FHISkybert/Fhi.Skybert.Docs", "branch": "main", "commit": "<ny sha>" },
    "infra": { "repo": "FHISkybert/Fhi.Skybert.Infra", "branch": "main", "commit": "<ny sha>" }
  }
}
```

Den varige staten er i `.oppdater-state.json` — `changed-files.json` i `.tmp/` er kun runtime-cache.

---

## CRD-versjonssporing

I `infra/crossplane/base/xrds/skybertapp.yaml`, les:
```yaml
spec:
  versions:
    - name: v1alpha1    # <-- dette er SkybertApp API-versjonen
      served: true
      referenceable: true
```

Parse `spec.versions[].name` der `served: true` og `referenceable: true`. Sammenlign med metadata i `skybert/SKILL.md`.

Ved endring (f.eks. v1alpha1 → v1beta1):
- Opprett endringspost med `crd-versjon`-flagg
- Inkluder: gammel versjon, ny versjon, alle feltendringer, migreringsveiledning
- Oppdater alle eksempler i `skybertapp-crd.md` og `SKILL.md`

### Felt-nivå-diff (obligatorisk ved enhver XRD-endring)

Versjonssporing er ikke nok — de fleste XRD-endringer skjer innenfor samme versjon. Når `infra/crossplane/base/xrds/skybertapp.yaml` (eller `webapp.yaml`) er endret, lag en felt-nivå-diff av `openAPIV3Schema`:

- Lagt til / fjernet felt
- Endrede `default`-verdier
- Endrede `enum`-verdier
- Endringer i `required`-lister
- Endrede typer, constraints (min/max, pattern) og beskrivelser

Hver feltendring får **egen endringspost** i planen — ikke samlepost som «XRD oppdatert». Dette sikrer at defaults, enums og required/optional aldri blir ufullstendig representert.

### Felt-dekningssjekk (obligatorisk ved FULL)

Ved FULL modus: verifiser at hvert felt i XRD-schemaet er representert i `references/skybertapp-crd.md` med korrekt type, default og required-status. Udekkede felt → `UTVID`-post per felt (eller gruppert per seksjon hvis mange).

### Statiske kopier i skybert/references/skybertapp/

Skillen inneholder statiske kopier av infra-filer, brukt av `references/skybertapp-render.md` for lokal `crossplane render`:

| Kopi i skillen | Kilde i infra-repo |
|----------------|--------------------|
| `references/skybertapp/xrd.yaml` | `infra/crossplane/base/xrds/skybertapp.yaml` (kopieres som-den-er) |
| `references/skybertapp/composition.yaml` | `infra/crossplane/base/compositions/skybertapp.yaml` (kopieres som-den-er) |
| `references/skybertapp/functions.yaml` | `infra/crossplane/base/functions.yaml` — **kopieres IKKE som-den-er**: image-referanser skal omskrives fra ACR-mirror til public `xpkg.crossplane.io` slik at render fungerer uten ACR-login |

Når en kildefil over er endret (compare/discovery):
1. Opprett endringspost for å oppdatere den statiske kopien (for `functions.yaml`: bevar xpkg-omskrivingen, oppdater bare versjoner/innhold)
2. Oppdater provenance-blokken i `references/skybertapp-render.md` (commit SHA, dato, per-fil «sist endret»)
3. Verifiser at eksemplene i `skybertapp-render.md` fortsatt stemmer med ny composition-output

Disse kopiene skal ALDRI drifte stille: ved FULL modus sammenlignes de alltid mot kildefilene, uavhengig av om compare viser endring.

---

## Dekningsanalyse (3 obligatoriske matriser)

### Del A — Docs coverage-matrise (side-for-side)

| Docs-side (fra mkdocs.yml) | Hovedtema | Dekket i skillen hvor? | Dekningsgrad | Hva mangler | Foreslått målfil hvis udekket |
|---|---|---|---|---|---|
| `docs/get-started/index.md` | Onboarding | `skybert/SKILL.md` linjer 30-80 | Komplett | -- | -- |
| `docs/auth/workload-identity.md` | WI | `references/security.md` | Delvis | Federated credential-oppsett, token-utløp | -- |
| `docs/new-topic/something.md` | Nytt emne | Ikke dekket | Fraværende | Alt | ny `references/new-topic.md` |

Hver docs-side MÅ finnes i denne tabellen. Ingen side skal mangle.

**Regler for dekningsgrad:**
- `Delvis` er ugyldig uten konkret innhold i «Hva mangler»-kolonnen — det skal stå *hvilke* opplysninger fra siden som ikke er representert, ikke bare at noe mangler. Hver mangel skal ha en tilhørende endringspost (eller eksplisitt begrunnelse for hvorfor den droppes).
- `Komplett` for normative sider (CRD-referanser, policy-oversikter) krever felt-/regel-nivå-verifikasjon — ikke bare at temaet er omtalt.

### Del B — Infra repo signal inventory

| Fil/mønster i infra-repo | Ga agentnyttig kunnskap? | Hva ble funnet? | Dekket i skillen? |
|---|---|---|---|
| `scripts/bootstrap-cluster.sh` | Ja | Cluster bootstrap-prosedyre | Delvis i SKILL.md |
| `infra/crossplane/base/compositions/storage.yaml` | Ja | Storage-provisjonering | Ikke dekket |
| `infra/gul/overlays/cluster-x/` | Nei (triviell overlay) | -- | -- |

### Del C — Eksisterende skill-innhold uten kilde i repoene

| Skill-fil | Seksjon/linje | Innhold | Vurdering |
|---|---|---|---|
| `SKILL.md` linje 45 | Subscription IDs | Spesifikke Azure-verdier | Beholdes (plattformteam-kunnskap) |
| `troubleshooting.md` | Pod ImagePullBackOff | Erfaringsbasert | Beholdes |
