# Migrering: nginx Ingress → Gateway API (HTTPRoute)

Runbook for å flytte en tenant fra nginx-ingress til Traefik Gateway API på Skybert.

> **Status (per 2026-06):** Gateway API er kun aktivert på **green**-klusterne
> (`aks-green-test-01`, `aks-green-prod-02`). Andre soner/klustere bruker
> fortsatt nginx-ingress. Sjekk infra-repoet før du migrerer en tenant i
> en annen sone.
>
> nginx-ingress kjører parallelt under migreringsvinduet, så en tenant kan
> migreres uten samtidig opprydding på plattformsiden. external-dns har både
> `ingress`- og `gateway-httproute`-source aktivert i denne perioden.

## Plattform-oppsettet du migrerer mot

Traefik er deployet med Gateway API-provider. Den sentrale gatewayen er felles
for alle tenants:

| Felt | Verdi |
|------|-------|
| Gateway-navn | `traefik-gateway` |
| Gateway-namespace | `traefik` |
| HTTPS-listener (`sectionName`) | `websecure` (port 8443, `allowedRoutes.namespaces.from: All`) |
| GatewayClass | `traefik` |

> **Merk:** En tidligere migrasjonsplan i infra-repoet
> (`manifests/httproute-migration.md`) refererte til gateway-navn `traefik` og
> sectionName `https`. Det stemmer **ikke** med den faktisk renderte ressursen
> fra Helm-charten. Bruk `traefik-gateway` / `websecure`. Verifiser alltid mot
> den rendrede Gateway-ressursen i infra hvis du er usikker:
> ```bash
> grep -n -A20 'kind: Gateway' infra/traefik/base/traefik-*-helm.yaml
> ```

### TLS

TLS termineres sentralt på `websecure`-listeneren (secret `traefik-default-tls`,
cluster-issuer-annotasjon på Gateway). Tenanten trenger **ikke** lenger en egen
cert-manager-annotasjon eller `secretName`. Hvis du har behov for å verifisere at
det sentrale sertifikatet faktisk dekker hostnavnet ditt, ta det med
plattformteamet (`#ext-fhi-skybert`) — det er infra-siden sitt ansvar.

### Public DNS (external-dns)

Den sentrale gatewayens LoadBalancer-IP er en intern MetalLB-adresse. For at
public DNS skal peke på riktig offentlig IP må `external-dns.alpha.kubernetes.io/target`
settes på **HTTPRoute**-objektet.

> **ADVARSEL — IP-et er IKKE det samme som nginx sitt.**
> IP-ene i hostnavn-tabellen (`83.118.177.220` green-test, `83.118.177.234`
> green-prod) er **nginx-ingress sine** offentlige IP-er. Traefik-gatewayen har
> en egen MetalLB-IP (f.eks. `10.97.72.177` på green-test, mot nginx `…176`) og
> dermed sannsynligvis en **annen** offentlig NAT-adresse. Kopier du nginx-IP-et
> inn på HTTPRouten, peker DNS fortsatt på nginx — ikke Traefik.
>
> **Bekreft Traefik-gatewayens offentlige IP med plattformteamet
> (`#ext-fhi-skybert`) før du flytter DNS.** Tenanten har vanligvis ikke lese-
> tilgang til `traefik`-namespacet eller cluster-scoped Gateway-ressurser, så
> du kan ikke slå den opp selv.

## Migreringssteg per tenant

> **KRITISK — ikke slett Ingress i samme commit som du legger til HTTPRoute.**
> Kjør de to parallelt. nginx eier fortsatt det offentlige IP-et under
> migreringsvinduet; sletter du Ingress før Traefik faktisk serverer routen,
> får hosten 404 fra nginx default-backend (= nedetid). Slett Ingress først
> **etter** at HTTPRoute er verifisert akseptert *og* trafikk faktisk når
> Traefik. Dette er en egen, andre commit.

### Fase 1 — legg til HTTPRoute (behold Ingress)

1. **Behold Service-objektet uendret.** HTTPRoute peker på samme Service.
2. **Legg til HTTPRoute** (se mal under) — *uten* å røre Ingress.
3. **Dropp nginx-spesifikke annotasjoner** på HTTPRoute — de har ingen effekt
   på Traefik:
   - `cert-manager.io/cluster-issuer` + `tls`/`secretName` → TLS er sentralt nå.
   - `nginx.ingress.kubernetes.io/proxy-body-size` → Traefik har **ingen**
     default body-size-grense. Dropp den. (Trenger du likevel en grense, bruk en
     Traefik `Middleware` + `ExtensionRef`-filter på routen.)
   - `nginx.ingress.kubernetes.io/service-upstream` → Traefik ruter til Service-
     endpoints by default. Vil du ha clusterIP-oppførsel: Service-annotasjon
     `traefik.io/service.nativelb: "true"`.
4. **Commit og push til `main`** → oci-push → Flux (vent ~2 min).
5. **Verifiser at Traefik faktisk aksepterer routen** (se under). HTTPRoute
   `.status.parents` skal være **ikke-tom** med `Accepted=True`. Tom status
   betyr at gateway-controlleren ikke har sett routen — typisk at Gateway
   API-rollouten ikke er live på klusteret ennå, eller feil `sectionName`.
   **Ikke gå videre til fase 2 før dette er grønt.**

### Fase 2 — flytt trafikk og fjern Ingress

6. **Bekreft korrekt offentlig IP for Traefik** (se IP-advarsel under) og pek
   `external-dns.alpha.kubernetes.io/target` på HTTPRoute dit. Verifiser at
   `curl https://<host>/` treffer appen (ikke nginx 404).
7. **Slett Ingress-templaten** i en egen commit. Service beholdes.

## HTTPRoute-mal

For én host som ruter alt (`/`) til én Service:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: httproute-<app>
  namespace: tn-<tenant>
  annotations:
    external-dns.alpha.kubernetes.io/target: <traefik-public-ip>  # IKKE nginx-IP! bekreft med plattformteam
spec:
  parentRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: traefik-gateway
      namespace: traefik
      sectionName: websecure
  hostnames:
    - <app>.skytest.fhi.no
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: <service-navn>
          port: <service-port>
```

### Flere hosts / path-baserte regler

- Flere hostnavn på samme route: list dem under `hostnames:`.
- Path-baserte backends: legg til flere `rules`-entries, hver med egen `matches`
  + `backendRefs`. Dette erstatter flere `paths` under én nginx-ingress.
- Trenger en host avvikende `target`-IP, lag en egen HTTPRoute (annotasjonen er
  per-objekt).

## Verifisering

```bash
# HTTPRoute er akseptert av gatewayen (Accepted=True, ResolvedRefs=True)
kubectl -n tn-<tenant> get httproute httproute-<app> -o yaml | \
  grep -A15 'status:'

# DNS peker på riktig offentlig IP (vent på external-dns-rekonsiliering)
dig +short <app>.skytest.fhi.no

# End-to-end mot hosten
curl -sI https://<app>.skytest.fhi.no/
```

I `status.parents[].conditions` skal `Accepted` og `ResolvedRefs` være `True`.
`reason: NotAllowedByListeners` betyr typisk feil `sectionName` eller at namespacet
ikke er tillatt av listeneren. `reason: BackendNotFound` betyr feil Service-navn/port.

## Opprydding

Slett Ingress-templaten fra tenant-repoet i samme commit som HTTPRoute legges til.
Service-objektet beholdes.
