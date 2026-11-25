# WAF på Skybert

## Tilgang og status

Docs beskriver Coraza som Wasm-utvidelse via `EnvoyExtensionPolicy` på Envoy Gateway. Policyen peker på tenantens `HTTPRoute` (SkybertApp rendrer en), eller på en `Gateway` eller `Backend`. Anbefalt bruk er egne regler for det appen faktisk godtar — stier, metoder, content types, størrelser og parameterformat; OWASP Core Rule Set (CRS) er et opt-in-bundle, ikke default. Docs' migreringsguide anbefaler WAF i hvert fall for `internett`- og `helsenett`-ruter. Tenant-admin og `flux-reconciler` har full CRUD på `envoyextensionpolicies` (se [Tenant-RBAC](platform-architecture.md#tenant-rbac)). Avklar aktivering med plattformteamet før bruk.

Kildene bekrefter konfigurasjon, ikke en fungerende ende-til-ende WAF. README for plattformens Coraza-image sier at lasting og kjøring i Envoy ikke er verifisert. Docs bruker `crfhiskybert.azurecr.io/waf/coraza-proxy-wasm:0.6.0`; avklar fungerende image og tilgang før et manifest tas i bruk.

> Kilde: https://docs.sky.fhi.no/workloads/waf/ · https://docs.sky.fhi.no/workloads/skybertapp/migrate-alpha-to-beta/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/skybert-system/base/tenant-admin-clusterroles/core-access-rules.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/coraza-proxy-wasm/README.md

## Plattformens policier

Alle kluster-overlays inkluderer `policies-waf`, og Envoy Gateway er installert på alle klustere. Dette betyr ikke at alle har en tilgjengelig WAF-tjeneste.

| Policy | Virkning |
|---|---|
| `restrict-tenant-waf-wasm-source` | Enforce: Wasm-kilden må være `Image` med URL under `crfhiskybert.azurecr.io/waf/*`. |
| `inject-tenant-waf-bundle` | Muterer en eksisterende `EnvoyExtensionPolicy` ved opprettelse/oppdatering, men bare når `waf.skybert.fhi.no/bundle` er `owasp-detection` eller `owasp`; oppretter ikke policyen for tenanten. |
| `require-tenant-waf-coverage` | Audit: rapporterer HTTPRoute uten en EnvoyExtensionPolicy i samme namespace som peker direkte på ruten med `targetRefs.kind: HTTPRoute` og riktig navn. Sjekken beviser ikke at WAF faktisk kjører. |

Dekking via Gateway/Backend som docs omtaler, telles ikke av denne Audit-regelen. PolicyException følger plattformens vanlige avklaringsløp; manglende dekning blokkerer ikke apply gjennom denne regelen.

> Kilde: https://docs.sky.fhi.no/workloads/waf/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/tree/main/infra/kyverno-policies/base/policies-waf/

## Bundles og egne regler

**Egne regler.** Uten bundle-annotasjon injiserer plattformen ingenting: du setter selv `default_directives: app`, `SecRuleEngine` og reglene i `config.directives_map.app`. Docs' forløp er `SecRuleEngine DetectionOnly`, kontroll av loggene for treff på legitim trafikk, deretter `SecRuleEngine On`. `failOpen: true` slipper trafikken gjennom hvis Wasm-modulen feiler; `false` stenger. Tenantens regel-ID-er er 1–99999; CRS bruker 900000–999999. Regler legges i `config`, ikke i et eget image. Én policy per rute: ved flere beholder Envoy Gateway den eldste og ignorerer resten uten varsel.

WAF-en kjører i Gatewayen ruten henger på, ikke i appen, og hver regel evalueres på hver forespørsel. På de delte Gatewayene `internett` og `helsenett` rammer dyre regler alle tenanter i klusteret; på egen `fhinett`-Gateway rammer de deg selv. Docs' råd: slå på `SecRequestBodyAccess` bare der det trengs og hold `SecRequestBodyLimit` lav (body bufres i Gatewayens minne), aldri `SecResponseBodyAccess On`, match i fase 1 (metode, sti, headere), avgrens regler til stier med `@beginsWith`, foretrekk enkle operatorer (`@streq`, `@within`, `@beginsWith`, `@pm`, `@ipMatch`) framfor `@rx`, hold regelsettet lite, og bruk `nolog` på regler som bare passerer eller setter variabler.

**OWASP CRS-bundle (opt-in).** Sett annotasjonen `waf.skybert.fhi.no/bundle` til `owasp-detection` eller `owasp`. Uten annotasjonen, eller med en annen verdi (default `none`), injiserer `inject-tenant-waf-bundle` ingen bundle og endrer ikke `EnvoyExtensionPolicy`-en; bundle er dermed opt-in i alle klustere, også rød.

| Bundle | Paranoia level | Inbound/outbound terskel | failOpen |
|---|---|---|---|
| owasp-detection | 1 | 5 / 4 | true |
| owasp | 1 | 5 / 4 | true |

Begge setter `SecRuleEngine DetectionOnly` og `failOpen: true`; preamble, terskler, engine og failOpen er like i de to bundlene. CRS-funn håndheves dermed ikke som blokkerende regelmotor, og feil i Wasm-filteret stenger ikke trafikk. Infra-kommentaren sier at `owasp` skal settes til `SecRuleEngine On` når blokkering slås på; docs knytter det til at WAF-logger flyter til Grafana. Ikke beskriv bundlene som blokkerende.

Med bundle bygger policyen `directives_map.default` fra preamble, tenantens `app`-regler og til slutt engine, og setter `default_directives: default` og `failOpen: true`; en egen `SecRuleEngine`-linje i `app` overstyres dermed. Flagger CRS legitim trafikk: legg et målrettet unntak (én regel, sti eller felt) i `app`, eller fjern annotasjonen.

Request body-limit i bundlene er 13107200 byte, no-files-limit 131072. Begge har `SecResponseBodyAccess Off` (ingen response-inspeksjon) og tillater GET/HEAD/POST/OPTIONS/PUT/PATCH/DELETE i CRS-konfigurasjonen. Større opplastinger: slå av body-inspeksjon for opplastingsstien med `ctl:requestBodyAccess=Off`. Da inspiserer ikke WAF-en body, og appen må validere innholdet selv.

Plattformbildet bygger inn GeoIP-støtte; bruk `%{GEO.COUNTRY_CODE}` ved substitusjon. Vis attribusjon til db-ip.com der GeoIP-resultater vises. Konkrete regler og unntak finnes i [plattformens eksempler](https://docs.sky.fhi.no/workloads/waf/examples/); prøv dem først etter at tilgang og image er avklart.

> Kilde: https://docs.sky.fhi.no/workloads/waf/ · https://docs.sky.fhi.no/workloads/waf/examples/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-waf/inject-tenant-waf-bundle.yaml · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/utils/coraza-proxy-wasm/README.md
