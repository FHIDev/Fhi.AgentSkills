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

> **Status per 2026-07:** Dagens SkybertApp-composition rendrer fortsatt Kubernetes `Ingress` med `ingressClassName: nginx`, og `ingress-nginx` er fortsatt produksjonsveien. Ikke migrer eksisterende SkybertApp-hostnames til Gateway API uten eksplisitt beskjed fra plattformteamet.

**Retning (plattformbeslutning):** Plattformen har besluttet å migrere fra `ingress-nginx` til **Gateway API**, implementert av **Envoy Gateway**.

**Faktisk aktiveringsstatus (infra per 2026-07):** Envoy Gateway (v1.8.2) er aktivert i de fleste klusteroverlays — men **ikke i green-test og green-prod**, som fortsatt bare kjører Envoy-namespacet og bruker `ingress-nginx`. Der Envoy er aktivert, definerer plattformen delte `Gateway`-objekter og `GatewayClass`-er. Utrullingen varierer per kluster (utledet fra `infra/envoy/*/kustomization.yaml`):

| Ressurs | Aktivert hvor |
|---------|---------------|
| GatewayClass `fhinett` + `helsenett`, Gateway `helsenett`, `gateway-proxyprotocol` | Alle klustere med Envoy aktivert (ops-test, sandbox, yellow-test/prod, red-test/prod, norsyss) |
| GatewayClass `internett` + Gateway `internett` | Kun ops-test, sandbox og yellow-test/prod — **ikke** red-klusterne eller norsyss |

**Tenant-mønsteret (dokumentert i docs):** Offisiell docs beskriver nå tenant-rettet bruk slik: plattformen kjører delte `Gateway`-objekter; tenanter knytter til seg listeners og TLS via **`ListenerSet`**-ressurser i eget namespace, og ruter trafikk til sine Services med **`HTTPRoute`**. RBAC-rollen `skybert:tenant-admin` tillater disse ressurstypene (se [Sikkerhet](security.md)). Merk at dette beskriver retningen — SkybertApp-hostnames bruker fortsatt `Ingress`, og hostname-reglene (inkl. flambert-blokkeringen over) håndheves også på Gateway API-ruter.

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
