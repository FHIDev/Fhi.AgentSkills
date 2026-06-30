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

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-green/ingress-security.yaml

### Ingress: nginx i dag, Gateway API (Envoy Gateway) under utrulling

> **Status per 2026-06:** Dagens SkybertApp-composition rendrer fortsatt Kubernetes `Ingress` med `ingressClassName: nginx`, og `ingress-nginx` er fortsatt produksjonsveien. Ikke migrer eksisterende SkybertApp-hostnames til Gateway API uten eksplisitt beskjed fra plattformteamet.

**Retning (plattformbeslutning):** Plattformen har besluttet å migrere fra `ingress-nginx` til **Gateway API**, implementert av **Envoy Gateway**.

**Faktisk aktiveringsstatus (infra per 2026-06):** Envoy Gateway (v1.8.0) er aktivert i de fleste klusteroverlays — men **ikke i green-test og green-prod**, som fortsatt bare kjører Envoy-namespacet og bruker `ingress-nginx`. Der Envoy er aktivert, definerer plattformen delte `Gateway`-objekter og `GatewayClass`-er (`fhinett`, `helsenett`, `internett`), og tenant-rettet bruk skjer via `HTTPRoute`/`ListenerSet` (RBAC tillater disse — se [Sikkerhet](security.md)). At Gateway API er valgt retning og aktivert i flere clustere betyr **ikke** at SkybertApp-hostnames allerede bruker det — composition rendrer fortsatt `Ingress`.

> **Intern (plattformdrift):** For green-test og green-prod er **Traefik** forhåndsdeployert som nød-fallback sommeren 2026 i tilfelle en alvorlig `ingress-nginx`-CVE. Ved en slik hendelse kan plattformteamet bytte ingress-controller (og patche `ingressClassName` for skybertapp-tenanter); interne ingresser kan forbli på nginx. Dette er en beredskapsmekanisme, ikke en tenant-oppgave.

> Kilde: https://docs.sky.fhi.no/internal/decisions/gatewayapi/
> Kilde: https://docs.sky.fhi.no/explanations/tools-and-components/
> Kilde: https://docs.sky.fhi.no/internal/migrate-ingress-to-traefik/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/envoy/aks-yellow-test-02/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/envoy/aks-green-prod-02/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/crossplane/base/compositions/skybertapp.yaml

## Nettverkspolicyer

Et farget (color) klusterpar (test + prod) deler samme nettverksregler — test er ment å oppføre seg identisk med prod slik at det ikke blir overraskelser ved promotion.

### Grønn sone
Ingen restriksjoner. Utgående trafikk er fullt åpen.

### Gul sone
**Foreløpig ingen restriksjoner.** Utgående trafikk er åpen, men dette kan endre seg etter hvert som plattformen modnes.

### Rød sone
**Streng egress-kontroll.** All utgående trafikk er blokkert som utgangspunkt, og ingress er begrenset til **NHN secure zone**.

Automatisk tillatt:
- Intern kommunikasjon innenfor eget namespace (`tn-<tenant>`) via auto-generert GlobalNetworkPolicy
- DNS (UDP port 53 til kube-system)

Eksplisitte unntak:
- Egress til spesifikke IP-ranges/porter — opprettes av plattformteamet som GlobalNetworkPolicy. **Kun IP/CIDR** støttes (ikke L7/hostname-basert).
- Plattformteamet kan også opprette tenant-spesifikke **ingress**-unntak som GlobalNetworkPolicy når trafikk mellom tenant-namespaces må tillates (f.eks. en tjeneste i ett `tn-*`-namespace som skal nå en tjeneste i et annet). Dette er ikke self-service for tenant-team — kontakt `#ext-fhi-skybert`.
- NFS egress (port 2049) er blokkert for alle tenanter

**Tenant-NetworkPolicies i rød sone:** Native Kubernetes `NetworkPolicy` (`networking.k8s.io/v1`) er fortsatt forbudt. Tenanter kan derimot opprette **Calico `NetworkPolicy`** (`crd.projectcalico.org/v1`) for å finjustere ingress — men kun med `Ingress`-regler og `spec.order < 1200`. Egress styres sentralt via GlobalNetworkPolicy fra plattformteamet (kun IP/CIDR-basert). Kontakt `#ext-fhi-skybert` for egress-unntak.

**Base GlobalNetworkPolicies (rød sone, plattform-styrt):**

| Policy | Type | Order | Effekt |
|--------|------|-------|--------|
| `base-tenant-egress` | Egress | 800 | Tillater DNS (UDP 53 til `kube-system`/kube-dns), deretter Deny |
| `base-tenant-ingress` | Ingress | 1200 | Tillater fra `ingress-nginx`-namespace (TCP), deretter Deny |

Tenant-egne Calico NetworkPolicies må ha `spec.order < 1200` for ikke å konflikte med base-policiene.

**Egress til Entra ID (rød sone):** Plattformen leverer en sentralt forvaltet GlobalNetworkPolicy som tillater 443/TCP til Microsoft Entra ID login-IPer. Konkrete IP-ranges holdes synkron med Microsofts publiserte ranges av plattformteamet.

Apper i rød sone som trenger pålogging mot Entra ID kontakter plattformteamet på `#ext-fhi-skybert`. Plattformen aktiverer unntaket for ditt namespace. Tenanter setter ikke namespace-labels selv.

> Kilde: https://docs.sky.fhi.no/build/environments/ | https://docs.sky.fhi.no/internal/global-network-policies/ | https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/c31fccc2ab593ffdbf523b14b20677aba4db8fd5/infra/globalnetworkpolicies/base/policies-red/

## Egress-IP (tillatt utgående trafikk fra clusterne)

Når egress er tillatt eller åpnet fra Skybert-clusterne, er trafikken oppgitt å
gå ut via denne felles egress-IP-en:

| Formål | IP |
|--------|-----|
| Skybert cluster egress | `83.118.167.10` |

IP-en kan være aktuell når en ekstern tjeneste skal tillate trafikk fra
Skybert, for eksempel i Azure SQL-brannmurregler eller mot eksterne API-er.
Bekreft verdien med plattformteamet (`#ext-fhi-skybert`) før den legges i en
brannmurregel.

> **Verifikasjonsgrunnlag:** Verdien er oppgitt av bidragsyter basert på
> intern plattformkunnskap, men ble ikke funnet i Skybert docs eller infra-repo
> ved kontroll 2026-06-20. Den er derfor et operativt hint, ikke en autoritativ
> kilde. Rød sone har fortsatt default deny og krever eksplisitte
> GlobalNetworkPolicy-unntak før trafikk kan gå ut.

## Service Mesh

Linkerd er **ikke lenger i bruk** (fjernet fra plattformen).

> Kilde: https://docs.sky.fhi.no/internal/service-mesh/

## Public CA / Trust Bundle

CA-sertifikater lagres i `/etc/ssl/certs/` i containere. Du er ansvarlig for å holde `ca-certificates`-pakken oppdatert.

**Interne CA-er:** FHI vedlikeholder interne CA-er (`fhi.no` og `red.fhi.sec`) i en `trust-bundle.pem`. Denne filen auto-monteres til `/etc/ssl/certs/trust-bundle.pem` i alle pods i `tn-*` namespaces via Kyverno-policy (`automount-cert-chain-bundle`).

**Bruk trust-bundle:** Sett `SSL_CERT_FILE=/etc/ssl/certs/trust-bundle.pem` for å bruke den kuraterte listen av CAs i stedet for image-standarder.

> Kilde: https://docs.sky.fhi.no/miscellaneous/publicCA/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml
