# Flux-verktøy

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

### URL-er per kluster

URL-mønster: `https://flux.<color>-<instance>.<domain>` (`<domain>` = `skytest.fhi.no` for non-prod, dvs. sandbox og test, `sky.fhi.no` for prod).

| Sone | Miljø | URL |
|------|-------|-----|
| Sandbox | sandbox | `https://flux.sandbox-01.skytest.fhi.no` |
| Grønn | test | `https://flux.green-01.skytest.fhi.no` |
| Grønn | prod | `https://flux.green-02.sky.fhi.no` |
| Gul | test | `https://flux.yellow-02.skytest.fhi.no` |
| Gul | prod | `https://flux.yellow-01.sky.fhi.no` |
| Rød | test | `https://flux.red-01.skytest.fhi.no` |
| Rød | prod | `https://flux.red-01.sky.fhi.no` (kun nåbar fra secure zone) |

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/

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
