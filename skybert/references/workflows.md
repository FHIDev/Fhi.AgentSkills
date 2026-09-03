# GitHub Workflows

## Premade baseline i GitOps-repo

GitOps-repoet (`Fhi.<Tenant>.GitOps`) leveres med `.github/workflows/oci-push.yaml` og
`.github/workflows/update-tag.yaml` ferdig konfigurert fra malen, samt miljømappene `sandbox/`, `test/`
og `prod/` med et eksempel-SkybertApp i hver. Workflow-filene skal ikke endres; `<TENANT>`-placeholderen
byttes ut av plattformens bootstrap-script når repoet opprettes.

App-repoet har ingen foreskrevet workflow-fil eller CI-verktøy (GitHub Actions, Azure DevOps o.l.). Det som
trengs er at CI bygger og pusher imaget til `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>` og deretter
trigger `update-tag.yaml` i GitOps-repoet (se under).

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/get-started/gitops-repo/

## Påkrevde GitHub Repository-variabler og secrets

**GitOps-repoet** får `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` og `AZURE_SUBSCRIPTION_ID` satt som
repository-variabler av plattformteamet ved onboarding. De peker på tenantens managed identity
`tn-<tenant>-acr-push`, som er federert til GitOps-repoet og brukes av `oci-push.yaml`. Teamet trenger ikke
sette noe her selv.

**App-repoet** konfigureres av teamet (brukes med `vars.*` / `secrets.*`):

| Type | Navn | Beskrivelse |
|------|------|-------------|
| Variabel | `GITOPS_REPO` | GitOps-repoet som skal trigges, f.eks. `FHIDev/Fhi.<tenant>.GitOps` |
| Secret | `GITOPS_APP_CLIENT_ID` | Client ID for GitHub App installert på GitOps-repoet |
| Secret | `GITOPS_APP_PRIVATE_KEY` | Privat nøkkel (PEM-innhold) for samme GitHub App — ikke client secret |
| Variabel | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Kun hvis app-repoet skal pushe imaget med `tn-<tenant>-acr-push`. Plattformteamet federerer identiteten til app-repoet (branch `main` eller et GitHub environment) og setter variablene — be om dette. Skal være variabler, ikke secrets |

> Kilde: https://docs.sky.fhi.no/build/how-to/trigger-gitops-promotion/ · https://docs.sky.fhi.no/internal/attach-application-repo/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--bootstrap--azure.sh

## Komplett CI/CD Flyt

```
App-repo: bygg og push image → repository_dispatch (update_tag) til GitOps-repo
GitOps-repo: update-tag.yaml committer ny tag i <env>/ → oci-push.yaml pusher gitops_<env> til ACR
Kluster: Flux henter artefaktet og applyer
```

