# Hostnavn og nettverkskonfigurasjon

## Innhold

- [Støttede domener](#støttede-domener)
- [Public DNS-oppslag (external-dns)](#public-dns-oppslag-external-dns)
- [DNS-eierskap for tenanter på flere laner](#dns-eierskap-for-tenanter-på-flere-laner)
- [Ingress-regler (Kyverno-håndhevet)](#ingress-regler-kyverno-håndhevet)
- [Nettverkspolicyer](#nettverkspolicyer)
- [Rød sone](#rød-sone)
- [Egress-IP (tillatt utgående trafikk fra clusterne)](#egress-ip-tillatt-utgående-trafikk-fra-clusterne)
- [Service Mesh](#service-mesh)
- [Public CA / Trust Bundle](#public-ca--trust-bundle)

---

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
| `*.<sone>.skybert` (fhinett, se under) | `local-issuer` |

Test-issuerne finnes på alle test-klustere og sandbox, prod-issueren på alle prod-klustere og `local-issuer` på alle. Beta-SkybertApp har ingen issuer for `fhi-k8s.com`; et slikt hostnavn feiler i compositionen.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/references/skybertapp/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/cert-manager/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml

### Fhinett-hostnavn (beta)

Med `network: fhinett` skal hostnavnet slutte på klusterets `.skybert`-sone. external-dns-private publiserer bare navn i den sonen (`--domain-filter` per kluster):

| Kluster | Ending |
|---|---|
| green-test | `greentest.skybert` |
| green-prod | `green.skybert` |
| yellow-test | `yellowtest.skybert` |
| yellow-prod, norsyss-prod | `yellow.skybert` |
| red-test | `redtest.skybert` |
| red-prod | `red.skybert` |
| sandbox, ops-test | `sandbox.skybert` |

`*.skytest.fhi.no` er tillatt på fhinett-ruter, men docs fraråder det. `network: helsenett` og `internett` bruker `*.skytest.fhi.no` og `*.sky.fhi.no`.

`local-issuer` signerer med en intern CA, «Skybert ICA Test» på sandbox og yellow-test, som en vanlig Linux-trust store ikke har. `curl` mot et `.skybert`-navn fra en arbeidsstasjon feiler derfor med exit 60 (`ssl_verify_result` 20) selv om appen svarer; røyktest med `-k`, eller legg CA-en til før en sjekk som skal stole på sertifikatet.

> **Operasjonell antakelse:** Observert fra WSL 2026-10-30 mot beta-SkybertApps på `aks-sandbox-02` og `aks-yellow-test-03`; utstederen på prod-klustrene er ikke sjekket.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/external-dns-private/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/scripts/lib/fhinett.sh

## Public DNS-oppslag (external-dns)

Alpha-SkybertApp eksponerer ingen Ingress-annotasjoner, så et `hostname` på den får alltid ingressens private IP. Trenger appen offentlig DNS-oppslag (f.eks. en frontend hostet utenfor FHI, eller claude.ai), la `hostname` stå tomt på SkybertApp (da rendres verken Service eller Ingress) og skriv egen `Service` (selector `skybert.fhi.no/webapp: <app>`, port = `spec.port`) og `Ingress` med `spec.ingressClassName: nginx`, TLS-blokk for hostnavnet, `cert-manager.io/cluster-issuer` (se tabellen over) og `external-dns.alpha.kubernetes.io/target: "<klusterets offentlige front-end-IP>"`. Ingressen må oppfylle [Kyverno-reglene under](#ingress-regler-kyverno-håndhevet). Front-end-IP-ene `83.118.177.220` (grønn test) og `83.118.177.234` (grønn prod) er ikke bekreftet; bekreft med plattformteamet. Offentlig eksponering utenfor grønn sone er en klassifiseringsbeslutning, ikke et IP-oppslag — avklar med plattformteamet på `#ext-fhi-skybert` før du bruker mønsteret på gul eller rød.

> **Operasjonell antakelse:** Ikke dokumentert for tenanter i docs, men i bruk i `tn-ki-mcp` (`Fhi.Ki.Mcp.GitOps`, test og prod) og verifisert i `tn-ehds-soksak` i grønn test med offentlig A-record, TLS og trafikk utenfra. For andre klustere (sandbox, ops-test, gul, rød): avklar IP med plattformteamet på `#ext-fhi-skybert`.

Med beta-SkybertApp eller egne `ListenerSet`/`HTTPRoute` på de delte Gatewayene `internett` og `helsenett` trengs ikke mønsteret over: external-dns har `gateway-httproute` som kilde, og plattformen har annotert Gatewayene med `external-dns.alpha.kubernetes.io/target` (adressen Gatewayen nås på fra det nettet), så hostnavnet får en record mot den. `internett` finnes ikke på rød og Norsyss.

> Kilde: https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/external-dns/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/envoy/

## DNS-eierskap for tenanter på flere laner

external-dns kjører per kluster mot samme Azure DNS-sone (`sky.fhi.no` i `rg-domains`), med TXT-registry og samme base på alle tenant-klustere: v0.21, `--policy=sync` og kildene `ingress` og `gateway-httproute`. Er tenanten registrert på både grønn og rød lane, rendres samme host på begge prod-klustrene. Klusteret som skriver recorden først eier den, og det andre hopper over den. Begge sletter egne records når Ingressen forsvinner. TXT-eieren er ikke klusterets eget navn: `aks-green-prod-03` skriver `--txt-owner-id=aks-green-prod-02` og `aks-red-prod-02` skriver `aks-red-prod-01`.

Eieren står i TXT-recorden: `dig +short <host> TXT` gir en streng som inneholder `external-dns/owner=<kluster>`, for grønn prod `owner=aks-green-prod-02`.

Eierskapet flyttes fra rødt til grønt uten git-endring, men flyttingen gir et kort DNS-brudd: rødt sletter A- og TXT-recorden straks Ingressen forsvinner, og hostnavnet svarer NXDOMAIN til grønt har skrevet sine (1–2 min, lenger hos klienter som cacher det negative svaret).

1. Bekreft at grønn Ingress for hostnavnet finnes og svarer: `curl --resolve <host>:443:<grønn ingress-IP> https://<host>/`.
2. Suspend tenantens Kustomization på rødt med `flux suspend` (se [Flux-verktøy](flux-tooling.md)), og slett Ingressen der.
3. Vent til TXT-recorden viser `owner=aks-green-prod-02` og A-recorden peker på grønn ingress-IP.
4. Resume Kustomizationen på rødt uansett utfall. Lyktes ikke steg 3, gjenskaper rødt Ingressen og recorden, og tilstanden er som før.

Rødt ser deretter en fremmed eier og lar recorden være. Kappløpet gjentar seg hver gang recorden slettes eller hostnavnet endres. Forsvinner Ingressen på grønt, sletter grønt recorden, og rødt kan ta den igjen så lenge tenanten fortsatt er registrert der.

> **Operasjonell antakelse:** Flyttingen (steg 2–4) er prøvd på en tenant registrert på både grønn og rød prod; docs beskriver ikke DNS-eierskap mellom laner. Sjekken i steg 1, tilbakefallet i steg 4 og grønns sletting er utledet av policy-oppførselen over, ikke prøvd.

> Kilde: https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/external-dns/

## Ingress-regler (Kyverno-håndhevet)

Følgende regler gjelder alle Ingress-ressurser på alle klustere:

- **TLS påkrevet**: Alle hosts i `spec.rules[].host` må finnes i `spec.tls[].hosts[]`
- **IngressClassName påkrevet**: Alle Ingress-ressurser må ha `spec.ingressClassName` satt
- **Wildcards blokkert**: Wildcard-hosts (f.eks. `*.skytest.fhi.no`) er ikke tillatt
- **SSL-redirect**: Kyverno setter automatisk `ssl-redirect: true` og `force-ssl-redirect: true`
- **flambert-hostnames blokkert**: Hostname `*.flambert` avvises (Enforce) i `tn-*`-namespaces — gjelder både `Ingress` og Gateway API-ressurser (`HTTPRoute`/`TLSRoute`/`GRPCRoute` og `ListenerSet`)

> Kilde: https://docs.sky.fhi.no/internal/kyverno-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-green/

### Ingress (nginx) og Gateway API (Envoy Gateway)

Alpha-SkybertApp (`skybert.fhi.no/v1alpha1`) rendrer Kubernetes `Ingress` med `ingressClassName: nginx` via `ingress-nginx`. Plattformens besluttede retning er **Gateway API**, implementert av **Envoy Gateway**: beta-SkybertApp (`skybert-beta.fhi.no/v1beta1`, alle klustere) rendrer `ListenerSet` + `HTTPRoute` — se [SkybertApp CRD — Beta](skybertapp-crd.md#beta-gateway-api).

**Aktivering per kluster:** Envoy Gateway (v1.9.2) og GatewayClass-ene `fhinett` og `helsenett` ligger i base og finnes på alle klustere. Kluster-overlayene legger til de delte Gatewayene:

| Ressurs | Aktivert hvor |
|---------|---------------|
| Gateway `helsenett`, `ClientTrafficPolicy` for proxy protocol | Alle tenant-klustere (sandbox, ops-test, green-test/prod, yellow-test/prod, red-test/prod, norsyss) |
| GatewayClass `internett` + Gateway `internett` | sandbox, ops-test, green-test/prod og yellow-test/prod — **ikke** red-klusterne eller norsyss |

**Tenant-mønsteret:** plattformen kjører delte `Gateway`-objekter (`helsenett`, `internett`) i `envoy-gateway-system` med `allowedListeners.namespaces.from: All`; tenanter knytter til seg listeners og TLS via **`ListenerSet`** i eget namespace og ruter trafikk til sine Services med **`HTTPRoute`**. RBAC-rollen `skybert:tenant-admin` gir `listenersets`, `httproutes`, `grpcroutes`, `tcproutes`, `tlsroutes` og `udproutes`, men bare lesetilgang (`get`/`list`/`watch`) til `gateways`, samt Envoy-policyer som beskrevet i [Sikkerhet](security.md#tenant-rbac--hva-du-kan-administrere). Hostname-reglene over (inkl. flambert-blokkeringen) håndheves også på Gateway API-ruter.

`fhinett` er unntaket: der er Gatewayen tenantens egen. Hver tenant-base i infra har en Gateway `fhinett` i `tn-<tenant>` (`tenants/<tenant>/base/gateway-fhinett.yaml`, generert ved bootstrap); tenanten kan lese den, men ikke endre den. EnvoyProxy-en for klassen har ikke `mergeGateways`, så hver slik Gateway får egne Envoy-pods i `envoy-gateway-system` og egen IP fra klusterets fhinett-pool; en Envoy-policy på den når ingen annen tenant. Adressen står i kolonnen `ADDRESS` fra `kubectl get gateway fhinett -n tn-<tenant>`; poolene per kluster står i [Cluster networks](https://docs.sky.fhi.no/miscellaneous/cluster-networks/). Gatewayen kommer med plattformens listener `http` (port 80, ruter bare fra `skybert-system`), der `HTTPRoute`-en `flambert-tn-<tenant>-ingress` gir hostnavnet `<klusterprefiks>-tn-<tenant>.ingress.flambert` en A-record mot Gatewayens IP (external-dns-private). Tenanten legger til egne listeners med `ListenerSet` (`parentRef: fhinett`); `ClientTrafficPolicy` kan peke på `ListenerSet`-en direkte (Envoy Gateway 1.9.2), så plattformens listener forblir urørt. Alle klustere har i tillegg en Gateway `fhinett` i `skybert-system` for plattformtjenester, som bare tar listeners fra `skybert-system`, `grafana` og `flux-system`.

> **Operasjonell antakelse:** At flambert-navnet kan brukes fra andre klustere i stedet for IP-en, er prøvd fra green-test (`greentest-tn-fida-analyserom.ingress.flambert`); infra viser bare DNS-recorden.

På rød sone når Gateway API-trafikk ikke fram til podene — se [Rød sone](#rød-sone).

`ListenerSet` + `HTTPRoute`, slik beta-compositionen rendrer dem. cert-manager-issueren annoteres på `ListenerSet`, ikke på ruten:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: ListenerSet
metadata:
  name: listenerset-gw-my-app-helsenett
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
    - name: listenerset-gw-my-app-helsenett
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

**Klient-IP bak `ingress-nginx`:** podene ser aldri kallerens adresse. Controlleren kjører med tom ConfigMap (standardverdier), så `X-Forwarded-For` erstattes med adressen som koblet til nginx i stedet for å utvides, og den adressen er allerede intern: NAT hos NHN og MetalLB-tjenesten (`externalTrafficPolicy` ikke satt, altså `Cluster`) bevarer ikke kilden. Rate-limiting eller lockout per klient-IP i appen blir dermed én felles bøtte for alle brukere. Headeren kan til gjengjeld ikke forfalskes utenfra.

> **Operasjonell antakelse:** Observert på `aks-green-test-02`: hver forespørsel kom inn med `X-Forwarded-For: 10.244.x.x`.

> Kilde: https://docs.sky.fhi.no/internal/decisions/gatewayapi/ · https://docs.sky.fhi.no/explanations/tools-and-components/ · https://docs.sky.fhi.no/miscellaneous/cluster-networks/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/envoy/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/compositions/skybertapp-beta.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml

## Nettverkspolicyer

Et farget (color) klusterpar (test + prod) deler samme nettverksregler — test er ment å oppføre seg identisk med prod slik at det ikke blir overraskelser ved promotion.

| Sone | Regler |
|------|--------|
| Grønn | Ingen restriksjoner. Utgående trafikk er fullt åpen. |
| Gul | Foreløpig ingen restriksjoner. Utgående trafikk er åpen, men dette kan endre seg etter hvert som plattformen modnes. |
| Rød | Streng egress-kontroll — se [Rød sone](#rød-sone). |

Gjelder **alle klustere**, også grønn og gul: GlobalNetworkPolicy `deny-nfs-egress` (order 900) blokkerer TCP 2049 fra `tn-*`-namespaces, slik at tenanter ikke kan montere NFS-sharet selv. Kyverno-policyen `limit-calico-netpol-order` (Enforce) krever `spec.order >= 1000` på Calico `NetworkPolicy` i `tn-*`, slik at tenanter ikke kan overstyre NFS-forbudet (lavere order vinner). `default-allow-tenant-egress` (order 1200) tillater øvrig egress; i rød sone stopper `base-tenant-egress` (order 800) trafikk som ikke allerede er tillatt.

Merk, på grønn begrenser en native `NetworkPolicy` ikke egress. Calico evaluerer den på order 1000 med bare Allow-regler, og trafikk den ikke treffer, går videre til `default-allow-tenant-egress`. En egress-lås i en tenant er derfor en Calico `NetworkPolicy` (`crd.projectcalico.org/v1`) med order 1000–1199 som slutter med `action: Deny`. Ingress er annerledes: grønn har ingen ingress-GNP for `tn-*`, så den implisitte avvisningen i en native ingress-policy holder.

> **Operasjonell antakelse:** Prøvd på `aks-green-test-02`: med en slik Calico-policy nådde poden bare det som var tillatt, og øvrig egress tidsavbrøts.

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/internal/global-network-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/globalnetworkpolicies/base/deny-nfs-egress.yaml

## Rød sone

**Streng egress-kontroll.** All utgående trafikk er blokkert som utgangspunkt, og ingress er begrenset til **NHN secure zone**.

**GlobalNetworkPolicies (plattform-styrt):**

| Policy | Type | Order | Effekt |
|--------|------|-------|--------|
| `alloy-scrape-ingress` | Ingress | 500 | Tillater TCP fra namespace `alloy` til `tn-*`, uten portavgrensning |
| `alloy-otlp-egress` | Egress | 500 | Tillater TCP fra `tn-*` til Alloy på 4317/4318 |
| `<ns>-internal-egress` | Egress | 600 | Kyverno-generert; tillater trafikk innen eget namespace uten protokollfilter |
| `base-tenant-egress` | Egress | 800 | Tillater DNS (UDP 53 til kube-dns i `kube-system`), deretter Deny |
| `deny-nfs-egress` | Egress | 900 | Blokkerer TCP 2049 (alle klustere) |
| `<ns>-internal-ingress` | Ingress | 1200 | Kyverno-generert; tillater trafikk innen eget namespace uten protokollfilter, etter tenantens ingress-policyer |
| `base-tenant-ingress` | Ingress | 1201 | Tillater TCP fra `ingress-nginx`-namespacet, deretter Deny |

Begge røde kluster-overlays inkluderer disse basene. Docs beskriver en forskjell mellom red-test og red-prod som manifestene ikke har; tabellen følger infra-manifestene. Tenantens Calico-regler med order 1000–1199 kan dermed begrense også ingress innen eget namespace.

**Unntak opprettes av plattformteamet** som GlobalNetworkPolicy med `order: 500` (evalueres før base-policyene). Ikke self-service — kontakt `#ext-fhi-skybert`:

- **Egress** til spesifikke IP-ranges/porter. **Kun IP/CIDR** støttes (ikke L7/hostname-basert), så tjenester som Microsoft eller GitHub krever store IP-blokker.
- **Ingress** mellom tenant-namespaces (f.eks. en tjeneste i ett `tn-*`-namespace som skal nå en tjeneste i et annet).
- **Entra ID-pålogging:** `shared-egress-to-entra` tillater 443/TCP til Entra ID login-ranges for namespaces med labelen `skybert.fhi.no/needs-entra-login=true`. Plattformteamet setter labelen; tenanter setter ikke namespace-labels selv.
- **CloudNativePG:** namespace-labelen `skybert.fhi.no/needs-cnpg=true` aktiverer GNP-ene operatoren og backup trenger — se [Persistence — Rød sone](persistence.md#rød-sone-globalnetworkpolicies).

**Tenant-NetworkPolicies i rød sone:** Native Kubernetes `NetworkPolicy` (`networking.k8s.io/v1`) er forbudt. Tenanter kan opprette **Calico `NetworkPolicy`** (`crd.projectcalico.org/v1`) for å finjustere ingress — kun med `Ingress`-regler og `spec.order` i `[1000, 1200)`: under 1000 avvises av `limit-calico-netpol-order` (alle klustere), 1200 og over av `sub-1200-calico-netpol-in-tenants` (rød). Egress styres kun via GlobalNetworkPolicy fra plattformteamet. Kyverno-policyene står i [Kyverno-policier — Rød sone](kyverno-policies.md#rød-sone--ekstra-policier).

**Gateway API når ikke fram:** `base-tenant-ingress` tillater kun ingress fra `ingress-nginx`-namespacet, og ingen GNP slipper `envoy-gateway-system` inn. `ListenerSet` og `HTTPRoute` applyer uten feil, men ingen trafikk når podene. Det gjelder også beta-SkybertApp, uansett `network`, selv om docs' migreringsguide lister `fhinett` og `helsenett` som tilgjengelige på rød. På rød er alpha-SkybertApp (`Ingress`) veien — eventuelt en Calico `NetworkPolicy` med `spec.order` i `[1000, 1200)` som tillater ingress fra `envoy-gateway-system`, avklart med `#ext-fhi-skybert`.

> Kilde: https://docs.sky.fhi.no/build/environments/ · https://docs.sky.fhi.no/internal/global-network-policies/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/globalnetworkpolicies/base/policies-red/

## Egress-IP (tillatt utgående trafikk fra clusterne)

Trafikk fra workloads forlater klusteret med IP-en til noden poden kjører på. Skal en tjeneste utenfor klusteret (database, API, filshare) begrense tilgang på IP, åpne for hele node-IP-poolen til klusteret, ikke én node — noder byttes ved oppgradering og skalering. Poolene står i [Cluster networks](https://docs.sky.fhi.no/miscellaneous/cluster-networks/).

Mot tjenester på internett er trafikken oppgitt å gå ut via felles egress-IP `83.118.167.10` (f.eks. Azure SQL-brannmurregler). Bekreft verdien med plattformteamet (`#ext-fhi-skybert`) før den legges i en brannmurregel; rød sone krever i tillegg en GlobalNetworkPolicy før trafikken slipper ut.

> **Operasjonell antakelse:** Verdien er oppgitt av bidragsyter fra intern plattformkunnskap og finnes verken i docs eller infra-repoet; docs beskriver bare node-IP-ene.

> Kilde: https://docs.sky.fhi.no/miscellaneous/cluster-networks/

## Service Mesh

Skybert kjører **ikke** service mesh.

> Kilde: https://docs.sky.fhi.no/internal/service-mesh/

## Public CA / Trust Bundle

CA-sertifikater lagres i `/etc/ssl/certs/` i containere. Du er ansvarlig for å holde `ca-certificates`-pakken oppdatert.

**Trust bundle:** Plattformen vedlikeholder `trust-bundle.pem` med FHIs interne CA-er (`fhi.no` og `red.fhi.sec`) **og** den vanlige listen av offentlige CA-er. Kyverno-policyen `automount-cert-chain-bundle` monterer den fra ConfigMap `internal-cert-bundle` til `/etc/ssl/certs/trust-bundle.pem` (read-only, `subPath`) i alle containere og init-containere i `tn-*`-pods, med mindre poden allerede har et volum med navn `internal-cert-bundle`. ConfigMapen har i tillegg nøklene `trust-bundle.jks` og `trust-bundle.p12` med de samme CA-ene; de monteres ikke automatisk — monter nøkkelen selv fra ConfigMap `internal-cert-bundle` i et volum med et annet navn.

**Bruk trust-bundle:** Sett `SSL_CERT_FILE=/etc/ssl/certs/trust-bundle.pem` (eller tilsvarende for ditt rammeverk) for å bruke den kuraterte listen i stedet for image-standardene. Siden bundelen også har offentlige CA-er, bryter ikke offentlige TLS-kall.

> Kilde: https://docs.sky.fhi.no/miscellaneous/publicCA/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/automount-cert-chain-bundle.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/cert-manager/base/internal-cert-bundle.yaml
