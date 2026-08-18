# Konfigurasjonseksempler

## Anbefalt startpunkt: Minimal SkybertApp

Start alltid med minimal SkybertApp i riktig miljømappe — docs anbefaler `sandbox/` som
første steg (https://docs.sky.fhi.no/build/). Bruk Helm/Kustomize/raw manifests kun når
behovet tilsier det (komplekse apps, upstream Helm charts, etc.).

```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: <app-navn>
  namespace: tn-<tenant>
spec:
  image:
    repository: crfhiskybert.azurecr.io/<tenant>/<app-navn>
    tag: "<tag>"
  hostname: <app-navn>.skytest.fhi.no
```

> Kilde: https://docs.sky.fhi.no/workloads/
> Kilde: https://docs.sky.fhi.no/build/

## Health probes i .NET-apper

Kubernetes har tre probe-typer:

- **Liveness** — restarter container ved feil. Bruk for hengte prosesser.
- **Readiness** — fjerner pod fra service-endpoints ved feil. Bruk for traffic gating.
- **Startup** — gates liveness/readiness mens appen booter. Bruk for sakte-startende apper.

**Anbefalinger:**

- Bruk separate, lette endepunkter (`/health/live`, `/health/ready`, `/health/startup`).
- **Ikke** legg tunge migreringer eller DB-spørringer i readinessProbe — under DB-last vil pods feile readiness og trekkes ut av trafikk selv om appen ellers er frisk.
- Skill **public** health checks (enkel "appen kjører") fra **private** (DB-konnektivitet og avhengigheter). Public-endepunktet er den eneste som bør være tilgjengelig fra ingress.

### .NET Health Checks API

Konfigurer separate "live"- og "ready"-tags og map dem til distinkte endepunkter:

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
                  tags: new[] { "ready" });

app.MapHealthChecks("/liveness", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live")
});

