# Hostnavn og nettverkskonfigurasjon

## Støttede domener

| Miljø | Domener |
|-------|---------|
| Test og sandbox | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager. SkybertApp velger issuer ut fra `hostname`; på egne `Ingress`- eller `ListenerSet`-ressurser setter du `cert-manager.io/cluster-issuer` selv:

| Domene | Cluster-issuer |
|--------|--------|
| `*.skytest.fhi.no` | `skytest-fhi-letsencrypt-azuredns-issuer` |
| `*.fhi-k8s.com` | `fhi-k8s-letsencrypt-azuredns-issuer` |
| `*.sky.fhi.no` | `sky-fhi-letsencrypt-azuredns-issuer` |

Test-issuerne finnes på alle test-klustere og sandbox; prod-issueren på alle prod-klustere.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/cert-manager/

## Public DNS-oppslag (external-dns)

SkybertApp eksponerer ingen Ingress-annotasjoner, og docs beskriver ingen tenant-mekanisme for å peke et hostnavn til en offentlig IP. Trenger appen offentlig DNS-oppslag, avklar med plattformteamet på `#ext-fhi-skybert`.

> **Operasjonell antakelse:** Plattformen bruker selv `external-dns.alpha.kubernetes.io/target` på egne Gateway-/Ingress-objekter, men mekanismen er ikke dokumentert for tenanter.

## Ingress-regler (Kyverno-håndhevet)

Følgende regler gjelder alle Ingress-ressurser på alle klustere:

- **TLS påkrevet**: Alle hosts i `spec.rules[].host` må finnes i `spec.tls[].hosts[]`
- **IngressClassName påkrevet**: Alle Ingress-ressurser må ha `spec.ingressClassName` satt
- **Wildcards blokkert**: Wildcard-hosts (f.eks. `*.skytest.fhi.no`) er ikke tillatt
- **SSL-redirect**: Kyverno setter automatisk `ssl-redirect: true` og `force-ssl-redirect: true`
- **flambert-hostnames blokkert**: Hostnames `*.flambert` og `*.flambert.fhi.no` avvises (Enforce) i `tn-*`-namespaces — gjelder både `Ingress` og Gateway API-ressurser (`HTTPRoute`/`TLSRoute`/`GRPCRoute` og `ListenerSet`)

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-green/

### Ingress (nginx) og Gateway API (Envoy Gateway)

SkybertApp-compositionen (`skybert.fhi.no/v1alpha1`) rendrer Kubernetes `Ingress` med `ingressClassName: nginx`; `ingress-nginx` er produksjonsveien. Plattformens besluttede retning er **Gateway API**, implementert av **Envoy Gateway**. Docs (`tools-and-components`) merker Envoy Gateway og External DNS som «Handled by SkybertApp»; på `main` er det bare beta-XRD-en (`skybert-beta.fhi.no/v1beta1`, kun `aks-ops-test-01`) som genererer `HTTPRoute`/`ListenerSet` — `v1alpha1`-compositionen rendrer `Ingress`.

**Aktivering per kluster:** Envoy Gateway (v1.8.2) er aktivert på alle klustere unntatt green-test og green-prod, som bare har namespacet og bruker `ingress-nginx`. Der Envoy er aktivert, definerer plattformen delte `Gateway`-objekter og `GatewayClass`-er:

| Ressurs | Aktivert hvor |
|---------|---------------|
| GatewayClass `fhinett` + `helsenett`, Gateway `helsenett`, `ClientTrafficPolicy` for proxy protocol | Alle klustere med Envoy (ops-test, sandbox, yellow-test/prod, red-test/prod, norsyss) |
| GatewayClass `internett` + Gateway `internett` | Kun ops-test, sandbox og yellow-test/prod — **ikke** red-klusterne eller norsyss |

**Tenant-mønsteret:** plattformen kjører delte `Gateway`-objekter (`helsenett`, `internett`) i `envoy-gateway-system` med `allowedListeners.namespaces.from: All`; tenanter knytter til seg listeners og TLS via **`ListenerSet`** i eget namespace og ruter trafikk til sine Services med **`HTTPRoute`**. RBAC-rollen `skybert:tenant-admin` gir `listenersets`, `httproutes`, `grpcroutes`, `tcproutes`, `tlsroutes` og `udproutes` — **ikke** `gateways` — samt `securitypolicies` (`gateway.envoyproxy.io`), ikke `backendtrafficpolicies` (se [Sikkerhet](security.md)). Hostname-reglene over (inkl. flambert-blokkeringen) håndheves også på Gateway API-ruter.

