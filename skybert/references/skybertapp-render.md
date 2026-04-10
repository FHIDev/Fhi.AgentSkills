# Rendering en SkybertApp lokalt

Bruk dette når du trenger å se nøyaktig hvilke Kubernetes-ressurser en
`SkybertApp` ekspanderer til — for review, debugging, eller for å forstå
effekten av en endring i Composition før den merges.

Rendering skjer lokalt via `crossplane render`, uten kluster-tilgang.

## Forutsetninger

- `crossplane` CLI (v2.x). Installer: `curl -sL https://raw.githubusercontent.com/crossplane/crossplane/main/install.sh | sh`
- `helm` (kun hvis SkybertApp-manifestet er en Helm-template, slik det er i
  f.eks. `Fhi.Ki.Mcp.GitOps`)
- Docker daemon — `crossplane render` starter Function-pods som
  containers lokalt

## Statiske kopier i skillen

| Fil | Rolle |
|-----|-------|
| `skybertapp/composition.yaml` | Crossplane Composition (go-templating pipeline) |
| `skybertapp/xrd.yaml` | CompositeResourceDefinition for `SkybertApp` |
| `skybertapp/functions.yaml` | Function-pakker, **omskrevet til public xpkg.crossplane.io** slik at render fungerer uten ACR-login |

**Kilde og provenance:**
- Repo: `FHISkybert/Fhi.Skybert.Infra`
- Commit: `9790452` (main, 2026-03-18)
- Opprinnelige filer:
  - `infra/crossplane/base/compositions/skybertapp.yaml` (sist endret: `1df8be3`)
  - `infra/crossplane/base/xrds/skybertapp.yaml` (sist endret: `e2ce1ca`)
  - `infra/crossplane/base/functions.yaml` — **ikke kopiert som-den-er**;
    vår `functions.yaml` bruker public xpkg i stedet for ACR-mirroren

Disse kopiene kan drifte fra upstream. Se [Refresh](#refresh-av-kopier) nederst.

## Pipeline

```
helm template (hvis nødvendig)  →  SkybertApp XR  →  crossplane render  →  K8s manifester
```

Crossplane render kjører Composition-pipen akkurat som i klusteret, men
uten å faktisk opprette ressursene. Outputen er de samme ressursene som
Crossplane ville ha applied.

## Eksempel: `kodeverk-mcp` fra `Fhi.Ki.Mcp.GitOps`

Filen `base/templates/kodeverk-mcp/skybertapp.yaml` er en Helm-template,
så den må først helm-templates til et konkret XR:

```bash
SKILL_DIR=~/.claude/skills/skybert/references/skybertapp

helm template kodeverk ~/git/fhi/Fhi.Ki.Mcp.GitOps/base/ \
  --show-only templates/kodeverk-mcp/skybertapp.yaml \
  > /tmp/kodeverk-xr.yaml

crossplane render \
  /tmp/kodeverk-xr.yaml \
  $SKILL_DIR/composition.yaml \
  $SKILL_DIR/functions.yaml
```

Forventet output (forkortet) for kodeverk-mcp slik den står i `main`:

| Kind | Navn |
|------|------|
| SkybertApp | `kodeverk-mcp` (echo av composite) |
| Deployment | `kodeverk-mcp-deployment` |
| Ingress | `kodeverk-mcp-ingress` |
| Service | `kodeverk-mcp-svc` |

Fordi XR-et ikke setter `secrets`, `config`, eller `autoscaling`, blir de
respektive grenene (`ConfigMap`, `SecretStore`, `ExternalSecret`,
`HorizontalPodAutoscaler`) ikke rendret. For å se disse: lag et XR som
aktiverer dem, eller bruk et annet tenant-manifest som allerede gjør det
(f.eks. `hdsoknad` i samme repo dersom enabled).

## Eksempel: rått XR uten Helm

Hvis du allerede har et ferdig SkybertApp-manifest (ikke en Helm-template),
kan du hoppe over helm-steget:

```bash
crossplane render \
  min-app.yaml \
  $SKILL_DIR/composition.yaml \
  $SKILL_DIR/functions.yaml
```

## Hva du kan og ikke kan stole på i outputen

**Stol på:**
- Hvilke Kinds som genereres og hvilke betingelser som trigger dem
- Navnemønstre (`<name>-deployment`, `<vault>-<name>` osv.)
- Field values som kommer fra XR-et eller XRD-defaults
- Ingress-issuer-valg basert på hostname-suffiks

**Ikke stol på:**
- `ownerReferences.uid` — render skriver alltid `""`
- `status`-blokken på composite — render stubber den som `Ready=True`
- `metadata.resourceVersion`, `managedFields` osv. — finnes ikke
- Crossplane-injiserte labels/annotations kan avvike litt fra det
  klusteret faktisk setter

Dette er debug/forståelse-verktøy, ikke en bit-for-bit kopi av
kluster-state.

## Feilsøking

**`unauthorized` ved pull av function image** — betyr at du fortsatt bruker
ACR-mirror-varianten. Pek på `$SKILL_DIR/functions.yaml` (public xpkg),
eller kjør `az acr login --name crfhiskybert` før render.

**`cannot start Function ...: docker: Cannot connect to the Docker daemon`**
— Docker kjører ikke. `crossplane render` starter Function-pods som
lokale containere.

**Rendret Deployment har `envFrom: null` / `volumes: null`** — kosmetisk.
Go-templatet emitterer header-nøklene selv når listene er tomme.
Harmløst både lokalt og i klusteret.

**Rendret output inneholder bare `SkybertApp` + `Deployment`** — betyr at
XR-et ditt ikke trigger noen av de betingede grenene
(`hostname`, `config`, `secrets`, `autoscaling`). Ikke en feil.

## Refresh av kopier

Kopiene er statiske og vil drifte. For å synke dem mot upstream `main`:

```bash
SKILL=~/git/fhi/Fhi.AgentSkills/skybert/references/skybertapp
INFRA=~/git/fhi/Fhi.Skybert.Infra

cp $INFRA/infra/crossplane/base/compositions/skybertapp.yaml $SKILL/composition.yaml
cp $INFRA/infra/crossplane/base/xrds/skybertapp.yaml         $SKILL/xrd.yaml
# functions.yaml vedlikeholdes for hånd — den peker på public xpkg,
# ikke ACR-mirroren. Bump versjonene kun når upstream functions.yaml endrer versjon.

( cd $INFRA && git log --oneline -1 )  # noter SHA i render-doken
```

Etter refresh, oppdater provenance-seksjonen øverst i denne filen med
ny commit-SHA.

## Se også

- [SkybertApp CRD-spesifikasjon](skybertapp-crd.md) — felt-referanse og
  fullstendig liste over genererte ressurser
- Upstream Composition:
  https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml
- Crossplane render docs:
  https://docs.crossplane.io/latest/cli/command-reference/#render
