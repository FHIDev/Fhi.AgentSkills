# Sikkerhet og Azure Workload Identity

## Azure Workload Identity

### Oppsett i applikasjon

Skybert leverer ferdig service account per tenant: `<tenant>-azure`, knyttet til managed
identity `tn-<tenant>-skybert-sa-<env>` (verifisert mot Azure 2026-04-17).
Manuell opprettelse eller annotering av service account er ikke nødvendig.

**For SkybertApp:**
Workload Identity er alltid aktivert. Composition setter automatisk `azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure` på alle pods. Du trenger ikke gjøre noe ekstra.

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

**Hva skjer under panseret:**
Clusteret kjører en mutating webhook (`azure-wi-webhook`) som del av kontrollplanet.
Når en pod har labelen `azure.workload.identity/use: "true"`, injiserer webhooken automatisk:

| Ressurs | Verdi |
|---|---|
| Projected token volume | `/var/run/secrets/azure/tokens/azure-identity-token` |
| `AZURE_CLIENT_ID` | Fra service account annotation |
| `AZURE_TENANT_ID` | Fra service account annotation |
| `AZURE_FEDERATED_TOKEN_FILE` | `/var/run/secrets/azure/tokens/azure-identity-token` |
| `AZURE_AUTHORITY_HOST` | `https://login.microsoftonline.com/` |

Du trenger ikke sette disse manuelt — webhooken gjør det for deg.

**SDK-kompatibilitet:** Workload Identity-autentisering fungerer automatisk (out of the box) uten ekstra konfigurasjon:
- .NET: `DefaultAzureCredential` og `WorkloadIdentityCredential` plukker opp token og miljøvariabler automatisk
- Azure CLI: `az` plukker opp Workload Identity-autentisering automatisk i pods

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/

### Tilgang til Azure-ressurser

Managed Identity `tn-<tenant>-skybert-sa-<env>` har tilganger satt opp av plattformteamet.

Typiske bruksområder:
- Azure Storage
- Azure SQL Database
- Azure Key Vault
- Azure Service Bus

### Managed Identities (leveres av plattformteamet)

Skybert leverer to typer managed identities per tenant:

- **ACR-push identity** — brukes av GitHub Actions-workflows for å pushe images til ACR. Én per tenant.
- **Workload Identities per miljø** — én per miljø (`sandbox`, `test`, `prod`) etter mønsteret `tn-<tenant>-skybert-sa-<env>`. Disse kobles mot Kubernetes service account `<tenant>-azure` i det respektive miljø-klusteret via OIDC federation, slik at applikasjonen får passordløs tilgang til Azure-ressurser.

Per-miljø-identiteter gjør at du kan gi minimale Azure RBAC-tilganger per miljø (least-privilege). Client ID-ene for workload identities er synlige på Kubernetes service accounts som annotasjoner.

> **Navnekonvensjon (verifisert mot Azure 2026-04-17):** `tn-`-prefikset er faktisk i bruk — eksempel: `tn-grossiststatistikken-skybert-sa-test`. Merk at offisielle docs (`docs/auth/workload-identity.md`) viser mønsteret uten prefiks (`<tenant>-skybert-sa-<env>`); dette er etterslep i docs. Autoritativ kilde for navnet er infra-scriptet `scripts/tenant--add--to-cluster.sh` samt faktisk Azure-state (oppslag via `az ad sp show --id <client-id>` på annotasjonen `azure.workload.identity/client-id`).

> Kilde (script, autoritativ): https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/scripts/tenant--add--to-cluster.sh
> Kilde (docs, etterslep): https://docs.sky.fhi.no/auth/workload-identity/

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

> **Merk:** Kyverno setter automatisk `runAsNonRoot: true`, `runAsUser: 1000` (hvis ikke satt),
> og `seccompProfile.type: RuntimeDefault` (hvis ikke satt) for pods i `tn-*` namespaces.
> Du trenger vanligvis ikke sette disse eksplisitt. Se [Kyverno-policier](kyverno-policies.md) for detaljer.

## Nettverkspolicyer (rød sone)

I rød sone er default DENY — all trafikk blokkert som utgangspunkt.

**Viktig:** Tenanter kan IKKE opprette egne `NetworkPolicy`-ressurser i rød sone — dette blokkeres av Kyverno (`deny-netpol`-policy). Be plattformteamet om GlobalNetworkPolicy-unntak for egress til spesifikke IP-ranges/porter.

Se [Hostnavn og nettverkskonfigurasjon](hostnames-and-networking.md#rød-sone) for detaljer om tillatt trafikk og nettverkspolicyer.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/e5bbc4b/infra/kyverno-policies/base/policies-red/

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

**Interne CA-er:** FHI vedlikeholder interne CA-er (`fhi.no` og `red.fhi.sec`) i en `trust-bundle.pem`. Denne filen auto-monteres til `/etc/ssl/certs/trust-bundle.pem` i alle pods i `tn-*` namespaces via Kyverno-policy (`automount-cert-chain-bundle`). Du trenger ikke legge disse til manuelt.

**Bruk trust-bundle:** Sett `SSL_CERT_FILE=/etc/ssl/certs/trust-bundle.pem` for å bruke den kuraterte listen av CAs i stedet for image-standarder.

> Kilde: https://docs.sky.fhi.no/miscellaneous/publicCA/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml

## Azure Subscriptions per Sikkerhetssone

Hver sikkerhetssone har egne Azure subscriptions:
- **Gul sone test**: FHI-Skybert-Yellow-Test
- **Gul sone prod**: FHI-Skybert-Yellow-Prod
- (tilsvarende for Grønn og Rød sone)

Workflows må bruke riktig `AZURE_SUBSCRIPTION_ID` for miljøet.

