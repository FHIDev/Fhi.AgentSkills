# Sikkerhet og Azure Workload Identity

## Azure Workload Identity

### Oppsett i applikasjon

Skybert leverer ferdig service account per tenant: `<tenant>-azure`, knyttet til managed
identity `<tenant>-skybert-sa-<env>`. Manuell opprettelse eller annotering av service account
er ikke nødvendig.

**For SkybertApp:**
Sett `useWorkloadIdentity: true` eksplisitt på SkybertApp-ressursen.

**For raw Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app-navn>
  namespace: tn-<tenant>
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: <tenant>-azure
```

**SDK-kompatibilitet:** Azure Workload Identity fungerer uten ekstra konfigurasjon med:
- .NET: `DefaultAzureCredential` og `WorkloadIdentityCredential`
- Azure CLI

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/

### Tilgang til Azure-ressurser

Managed Identity `<tenant>-skybert-sa-<env>` har tilganger satt opp av plattformteamet.

Typiske bruksområder:
- Azure Storage
- Azure SQL Database
- Azure Key Vault
- Azure Service Bus

### Managed Identities (leveres av plattformteamet)
Skybert leverer 3 managed identities per tenant:
1. **ACR-push identity**: For GitHub Actions å pushe images til ACR
2. **Test SA identity**: Knyttet til `<tenant>-azure` service account i test
3. **Prod SA identity**: Knyttet til `<tenant>-azure` service account i prod

Client ID-ene for SA-identities er synlige på Kubernetes service accounts.

## Obligatorisk sikkerhetskonfigurasjon

```yaml
securityContext:
  # Pod-level
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

  # Container-level
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

## Nettverkspolicyer (spesielt rød sone)

I rød sone er default DENY - alle tilkoblinger må eksplisitt tillates:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: <tenant>-allow-ingress
  namespace: tn-<tenant>
spec:
  podSelector:
    matchLabels:
      app: <tenant>-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tn-<tenant>
  - to:  # DNS
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

## Secrets Management

**Aldri** commit secrets til Git. Bruk:
- **External Secrets Operator (ESO)** (anbefalt) - SecretStore + ExternalSecret
- **SkybertApp inline secrets** (enklest) - spesifiser vault-navn og nøkler direkte i CRD

**Oppsett av secrets:**
1. Plattformteamet oppretter Azure Key Vault og gir tilgang til managed identity
2. Bruk SkybertApp inline secrets eller manuell SecretStore + ExternalSecret
3. Se [Secrets-mønstre](secrets.md) for detaljer

## Public CA / Trust Bundle

CA-sertifikater lagres i `/etc/ssl/certs/` i containere. Du er ansvarlig for å holde `ca-certificates`-pakken oppdatert i build-prosessen.

**Interne CA-er:** FHI vedlikeholder interne CA-er (`fhi.no` og `red.fhi.sec`) som automatisk inkluderes i en `trust-bundle.pem`-fil. Du trenger ikke legge disse til manuelt.

**Bruk trust-bundle:** Sett miljøvariabelen `SSL_CERT_FILE` til å peke på `trust-bundle.pem` for å bruke den kuraterte listen av public CAs istedenfor image-standarder.

## Azure Subscriptions per Sikkerhetssone

Hver sikkerhetssone har egne Azure subscriptions:
- **Gul sone test**: FHI-Skybert-Yellow-Test
- **Gul sone prod**: FHI-Skybert-Yellow-Prod
- (tilsvarende for Grønn og Rød sone)

Workflows må bruke riktig `AZURE_SUBSCRIPTION_ID` for miljøet.

