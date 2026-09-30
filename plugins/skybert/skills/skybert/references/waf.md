# WAF på Skybert

## Tilgang og status

Docs beskriver Coraza med OWASP Core Rule Set via `EnvoyExtensionPolicy` på Envoy Gateway-ruter. Dette dekker ikke nginx-`Ingress` fra vanlig SkybertApp. Avklar aktivering med plattformteamet før bruk: standardrollene for tenant-admin og Flux mangler `envoyextensionpolicies`, og Gateway API har egne begrensninger på rød sone. Se [nettverk](hostnames-and-networking.md#rød-sone).

Kildene bekrefter konfigurasjon, ikke en fungerende ende-til-ende WAF. README for plattformens Coraza-image sier at lasting og kjøring i Envoy ikke er verifisert. Docs bruker `crfhiskybert.azurecr.io/waf/coraza-proxy-wasm:0.6.0`; avklar fungerende image og tilgang før et manifest tas i bruk.

> Kilde: https://docs.sky.fhi.no/workloads/waf/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/coraza-proxy-wasm/README.md

## Plattformens policier

Alle ni kluster-overlays inkluderer `policies-waf`, også klustere uten aktiv Envoy-installasjon. Dette betyr ikke at alle har en tilgjengelig WAF-tjeneste.

| Policy | Virkning |
|---|---|
| `restrict-tenant-waf-wasm-source` | Enforce: Wasm-kilden må være `Image` med URL under `crfhiskybert.azurecr.io/waf/*`. |
| `inject-tenant-waf-bundle` | Muterer en eksisterende `EnvoyExtensionPolicy` ved opprettelse/oppdatering, men bare når `waf.skybert.fhi.no/bundle` er `owasp-detection` eller `owasp`; oppretter ikke policyen for tenanten. |
| `require-tenant-waf-coverage` | Audit: rapporterer HTTPRoute uten en EnvoyExtensionPolicy i samme namespace som peker direkte på ruten med `targetRefs.kind: HTTPRoute` og riktig navn. Sjekken beviser ikke at WAF faktisk kjører. |

Dekking via Gateway/Backend som docs omtaler, telles ikke av denne Audit-regelen. PolicyException følger plattformens vanlige avklaringsløp; manglende dekning blokkerer ikke apply gjennom denne regelen.

> Kilde: https://docs.sky.fhi.no/workloads/waf/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-waf/

## Bundles og egne regler

Velg bundle med annotasjonen `waf.skybert.fhi.no/bundle`: `owasp-detection` eller `owasp`. Uten annotasjonen, eller med en annen verdi, injiserer `inject-tenant-waf-bundle` ingen bundle og endrer ikke `EnvoyExtensionPolicy`-en; bundle er dermed opt-in i alle klustere, også rød. Docs beskriver `detection`/`baseline`/`strict` og automatisk injisering (default `baseline`, `strict` på rød); de navnene finnes ikke i policyen, og en annotasjon med et av dem gir ingen bundle. Følg infra, og avklar valg og konsekvenser med plattformteamet.

| Bundle | Paranoia level | Inbound/outbound terskel | failOpen |
|---|---|---|---|
| owasp-detection | 1 | 5 / 4 | true |
| owasp | 1 | 5 / 4 | true |

Begge setter `SecRuleEngine DetectionOnly` og `failOpen: true`; preamble, terskler, engine og failOpen er i dag like i de to bundlene. CRS-funn håndheves dermed ikke som blokkerende regelmotor, og feil i Wasm-filteret stenger ikke trafikk. Infra-kommentaren sier at `owasp` skal settes til `SecRuleEngine On` når blokkering slås på. Ikke beskriv dette som at WAF blokkerer i dag.

Tenant-regler legges i `config.directives_map.app`. Er `waf.skybert.fhi.no/bundle` satt til `owasp-detection` eller `owasp`, bygger `inject-tenant-waf-bundle` `default` fra preamble, app-reglene og til slutt engine, og setter `default_directives: default` og `failOpen`; uten en slik annotasjon endrer policyen verken `directives_map` eller `default_directives`. Tenantens regel-ID-er er 1–99999; CRS bruker 900000–999999. Bruk målrettede unntak, og én policy per rute som beskrevet i docs. Ved flere policyer beskriver docs at den eldste vinner.

Request body-limit er 13107200 byte, no-files-limit 131072. Begge bundlene har `SecResponseBodyAccess Off` (ingen response-inspeksjon) og tillater GET/HEAD/POST/OPTIONS/PUT/PATCH/DELETE i CRS-konfigurasjonen.

Plattformbildet bygger inn GeoIP-støtte; bruk `%{GEO.COUNTRY_CODE}` ved substitusjon. Vis attribusjon til db-ip.com der GeoIP-resultater vises. Konkrete regler og unntak finnes i [plattformens eksempler](https://docs.sky.fhi.no/workloads/waf/examples/); prøv dem først etter at tilgang og image er avklart.

> Kilde: https://docs.sky.fhi.no/workloads/waf/examples/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-waf/inject-tenant-waf-bundle.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/coraza-proxy-wasm/README.md
