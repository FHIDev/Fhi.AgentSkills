# Hostnavn og nettverkskonfigurasjon

## Støttede domener

| Miljø | Domener |
|-------|---------|
| Test | `*.skytest.fhi.no`, `*.fhi-k8s.com` |
| Sandbox | `*.skytest.fhi.no` |
| Produksjon | `*.sky.fhi.no` |

TLS-sertifikater provisjoneres automatisk via cert-manager.

Cert-manager cluster-issuere per domene:

| Domene | Issuer |
|--------|--------|
| `*.skytest.fhi.no` | `skytest-fhi-letsencrypt-azuredns-issuer` |
| `*.fhi-k8s.com` | `fhi-k8s-letsencrypt-azuredns-issuer` |
| `*.sky.fhi.no` | `sky-fhi-letsencrypt-azuredns-issuer` |

**Viktig:** Test og sandbox deler `*.skytest.fhi.no` (på separate clustere). For å unngå DNS-kollisjoner på offentlige hostnavn, må sandbox-tjenester inkludere `-sandbox` i tjenestenavnet. Eksempel: `airflow.skytest.fhi.no` (test) vs `airflow-sandbox.skytest.fhi.no` (sandbox).

## Public DNS-oppslag (external-dns)

Som standard resolves ingress-hostnavn til interne 10.x-adresser. For at DNS skal peke til en offentlig IP, legg til annotasjonen `external-dns.alpha.kubernetes.io/target` på Ingress-objektet:

| Cluster | Annotation-verdi |
|---------|-----------------|
| green-prod | `external-dns.alpha.kubernetes.io/target: 83.118.177.234` |
| green-test | `external-dns.alpha.kubernetes.io/target: 83.118.177.220` |

**Merk:** SkybertApp CRD eksponerer ikke denne annotasjonen på Ingress-objektet. Du må derfor opprette tre separate objekter: en SkybertApp (uten ingress), en Service, og et raw Ingress-objekt.

Mønsteret er:

1. **SkybertApp** — kun app-definisjon, ingen ingress-konfigurasjon:
```yaml
apiVersion: skybert.fhi.no/v1alpha1
kind: SkybertApp
metadata:
  name: my-app
  namespace: tn-my-tenant
spec:
  image:
    repository: crfhiskybert.azurecr.io/my-app
    tag: "latest"
  port: 8080
  resources:
    cpu: "500m"
    memory: "512Mi"
```

2. **Service** — kobler til SkybertApp sine pods via label `skybert.fhi.no/webapp`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
  namespace: tn-my-tenant
spec:
  type: ClusterIP
  selector:
    skybert.fhi.no/webapp: my-app
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

3. **Ingress** — med external-dns-annotasjon og cert-manager:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: tn-my-tenant
  annotations:
    cert-manager.io/cluster-issuer: skytest-fhi-letsencrypt-azuredns-issuer
    external-dns.alpha.kubernetes.io/target: "83.118.177.234"
spec:
  ingressClassName: nginx
  rules:
    - host: my-app.skytest.fhi.no
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-svc
                port:
                  number: 8080
  tls:
    - hosts:
        - my-app.skytest.fhi.no
      secretName: my-app-tls
