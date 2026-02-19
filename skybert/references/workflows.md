# GitHub Workflows

## Komplett CI/CD Flyt

```
App-repo push → build-and-push.yaml → Docker image til ACR
                                     → webhook til GitOps-repo
                                     ↓
GitOps-repo   → update-tag.yaml     → oppdater skybertapp.yaml (med PAT!)
              → oci-push.yaml       → OCI artifact til ACR
                                     ↓
Skybert       → Flux (hvert 2 min)  → deployer til Kubernetes
```

## build-and-push.yaml - App-repo workflow

Denne workflowen kjører i **app-repoet** og:
- Bygger Docker image med semantic versioning
- Pusher til ACR
- Trigger GitOps-repo via webhook

```yaml
name: Build and Push

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: build-${{ github.ref }}
  cancel-in-progress: false  # Viktig for semantic versioning

env:
  REGISTRY: crfhiskybert.azurecr.io
  IMAGE_NAME: <tenant>/<tenant>

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Trengs for git tags

      - name: Get and bump version
        id: version
        run: |
          # Hent siste semver-tag på gjeldende branch (ikke fra andre branches)
          LATEST_TAG=$(git describe --tags --abbrev=0 --match '[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")

          # Første release: start på 0.0.1 (ikke 1.0.0 selv om gamle commits har semver +major)
          if [ -z "$LATEST_TAG" ]; then
            echo "Ingen eksisterende tags - starter på 0.0.1"
            echo "version=0.0.1" >> $GITHUB_OUTPUT
            exit 0
          fi

          echo "Latest tag: $LATEST_TAG"

          IFS='.' read -r MAJOR MINOR PATCH <<< "$LATEST_TAG"
          MAJOR=${MAJOR:-0}
          MINOR=${MINOR:-0}
          PATCH=${PATCH:-0}

          # Hent full commit-melding inkludert body (%B) siden forrige tag
          COMMITS=$(git log "$LATEST_TAG"..HEAD --pretty=format:"%B" 2>/dev/null || echo "")

          # Støtter "semver +major" eller "semver +minor" i commit subject eller body
          if [ -z "$COMMITS" ]; then
            echo "Ingen nye commits siden $LATEST_TAG - bumper patch"
            PATCH=$((PATCH + 1))
          elif echo "$COMMITS" | grep -qiE 'semver\s*\+\s*major'; then
            echo "Found semver +major"
            MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0
          elif echo "$COMMITS" | grep -qiE 'semver\s*\+\s*minor'; then
            echo "Found semver +minor"
            MINOR=$((MINOR + 1)); PATCH=0
          else
            echo "Default: bump patch"
            PATCH=$((PATCH + 1))
          fi

          NEW_VERSION="$MAJOR.$MINOR.$PATCH"
          echo "New version: $NEW_VERSION"
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT

      - name: Check if tag exists
        id: check_tag
        run: |
          VERSION="${{ steps.version.outputs.version }}"

          # Sjekk både lokalt og remote for å unngå race condition
          git fetch --tags --quiet

          if git rev-parse "$VERSION" >/dev/null 2>&1; then
            echo "Tag $VERSION eksisterer allerede (lokalt)"
            echo "exists=true" >> $GITHUB_OUTPUT
          elif git ls-remote --tags origin | grep -q "refs/tags/$VERSION$"; then
            echo "Tag $VERSION eksisterer allerede (remote)"
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "Tag $VERSION finnes ikke - fortsetter"
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Azure login
        if: steps.check_tag.outputs.exists != 'true'
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Login to ACR
        if: steps.check_tag.outputs.exists != 'true'
        run: az acr login --name crfhiskybert

      - name: Build and push
        if: steps.check_tag.outputs.exists != 'true'
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }} .
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}

      - name: Create and push git tag
        if: steps.check_tag.outputs.exists != 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a "${{ steps.version.outputs.version }}" -m "Release ${{ steps.version.outputs.version }}"
          git push origin "${{ steps.version.outputs.version }}"

      - name: Trigger GitOps update
        if: steps.check_tag.outputs.exists != 'true'
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.GITOPS_PAT }}
          repository: ${{ vars.GITOPS_REPO }}
          event-type: update_tag
          client-payload: '{"env": "test", "updates": [{"repository": "${{ github.event.repository.name }}", "tag": "${{ steps.version.outputs.version }}"}]}'
```

## Viktige robusthetsforbedringer

**1. Hent kun tags fra gjeldende branch:**
```bash
git describe --tags --abbrev=0 --match '[0-9]*.[0-9]*.[0-9]*'
```
Bruker `git describe` istedenfor `git tag -l` for å unngå at tags fra andre branches blir valgt.

**2. Les full commit-melding (%B):**
```bash
git log "$LATEST_TAG"..HEAD --pretty=format:"%B"
```
Leser både subject og body, slik at `semver +minor` i PR-beskrivelse eller commit-body fungerer.

**3. Sjekk remote tags:**
```bash
git fetch --tags --quiet
git ls-remote --tags origin | grep -q "refs/tags/$VERSION$"
```
Forhindrer race condition hvis to builds kjører samtidig.

**4. HTTP-kode sjekk på curl:**
```bash
HTTP_CODE=$(curl -s -o /tmp/response.txt -w "%{http_code}" ...)
if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
  exit 1
fi
```
Feiler workflow hvis GitOps-trigger ikke lykkes (401/404).

## Concurrency

For å unngå race conditions ved samtidige pushes, bruk concurrency:

```yaml
concurrency:
  group: build-${{ github.ref }}
  cancel-in-progress: false  # Ikke avbryt pågående builds
```

Viktig for semantic versioning - sikrer at versjoner bumpes sekvensielt.

