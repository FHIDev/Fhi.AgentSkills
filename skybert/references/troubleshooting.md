# Feilsøking

Du har kun tilgang til ressurser i eget namespace (`tn-<tenant>`). Runtime-kommandoer (`exec`,
`port-forward`, `attach`, debug-containere) er begrenset per kluster — se
[Kyverno-policier — runtime-restriksjoner](kyverno-policies.md#produksjon--runtime-restriksjoner).
Tilkobling til klusteret: [kubectl-tilgang](kubectl-access.md#koble-til-klusteret).

## Verifisere deployment etter push

1. **GitHub-workflow:** sjekk at `oci-push` i GitOps-repoet fullførte, og at OCI-artefaktet
   `<tenant>/gitops_<env>` ble pushet til ACR.
2. **Flux:** artefaktet hentes og applyes automatisk innen ~5 minutter (OCIRepository 3 min +
   Kustomization 2 min). Vil du ikke vente, trigg rekonsiliering selv i Flux-dashboardet; `sk8 status --tenant <tenant>`
   viser status. Se
   [Rekonsilieringsintervall](platform-architecture.md#rekonsilieringsintervall) og
   [Flux-verktøy](flux-tooling.md).
3. **Ressurser i namespacet:** `kubectl get skybertapp,pods,ingress -n tn-<tenant>` og
   `kubectl get events -n tn-<tenant> --sort-by='.lastTimestamp'`. Feilende Kustomization viser
   feilmeldingen i Flux-dashboardet.
4. **Secrets:** `kubectl get externalsecrets -n tn-<tenant>` viser om Key Vault-oppslaget
   lyktes.

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://docs.sky.fhi.no/get-started/gitops-repo/

## Vanlige problemer

### Pod starter ikke (ImagePullBackOff)

Image-pull fra `crfhiskybert.azurecr.io` bruker `acr-pull-secret`, som plattformen patcher inn som
`imagePullSecrets` på ServiceAccounts i `tn-*`. En SA som allerede har egne `imagePullSecrets`
røres ikke. Sjekk at secreten finnes i namespacet og at workloadens SA refererer til den, og at
imagenavnet følger `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>`. Workload Identity er
irrelevant for pull. Se [Sikkerhet — ACR image pull](security.md#acr-image-pull-automatisk-acr-pull-secret).

> Kilde: https://docs.sky.fhi.no/internal/skybert-system/ · https://docs.sky.fhi.no/build/

### Key Vault-secrets mangler

`kubectl describe externalsecret <navn> -n tn-<tenant>` viser feilen fra External Secrets
Operator. Vanligste årsak er at tenantens managed identity (`tn-<tenant>-skybert-sa-<env>`) ikke
har lesetilgang på vaulten — det er tenanten som gir den. Se [Secrets-mønstre](secrets.md#key-vault).

> Kilde: https://docs.sky.fhi.no/miscellaneous/vault_secrets/

### Flux applyer ikke endringen

1. Verifiser at `oci-push` fullførte og at artefaktet finnes i ACR.
2. Åpne Flux-dashboardet: en feilende Kustomization viser hele feilmeldingen (f.eks. en ressurs
   som feiler dry-run avviser hele Kustomizationen — ikke bare den ene filen).
3. Trigg rekonsiliering manuelt i dashboardet, eller suspend/resume med
   `sk8 suspend`/`sk8 resume --tenant <tenant>`. Tenant-RBAC gir `reconcile`, `suspend` og
   `resume` på egne Kustomizations og OCIRepositories.

> Kilde: https://docs.sky.fhi.no/build/flux-dashboard/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/sk8/README.md

### Nettverkstilkobling feiler i rød sone

Rød sone er default deny for egress; native `NetworkPolicy` er forbudt der, så
`kubectl get networkpolicy` viser ingenting relevant. Sjekk i stedet tenantens Calico
`NetworkPolicy` (`kubectl get networkpolicies.crd.projectcalico.org -n tn-<tenant>`) og
plattformens GlobalNetworkPolicies. Egress-unntak opprettes av plattformteamet — meld behov på
`#ext-fhi-skybert`. `kubectl exec` for å teste tilkobling er ikke tilgjengelig på
`aks-red-test-01`/`aks-red-prod-01`; bruk app-logger i Grafana og events. Se
[Rød sone](hostnames-and-networking.md#rød-sone).

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/internal/global-network-policies/

### Container avvises fordi den kjører som root

Kyverno avviser pods med `runAsUser: 0` («Running as root is not allowed»). Fiks i denne
rekkefølgen: `USER 1000` i Dockerfile, `runAsUser: 1000` i pod-spec, `runAsNonRoot: true`.
Feiler deploy, rett imaget — ikke omgå policyen i YAML. Kyverno setter `runAsNonRoot: true` og
`runAsUser: 1000` automatisk i `tn-*` når feltene mangler; å sette `runAsNonRoot: false`
eksplisitt gir Audit-funn, ikke avvisning. Se [Kyverno-policier](kyverno-policies.md).

> Kilde: https://docs.sky.fhi.no/troubleshooting/non-root/ · https://docs.sky.fhi.no/internal/kyverno-policies/

### Workload Identity feiler mot Azure

Bruk `kubectl get pod <pod> -n tn-<tenant> -o yaml` og sjekk at poden har labelen
`azure.workload.identity/use: "true"`, `serviceAccountName: <tenant>-azure`, og at
`AZURE_CLIENT_ID`/`AZURE_FEDERATED_TOKEN_FILE` er injisert i containeren. SkybertApp setter label
og SA selv; for rå Deployments må du sette begge. Client-ID-en på ServiceAccounten er tenantens
per-miljø-identitet `tn-<tenant>-skybert-sa-<env>`; det er tenanten som tildeler den Azure-roller.
Se [Sikkerhet](security.md#azure-workload-identity).

> Kilde: https://docs.sky.fhi.no/auth/workload-identity/

### Felter i SkybertApp forsvinner

XRD-schemaet er lukket: ukjente felter i `spec` avvises eller strippes, og pod-spec-felter kan
ikke legges inn direkte. Verifiser med `kubectl get skybertapp <navn> -n tn-<tenant> -o yaml`
og bruk feltene i [SkybertApp CRD-spesifikasjonen](skybertapp-crd.md). Eneste åpne felt er
`spec.config` (`x-kubernetes-preserve-unknown-fields: true`). Dekker ikke CRD-en behovet, bruk
rå manifester ved siden av — se [Konfigurasjon](configuration.md).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml · https://docs.sky.fhi.no/workloads/

### kubectl: tilkoblingsfeil eller «Forbidden»

- `dial tcp 127.0.0.1:<port>: connectex: No connection could be made` — proxyen kjører ikke.
  Start `az connectedk8s proxy` i egen terminal og hold den åpen; `az aks get-credentials` gjelder
  ikke Arc-tilkoblede klustere. Se [Koble til klusteret](kubectl-access.md#koble-til-klusteret).
- `Forbidden` / «User does not have access to the resource» i namespace `default` — kommandoen
  ble kjørt uten `-n tn-<tenant>`. Sett `kubectl config set-context --current --namespace=tn-<tenant>`.
- Tilgang mangler helt på prod eller `aks-red-test-01` — PIM-aktivering kreves; se
  [PIM](kubectl-access.md#pim-privileged-identity-management).

> **Operasjonell antakelse:** Feilmeldingene er observert mot Skybert-klustre; docs beskriver bare
> at proxy og eget namespace er nødvendig, ikke ordlyden.
