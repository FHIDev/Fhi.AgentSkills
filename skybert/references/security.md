# Sikkerhet og Azure Workload Identity

## Azure Workload Identity

### Oppsett i applikasjon

Hvert tenant-namespace leveres med Kubernetes service account `<tenant>-azure`, bundet (OIDC-federering)
til managed identity `tn-<tenant>-skybert-sa-<env>` — én identitet per miljø (`sandbox`, `test`, `prod`).
Client-id og tenant-id ligger som annotasjoner (`azure.workload.identity/client-id`, `.../tenant-id`)
på service accounten. Du oppretter eller annoterer ikke service accounten selv.

Offentlig docs viser identitetsnavnet uten `tn-`-prefiks; infra-scriptet og intern docs bruker prefikset.

**For SkybertApp:** Workload Identity er alltid aktivert. Composition setter
`azure.workload.identity/use: "true"` og `serviceAccountName: <tenant>-azure` på alle pods.

**For raw Deployment:** sett labelen og service accounten på pod-templaten selv:

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

Podene eksponerer standard Azure Workload Identity-token og miljøvariabler, så .NET
`DefaultAzureCredential`/`WorkloadIdentityCredential` og `az` CLI autentiserer uten ekstra konfigurasjon.

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--add--to-cluster.sh

### Tilgang til Azure-ressurser

Plattformen oppretter og federerer `tn-<tenant>-skybert-sa-<env>`, men gir den ingen Azure-tilganger.
Tenanten tildeler selv Azure RBAC på identiteten — minst mulig, og per miljø — i egne subscriptions
(anbefalt én for test og én for prod). Azure-subscriptions for applikasjonen er tenantens ansvar;
plattformen oppretter dem ikke. Det dokumenterte bruksområdet er lesetilgang til tenantens Key Vault
— se [Secrets-mønstre](secrets.md).

> Kilde: https://docs.sky.fhi.no/get-started/prerequisites/application/

### Managed Identities (leveres av plattformteamet)

Plattformen leverer to typer managed identities per tenant:

- **ACR-push-identitet** `tn-<tenant>-acr-push` — i plattformens management-subscription, med
  `Container Registry Repository Writer` avgrenset til `<tenant>/`-stier i `crfhiskybert.azurecr.io`,
  federert til GitOps-repoets `main`-branch ved onboarding. Workflowene i GitOps-malen bruker den.
  Plattformteamet kan federere app-repoer til samme identitet (subject per branch `refs/heads/main`
  eller per GitHub environment); app-repoet får da variablene `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` og
  `AZURE_SUBSCRIPTION_ID` (sistnevnte er management-subscriptionen, uavhengig av miljø).
- **Workload identities per miljø** `tn-<tenant>-skybert-sa-<env>` — se
  [Oppsett i applikasjon](#oppsett-i-applikasjon).

> **Merk (GitHub OIDC-subject):** Repoer opprettet etter 2026-07-15 presenterer et subject med
> immutable numeriske ID-er (`repo:<org>@<org-id>/<repo>@<repo-id>:ref:...`); eldre repoer bytter
> til samme format ved rename/transfer. Subject matches eksakt — en federert credential med feil
> format gir `AADSTS700213` ved token-utveksling. Plattformens bootstrap oppretter begge variantene
> for GitOps-repoet; ved federering av app-repoer opprettet etter 2026-07-15 (eller renamet/flyttet)
> må ID-varianten med — docs-siden viser bare navnebasert subject.

> Kilde: https://docs.sky.fhi.no/internal/attach-application-repo/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/tenant--bootstrap--azure.sh

## Tenant-RBAC — hva du kan administrere

Tenantens Entra-gruppe bindes ved bootstrap til ClusterRole `skybert:tenant-admin` via en RoleBinding i
`tn-<tenant>`; plattformen lager bindingen, du skal ikke lage en egen. Rollen aggregeres av
rettighetsfragmenter som varierer per kluster (runtime-subressurser som `exec`/`portforward` finnes
bare i test/sandbox-aggregeringen), og enkelte tenant-baser (inkl. nye generert av bootstrap-scriptet) binder fortsatt `cluster-admin` —
tenantens faktiske RoleBindings er autoritative. Hva rollen gir, hvordan den aggregeres og
bootstrap-flyten står i [Plattformarkitektur — Tenant-bootstrap](platform-architecture.md#tenant-bootstrap);
runtime-restriksjoner per miljø står i [Kyverno-policier](kyverno-policies.md).

`securitypolicies` (`gateway.envoyproxy.io`) er med i RBAC-settet med full CRUD; kildekommentaren
beskriver formålet som «firewalls, oidc, etc». Andre `gateway.envoyproxy.io`-ressurser er ikke med,
og `SecurityPolicy` er ikke omtalt i offisiell docs — avklar med plattformteamet før du bygger på den.

> Kilde: https://docs.sky.fhi.no/internal/skybert-system/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml

## Anbefalt sikkerhetskonfigurasjon

Kyverno håndhever Pod Security Standards på alle klustere. Det som **avvises** (Enforce): `runAsUser: 0`
(feltet må være tomt eller > 0), `privileged`, `hostPath`, `hostNetwork`/`hostPID`/`hostIPC`, `hostPort`,
`allowPrivilegeEscalation: true`, `seccompProfile.type: Unconfined` og capabilities utover
PSS-baseline. Det som **settes automatisk**: `runAsNonRoot: true` og `runAsUser: 1000` (hvis utelatt)
for pods i `tn-*`, og `seccompProfile.type: RuntimeDefault` (hvis utelatt) for alle pods. Det som bare
gir **Audit-funn**: manglende `readOnlyRootFilesystem: true` og eksplisitt `runAsNonRoot: false` på
container — ikke bygg på root-kjøring likevel; `runAsUser: 0` avvises.

Anbefalt for raw Deployment (SkybertApp setter tilsvarende selv; bruk `readOnlyRootFilesystem: true`
og `writableDirs` i spec):

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

Interne CA-er (`fhi.no`, `red.fhi.sec`) monteres automatisk som `trust-bundle.pem` — se
[Public CA / Trust Bundle](hostnames-and-networking.md#public-ca--trust-bundle). Full policy-liste:
[Kyverno-policier](kyverno-policies.md#pod-security-alle-klustere).

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/psp.yaml

## Nettverkspolicyer (rød sone)

Rød sone er default deny inn og ut av tenant-namespacet; native `NetworkPolicy` avvises, ingress åpnes med Calico `NetworkPolicy` (`spec.order` i `[1000, 1200)`), og egress-unntak opprettes bare av plattformteamet. Regler, unntak og eksempler: [Hostnavn og nettverk — Rød sone](hostnames-and-networking.md#rød-sone).

> Kilde: https://docs.sky.fhi.no/internal/global-network-policies/

## ACR image pull (automatisk `acr-pull-secret`)

Pods puller fra `crfhiskybert.azurecr.io` uten at du konfigurerer noe: plattformen genererer
`acr-pull-secret` (dockerconfigjson fra shared Key Vault, refresh 24t), replikerer den til alle
namespaces (kubernetes-replicator), og to Kyverno-ClusterPolicies patcher
`imagePullSecrets: acr-pull-secret` på ServiceAccounts i `tn-*` (og `default`-SA-en overalt).
**En SA som allerede har egne `imagePullSecrets` røres ikke** — ved `ImagePullBackOff` mot
private ACR-images: sjekk både at secreten finnes og at workloadens SA faktisk refererer til den.

> Kilde: https://docs.sky.fhi.no/internal/skybert-system/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/sa-patcher-policy.yaml
