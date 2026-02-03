# Sikkerhet og Azure Workload Identity

## Azure Workload Identity

### Oppsett i applikasjon

1. **Service Account** må annoteres:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: <tenant>-azure
  namespace: tn-<tenant>
  annotations:
    azure.workload.identity/client-id: "<client-id>"
```

2. **Pod** må ha riktig label:
```yaml
metadata:
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: <tenant>-azure
```

3. **Miljøvariabel** for Azure SDK:
```yaml
env:
- name: AZURE_CLIENT_ID
  value: "<client-id>"
```

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

## mTLS med Linkerd

Linkerd er påkrevet og automatisk aktivert for alle `tn-*` namespaces.

**Viktig**: Kyverno-policyer forhindrer:
- Deaktivering av Linkerd
- Bypassing av mesh
- Endring av mesh-konfigurasjon

Verifiser mesh-status:
```bash
linkerd check --proxy -n tn-<tenant>
```

## Secrets Management

**Aldri** commit secrets til Git. Bruk:
- Azure Key Vault via CSI driver
- Kubernetes Secrets (kun for non-sensitive config)

**Oppsett av Key Vault:**
1. Opprett egen Azure Key Vault
2. Gi tilgang til managed identity som er knyttet til `<tenant>-azure` service account
3. Monter secrets direkte i container fra Key Vault

## Azure Subscriptions per Sikkerhetssone

Hver sikkerhetssone har egne Azure subscriptions:
- **Gul sone test**: FHI-Skybert-Yellow-Test
- **Gul sone prod**: FHI-Skybert-Yellow-Prod
- (tilsvarende for Grønn og Rød sone)

Workflows må bruke riktig `AZURE_SUBSCRIPTION_ID` for miljøet.
