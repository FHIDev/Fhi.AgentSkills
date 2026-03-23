# Hostnavn og nettverkskonfigurasjon

## Støttede domener

| Miljø | Domener |
|-------|---------|
| Test | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Sandbox | `*.skytest.fhi.no` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager.

**Viktig:** Test og sandbox deler `*.skytest.fhi.no` (på separate clustere). For å unngå DNS-kollisjoner på offentlige hostnavn, må sandbox-tjenester inkludere `-sandbox` i tjenestenavnet. Eksempel: `airflow.skytest.fhi.no` (test) vs `airflow-sandbox.skytest.fhi.no` (sandbox).

## Ingress-regler (Kyverno-håndhevet)

Følgende regler gjelder alle Ingress-ressurser:

- **TLS påkrevet**: Alle hosts i `spec.rules[].host` må finnes i `spec.tls[].hosts[]`
- **IngressClassName påkrevet**: Alle Ingress-ressurser må ha `spec.ingressClassName` satt
- **Wildcards blokkert**: Wildcard-hosts (f.eks. `*.skytest.fhi.no`) er ikke tillatt
- **SSL-redirect**: Kyverno setter automatisk `ssl-redirect: true` og `force-ssl-redirect: true`

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/kyverno-policies/base/policies-green/ingress-security.yaml

## Nettverkspolicyer

### Grønn/Gul sone
Ingen spesielle nettverksrestriksjoner utover standard Kubernetes-nettverkspolicyer.

### Rød sone
**Default DENY** — all trafikk blokkert som utgangspunkt.

Automatisk tillatt:
- Intern kommunikasjon innenfor eget namespace (`tn-<tenant>`) via auto-generert GlobalNetworkPolicy
- DNS (UDP port 53 til kube-system)

Eksplisitte unntak:
- Egress til spesifikke IP-ranges/porter — opprettes av plattformteamet som GlobalNetworkPolicy
- NFS egress (port 2049) er blokkert for alle tenanter

**Viktig:** Tenanter i rød sone kan IKKE opprette egne NetworkPolicies — dette blokkeres av Kyverno.
Kontakt plattformteamet for nettverksunntak.

> Kilde: https://docs.sky.fhi.no/internal/global-network-policies/ | https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/e5bbc4b/infra/globalnetworkpolicies/base/policies-red/

## Service Mesh

Linkerd er **ikke lenger i bruk** (fjernet fra plattformen).

> Kilde: https://docs.sky.fhi.no/internal/service-mesh/

## Public CA / Trust Bundle

CA-sertifikater lagres i `/etc/ssl/certs/` i containere. Du er ansvarlig for å holde `ca-certificates`-pakken oppdatert.

**Interne CA-er:** FHI vedlikeholder interne CA-er (`fhi.no` og `red.fhi.sec`) i en `trust-bundle.pem`. Denne filen auto-monteres til `/etc/ssl/certs/trust-bundle.pem` i alle pods i `tn-*` namespaces via Kyverno-policy (`automount-cert-chain-bundle`).

**Bruk trust-bundle:** Sett `SSL_CERT_FILE=/etc/ssl/certs/trust-bundle.pem` for å bruke den kuraterte listen av CAs i stedet for image-standarder.

> Kilde: https://docs.sky.fhi.no/miscellaneous/publicCA/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/e5bbc4b/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml
