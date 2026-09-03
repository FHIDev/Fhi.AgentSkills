# Kyverno-policier som påvirker tenanter

Skybert bruker Kyverno for policy-håndhevelse. Policiene under gjelder tenant-namespaces (`tn-*`) med mindre annet er sagt.

`Enforce` avviser requesten. `Audit` slipper ressursen gjennom og skriver `PolicyReport`. Mutate/generate endrer eller oppretter ressurser og har ingen failure action.

**Overlay-modell** (hvilke policy-sett som gjelder hvor):

| Overlay | Klustere |
|---|---|
| `policies-green` + `policy-exceptions` | Alle |
| `policies-not-red` | Alle unntatt `aks-red-test-01`/`aks-red-prod-01` |
| `policies-red` | `aks-red-test-01`, `aks-red-prod-01` |
| `policies-prod` | `aks-green-prod-02`, `aks-red-prod-01`, `aks-yellow-prod-01`, `aks-norsyss-prod-01` |
| `norsyss-runtime-access.yaml` (PolicyException) | `aks-norsyss-prod-01` |

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/

## Automatiske mutasjoner (Kyverno setter automatisk)

| Policy | Handling | Scope |
|--------|----------|-------|
| `auto-set-default-user-and-run-as-non-root` | Setter `runAsNonRoot: true` og `runAsUser: 1000` (hvis ikke satt) | `tn-*` pods |
| `auto-set-seccomp-runtime-default` | Setter `seccompProfile.type: RuntimeDefault` (hvis ikke satt) | Alle pods |
| `ingress-security` (mutate) | Setter `ssl-redirect: true` og `force-ssl-redirect: true` på alle Ingress | Alle Ingress |
| `automount-cert-chain-bundle` | Auto-monterer `trust-bundle.pem` til `/etc/ssl/certs/trust-bundle.pem` i alle containere og init-containere — se [Public CA / Trust Bundle](hostnames-and-networking.md#public-ca--trust-bundle) | `tn-*` pods |
| `enable-goldilocks-tenant-namespaces` | Setter `goldilocks.fairwinds.com/enabled: "true"` på namespacet, slik at VPA-anbefalinger genereres (se [nedenfor](#ressursanbefalinger-goldilocks--vpa)) | `tn-*` namespaces |
| `patch-tenant-serviceaccounts-with-acr-pull-secret` / `patch-default-serviceaccounts-with-acr-pull-secret` (leveres av `skybert-system`) | Legger `imagePullSecrets: acr-pull-secret` på ServiceAccounts i `tn-*` og på alle `default`-SA-er som mangler `imagePullSecrets` | ServiceAccounts |

> **Praktisk betydning:** Du trenger vanligvis ikke sette `runAsNonRoot`, `runAsUser` eller
> `seccompProfile` eksplisitt — Kyverno setter defaults. Å sette `runAsNonRoot: false`
> eksplisitt gir bare et **Audit-funn** (regelen `prevent-run-as-root-override` mangler
> `validationFailureAction` og faller tilbake til Audit — poden avvises ikke), men
> `runAsUser: 0` avvises av `require-run-as-non-root-user` (Enforce). Ikke bygg på root-kjøring.

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-green/

## Håndhevede policier (Enforce — avviser pods/ressurser som bryter)

### Pod Security (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `disallow-capabilities` | Capabilities utover baseline-listen (`AUDIT_WRITE`, `CHOWN`, `NET_BIND_SERVICE`, …) |
| `disallow-host-namespaces` | `hostNetwork`, `hostIPC`, `hostPID` |
| `disallow-host-path` | HostPath-volumer |
| `disallow-host-ports` | Host ports |
| `disallow-host-process` | Windows HostProcess |
| `disallow-privilege-escalation` | `allowPrivilegeEscalation: true` |
| `disallow-privileged-containers` | Privilegerte containere |
| `disallow-proc-mount` | Ikke-standard procMount |
| `disallow-selinux` | Ikke-standard SELinux-opsjoner |
| `require-run-as-non-root-user` | `runAsUser: 0` |
| `restrict-apparmor-profiles` | Ikke-standard AppArmor-profiler |
| `restrict-seccomp` | Seccomp-profiler utenom RuntimeDefault/Localhost |
| `restrict-sysctls` | Sysctls utenom safe-listen |
| `restrict-volume-types` | Volume-typer utenom configMap, emptyDir, secret, PVC, projected, csi, downwardAPI, ephemeral |

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/psp.yaml

### Ingress (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `ingress-security` | Ingress uten TLS-match, uten ingressClassName, med wildcard-hosts |
| `deny-flambert-hostnames-in-tenant-namespaces` | Hostnames `*.flambert` og `*.flambert.fhi.no` i `tn-*` — håndheves på `Ingress`, `HTTPRoute`/`TLSRoute`/`GRPCRoute` og `ListenerSet` |

Detaljene står i [Hostnavn og nettverk — Ingress-regler](hostnames-and-networking.md#ingress-regler-kyverno-håndhevet).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/ingress-security.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/deny-flambert-hostnames.yaml

### Service-typer (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `disallow-nodeport-loadbalancer-services` | NodePort- og LoadBalancer-services i alle namespaces. Ekstern tilgang går via Ingress eller Gateway API; unntak finnes kun for plattformens ingress-controllere (nginx, Traefik, Envoy) |

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/disallow-nodeport-lb.yaml

### ServiceAccount (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `restrict-tenant-workload-serviceaccount` | Tenant-workloads (Pod + Deployment/StatefulSet/DaemonSet/Job/CronJob/ReplicaSet) i `tn-*` som setter `serviceAccountName: flux-reconciler`. `flux-reconciler` er reservert for Flux-rekonsiliering — bruk `default`, workload-identity-SA `<tenant>-azure`, eller en egen SA |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/restrict-tenant-workload-serviceaccount.yaml

### Nettverk og plattformvern (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `limit-calico-netpol-order` | Calico `NetworkPolicy` i `tn-*` med `spec.order < 1000` — tenanter kan ikke overstyre plattformens GlobalNetworkPolicies (se [Nettverkspolicyer](hostnames-and-networking.md#nettverkspolicyer)) |
| `flux-verify-sources` | Flux `OCIRepository.spec.url` som ikke er `oci://crfhiskybert.azurecr.io/*` |
| `restrict-policy-exceptions-to-kyverno-ns` | `PolicyException`-objekter utenfor `kyverno`-namespacet |
| `protect-essential-namespaces` | DELETE av plattform-namespaces (kube-system, flux-system, kyverno, cert-manager, ingress-nginx, envoy-gateway-system, external-secrets, observability-stakken m.fl.) |

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-green/

## Audit-policier (rapporterer i PolicyReport, blokkerer ikke)

| Policy | Overlay | Hva sjekkes |
|--------|---------|-------------|
| `resource-limits` | `policies-green` | Containere (inkl. init og ephemeral) i `tn-*` skal ha CPU- og memory-requests og memory limit; flagger CPU limit > 2 eller memory limit > 2Gi |
| `suggest-ro-rootfs` | `policies-green` | Anbefaler `readOnlyRootFilesystem: true` for `tn-*`-workloads |
| `rbac-security` | `policies-green` | Ingen `*` i Role-regler i `tn-*`; ingen ClusterRoleBinding til `cluster-admin`; RoleBinding må navngi namespace |
| `recommend-network-policy` | `policies-not-red` | Bakgrunnsskann (`admission: false`): rapporterer `tn-*`-namespaces uten verken Kubernetes- eller Calico-`NetworkPolicy`. Funnet lander i PolicyReport i tenant-namespacet (matcher `default`-SA-en). På rød dekkes isolasjon av GNP-er i stedet |
| `prevent-run-as-root-override` (regel i `auto-set-default-user-and-run-as-non-root`) | `policies-green` | `runAsNonRoot: false` på containere (alle pods) |

Tenanten har lesetilgang til `policyreports` i eget namespace (`kubectl get policyreport -n tn-<tenant>`); `sk8 policies --tenant <tenant>` aggregerer de samme funnene — se [kubectl-tilgang](kubectl-access.md#sk8-cli--automatisert-pim--proxy).

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/

## Ressursanbefalinger (Goldilocks / VPA)

Alle `tn-*`-namespaces merkes automatisk av Kyverno slik at Goldilocks-controlleren oppretter
**VerticalPodAutoscaler-objekter i anbefalingsmodus** (`updateMode: Off`) for workloadene dine.

**Dette endrer ikke noe i seg selv.** VPA-ens `updater` og `admissionController` er slått av i
plattformens oppsett — ingen pod restartes, og ingen resource requests overskrives. Objektene
finnes kun for å beregne hva riktig CPU/memory *ville* vært.

- `Job` og `CronJob` er unntatt (`--ignore-controller-kind=Job,CronJob`).
- For SkybertApps peker VPA-ens `targetRef` på **SkybertApp-ressursen**, ikke Deployment-en —
  mulig fordi XRD-en eksponerer `/scale` (se [SkybertApp CRD](skybertapp-crd.md#status-og-scale-subresource)).
- Du har **lesetilgang** (`kubectl get vpa -n tn-<tenant>`), men kan ikke endre objektene — de er
  plattformstyrt.
- Anbefalingene leses i Grafana: se [Observability — Ressursanbefalinger i Grafana](observability.md#ressursanbefalinger-i-grafana).

> Kilde: https://docs.sky.fhi.no/internal/observability/vpa/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/goldilocks/base/goldilocks-10.4.1-values.yaml

## Rød sone — ekstra policier

Gjelder `aks-red-test-01` og `aks-red-prod-01` (`policies-red`). Nettverksreglene de håndhever (GlobalNetworkPolicies, default deny, egress-unntak) står i [Hostnavn og nettverk — Rød sone](hostnames-and-networking.md#rød-sone) og gjentas ikke her.

| Policy | Modus | Handling |
|--------|-------|----------|
| `generate-tenant-internal-gnp` | Generate | Oppretter GlobalNetworkPolicy `<ns>-internal-access` (order 600) per `tn-*`-namespace: TCP innenfor eget namespace |
| `sub-1200-calico-netpol-in-tenants` | Enforce | Avviser native Kubernetes `NetworkPolicy` i `tn-*`; Calico `NetworkPolicy` må ha kun `Ingress`-regler og `spec.order < 1200` (gulvet 1000 kommer fra `limit-calico-netpol-order`) |
| `restrict-tenant-runtime-access` | Enforce | Blokkerer `kubectl port-forward`, `attach` og API-`proxy` (pod og service) i `tn-*`. Blokkerer **ikke** `kubectl exec` eller ephemeral debug-containere — policybeskrivelsen nevner ephemeral containers, men reglene gjør det ikke |

**Runtime-tilgang per rød-kluster:**

- `aks-red-test-01` (`policies-red` uten `policies-prod`): Kyverno blokkerer port-forward/attach/proxy. `exec` og debug-containere er ikke Kyverno-blokkert, men RBAC gir dem ikke: `skybert:tenant-admin` aggregerer der bare `aggregate-to-tenant-admin-red-test`, og runtime-fragmentet bærer `aggregate-to-tenant-admin-test-sandbox`.
- `aks-red-prod-01` (`policies-red` + `policies-prod`): all interaktiv runtime-tilgang er Kyverno-blokkert (se under).

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-red/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/aks-red-test-01/kustomization.yaml

## Produksjon — runtime-restriksjoner

`policies-prod` gjelder kun prod-klustrene: aks-green-prod-02, aks-norsyss-prod-01, aks-red-prod-01 og aks-yellow-prod-01.

| Policy | Hva blokkeres |
|--------|---------------|
| `deny-tenant-runtime-access` | `kubectl exec`, `port-forward`, `attach`, API-`proxy` (pod og service) og ephemeral debug-containere i `tn-*` |

Konsekvens: feilsøk i prod via logger/metrics i Grafana — se [Observability](observability.md).

**Test og sandbox:** I green-test, yellow-test-02, ops-test og sandbox er exec, port-forward, attach, proxy og debug-containere tillatt — ingen Kyverno-policy blokkerer dem, og `skybert:tenant-admin` aggregerer fragmentet `skybert:tenant-admin:test-sandbox:runtime-access` (`pods/exec`, `pods/attach`, `pods/portforward`, `pods/proxy`, `services/proxy`, `pods/ephemeralcontainers`). Docs (`persistence/postgres`) sier at `kubectl exec` ikke gis på noe kluster; infra-repoet er autoritativt her.

**Unntak: `tn-norsyss` på `aks-norsyss-prod-01`.** PolicyException `norsyss-runtime-access` unntar
namespacet fra regelen `deny-pod-portforward` i `deny-tenant-runtime-access`. Unntaket er avgrenset
til **port-forward** — `exec`, `attach` og API-`proxy` er fortsatt blokkert der. Tilsvarende gir
ClusterRole `skybert:tenant-admin:norsyss:runtime-access` `get`/`create` på `pods/portforward`;
fragmentet bærer labelen `aggregate-to-tenant-admin-yellow-prod`, som klusterets
`skybert:tenant-admin` aggregerer (samme per-kluster-mønster som på alle klustere), og
`aggregate-to-tenant-flux-reconciler`. Begge deler må være på plass: et Kyverno-unntak alene er
ikke nok uten RBAC, og motsatt.

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-prod/deny-tenant-runtime-access.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/skybert-system/

## PolicyExceptions

PolicyExceptions er sentralt styrt av plattformteamet i `kyverno`-namespacet (håndhevet av `restrict-policy-exceptions-to-kyverno-ns`). Tenanter kan ikke self-serve unntak.

Tenant-rettede unntak er sjeldne, men kan opprettes etter avtale med plattformteamet; det eneste i infra er `norsyss-runtime-access` (over). Plattformkomponenter har bredere unntak: f.eks. har `azure-arc-containerstorage`-namespacet unntak fra privileged containers, host-path, capabilities og flere andre policier, og ingress-controllerne (nginx, Traefik, Envoy) har unntak fra `disallow-nodeport-loadbalancer-services`.

**Praktisk:** Hvis du trenger unntak fra en policy, kontakt plattformteamet. Forklar brukstilfelle og krav.

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policy-exceptions/
