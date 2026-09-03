# Kubectl-tilgang til Skybert

## Forutsetninger

1. Azure CLI installert (Windows: via «Firmaportal», Linux/WSL: [Microsofts guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-linux)).
   I WSL: verifiser med `which az` at du ikke kjører Windows-binæren.
2. `kubectl` og/eller `k9s` installert (`winget install kubectl`, `winget install k9s`).
3. Tilgangspakke bestilt og godkjent på https://myaccess.microsoft.com/. Pakken gir medlemskap i
   tenantens rollegruppe (mønster `A-FHI-XX-Tenant`); én av tenantens to godkjennere
   (`A-FHI-AP-XX-Approver`) godkjenner — en godkjenner kan ikke godkjenne seg selv — og tilgangen er
   tidsbegrenset til ett år.
4. `az logout && az login` etter at tilgangspakken er innvilget, og på nytt etter PIM-aktivering.

> Kilde: https://docs.sky.fhi.no/get-started/connectedk8s/ · https://docs.sky.fhi.no/miscellaneous/access-packages/

## Koble til klusteret

Klustrene er AKS på Azure Local, Arc-connected, uten direkte nettverkstilgang. All kubectl-trafikk
går via `az connectedk8s proxy` (ikke `az aks get-credentials`).

**Steg 1: Start proxy (hold terminalen åpen)**

```powershell
az connectedk8s proxy --resource-group <resource-group> --name <kluster-navn> --subscription <subscription-id>
```

