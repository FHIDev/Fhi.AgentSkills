# Flux-verktøy

## Innhold

- [Flux Dashboard](#flux-dashboard)
- [Flux Operator MCP](#flux-operator-mcp)

---

## Flux Dashboard

### Hva du kan gjøre

Web-basert UI per kluster. Pålogging med FHI Entra ID (samme konto som Grafana).

- Se reconciliation-status for Kustomizations i klusteret, med feilmeldinger ved feilet rekonsiliering
- Trigge manuell rekonsiliering — umiddelbar sync uten å vente på neste intervall
  (se [Flux GitOps](platform-architecture.md#flux-gitops))
- **Suspend / resume** egne Kustomizations for å teste noe i klusteret uten at Flux reverterer:
  1. Suspend din Kustomization
  2. Endre direkte med `kubectl` (env-var, resource-limit, image-tag …)
  3. Observer
  4. Resume — Flux rekonsilerer umiddelbart tilbake til GitOps-state
- Søk og filter på navn/namespace/status
- Pin favoritter for raske snarveier

> **Husk å resume.** Suspended Kustomizations stopper drift-deteksjon. Endringer pushet til GitOps-repoet køes opp og applies først ved resume.

Rettighetene bak knappene (tenant-admins verb på Kustomizations/OCIRepositories og Flux Web UI-verbene
`reconcile`/`suspend`/`resume`/`download`/`restart`) er beskrevet under
[Tenant-RBAC](platform-architecture.md#tenant-rbac).

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/skybert-system/base/tenant-admin-clusterroles/

### Suspend som holder

Suspend med dashboardet eller `flux suspend kustomization <navn> -n tn-<tenant>`, aldri med `kubectl patch` eller `kubectl edit`. Tenantens Kustomization appliseres selv av plattformens `tenants`-Kustomization (hvert 2. minutt). Før hver apply overtar kustomize-controller felt eid av field managers med prefikset `kubectl` (også `kubectl-patch` og `kubectl-edit`), og applyen fjerner så `spec.suspend`, som ikke står i plattformens manifest: tenanten rekonsilierer igjen uten varsel. `flux suspend` skriver feltet med manager `flux`, som ikke overtas, og det blir stående.

> **Operasjonell antakelse:** Observert på røde tenant-klustere: kubectl-suspend ble revertert innen ett intervall, `flux suspend` sto over flere. Mekanismen er lest ut av upstream kustomize-controller (`ApplyCleanupOptions`, https://github.com/fluxcd/kustomize-controller/blob/main/internal/controller/kustomization_controller.go) og fluxcd/pkg (`matchFieldManager`, https://github.com/fluxcd/pkg/blob/main/ssa/patch.go), ikke av Skybert-kildene.

### URL-er per kluster

Flux Web UI eksponeres to steder per kluster: en nginx-`Ingress` på `flux.<color>-<nn>.<domain>` (`<domain>` = `skytest.fhi.no` for sandbox og test, `sky.fhi.no` for prod) og en `ListenerSet` på plattformens `fhinett`-Gateway i `skybert-system` med et `.skybert`-navn. OIDC-`baseURL` er `.skybert`-navnet på alle tenant-klustere. `.skybert`-navnene følger ikke alltid klusternummeret:

| Kluster | Ingress | `.skybert` (OIDC-`baseURL`) |
|---|---|---|
| aks-sandbox-02 | `https://flux.sandbox-02.skytest.fhi.no` | `https://flux-02.sandbox.skybert` |
| aks-ops-test-02 | `https://flux.ops-02.skytest.fhi.no` | `https://flux-ops-02.sandbox.skybert` |
| aks-green-test-02 | `https://flux.green-02.skytest.fhi.no` | `https://flux-02.greentest.skybert` |
| aks-green-prod-03 | `https://flux.green-03.sky.fhi.no` | `https://flux-02.green.skybert` |
| aks-yellow-test-03 | `https://flux.yellow-03.skytest.fhi.no` | `https://flux-03.yellowtest.skybert` |
| aks-yellow-prod-02 | `https://flux.yellow-02.sky.fhi.no` | `https://flux-03.yellow.skybert` |
| aks-norsyss-prod-02 | `https://flux.norsyss-02.sky.fhi.no` | `https://flux-norsyss-02.yellow.skybert` |
| aks-red-test-02 | `https://flux.red-02.skytest.fhi.no` | `https://flux-02.redtest.skybert` |
| aks-red-prod-02 | `https://flux.red-02.sky.fhi.no` (kun nåbar fra secure zone) | `https://flux-02.red.skybert` |

Innloggingen sender deg tilbake til `baseURL`. Hvilken URL som gir fungerende pålogging fra din maskin, er ikke verifisert; svarer ikke `.skybert`-navnet, spør på `#ext-fhi-skybert`.

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/flux-operator/

## Flux Operator MCP

### Hva den gir agenten

MCP-server som lar AI-assistenten lese kluster-tilstand og pod-logger via din kubeconfig.

- Hente Kubernetes-ressurser i ditt namespace (Kustomizations, Deployments, Services, pods)
- Hente pod-logger
- Hente pod-metrics
- Guidet feilsøking av Kustomization/HelmRelease
- Søke i offisiell Flux-dokumentasjon
- Bytte kubeconfig-context (sandbox/test/prod)

> **Sikkerhet:** Secrets maskeres som default (`--mask-secrets=true`).

> Kilde: https://docs.sky.fhi.no/build/flux-mcp/

### Forutsetninger

- `kubectl`-tilgang til Skybert-kluster (se [kubectl-access](kubectl-access.md))
- Kubeconfig som peker på klusteret

> Kilde: https://docs.sky.fhi.no/build/flux-mcp/

### Installasjon

**macOS / Linux / WSL** (anbefalt):

```bash
brew install controlplaneio-fluxcd/tap/flux-operator-mcp
```

**Windows uten WSL:** Last ned `windows_amd64.zip` fra
[Flux Operator MCP releases](https://github.com/controlplaneio-fluxcd/flux-operator/releases),
pakk ut `flux-operator-mcp.exe` til f.eks. `C:\tools\`.

> Kilde: https://docs.sky.fhi.no/build/flux-mcp/

### Editor-konfigurasjon

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "flux-operator-mcp": {
      "command": "flux-operator-mcp",
      "args": ["serve", "--read-only"],
      "env": {
        "KUBECONFIG": "/path/to/.kube/config"
      }
    }
  }
}
```

**VS Code** (settings.json): samme server-blokk under `mcp.servers` i stedet for `mcpServers`.

På Windows: bruk full path til exe og til `KUBECONFIG`, med dobbel backslash i JSON
(`C:\\tools\\flux-operator-mcp.exe`, `C:\\Users\\<bruker>\\.kube\\config`).

> **Bruk `--read-only`.** Uten flagget får MCP-en tilgang til muterende kommandoer (reconcile, suspend, resume, delete). Selv i read-only kan en assistent fortsatt endre klusteret via `kubectl` i terminalen — vær eksplisitt på hva du autoriserer.

> Kilde: https://docs.sky.fhi.no/build/flux-mcp/
