# WebApp CRD-spesifikasjon (UTDATERT)

> **ADVARSEL:** WebApp CRD er utdatert. Bruk [SkybertApp](skybertapp-crd.md) for alle nye deployments.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/8e32c0f/infra/crossplane/base/xrds/webapp.yaml

## API

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
```

## Spec Reference

### Container

| Felt | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `container.image.repository` | string | **påkrevet** | Container image repository |
| `container.image.tag` | string | **påkrevet** | Container image tag |
| `container.port` | integer | `8080` | Container-port |
| `container.command` | string[] | — | Overstyr kommando |
| `container.resources.requests.cpu` | string | `150m` | CPU request |
| `container.resources.requests.memory` | string | `256Mi` | Memory request |
| `container.resources.limits.cpu` | string | `300m` | CPU limit |
| `container.resources.limits.memory` | string | `512Mi` | Memory limit |
| `container.secrets.name` | string | **påkrevet** | Secret-navn |
| `container.secrets.path` | string | `/secrets` | Secret-monteringssti |
| `container.secrets.asEnv` | boolean | `false` | Monter som env vars |
| `container.readOnlyRootFilesystem` | boolean | `false` | Read-only root |

### Viktige forskjeller fra SkybertApp

| Aspekt | WebApp | SkybertApp |
|--------|--------|-----------|
| API-versjon | `v1` | `v1alpha1` |
| Struktur | Nestet under `container.` | Flat |
| Resources | Separate requests/limits | Kun request (limit = request for memory) |
| CPU limit | Ja (`300m` default) | Nei (kun request) |
| Secrets | Enkelt secret-objekt | Array av secrets med vault-integrasjon |
| Workload Identity | Manuell | Automatisk |
| Config | Ikke innebygd | `config`-felt |

## Migrering fra WebApp til SkybertApp

1. Endre `apiVersion` fra `skybert.fhi.no/v1` til `skybert.fhi.no/v1alpha1`
2. Endre `kind` fra `WebApp` til `SkybertApp`
3. Flytt felt fra `container.*` til toppnivå (`image`, `port`, `resources`)
4. Konverter secrets til SkybertApp-format med `vault`-felt
5. Fjern manuell SecretStore/ExternalSecret — SkybertApp oppretter disse automatisk
6. Fjern `serviceAccount`-konfigurasjon — Workload Identity er automatisk