app.MapHealthChecks("/readiness", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

### Public vs private endepunkter

Kun en enkel "appen kjører"-sjekk bør eksponeres via offentlig ingress. Detaljerte health checks (DB, intern kø, etc.) bør kun være nåbar fra klusteret.

I .NET kan dette begrenses med `.RequireHost("*:<privat-port>")`:

```csharp
public static WebApplication MapDefaultEndpoints(this WebApplication app, int? privatePort = null)
{
    // Public health endpoint — kun "service kjører", ingen detaljer
    app.MapHealthChecks(HealthEndpointPath, new HealthCheckOptions
    {
        Predicate = healthCheck => healthCheck.Tags.Contains("public")
    }).RequireHost();

    // Private health endpoints — detaljert status, kun fra klusteret
    var livenessEndpoint = app.MapHealthChecks(AlivenessEndpointPath, new HealthCheckOptions
    {
        Predicate = healthCheck => healthCheck.Tags.Contains("private") && healthCheck.Tags.Contains("live")
    });

    var readinessEndpoint = app.MapHealthChecks(ReadinessEndpointPath, new HealthCheckOptions
    {
        Predicate = healthCheck => healthCheck.Tags.Contains("private") && healthCheck.Tags.Contains("ready")
    });

    if (privatePort.HasValue)
    {
        livenessEndpoint.RequireHost($"*:{privatePort}");
        readinessEndpoint.RequireHost($"*:{privatePort}");
    }

    return app;
}
```

> **⚠️ `.RequireHost()` er kun en applikasjonslag-sjekk.** For at barrieren skal være effektiv, må infrastrukturen også passe på å ikke eksponere den private porten gjennom ingress. Dette er et delt ansvar mellom kode og deployment.

For SkybertApp setter du probes via [`probes`-feltet](skybertapp-crd.md#health-probes) — Composition rendrer ferdig liveness-/readiness-/startup-probe på Deployment.

> Kilde: https://docs.sky.fhi.no/miscellaneous/probes/

## Job og CronJob

Det finnes foreløpig ingen Skybert-CRD for batch-arbeid eller planlagte jobber. Bruk Kubernetes sine innebygde `Job`/`CronJob` som vanlige manifester i miljø-mappen (`test/`, `prod/`, osv.).

Plattformteamet har varslet at **førsteklasses Skybert-ressurser for vanlige jobbmønstre er planlagt**, etter samme prinsipp som SkybertApp (fornuftige defaults, mindre boilerplate). Ingen dato er satt. Har teamet ditt et konkret behov, meld det på `#ext-fhi-skybert` — det påvirker prioriteringen. Inntil videre er mønsteret nedenfor det som gjelder.

> Kilde: https://docs.sky.fhi.no/workloads/jobs/

Samme plattform-konvensjoner gjelder som for øvrige workloads:

- Kjør i eget tenant-namespace (`tn-<tenant>`).
- Bruk Workload Identity ved å sette `serviceAccountName: <tenant>-azure` og labelen `azure.workload.identity/use: "true"` på pod-template (tilsvarende raw Deployment — se [Sikkerhet](security.md)).
- Secrets via ExternalSecret/SecretStore — se [Secrets-mønstre](secrets.md).

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: <tenant>-daily-job
  namespace: tn-<tenant>
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            azure.workload.identity/use: "true"
        spec:
          serviceAccountName: <tenant>-azure
          restartPolicy: OnFailure
          containers:
            - name: job
              image: crfhiskybert.azurecr.io/<tenant>/<job-image>:<tag>
```

> Kilde: https://docs.sky.fhi.no/workloads/jobs/

## Legacy: WebApp og CSI driver

WebApp CRD og Key Vault CSI driver er utdatert — bruk [SkybertApp](skybertapp-crd.md) og
ESO/inline secrets (se [Secrets-mønstre](secrets.md)) for alle nye deployments.
Spesifikasjon, migreringsguide og eksempler for eksisterende workloads (WebApp med
Workload Identity, CSI driver-Deployment, SecretProviderClass, minimal WebApp) er samlet i
[Legacy: WebApp CRD og CSI driver](legacy-webapp-csi.md).

## Helm-basert deployment

Struktur:
```
test/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
```

`test/Chart.yaml`:
```yaml
apiVersion: v2
name: <tenant>-app
version: 1.0.0
appVersion: "1.0.0"
```

`test/values.yaml`:
```yaml
image:
  repository: crfhiskybert.azurecr.io/<tenant>_test
  tag: latest

ingress:
  enabled: true
  hostname: <tenant>.skytest.fhi.no
```

## Kustomize-basert deployment

`test/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: tn-<tenant>

resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml

images:
  - name: app
    newName: crfhiskybert.azurecr.io/<tenant>_test
    newTag: latest
```

## Postgres i klusteret (CloudNativePG) — under utrulling

> **Status per 2026-08-14: kun `aks-ops-test-01`.** Ikke tilgjengelig på tenant-klustere ennå, og
> ikke omtalt i offisiell docs. Offisiell anbefaling er fortsatt **ekstern database** (Azure managed
> eller NHN Moderne Etatsplattform). Denne seksjonen finnes for at du skal kjenne retningen, ikke
> som en oppfordring til å ta det i bruk.

Plattformen har rullet ut **CloudNativePG**-operatoren (chart 0.29.0, operator-image 1.30.0) i
namespacet `cnpg-system`, med **plugin-barman-cloud** (0.7.1, image v0.14.0) for backup til
objektlagring.

Der komponenten er aktivert, gir ClusterRole-fragmentet `skybert:tenant-admin:cnpg` tenanten:

| API-gruppe | Ressurser | Tilgang |
|------------|-----------|---------|
| `postgresql.cnpg.io` | `clusters`, `backups`, `scheduledbackups`, `poolers`, `databases`, `databaseroles`, `publications`, `subscriptions`, `imagecatalogs` | Full CRUD |
| `postgresql.cnpg.io` | `failoverquorums`, samt `*/status` for clusters/backups/scheduledbackups/poolers | Kun lesing (operatør-eid) |
| `barmancloud.cnpg.io` | `objectstores` | Full CRUD |

`clusterimagecatalogs` er bevisst utelatt — den er kluster-scoped, og kluster-scopede ressurser
inngår ikke i tenant-admin-settet.

Fragmentet er bevisst **ikke** med i katalogens `kustomization.yaml`: hvert kluster må opte inn
eksplisitt, slik at rettigheter på `postgresql.cnpg.io` ikke deles ut der CRD-ene ikke finnes.
Aggregeringslabelene er allerede komplette for alle miljøer, så utrulling krever ingen RBAC-endring.

Merk at `ontap-nas` (NFS) uansett er uegnet for databaser — se [Persistence i SKILL.md](../SKILL.md#persistence--data-lagring).
Hvilken StorageClass en CNPG-`Cluster` skal bruke, avgjøres i tenantens eget `Cluster`-manifest;
plattformens operator-oppsett fastsetter ingen default for tenant-databaser.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/a1ce34539f1b10f06fb5112e319ec57f11da30b0/infra/skybert-system/base/tenant-admin-clusterroles/cnpg-access-rules.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/a1ce34539f1b10f06fb5112e319ec57f11da30b0/infra/cloudnative-pg/base/
