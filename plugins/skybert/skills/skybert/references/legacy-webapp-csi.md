# Legacy: WebApp, alpha-SkybertApp og CSI driver

Plattformen har én XRD for apper: `SkybertApp` i `skybert-beta.fhi.no/v1beta1`. `WebApp` (`skybert.fhi.no/v1`) og alpha-`SkybertApp` (`skybert.fhi.no/v1alpha1`) har verken XRD eller composition i `infra/crossplane/base/`, og tenant-RBAC gir ingen rettigheter på API-gruppen `skybert.fhi.no`. Et manifest med et av disse API-ene kan ikke applyes og må konverteres: alpha-`SkybertApp` etter [SkybertApp CRD — Beta](skybertapp-crd.md#beta-gateway-api), WebApp etter stegene under. Secrets Store CSI driver og `SecretProviderClass` er merket deprecated for tenanter i RBAC-kommentaren («Remove once all tenants have migrated to external-secrets»), men driveren er installert på alle klustere og `skybert:tenant-admin` har full CRUD på `secretproviderclasses`; raw Deployments med CSI-volum migreres til ESO (se [Secrets-mønstre](secrets.md)).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/crossplane/base/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/secrets-store-csi-driver/

## Migrering fra WebApp til SkybertApp

Feltnavnene til venstre for pilen er fra WebApp-manifestet som konverteres.

1. `apiVersion` → `skybert-beta.fhi.no/v1beta1`, `kind` → `SkybertApp`, og sett `spec.network` (se [SkybertApp CRD](skybertapp-crd.md#networking)). Beta er en egen API-gruppe: regn med nedetid, ny Gateway-adresse og DNS-endring, se [Konvertere et alpha-manifest](skybertapp-crd.md#beta-gateway-api).
2. Flytt `container.image`, `container.port`, `container.command` og `container.readOnlyRootFilesystem` til toppnivå.
3. `container.resources.requests/limits.{cpu,memory}` → `resources.cpu` (kun request, ingen CPU-limit) og `resources.memory` (request = limit). Juster verdiene etter «Request vs Recommendation» i Grafana når appen har kjørt en stund.
4. `ingress.enabled: true` + `ingress.hostname` → `hostname`. Sjekk domenet først: et WebApp-manifest kan ha `*.fhi-k8s.com`, men SkybertApp-compositionen har ingen issuer for det og feiler med «No matching issuer found». Bytt til `*.skytest.fhi.no` eller `*.sky.fhi.no`, eller til klusterets `.skybert`-ending for `fhinett` ([Fhinett-hostnavn](hostnames-and-networking.md#fhinett-hostnavn-beta)).
5. `azureSecrets[]` + `container.secrets` → `secrets[]` med `vault` og `keys[].remote`/`local`; `container.secrets.path` → `mountPath`, `container.secrets.asEnv` → `mountAsEnv`. `clientId` faller bort — SkybertApp bruker tenantens identitet. Fjern manuelle SecretProviderClass; SkybertApp oppretter SecretStore/ExternalSecret selv.
6. `config[]` liste av `{key, value}` → `config` map.
7. `autoScaling.{minReplicas,maxReplicas,targetCPUUtilizationPercentage,targetMemoryUtilizationPercentage}` → `autoscaling.{minReplicas,maxReplicas,targetCPU,targetMemory}` (gir faktisk HPA i SkybertApp).
8. Fjern `useWorkloadIdentity` — Workload Identity er automatisk.
9. `initContainers[]`/`sidecarContainers[]`: samme struktur, men `resources` bytter form som i steg 3, og per-container `secrets` finnes ikke — SkybertApp-secrets monteres i alle containere.
10. Legg til `probes` — WebApp-manifestet har ingen.

> **Operasjonell antakelse:** WebApp-feltnavnene er lest fra XRD-en og compositionen mens de lå i infra-repoet; de finnes ikke på `main` og kan ikke re-verifiseres. SkybertApp-siden av hvert steg følger [SkybertApp CRD](skybertapp-crd.md).

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://docs.sky.fhi.no/workloads/resource-sizing/

## CSI driver i raw Deployments

Eksisterende raw Deployments som leser Key Vault via CSI driver kjennes igjen på et volum av denne formen, pluss en `SecretProviderClass` (`provider: azure`, `clientID`, `keyvaultName`, `objects` med `objectName`/`objectType: secret`, valgfritt `secretObjects` for synk til K8s-secret) i namespacet:

```yaml
volumes:
  - name: <vault>-mnt
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: <spc-navn>
```

Migrering: erstatt SecretProviderClass + CSI-volum med SecretStore/ExternalSecret (se [Secrets-mønstre](secrets.md)) og monter det resulterende Secret-et som volum eller `envFrom`. Workload Identity på pod-template beholdes uendret (se [Azure Workload Identity](security.md#azure-workload-identity)).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/secrets-store-csi-driver/