```

## Ingress-regler (Kyverno-håndhevet)

Følgende regler gjelder alle Ingress-ressurser:

- **TLS påkrevet**: Alle hosts i `spec.rules[].host` må finnes i `spec.tls[].hosts[]`
- **IngressClassName påkrevet**: Alle Ingress-ressurser må ha `spec.ingressClassName` satt
- **Wildcards blokkert**: Wildcard-hosts (f.eks. `*.skytest.fhi.no`) er ikke tillatt
- **SSL-redirect**: Kyverno setter automatisk `ssl-redirect: true` og `force-ssl-redirect: true`
- **flambert-hostnames blokkert**: Hostnames `*.flambert` og `*.flambert.fhi.no` avvises (Enforce) i `tn-*`-namespaces — gjelder både `Ingress` og Gateway API-ressurser (`HTTPRoute`/`TLSRoute`/`GRPCRoute` og `ListenerSet`). Håndheves på alle klustere (del av `policies-green` som er base overalt).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/adef9e78918862cd7fedfc2476242e286aadc992/infra/kyverno-policies/base/policies-green/ingress-security.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/0c766cae1b41d7633f29b30f6fd211501515953d/infra/kyverno-policies/base/policies-green/deny-flambert-hostnames.yaml

### Ingress: nginx i dag, Gateway API (Envoy Gateway) under utrulling

> **Status per 2026-08-27:** Dagens SkybertApp-composition rendrer fortsatt Kubernetes `Ingress` med `ingressClassName: nginx`, og `ingress-nginx` er fortsatt produksjonsveien. Ikke migrer eksisterende SkybertApp-hostnames til Gateway API uten eksplisitt beskjed fra plattformteamet.

**Retning (plattformbeslutning):** Plattformen har besluttet å migrere fra `ingress-nginx` til **Gateway API**, implementert av **Envoy Gateway**.

**Faktisk aktiveringsstatus (infra per 2026-08-27, `449745b`):** Envoy Gateway (v1.8.2) er aktivert i de fleste klusteroverlays — men **ikke i green-test og green-prod**, som fortsatt bare kjører Envoy-namespacet og bruker `ingress-nginx`. Der Envoy er aktivert, definerer plattformen delte `Gateway`-objekter og `GatewayClass`-er. Utrullingen varierer per kluster (utledet fra `infra/envoy/*/kustomization.yaml`):

| Ressurs | Aktivert hvor |
|---------|---------------|
| GatewayClass `fhinett` + `helsenett`, Gateway `helsenett`, `gateway-proxyprotocol` | Alle klustere med Envoy aktivert (ops-test, sandbox, yellow-test/prod, red-test/prod, norsyss) |
| GatewayClass `internett` + Gateway `internett` | Kun ops-test, sandbox og yellow-test/prod — **ikke** red-klusterne eller norsyss |

**Tenant-mønsteret:** plattformen kjører delte `Gateway`-objekter; tenanter knytter til seg listeners og TLS via **`ListenerSet`**-ressurser i eget namespace, og ruter trafikk til sine Services med **`HTTPRoute`**. RBAC-rollen `skybert:tenant-admin` tillater disse ressurstypene (se [Sikkerhet](security.md)). Merk at hostname-reglene (inkl. flambert-blokkeringen over) håndheves også på Gateway API-ruter.

**Rød sone: Gateway API når ikke fram.** `base-tenant-ingress` (order 1200) tillater kun ingress til `tn-*` fra `ingress-nginx`-namespacet og denyer resten, og det finnes ingen GlobalNetworkPolicy som slipper `envoy-gateway-system` inn. `ListenerSet` og `HTTPRoute` applyer uten feil, men ingen trafikk når podene. På rød er `Ingress` veien — eventuelt en Calico `NetworkPolicy` med `spec.order < 1200` som tillater `envoy-gateway-system` (se [Rød sone](#rød-sone) under), avklart med `#ext-fhi-skybert`.

Tenanten har **ikke** `gateways` i RBAC-settet, bare `listenersets` og rutene. `helsenett`- og `internett`-gatewayene ligger i `envoy-gateway-system` med `allowedListeners.namespaces.from: All`. `fhinett` er unntaket: den Gateway-en ligger i tenantens eget namespace og legges inn av plattformteamet under `tenants/<tenant>/base/`, ikke av tenanten selv — be om den i onboardingen hvis appen skal på fhinett.

Tenanten får også `securitypolicies` (`gateway.envoyproxy.io`) i RBAC-settet. Se [Sikkerhet](security.md) for hva den dekker — og for forbeholdene: rate limiting ligger i `BackendTrafficPolicy`, som **ikke** er gitt, og funksjonen er ikke annonsert som støttet plattformfunksjon i offisiell docs.

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

`HTTPRoute` gjør path-matching og `URLRewrite` som innebygde filtre. Skal flere komponenter dele ett hostnavn under hver sin path, er dette veien — ikke nginx' rewrite-annotasjoner.

**SkybertApp på Gateway API:** `skybert-beta.fhi.no/v1beta1` rendrer `ListenerSet` + `HTTPRoute` og har et `network`-felt med enum `fhinett` / `helsenett` / `internett`, default `fhinett`. XRD og composition finnes **kun på `aks-ops-test-01`**.

Regn den som plattform-intern: tenant-RBAC gir `*`/`*` på API-gruppen `skybert.fhi.no`, og beta-CRD-en ligger i `skybert-beta.fhi.no` — en annen gruppe, som ingen tenant-rolle dekker. Skriv Gateway API-ressursene selv til beta eventuelt promoteres.

> **Intern (plattformdrift):** For green-test og green-prod er **Traefik** forhåndsdeployert som nød-fallback sommeren 2026 i tilfelle en alvorlig `ingress-nginx`-CVE. Ved en slik hendelse kan plattformteamet bytte ingress-controller (og patche `ingressClassName` for skybertapp-tenanter); interne ingresser kan forbli på nginx. Dette er en beredskapsmekanisme, ikke en tenant-oppgave.

> Kilde: https://docs.sky.fhi.no/internal/decisions/gatewayapi/
> Kilde: https://docs.sky.fhi.no/explanations/tools-and-components/
> Kilde: https://docs.sky.fhi.no/internal/migrate-ingress-to-traefik/
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/0c766cae1b41d7633f29b30f6fd211501515953d/infra/envoy/aks-yellow-test-02/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/0c766cae1b41d7633f29b30f6fd211501515953d/infra/envoy/aks-green-prod-02/kustomization.yaml
> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/0c766cae1b41d7633f29b30f6fd211501515953d/infra/crossplane/base/compositions/skybertapp.yaml

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

**Tenant-NetworkPolicies i rød sone:** Native Kubernetes `NetworkPolicy` (`networking.k8s.io/v1`) er fortsatt forbudt. Tenanter kan derimot opprette **Calico `NetworkPolicy`** (`crd.projectcalico.org/v1`) for å finjustere ingress — men kun med `Ingress`-regler og `spec.order` i `[1000, 1200)`. Egress styres sentralt via GlobalNetworkPolicy fra plattformteamet (kun IP/CIDR-basert). Kontakt `#ext-fhi-skybert` for egress-unntak.

**Base GlobalNetworkPolicies (rød sone, plattform-styrt):**

| Policy | Type | Order | Effekt |
|--------|------|-------|--------|
| `base-tenant-egress` | Egress | 800 | Tillater DNS (UDP 53 til `kube-system`/kube-dns), deretter Deny |
| `base-tenant-ingress` | Ingress | 1200 | Tillater fra `ingress-nginx`-namespace (TCP), deretter Deny |

Tenant-egne Calico NetworkPolicies må ligge i `[1000, 1200)` — under 1000 avvises av Kyverno (`limit-calico-netpol-order`, alle klustere), 1200+ er reservert for plattformens default-deny.

**Egress til Entra ID (rød sone):** Plattformen leverer en sentralt forvaltet GlobalNetworkPolicy som tillater 443/TCP til Microsoft Entra ID login-IPer. Konkrete IP-ranges holdes synkron med Microsofts publiserte ranges av plattformteamet.

Apper i rød sone som trenger pålogging mot Entra ID kontakter plattformteamet på `#ext-fhi-skybert`. Plattformen aktiverer unntaket for ditt namespace. Tenanter setter ikke namespace-labels selv.

**CNPG i rød sone (opt-in via label):** Kjører tenanten CloudNativePG, setter plattformteamet
namespace-labelen `skybert.fhi.no/needs-cnpg=true`, som aktiverer tre GlobalNetworkPolicies
(order 500): ingress fra `cnpg-system` til 5432/8000 (operator → instans; metrics-porten 9187 er
bevisst utenfor), egress til kube-apiserver (instance manager), og egress 443 til Azure
Storage-IP-er (backup/WAL — plattformforvaltet liste; private endpoint er den bedre
sluttilstanden). Entra-token-utveksling er separat opt-in (`needs-entra-login`). Tenanter setter
ikke labels selv — meld behov på `#ext-fhi-skybert`. Se
[Persistence og CloudNativePG](persistence.md).

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/d3d4e9260b81977d61f57ad231e1c5a9bb3754e0/infra/globalnetworkpolicies/base/policies-red/cnpg.yaml

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
