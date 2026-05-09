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

## Legacy-eksempler (for eksisterende workloads)

## **Legacy** - WebApp med Workload Identity

> **Merk:** WebApp CRD er utdatert. Bruk [SkybertApp](skybertapp-crd.md) for nye deployments.

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>_test
      tag: "v1.0.0"
    env:
      - name: AZURE_CLIENT_ID
        value: "<client-id>"

  serviceAccount:
    name: <tenant>-azure
    annotations:
      azure.workload.identity/client-id: "<client-id>"

  ingress:
    enabled: true
    hostname: <tenant>.skytest.fhi.no
    tls:
      enabled: true
```

### WebApp CRD Begrensninger

**Felter som IKKE støttes i WebApp CRD:**
- `livenessProbe` / `readinessProbe` (health checks)
- Visse Kubernetes-native felter

**Anbefaling:**
- Start med minimal konfigurasjon
- Legg til felter gradvis etter behov
- Sjekk med Skybert-teamet før du legger til felter som ikke er dokumentert

## **Legacy** - Deployment med Azure Key Vault Secrets (CSI driver)

> **Merk:** CSI driver er legacy. Bruk SkybertApp inline secrets eller External Secrets Operator (ESO) i stedet.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  replicas: 2
  selector:
    matchLabels:
      app: <tenant>-app
  template:
    metadata:
      labels:
        app: <tenant>-app
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: <tenant>-azure
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: app
        image: crfhiskybert.azurecr.io/<tenant>_test:latest
        securityContext:
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
        env:
        - name: AZURE_CLIENT_ID
          value: "<client-id>"
        volumeMounts:
        - name: secrets-store
          mountPath: /mnt/secrets
          readOnly: true
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: <tenant>-secrets
```

## **Legacy** - SecretProviderClass for Key Vault (CSI driver)

> **Merk:** SecretProviderClass (CSI driver) er legacy. Bruk SkybertApp inline secrets eller ESO (SecretStore + ExternalSecret).

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: <tenant>-secrets
  namespace: tn-<tenant>
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "false"
    clientID: "<client-id>"
    keyvaultName: "<keyvault-name>"
    tenantId: "<tenant-id>"
    objects: |
      array:
        - |
          objectName: database-password
          objectType: secret
          objectVersion: ""
```

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

## **Legacy** - Minimal WebApp for rask start

> **Merk:** WebApp CRD er utdatert. Bruk [SkybertApp](skybertapp-crd.md) for nye deployments.

```yaml
apiVersion: skybert.fhi.no/v1
kind: WebApp
metadata:
  name: <tenant>-app
  namespace: tn-<tenant>
spec:
  container:
    image:
      repository: crfhiskybert.azurecr.io/<tenant>_test
      tag: "latest"

  ingress:
    enabled: true
    hostname: <tenant>.skytest.fhi.no
```

**Merk**: DNS-oppføring og TLS-sertifikat opprettes automatisk basert på hostname.
