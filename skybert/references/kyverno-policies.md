# Kyverno-policier som påvirker tenanter

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/e5bbc4b/infra/kyverno-policies/

Skybert bruker Kyverno for policy-håndhevelse. Disse policiene gjelder alle tenant-namespaces (`tn-*`).

## Automatiske mutasjoner (Kyverno setter automatisk)

| Policy | Handling | Scope |
|--------|----------|-------|
| `auto-set-default-user-and-run-as-non-root` | Setter `runAsNonRoot: true` og `runAsUser: 1000` (hvis ikke satt) | `tn-*` pods |
| `auto-set-seccomp-runtime-default` | Setter `seccompProfile.type: RuntimeDefault` (hvis ikke satt) | Alle pods |
| `ingress-security` (mutate) | Setter `ssl-redirect: true` og `force-ssl-redirect: true` på alle Ingress | Alle Ingress |
| `automount-cert-chain-bundle` | Auto-monterer `trust-bundle.pem` til `/etc/ssl/certs/trust-bundle.pem` i alle pods (inkl. init containers) | `tn-*` pods |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml

> **Praktisk betydning:** Du trenger vanligvis ikke sette `runAsNonRoot`, `runAsUser` eller `seccompProfile` eksplisitt — Kyverno setter fornuftige defaults. Men du **kan ikke** override `runAsNonRoot` til `false`.

## Håndhevede policier (Enforce — avviser pods/ressurser som bryter)

### Pod Security (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `disallow-capabilities` | Capabilities utover baseline-listen (CHOWN, NET_BIND_SERVICE, etc.) |
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

### Ingress (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `ingress-security` | Ingress uten TLS-match, uten ingressClassName, med wildcard-hosts |

### Service-typer (alle klustere)

| Policy | Hva blokkeres |
|--------|---------------|
| `disallow-nodeport-loadbalancer-services` | NodePort- og LoadBalancer-services. Kun ClusterIP tillatt — bruk Ingress for ekstern tilgang |

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/kyverno-policies/base/policies-green/disallow-nodeport-lb.yaml

### Ressurser (Audit-modus i `tn-*`)

| Policy | Hva sjekkes |
|--------|-------------|
| `resource-limits` | Krever memory limit, memory/CPU requests. Maks 2 CPU og 2Gi memory per container |
| `suggest-ro-rootfs` | Anbefaler `readOnlyRootFilesystem: true` (Audit, ikke Enforce) |

> **Merk:** `resource-limits` er i Audit-modus — den blokkerer ikke, men logger advarsler.

## Rød sone — ekstra policier

| Policy | Handling |
|--------|----------|
| `deny-netpol` | Blokkerer tenant-opprettede NetworkPolicies i `tn-*` |
| `generate-tenant-internal-gnp` | Genererer automatisk GlobalNetworkPolicy per tenant-namespace som tillater intern kommunikasjon |

I rød sone er **all nettverkstrafikk blokkert som default** (base deny-policy, order 800). Unntak:
- Intern kommunikasjon innenfor eget namespace (auto-generert, order 600)
- Eksplisitte GlobalNetworkPolicies opprettet av plattformteamet (order 500)
- NFS egress er blokkert for tenanter (order 900)

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/bdd8bf05fade7c7e1aba534b75e64f6e46b0e22f/infra/kyverno-policies/base/policies-red/

## PolicyExceptions

PolicyExceptions er sentralt styrt av plattformteamet i `kyverno`-namespacet. Tenanter kan ikke self-serve unntak.

Tenant-rettede unntak er sjeldne, men eksisterer: f.eks. har `tn-sindre-exempl` unntak fra `disallow-nodeport-loadbalancer-services` (LoadBalancer-services tillatt). Slike unntak opprettes etter avtale med plattformteamet.

Plattformkomponenter har bredere unntak: f.eks. har `azure-arc-containerstorage`-namespacet unntak fra privileged containers, host-path, capabilities og flere andre policier — fordi plattformkomponenter har andre krav enn tenantworkloads.

**Praktisk:** Hvis du trenger unntak fra en policy, kontakt plattformteamet. Forklar brukstilfelle og krav.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/bdd8bf05fade7c7e1aba534b75e64f6e46b0e22f/infra/kyverno-policies/base/policy-exceptions/arc-containerstorage.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/bdd8bf05fade7c7e1aba534b75e64f6e46b0e22f/infra/kyverno-policies/base/policy-exceptions/envoy-sindre-exempl.yaml