`fhinett` er unntaket: GatewayClass-en finnes på alle Envoy-klustere, men det finnes ingen delt Gateway. Beta-compositionen forventer en Gateway `fhinett` i tenantens eget namespace, og tenant-RBAC gir ikke `gateways` — avklar med plattformteamet (`#ext-fhi-skybert`) før du bruker fhinett.

På rød sone når Gateway API-trafikk ikke fram til podene — se [Rød sone](#rød-sone).

`ListenerSet` + `HTTPRoute`, slik beta-compositionen rendrer dem. cert-manager-issueren annoteres på `ListenerSet`, ikke på ruten:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: ListenerSet
metadata:
  name: listenerset-gw-helsenett
  namespace: tn-my-tenant
  annotations:
    cert-manager.io/cluster-issuer: skytest-fhi-letsencrypt-azuredns-issuer
spec:
  parentRef:
    name: helsenett            # fhinett: bytt BÅDE name og namespace
    namespace: envoy-gateway-system   # fhinett: tn-my-tenant
    kind: Gateway
    group: gateway.networking.k8s.io
  listeners:
    - name: https
      hostname: my-app.skytest.fhi.no
      protocol: HTTPS
      port: 443
      allowedRoutes:
        namespaces:
          from: Same
      tls:
        mode: Terminate
        certificateRefs:
          - name: gw-my-app-helsenett-tls
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app-httproute-gw-helsenett
  namespace: tn-my-tenant
spec:
  parentRefs:
    - name: listenerset-gw-helsenett
      kind: ListenerSet
      group: gateway.networking.k8s.io
  hostnames:
    - "my-app.skytest.fhi.no"   # velger riktig listener når flere finnes
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - kind: Service
          name: my-app-svc
          port: 8080
```

**SkybertApp på Gateway API (beta):** `skybert-beta.fhi.no/v1beta1` rendrer `ListenerSet` + `HTTPRoute` i stedet for `Ingress` og har et `network`-felt med enum `fhinett` / `helsenett` / `internett`, default `fhinett`. XRD og composition finnes **kun på `aks-ops-test-01`**. Regn den som plattform-intern: tenant-RBAC gir `*`/`*` på API-gruppen `skybert.fhi.no`, og beta-CRD-en ligger i `skybert-beta.fhi.no` — en annen gruppe, som ingen tenant-rolle dekker. Skriv Gateway API-ressursene selv til beta eventuelt promoteres.

green-test og green-prod har Traefik forhåndsdeployert som nød-fallback for `ingress-nginx` (plattformdrift, ikke en tenant-oppgave).

> Kilde: https://docs.sky.fhi.no/internal/decisions/gatewayapi/ · https://docs.sky.fhi.no/explanations/tools-and-components/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/envoy/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/aks-ops-test-01/compositions/skybertapp-beta.yaml

## Nettverkspolicyer

Et farget (color) klusterpar (test + prod) deler samme nettverksregler — test er ment å oppføre seg identisk med prod slik at det ikke blir overraskelser ved promotion.

| Sone | Regler |
|------|--------|
| Grønn | Ingen restriksjoner. Utgående trafikk er fullt åpen. |
| Gul | Foreløpig ingen restriksjoner. Utgående trafikk er åpen, men dette kan endre seg etter hvert som plattformen modnes. |
| Rød | Streng egress-kontroll — se [Rød sone](#rød-sone). |

Gjelder **alle klustere**, også grønn og gul: GlobalNetworkPolicy `deny-nfs-egress` (order 900) blokkerer TCP 2049 fra `tn-*`-namespaces, slik at tenanter ikke kan montere NFS-sharet selv. Kyverno-policyen `limit-calico-netpol-order` (Enforce) krever `spec.order >= 1000` på Calico `NetworkPolicy` i `tn-*`, slik at tenanter ikke kan overstyre plattformens GNP-er (lavere order vinner).

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/internal/global-network-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/globalnetworkpolicies/base/deny-nfs-egress.yaml

## Rød sone

**Streng egress-kontroll.** All utgående trafikk er blokkert som utgangspunkt, og ingress er begrenset til **NHN secure zone**.

**GlobalNetworkPolicies (plattform-styrt):**

| Policy | Type | Order | Effekt |
|--------|------|-------|--------|
| `<ns>-internal-access` | Ingress + Egress | 600 | Genereres av Kyverno per `tn-*`-namespace: tillater **TCP** innenfor eget namespace (ikke UDP/ICMP) |
| `base-tenant-egress` | Egress | 800 | Tillater DNS (UDP 53 til kube-dns i `kube-system`), deretter Deny |
| `deny-nfs-egress` | Egress | 900 | Blokkerer TCP 2049 (alle klustere) |
| `base-tenant-ingress` | Ingress | 1200 | Tillater TCP fra `ingress-nginx`-namespacet, deretter Deny |

**Unntak opprettes av plattformteamet** som GlobalNetworkPolicy med `order: 500` (evalueres før base-policyene). Ikke self-service — kontakt `#ext-fhi-skybert`:

- **Egress** til spesifikke IP-ranges/porter. **Kun IP/CIDR** støttes (ikke L7/hostname-basert), så tjenester som Microsoft eller GitHub krever store IP-blokker.
- **Ingress** mellom tenant-namespaces (f.eks. en tjeneste i ett `tn-*`-namespace som skal nå en tjeneste i et annet).
- **Entra ID-pålogging:** `shared-egress-to-entra` tillater 443/TCP til Entra ID login-ranges for namespaces med labelen `skybert.fhi.no/needs-entra-login=true`. Plattformteamet setter labelen; tenanter setter ikke namespace-labels selv.
- **CloudNativePG:** namespace-labelen `skybert.fhi.no/needs-cnpg=true` aktiverer GNP-ene operatoren og backup trenger — se [Persistence — Rød sone](persistence.md#rød-sone-globalnetworkpolicies).

**Tenant-NetworkPolicies i rød sone:** Native Kubernetes `NetworkPolicy` (`networking.k8s.io/v1`) er forbudt. Tenanter kan opprette **Calico `NetworkPolicy`** (`crd.projectcalico.org/v1`) for å finjustere ingress — kun med `Ingress`-regler og `spec.order` i `[1000, 1200)`: under 1000 avvises av `limit-calico-netpol-order` (alle klustere), 1200 og over av `sub-1200-calico-netpol-in-tenants` (rød). Egress styres kun via GlobalNetworkPolicy fra plattformteamet. Kyverno-policyene står i [Kyverno-policier — Rød sone](kyverno-policies.md#rød-sone--ekstra-policier).

**Gateway API når ikke fram:** `base-tenant-ingress` tillater kun ingress fra `ingress-nginx`-namespacet, og ingen GNP slipper `envoy-gateway-system` inn. `ListenerSet` og `HTTPRoute` applyer uten feil, men ingen trafikk når podene. På rød er `Ingress` veien — eventuelt en Calico `NetworkPolicy` med `spec.order` i `[1000, 1200)` som tillater ingress fra `envoy-gateway-system`, avklart med `#ext-fhi-skybert`.

> **Operasjonell antakelse:** Gateway API-konsekvensen er utledet fra GNP-ene i `policies-red/` (kun `ingress-nginx` er tillatt som kilde); ingen docs-side beskriver Gateway API på rød sone.

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/internal/global-network-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/globalnetworkpolicies/base/policies-red/

## Egress-IP (tillatt utgående trafikk fra clusterne)

Når egress er tillatt fra Skybert-clusterne, er trafikken oppgitt å gå ut via felles egress-IP `83.118.167.10`. Aktuelt når en ekstern tjeneste skal tillate trafikk fra Skybert (f.eks. Azure SQL-brannmurregler). Bekreft verdien med plattformteamet (`#ext-fhi-skybert`) før den legges i en brannmurregel; rød sone krever i tillegg en GlobalNetworkPolicy før trafikken slipper ut.

> **Operasjonell antakelse:** Verdien er oppgitt av bidragsyter fra intern plattformkunnskap og finnes verken i docs eller infra-repoet.

## Service Mesh

Skybert kjører **ikke** service mesh. Linkerd er fjernet fra plattformen.

> Kilde: https://docs.sky.fhi.no/internal/service-mesh/

## Public CA / Trust Bundle

CA-sertifikater lagres i `/etc/ssl/certs/` i containere. Du er ansvarlig for å holde `ca-certificates`-pakken oppdatert.

**Trust bundle:** Plattformen vedlikeholder `trust-bundle.pem` med FHIs interne CA-er (`fhi.no` og `red.fhi.sec`), klusterets selvsignerte rot-CA **og** den vanlige listen av offentlige CA-er. Kyverno-policyen `automount-cert-chain-bundle` monterer den fra ConfigMap `internal-cert-bundle` til `/etc/ssl/certs/trust-bundle.pem` (read-only, `subPath`) i alle containere og init-containere i `tn-*`-pods, med mindre poden allerede har et volum med navn `internal-cert-bundle`.

**Bruk trust-bundle:** Sett `SSL_CERT_FILE=/etc/ssl/certs/trust-bundle.pem` (eller tilsvarende for ditt rammeverk) for å bruke den kuraterte listen i stedet for image-standardene. Siden bundelen også har offentlige CA-er, bryter ikke offentlige TLS-kall.

> Kilde: https://docs.sky.fhi.no/miscellaneous/publicCA/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml
