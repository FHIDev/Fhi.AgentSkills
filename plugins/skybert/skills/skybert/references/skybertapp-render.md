# Rendering en SkybertApp lokalt

Bruk dette når du trenger å se nøyaktig hvilke Kubernetes-ressurser en
`SkybertApp` ekspanderer til — for review, debugging, eller for å forstå
effekten av en endring i Composition før den merges. Feltreferansen og
navnekonvensjonene står i [SkybertApp CRD-spesifikasjon](skybertapp-crd.md).

Rendering skjer lokalt via `crossplane render`, uten kluster-tilgang.

> **Operasjonell antakelse:** Lokal inspeksjon av den distribuerte SkybertApp-compositionen; render-forutsetninger og begrensninger står nedenfor.

## Innhold

- [Forutsetninger](#forutsetninger)
- [Statiske kopier i skillen](#statiske-kopier-i-skillen)
- [Eksempel: rått XR](#eksempel-rått-xr)
- [Hva du kan og ikke kan stole på i outputen](#hva-du-kan-og-ikke-kan-stole-på-i-outputen)
- [Feilsøking](#feilsøking)

---

## Forutsetninger

- `crossplane` CLI v2 ([kommandoreferanse](https://docs.crossplane.io/latest/cli/command-reference/#render)), `helm` hvis SkybertApp-manifestet er en Helm-template, og en kjørende Docker daemon.

> **Operasjonell antakelse:** Kildene dokumenterer ikke lokal rendering; CLI-versjonen følger plattformens Crossplane 2.x.

## Statiske kopier i skillen

| Fil | Rolle |
|-----|-------|
| `skybertapp/composition.yaml` | Crossplane Composition (go-templating pipeline), kopi av `infra/crossplane/base/compositions/skybertapp-beta.yaml` |
| `skybertapp/xrd.yaml` | CompositeResourceDefinition for `SkybertApp`, kopi av `infra/crossplane/base/xrds/skybertapp-beta.yaml` |
| `skybertapp/functions.yaml` | Function-pakker fra `infra/crossplane/base/functions.yaml`, omskrevet til public xpkg.crossplane.io for lokal rendering uten ACR-login |

Kopiene gjelder beta-APIet (`skybert-beta.fhi.no/v1beta1`) med `network`-felt, `hostname` og Gateway API-rendring. Alpha-APIet er fortsatt tilgjengelig i legacy-/migrasjonsdokumentasjonen, men ikke som den distribuerte lokale referansen.

Kopiene vedlikeholdes av `oppdater-skybert`-skillen. Vedlikeholdere finner kildecommit i `maintenance/skybert/.oppdater-state.json` (`github.infra.commit`) i repoet Fhi.Skybert.Infra.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/crossplane/base/

## Eksempel: rått XR

`SKILL_DIR` er stien til `plugins/skybert/skills/skybert/references/skybertapp` der skillen er installert. Lagre
beta Quick Start-manifestet som `myapp.yaml`:

```yaml
apiVersion: skybert-beta.fhi.no/v1beta1
kind: SkybertApp
metadata:
  name: myapp
  namespace: tn-mytenant
spec:
  network: fhinett
  image:
    repository: crfhiskybert.azurecr.io/mytenant/myapp
    tag: v1.0.0
```

```bash
crossplane render   myapp.yaml   $SKILL_DIR/composition.yaml   $SKILL_DIR/functions.yaml
```

Forventet output:

| Kind | Navn |
|------|------|
| SkybertApp | `myapp` (echo av composite) |
| Deployment | `myapp-deployment` |

Uten `hostname`, `config`, `secrets` eller `autoscaling` rendres ikke ListenerSet/HTTPRoute,
`ConfigMap`, `SecretStore`/`ExternalSecret` eller `HorizontalPodAutoscaler`.
`PodDisruptionBudget` rendres heller ikke uten relevante betingelser.

`status.replicas` på composite-echoen blir ofte `0` i render fordi compositionen leser `readyReplicas` fra den komponerte Deployment-en, og render har ingen levende Deployment. Det er ikke en feil.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml

## Hva du kan og ikke kan stole på i outputen

**Stol på:**
- Hvilke Kinds som genereres og hvilke betingelser som trigger dem
- Navnemønstre (`<name>-deployment`, `<vault-lowercase>-secret-<i>-<name>` osv.)
- Feltverdier som kommer fra XR-et eller XRD-defaults
- `status.labelSelector` på composite-echoen

**Ikke stol på:**
- `status`, `ownerReferences`, `managedFields` og Crossplane-injiserte labels i render-outputen
- `status.replicas` på composite-echoen — den kan stå `0` i render

Dette er et debug/forståelse-verktøy, ikke en bit-for-bit kopi av kluster-state.

> **Operasjonell antakelse:** Generell `crossplane render`-oppførsel observert mot beta-compositionen; ikke dokumentert i kildene.

## Feilsøking

**`unauthorized` ved pull av function image** — betyr at du fortsatt bruker ACR-mirror-varianten. Pek på `$SKILL_DIR/functions.yaml` (public xpkg).

**Rendret output inneholder bare `SkybertApp` + `Deployment`** — betyr at XR-et ditt ikke trigger noen av de betingede grenene (`hostname`, `config`, `secrets`, `autoscaling` eller PDB-betingelsen). Ikke en feil.

**`network` eller `hostname` mangler** — beta-APIet krever normalt `network` i manifestet og `hostname` løfter eksponering og TLS via Gateway API.

> **Operasjonell antakelse:** Feilbildene er erfaring fra lokal render mot skillens kopier; kildene dokumenterer ikke lokal rendering.
