# Flux-verktøy

Flux-plattformen tilbyr to verktøy for utviklere som jobber med GitOps:
Flux Dashboard (web-UI) og Flux Operator MCP (AI-assistent-integrasjon).

## Flux Dashboard

Web-basert UI per kluster. Pålogging via FHI Entra ID.

### Hva du kan gjøre

- Se reconciliation-status for alle Kustomizations i klusteret
- Se feilmeldinger ved feilet rekonsiliering
- Trigge manuell rekonsiliering (umiddelbar sync uten å vente på 2-min-intervallet)
- **Suspend / resume** eksisterende Kustomizations i ditt eget namespace — suspend/resume gjøres med `patch`. Tenant-admin har `get`/`list`/`watch`/`patch`/`update`/`create`/`delete` på Kustomizations (create/delete for å legge til egne ekstra Kustomizations). Flux `OCIRepositories` er derimot plattform-bootstrappet: kun `get`/`list`/`watch`/`patch`/`update` (ingen create/delete):
  1. Suspend din Kustomization
  2. Endre direkte med `kubectl` (env-var, resource-limit, image-tag …)
  3. Observer
  4. Resume — Flux reverterer til GitOps-state
- **Reconcile / restart-knapper** i Web UI styres av egne SubjectAccessReview-verb (`reconcile`/`suspend`/`resume`/`download`/`restart`) via ClusterRole `skybert:tenant-admin:flux-web-ui`. Dette er UI-affordanser, ikke kubectl-verb — der en knapp faktisk endrer en ressurs, krever det at tenant-admin også har de ordinære native rettighetene fra core-fragmentet.
- Søk og filter på navn/namespace/status
- Pin favoritter for raske snarveier

> **Husk å resume.** Suspended Kustomizations stopper drift-deteksjon. Endringer pushet til GitOps-repoet køes opp og applies først ved resume.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/skybert-system/base/tenant-admin-clusterroles/flux-web-ui-access.yaml

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
