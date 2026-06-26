# Flux-verktøy

Flux-plattformen tilbyr to verktøy for utviklere som jobber med GitOps:
Flux Dashboard (web-UI) og Flux Operator MCP (AI-assistent-integrasjon).

## Flux Dashboard

Web-basert UI per kluster. Pålogging via FHI Entra ID.

### Hva du kan gjøre

- Se reconciliation-status for alle Kustomizations i klusteret
- Se feilmeldinger ved feilet rekonsiliering
- Trigge manuell rekonsiliering (umiddelbar sync uten å vente på 2-min-intervallet)
- **Suspend / resume** eksisterende Kustomizations i ditt eget namespace — tenant-admin har lese-, patch- og update-rettigheter (`get`/`list`/`watch`/`patch`/`update`), men ikke create/delete:
  1. Suspend din Kustomization
  2. Endre direkte med `kubectl` (env-var, resource-limit, image-tag …)
  3. Observer
  4. Resume — Flux reverterer til GitOps-state
- Søk og filter på navn/namespace/status
- Pin favoritter for raske snarveier

> **Husk å resume.** Suspended Kustomizations stopper drift-deteksjon. Endringer pushet til GitOps-repoet køes opp og applies først ved resume.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/8aa3d7a71eb1209962ff3769a00a169cb3caec8e/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml

### URL-er per kluster

URL-mønster: `https://flux.<color>-<instance>.<domain>` (`<domain>` = `skytest.fhi.no` for test, `sky.fhi.no` for prod).

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

Model Context Protocol-server som lar AI-assistenter (Cursor, VS Code Copilot,
Claude Desktop, Windsurf) lese kluster-tilstand og pod-logger via kubectl —
uten å forlate editoren.

### Hva den gir agenten

- Hente Kubernetes-ressurser i ditt namespace (Kustomizations, Deployments, Services, pods)
- Hente pod-logger
- Hente pod-metrics
- Guidet feilsøking av Kustomization/HelmRelease
- Søke i offisiell Flux-dokumentasjon
- Bytte kubeconfig-context (sandbox/test/prod)

> **Sikkerhet:** Secrets maskeres som default (`--mask-secrets=true`).

### Forutsetninger

- `kubectl`-tilgang til Skybert-kluster (se [kubectl-access](kubectl-access.md))
- Kubeconfig som peker på klusteret

### Installasjon

**macOS / Linux / WSL** (anbefalt):

```bash
brew install controlplaneio-fluxcd/tap/flux-operator-mcp
```

**Windows uten WSL:** Last ned `windows_amd64.zip` fra
[Flux Operator MCP releases](https://github.com/controlplaneio-fluxcd/flux-operator/releases),
pakk ut `flux-operator-mcp.exe` til f.eks. `C:\tools\`.

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

**VS Code** (settings.json):

```json
{
  "mcp": {
    "servers": {
      "flux-operator-mcp": {
        "command": "flux-operator-mcp",
        "args": ["serve", "--read-only"],
        "env": { "KUBECONFIG": "/path/to/.kube/config" }
      }
    }
  }
}
```

På Windows: bruk full path til exe og til `KUBECONFIG`
(`C:\\Users\\<bruker>\\.kube\\config`).

> **Bruk `--read-only`.** Uten flagget får MCP-en tilgang til muterende kommandoer (reconcile, suspend, resume, delete). Selv i read-only kan en assistent fortsatt endre klusteret via `kubectl` i terminalen — vær eksplisitt på hva du autoriserer.

> Kilde: https://docs.sky.fhi.no/build/flux-mcp/