Verdiene står i [klustertabellen](#tilgjengelige-klustere) — bruk den, ikke et navnemønster
(sandbox og ops-test følger ikke `rg-fhi-aks-<sone>-<env>-weu-01`). Har du valgt riktig subscription
ved `az login`, kan `--subscription` utelates. Proxyen registrerer selv en kubectl-context;
plattformens egne verktøy (`ska az proxy`, `sk8`) starter den på en tilfeldig port i 47000–49999.

**Steg 2: Kjør kubectl i en annen terminal**

```powershell
kubectl config set-context --current --namespace=tn-<tenant>
kubectl get pods
```

Du har kun tilgang i eget namespace `tn-<tenant>`. Manuelle endringer rulles tilbake av Flux
innen få minutter — permanente endringer gjøres via GitOps. `exec`/`port-forward`/`attach`/`proxy`
virker kun i sandbox, green-test, yellow-test-02 og ops-test; i prod blokkerer Kyverno, i red-test
mangler RBAC-fragmentet — se [Kyverno-policier](kyverno-policies.md#produksjon--runtime-restriksjoner).

> Kilde: https://docs.sky.fhi.no/get-started/connectedk8s/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/az--proxy.sh

## Tilgjengelige klustere

`scripts/lib/clusters.sh` i infra-repoet er autoritativt register (navn, resource group,
subscription, OIDC issuer, PIM). Samme data publiseres maskinlesbart på
https://docs.sky.fhi.no/sk8/clusters.json (`name`, `resourceGroup`, `subscription`,
`oidcIssuerUrl`, `needsPim`). `COLOR_GROUP_CLUSTERS` i samme fil definerer lanene:
hver farge = sandbox + ett test- + ett prod-kluster.

### Sandbox

| Kluster | Resource Group | Subscription ID |
|---------|---------------|----------------|
| aks-sandbox-01 | `rg-fhi-aks-sandbox-weu-01` | `09fc3dd5-8ce9-4951-a7a6-49f95b871cbd` |

`aks-sandbox-01` er felles for alle fargesoner.

### Test

| Kluster | Resource Group | Subscription ID |
|---------|---------------|----------------|
| aks-green-test-01 | `rg-fhi-aks-green-test-weu-01` | `09fc3dd5-8ce9-4951-a7a6-49f95b871cbd` |
| aks-yellow-test-02 | `rg-fhi-aks-yellow-test-weu-01` | `09fc3dd5-8ce9-4951-a7a6-49f95b871cbd` |
| aks-yellow-test-01 [¹] | `rg-fhi-aks-yellow-test-weu-01` | `09fc3dd5-8ce9-4951-a7a6-49f95b871cbd` |
| aks-red-test-01 | `rg-fhi-aks-red-test-weu-01` | `247deb95-d7de-4d1b-9fab-1f50a24715ed` |
| aks-ops-test-01 [²] | `rg-fhi-aks-yellow-test-weu-01` | `09fc3dd5-8ce9-4951-a7a6-49f95b871cbd` |

### Produksjon

| Kluster | Resource Group | Subscription ID |
|---------|---------------|----------------|
| aks-green-prod-02 | `rg-fhi-aks-green-prod-weu-01` | `c0b8ff18-a1bc-4390-ba6d-a9c252e86252` |
| aks-yellow-prod-01 | `rg-fhi-aks-yellow-prod-weu-01` | `c0b8ff18-a1bc-4390-ba6d-a9c252e86252` |
| aks-red-prod-01 | `rg-fhi-aks-red-prod-weu-01` | `88fde73a-d4a6-4aab-b8be-31810fcd7116` |
| aks-norsyss-prod-01 [³] | `rg-fhi-aks-norsyss-prod-weu-01` | `c0b8ff18-a1bc-4390-ba6d-a9c252e86252` |

[¹] Registrert, men ikke i `COLOR_GROUP_CLUSTERS` — yellow-lanen bruker `aks-yellow-test-02`.

[²] Plattformens eget test-/utviklingskluster (første kluster ved komponentoppgraderinger). Deler resource group og subscription med yellow-test.

[³] Ikke i `COLOR_GROUP_CLUSTERS`; kjører samme Kyverno-policysett som gul prod.

> Kilde: https://docs.sky.fhi.no/get-started/connectedk8s/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/lib/clusters.sh

### PIM (Privileged Identity Management)

PIM-aktivering kreves for alle produksjonsklustere og for `aks-red-test-01` (`needsPim: true` i
registeret). Aktiver via Azure Portal → **Privileged Identity Management** → **My Roles** → Groups
([direktelenke](https://portal.azure.com/#blade/Microsoft_Azure_PIMCommon/CommonMenuBlade)), og kjør
`az logout && az login` etterpå. Formålet er logging av hvem/når/hvorfor; daglige oppgaver skal
løses via Grafana eller testklustrene.

> Kilde: https://docs.sky.fhi.no/miscellaneous/PIM/ · https://docs.sky.fhi.no/sk8/clusters.json

### OIDC issuer URL-er

Trengs ved opprettelse av federated credentials på managed identities (workload identity mot
Kubernetes service accounts). Format: `https://europe.oic.prod-arc.azure.com/<entra-tenant-id>/<issuer-id>/`.

| Kluster | OIDC issuer URL |
|---------|-----------------|
| aks-sandbox-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/cf8f6b35-4954-4548-b3da-37287cdbe99b/` |
| aks-green-test-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/8eae23c5-dedf-4812-9c32-9de1adbb67c9/` |
| aks-yellow-test-02 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/bfb4e46e-3df2-436b-985b-ecdc184e46f7/` |
| aks-yellow-test-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/5218cffc-5c13-4b12-8edc-0d76cba4c9a3/` |
| aks-ops-test-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/50541d55-54ba-48bc-bb33-bfeec177d216/` |
| aks-red-test-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/30e79bc7-b120-4a86-8b94-07d875ccface/` |
| aks-green-prod-02 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/2776d74b-e71f-41e5-b56e-4db0abc67cd3/` |
| aks-yellow-prod-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/3ba54ddb-2c2c-4bf5-81d0-e2f419b5f466/` |
| aks-red-prod-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/94639478-26a0-487a-926e-0dca36bce049/` |
| aks-norsyss-prod-01 | `https://europe.oic.prod-arc.azure.com/54475f80-1baa-4ea9-9185-c0de5cc603fe/2e7d357f-5942-4fad-bc16-91b0de9a7471/` |

Hent live (klustrene er Arc-ressurser — `az connectedk8s show`, ikke `az aks show`):

```bash
az connectedk8s show --name <cluster> --resource-group <rg> --subscription <sub> \
  --query oidcIssuerProfile.issuerUrl -o tsv
```

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/lib/clusters.sh · https://docs.sky.fhi.no/internal/replace-cluster-in-place/

## sk8 CLI — automatisert PIM + proxy

Go-CLI i infra-repoet (`utils/sk8/`), publisert som GitHub-release (`sk8/v*`-tags) på
`FHISkybert/Fhi.Skybert.Infra` — nedlasting krever tilgang til repoet. Forutsetninger: `az` med
`connectedk8s`-extension, `kubectl`, `gh`. Klusterregisteret hentes fra
`https://docs.sky.fhi.no/sk8/clusters.json` (lokal cache + innebygd fallback; `--refresh` tvinger ny henting).

- **`sk8 cluster [navn]`** — interaktiv picker eller fuzzy-match på delnavn, PIM-aktivering ved
  behov (`--justification`, `--duration-hours`, `--skip-pim`), og `az connectedk8s proxy` i
  bakgrunnen. Kjøres den på nytt mens proxyen lever, kan den bytte kubectl-context i stedet.
  `sk8 cluster list` viser registeret.
- **`sk8 status --tenant <tenant>`** — sammenligner siste commit i GitOps-repoet
  (`FHIDev/Fhi.<Tenant>.GitOps`, via `gh`) med det Flux har deployet på gjeldende context
  (`Kustomization.status.lastAppliedOriginRevision` + readiness), og skanner `tn-<tenant>` for
  suspenderte Kustomizations, crash-loops, image-pull-feil og deployments uten klare replikaer.
- **`sk8 policies --tenant <tenant>`** — aggregerer Kyverno PolicyReports for tenanten på gjeldende
  context: anbefalinger og policy-brudd, gruppert på melding og merket **Recommendation** eller
  **Planned enforced**, med berørte workloads under. VPA-/Goldilocks-anbefalinger vises ikke her —
  se [Observability](observability.md#ressursanbefalinger-i-grafana).
- **`sk8 suspend --tenant <tenant>` / `sk8 resume --tenant <tenant>`** — pauser/gjenopptar
  Flux-rekonsiliering av tenantens Kustomization på gjeldende context. Samme som Flux-dashboardet
  gjør — se [Flux-verktøy](flux-tooling.md#flux-dashboard).

`--tenant` husker sist brukte tenant. Bash-dispatcheren `ska` (`ska tenant new` →
`scripts/tenant--new.sh`) er plattformteamets verktøy og ikke det samme som `sk8`.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/sk8/README.md · https://docs.sky.fhi.no/internal/ska-cli/

## k9s

`winget install k9s`, start proxy som over, og kjør `k9s -n tn-<tenant>`. Hjelp finnes i UI-et og
på https://k9scli.io/topics/commands/.

> Kilde: https://docs.sky.fhi.no/get-started/connectedk8s/

## Kjøre container lokalt fra ACR

Samme image som kjører i Skybert kan kjøres lokalt (Docker Desktop):

```powershell
az login
az acr login --name crfhiskybert
docker pull crfhiskybert.azurecr.io/<tenant>/<app>:<tag>
docker run -p 8080:8080 crfhiskybert.azurecr.io/<tenant>/<app>:<tag>
```

Det krever AcrPull for din bruker på `crfhiskybert.azurecr.io`, som ikke følger av tilgangspakken —
be om det på `#ext-fhi-skybert` (oppgi bruker og `<tenant>/<app>`). Feiler `docker pull` med
«pull access denied» eller «repository does not exist» selv om `az acr login` lyktes, mangler
tilgangen; ACR skjuler om repoet finnes.

> **Operasjonell antakelse:** Lokal pull fra Skybert-registeret er ikke beskrevet i docs eller infra; imagenavnet følger docs' konvensjon, tilgangsmodellen er observert i bruk.
