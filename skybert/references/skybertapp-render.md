# Rendering en SkybertApp lokalt

Bruk dette når du trenger å se nøyaktig hvilke Kubernetes-ressurser en
`SkybertApp` ekspanderer til — for review, debugging, eller for å forstå
effekten av en endring i Composition før den merges. Feltreferansen og
navnekonvensjonene står i [SkybertApp CRD-spesifikasjon](skybertapp-crd.md).

Rendering skjer lokalt via `crossplane render`, uten kluster-tilgang.

## Forutsetninger

- `crossplane` CLI (v2). Installer: `curl -sL https://raw.githubusercontent.com/crossplane/crossplane/main/install.sh | sh`.
  Kommandoreferanse: https://docs.crossplane.io/latest/cli/command-reference/#render
- `helm` (kun hvis SkybertApp-manifestet er en Helm-template)
- Docker daemon — `crossplane render` starter Function-pods som
  containers lokalt

> **Operasjonell antakelse:** Kildene dokumenterer ikke lokal rendering; CLI-versjonen følger plattformens Crossplane 2.x, resten er standard `crossplane render`-krav.

## Statiske kopier i skillen

| Fil | Rolle |
|-----|-------|
| `skybertapp/composition.yaml` | Crossplane Composition (go-templating pipeline), kopi av `infra/crossplane/base/compositions/skybertapp.yaml` |
| `skybertapp/xrd.yaml` | CompositeResourceDefinition for `SkybertApp`, kopi av `infra/crossplane/base/xrds/skybertapp.yaml` |
| `skybertapp/functions.yaml` | Function-pakker fra `infra/crossplane/base/functions.yaml`, **omskrevet til public xpkg.crossplane.io** slik at render fungerer uten ACR-login |

Kopiene vedlikeholdes av `oppdater-skybert`-skillen; hvilken infra-commit de tilsvarer står i
`skybert/.oppdater-state.json` (`github.infra.commit`).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/crossplane/base/

## Pipeline

```
helm template (hvis nødvendig)  →  SkybertApp XR  →  crossplane render  →  K8s manifester
```

Crossplane render kjører Composition-pipen akkurat som i klusteret, men
uten å faktisk opprette ressursene. Outputen er de samme ressursene som
Crossplane ville ha applied.

> **Operasjonell antakelse:** Generell `crossplane render`-semantikk; ikke beskrevet i kildene.

## Eksempel: rått XR

`SKILL_DIR` er stien til `skybert/references/skybertapp` der skillen er installert. Lagre
Quick Start-manifestet fra CRD-referansen som `myapp.yaml`:

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0
```

```bash
crossplane render \
  myapp.yaml \
  $SKILL_DIR/composition.yaml \
  $SKILL_DIR/functions.yaml
```

Forventet output:

| Kind | Navn |
|------|------|
| SkybertApp | `myapp` (echo av composite, med `status.replicas` og `status.labelSelector`) |
| Deployment | `myapp-deployment` |

Uten `hostname`, `config`, `secrets` eller `autoscaling` rendres ikke `Service`/`Ingress`,
`ConfigMap`, `SecretStore`/`ExternalSecret` eller `HorizontalPodAutoscaler`. `PodDisruptionBudget`
rendres heller ikke uten `replicas > 1`, `autoscaling.minReplicas > 1` eller eksplisitt
`podDisruptionBudget.enabled: true`. Legg til feltene i XR-et for å se disse grenene.

`status.replicas` på composite-echoen blir **alltid `0`** i render: compositionen leser
`readyReplicas` fra den komponerte Deployment-en via `getComposedResource`, og i render finnes
ingen levende Deployment. Det er ikke en feil.

Er manifestet en Helm-template, render templaten til vanlig YAML først
og render resultatet.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp.yaml

## Hva du kan og ikke kan stole på i outputen

**Stol på:**
- Hvilke Kinds som genereres og hvilke betingelser som trigger dem
- Navnemønstre (`<name>-deployment`, `<vault-lowercase>-secret-<i>-<name>` osv.)
- Field values som kommer fra XR-et eller XRD-defaults
- Ingress-issuer-valg basert på hostname-suffiks
- `status.labelSelector` på composite-echoen — den utledes rent fra navnet (`skybert.fhi.no/webapp=<name>`)

**Ikke stol på:**
- `ownerReferences.uid` — render skriver alltid `""`
- `status`-blokken på composite — render stubber den som `Ready=True`
- `status.replicas` på composite-echoen — alltid `0`, se over
- `metadata.resourceVersion`, `managedFields` osv. — finnes ikke
- Crossplane-injiserte labels/annotations kan avvike litt fra det
  klusteret faktisk setter

Dette er debug/forståelse-verktøy, ikke en bit-for-bit kopi av
kluster-state.

> **Operasjonell antakelse:** Generell `crossplane render`-oppførsel observert mot SkybertApp-compositionen; ikke dokumentert i kildene.

## Feilsøking

**`unauthorized` ved pull av function image** — betyr at du fortsatt bruker
ACR-mirror-varianten. Pek på `$SKILL_DIR/functions.yaml` (public xpkg),
eller kjør `az acr login --name crfhiskybert` før render.

**`cannot start Function ...: docker: Cannot connect to the Docker daemon`**
— Docker kjører ikke. `crossplane render` starter Function-pods som
lokale containere.

**Rendret Deployment har `envFrom: null` / `volumes: null`** — kosmetisk.
Go-templatet emitterer header-nøklene selv når listene er tomme.

**Rendret output inneholder bare `SkybertApp` + `Deployment`** — betyr at
XR-et ditt ikke trigger noen av de betingede grenene (`hostname`, `config`,
`secrets`, `autoscaling`, eller PDB-betingelsen `replicas > 1` /
`autoscaling.minReplicas > 1` / `podDisruptionBudget.enabled: true`). Ikke en feil.

> **Operasjonell antakelse:** Feilbildene er erfaring fra lokal render mot skillens kopier; kildene dokumenterer ikke lokal rendering.