## oci-push.yaml - Bygge og pushe til ACR

Denne workflowen:
- Oppdager automatisk alle miljø-mapper (test, prod, etc.)
- Støtter tre konfigurasjonstyper:
  - **Helm**: Hvis `Chart.yaml` finnes
  - **Kustomize**: Hvis `kustomization.yaml` finnes
  - **Plain YAML**: Alle andre YAML-filer kopieres direkte
- Pusher OCI-artifacts til ACR med Workload Identity
- Signerer artifacts med Cosign
- Kjører automatisk på push til main

Viktig: Kun `TENANT` env-variabelen trenger endring.

### OCI-artifact navnekonvensjon
Workflowen pusher OCI-artifacts til:
`crfhiskybert.azurecr.io/<tenant>/gitops_<env>:latest`

Eksempel: `crfhiskybert.azurecr.io/grossiststatistikken/gitops_test:latest`

## update-tag.yaml - Automatisk tag-oppdatering

Trigger denne via `repository_dispatch` med event-type `update_tag`. Payload-format:
```json
{"env": "<miljø>", "updates": [{"repository": "<repo-navn>", "tag": "<versjon>"}]}
```

```yaml
name: Update Image Tag
on:
  repository_dispatch:
    types: [update_tag]

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_PAT }}  # KRITISK: Må bruke PAT for workflow chaining!
      - name: Update tag
        run: |
          ENV="${{ github.event.client_payload.env }}"
          NEW_TAG=$(echo '${{ toJson(github.event.client_payload.updates) }}' | jq -r '.[0].tag')
          sed -i "s/tag: .*/tag: \"$NEW_TAG\"/" "${ENV}/skybertapp.yaml"
      - name: Commit
        run: |
          ENV="${{ github.event.client_payload.env }}"
          NEW_TAG=$(echo '${{ toJson(github.event.client_payload.updates) }}' | jq -r '.[0].tag')
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add "${ENV}/skybertapp.yaml"
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "Update image tag to $NEW_TAG in $ENV"
            git push
          fi
```

## Promotion fra test til prod

For å promotere til prod, bruk en manuell `workflow_dispatch`-workflow i app-repoet:

```yaml
name: Promote to Prod

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Versjon å promotere til prod (f.eks. 0.0.20)"
        required: true
        type: string

jobs:
  promote:
    runs-on: ubuntu-latest
    environment: prod  # Krever GitHub Environment med required reviewers
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Validate version format
        run: |
          VERSION="${{ inputs.version }}"
          if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "::error::Ugyldig versjon — må matche semver-format (x.y.z)"
            exit 1
          fi

      - name: Azure login
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Verify image exists in ACR
        run: |
          az acr manifest show-metadata \
            --registry crfhiskybert \
            --name "<tenant>/<tenant>" \
            --tag "${{ inputs.version }}" || exit 1

      - name: Trigger GitOps update for prod
        run: |
          curl -s -X POST \
            https://api.github.com/repos/<org>/<gitops-repo>/dispatches \
            -H "Authorization: token ${{ secrets.GH_PAT }}" \
            -d '{"event_type":"update-tag","client_payload":{"env":"prod","tag":"${{ inputs.version }}"}}'
```

`update-tag.yaml` i GitOps-repoet håndterer `env: "prod"` ved å opprette en PR (i stedet for direkte push som for test).

## Input-validering i update-tag.yaml

Workflowen bør validere input:
- **env**: Kun `test` eller `prod` (allowlist)
- **tag**: Må matche semver-format (`^\d+\.\d+\.\d+$`)

```yaml
- name: Validate inputs
  run: |
    ENV="${{ github.event.client_payload.env }}"
    TAG="${{ github.event.client_payload.tag }}"
    if [[ "$ENV" != "test" && "$ENV" != "prod" ]]; then
      echo "::error::Ugyldig env" && exit 1
    fi
    if [[ ! "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "::error::Ugyldig tag" && exit 1
    fi
```

## VIKTIG: Workflow Chaining med PAT

Checkout-steget MÅ bruke `token: ${{ secrets.GH_PAT }}` fordi:
- GitHub Actions sikkerhet: Commits gjort med standard `GITHUB_TOKEN` kan IKKE trigge andre workflows
- Uten PAT vil `oci-push.yaml` ALDRI trigges automatisk etter at `update-tag.yaml` oppdaterer skybertapp.yaml
- PAT må ha både `repo` og `workflow` scopes

## Signerte commits med actions--create-commit

For commits som krever GPG-signering:

```yaml
- uses: FHISkybert/actions--create-commit@v1
  with:
    message: "Deploy version ${{ env.VERSION }}"
    add: "test/skybertapp.yaml"
```

## PAT for repository_dispatch på tvers av repoer

`GITHUB_TOKEN` fungerer ikke for `repository_dispatch` mellom repoer (gir 404-feil). Du må bruke en personlig PAT:

1. Opprett en PAT med `repo` scope på github.com/settings/tokens
2. Legg til PAT som repository secret i app-repoet (f.eks. `GITOPS_PAT`)
3. Bruk denne i workflowen som trigger GitOps-repoet

Eksempel trigger fra app-repo (anbefalt med `peter-evans/repository-dispatch@v3`):
```yaml
- name: Trigger GitOps update
  uses: peter-evans/repository-dispatch@v3
  with:
    token: ${{ secrets.GITOPS_PAT }}
    repository: ${{ vars.GITOPS_REPO }}
    event-type: update_tag
    client-payload: '{"env": "test", "updates": [{"repository": "${{ github.event.repository.name }}", "tag": "${{ steps.version.outputs.version }}"}]}'
```

*Merk: GitHub har dessverre ikke støtte for service accounts, så PAT er eneste løsning.*