Flux-intervaller og hva som skjer i klusteret er beskrevet i
[Flux GitOps](platform-architecture.md#flux-gitops).

> Kilde: https://docs.sky.fhi.no/build/

## oci-push.yaml - Bygge og pushe til ACR

- Kjører på push til `main` i GitOps-repoet.
- Pakker den faste listen `sandbox`, `test` og `prod` til ett OCI-artefakt hver. Listen er fast; workflowen
  oppdager ikke andre mapper.
- Gjenkjenner Helm (`Chart.yaml`) og Kustomize (`kustomization.yaml`) og kjører `helm template` /
  `kustomize build` før pakking. Annen YAML pakkes som den er.
- Pusher med tenantens managed identity via `AZURE_*`-variablene.

> Kilde: https://docs.sky.fhi.no/get-started/gitops-repo/

### OCI-artifact navnekonvensjon

Artefaktene pushes til `crfhiskybert.azurecr.io/<tenant>/gitops_<env>:latest`, f.eks.
`crfhiskybert.azurecr.io/exempl/gitops_prod:latest`. Mappenavn styrer artefaktnavn, så ikke endre dem.
Plattformens `OCIRepository` for tenanten (én per kluster, i namespace `tenant-repositories`) peker på
nøyaktig denne URL-en. Kyverno-policyen `flux-verify-sources` (Enforce) tillater bare `OCIRepository`-URL-er
under `oci://crfhiskybert.azurecr.io/`.

> Kilde: https://docs.sky.fhi.no/get-started/gitops-repo/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/tenant-repositories/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/flux-verify-sources.yaml

## update-tag.yaml - Automatisk tag-oppdatering

`update-tag.yaml` trigges av `repository_dispatch` med event-type `update_tag` og oppdaterer image-taggen i
manifestene under `<env>/` i GitOps-repoet. Committen til `main` trigger `oci-push.yaml`, som pusher nytt
`gitops_<env>`-artefakt. Payload-format:

```json
{
  "env": "prod",
  "updates": [
    { "repository": "<app>", "tag": "v1.2.3" }
  ]
}
```

**Regler:**
- Ett `env` per kall (`sandbox`, `test` eller `prod`).
- Flere image-repositories kan oppdateres i samme kall via `updates[]`.
- `repository` er **image-repository-navnet i GitOps-manifestene** — `<app>`-segmentet i
  `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>` (`spec.image.repository` i SkybertApp). Det er ikke
  GitHub-repo-navnet, med mindre de tilfeldigvis er like.

Egen POST-request utenfor GitHub Actions (f.eks. fra Azure DevOps) er ikke dokumentert i docs — kontakt
plattformteamet.

> Kilde: https://docs.sky.fhi.no/build/ · https://docs.sky.fhi.no/build/how-to/trigger-gitops-promotion/

### Promotion til neste miljø

Manifestene flyter `sandbox → test → prod`. Promotion er et nytt `repository_dispatch`-kall med ønsket `env`
og samme tag, sendt når teamet er trygg på versjonen. Docs' eksempel fra en GitHub-workflow i app-repoet
(`image_tag` er output fra bygg-jobben):

```yaml
      - name: Create GitHub app token
        uses: actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1 # v3.2.0
        id: gitops-app-token
        with:
          client-id: ${{ secrets.GITOPS_APP_CLIENT_ID }}
          private-key: ${{ secrets.GITOPS_APP_PRIVATE_KEY }}
          owner: FHIDev
          repositories: |
            Fhi.<tenant>.GitOps

      - name: Trigger GitOps promotion workflow
        uses: peter-evans/repository-dispatch@28959ce8df70de7be546dd1250a005dd32156697 #v4.0.1
        with:
          token: ${{ steps.gitops-app-token.outputs.token }}
          repository: ${{ vars.GITOPS_REPO }}
          event-type: update_tag
          client-payload: |
            {"env": "prod", "updates": [{"repository": "<app>", "tag": "${{ needs.build-and-push.outputs.image_tag }}"}]}
```

`owner` er organisasjonen som eier GitOps-repoet; `repositories` lister kun repoer der appen er installert.

> Kilde: https://docs.sky.fhi.no/build/how-to/trigger-gitops-promotion/

## GitHub App for repository_dispatch på tvers av repoer

Standard `GITHUB_TOKEN` i app-repoet kan ikke nå et annet repo eller en annen org. Dokumentert mønster er en
**GitHub App** installert kun på GitOps-repoet, med **Contents: Read and write** (Metadata: Read følger med).
Workflowen minter et kortlivet installasjonstoken med `actions/create-github-app-token` fra secrets
`GITOPS_APP_CLIENT_ID` og `GITOPS_APP_PRIVATE_KEY` (Client ID + privat nøkkel-PEM — **ikke** client secret),
og sender dispatch med `peter-evans/repository-dispatch` (se eksempelet over). App-oppsett bestilles hos
plattformteamet på NHN-Slack `#ext-fhi-skybert`; docs har ferdig meldingsmal med GitOps-repo, kaller-repo og
app-navn `<tenant>-gitops-dispatch`.

> Kilde: https://docs.sky.fhi.no/build/how-to/trigger-gitops-promotion/

### Eldre oppsett: PAT

Har app-repoet en `GITOPS_PAT` fra før, bytt til GitHub App-mønsteret over.

> **Operasjonell antakelse:** PAT-oppsettet finnes i eksisterende tenant-repoer, men er ikke beskrevet i docs eller infra.
