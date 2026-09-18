# Container images — FHI-retningslinje og Skybert

FHI-retningslinjen «Container images og Container Registry» (`RL-CICD-001`) gjelder alle container
images som bygges og publiseres til FHIs Container Registry for deploy til Kubernetes — på Skybert
betyr det alt som pushes til `crfhiskybert.azurecr.io/<tenant>/<app>:<tag>`. Dokumentet har status
**Utkast** og er foreslått i PR #2 i `FHIDev/Fhi.Guidelines`; dokumenteier og avvikssystem er ikke
fastsatt. Anbefal kravene som gjeldende praksis, men si at retningslinjen ikke er vedtatt.

🛑 **KRAV (skal)** må følges. 💡 **VEILEDNING (bør)** vurderes i hvert tilfelle. Et krav kan fravikes
i et konkret tilfelle, men avviket skal meldes skriftlig til dokumenteier med hvilket punkt som
fravikes, hvorfor, og hvilke kompenserende tiltak som er gjort.

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md`)

## Krav til imaget

- **Base image** skal være offisielt eller betrodd, og holdes oppdatert. Pinnede versjoner må
  oppdateres jevnlig så sikkerhetsfikser tas inn.
- **Produksjons-imaget** skal inneholde kun det appen trenger, og debug-images skal ikke brukes i
  produksjon. Veiledning: trengs diagnoseverktøy, bruk et eget image (`myapp:prod` og `myapp:debug`).
- **Applikasjonens egne avhengigheter** (NuGet, npm, pip o.l.) skal være oppdaterte, nødvendige og
  uten kjente alvorlige sårbarheter der det er praktisk mulig.
- Veiledning: foretrekk minimalistiske images, ikke installer verktøy appen ikke trenger (`curl`,
  `wget`, `bash`, kompilatorer, package managers), og vurder å pinne base image til versjon/digest.

Imaget må i tillegg kunne kjøre som UID 1000 på Skybert, og bør tåle read-only rot — se
[Least privilege på Skybert](#least-privilege-på-skybert).

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md` §3.1–3.3)

## Sårbarhetsscanning og håndtering av funn

- Images skal scannes for kjente sårbarheter, med **Trivy** som standardverktøy (med mindre annet er
  besluttet sentralt), og scanningen skal så langt det er praktisk mulig inngå i CI/CD-pipelinen.
- Første steg ved funn er å identifisere hvilken komponent som introduserer sårbarheten (appen,
  base imaget, eller en pakke lenger ned i kjeden). Kommer den fra base imaget, skal nyere versjon
  eller annet base image undersøkes før det legges inn workarounds eller egne pakkeoppgraderinger
  i Dockerfilen.
- Floating tags (`nginx:stable-alpine`) er ikke en sikkerhetsmekanisme; ved High/Critical skal
  oppgradering undersøkes aktivt.

| Severity | Håndtering |
|---|---|
| **Critical** | Build/deploy skal stoppe. Må utbedres eller eksplisitt godkjennes som avvik. |
| **High** | Build/deploy skal som hovedregel stoppe. Må utbedres eller eksplisitt vurderes og godkjennes. |
| **Medium** | Bør utbedres. Kan tillates midlertidig uten tilgjengelig fix eller ved lav risiko. |
| **Low** | Følges opp ved anledning. Blokkerer normalt ikke. |

**Kontinuerlig scanning i registry:** retningslinjen krever at registeret scanner publiserte images
løpende, i tillegg til pipeline-scanning, og at teamet varsles og følger opp med nytt base
image/dependencies og rebuild. `crfhiskybert.azurecr.io` eies av plattformen, så tenanten kan ikke
skru dette på selv. Skybert-docs annonserer plattformscanning som kommende («Scanning (Coming)»)
uten å beskrive noen tilgjengelig mekanisme, og verken docs eller infra nevner Trivy eller Defender.
Behandle punktet som et åpent gap: avklar status med plattformteamet på `#ext-fhi-skybert`, og
dokumenter det ellers som avvik etter retningslinjens §4.

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md` §3.4–3.5, 3.9) · https://docs.sky.fhi.no/legal/

## Pipeline, tagging og promotion på Skybert

Retningslinjens anbefalte flyt er build → Trivy-scan → stopp ved Critical/High → push til registry →
deploy til test → funksjonelle/integrasjonstester → godkjenning → deploy **samme image** til prod.
Et image skal ikke pushes til produksjonsregisteret uten at bygg- og scanningskravene er oppfylt,
og unntak skal være dokumenterte, bevisste beslutninger.

Slik oppfylles kravene med Skybert-flyten:

- **Samme image i test og prod:** app-repoet bygger og pusher imaget én gang, og promotion er et
  nytt `repository_dispatch` (`update_tag`) med samme tag for neste `env` — se
  [Workflows — Promotion](workflows.md#promotion-til-neste-miljø). Bygg aldri ett image for test og
  ett for prod.
- **Immutable images og identifiserbar versjon:** bruk en unik tag per bygg (versjon eller
  commit-SHA), og overskriv aldri en tag som er brukt eller godkjent. `latest` skal ikke brukes i
  `SkybertApp`-manifestene. Retningslinjen anbefaler deploy via digest der det passer;
  `SkybertApp.spec.image` har bare `repository` og `tag` (begge påkrevd) og rendres som
  `<repository>:<tag>`, så på Skybert er unike, immutable tags måten å oppfylle kravet på — se
  [SkybertApp CRD](skybertapp-crd.md).
- **Scanning i pipeline** ligger i app-repoets CI, ikke i GitOps-repoets `oci-push`/`update-tag`
  (de pakker manifester og bytter tag). Legg Trivy-steget mellom build og push, med feil ved
  Critical/High.

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md` §3.6–3.8) · https://docs.sky.fhi.no/build/ · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/crossplane/base/xrds/skybertapp.yaml

## Least privilege på Skybert

Retningslinjen krever at containere ikke kjører privileged uten særskilt behov, at unødvendige
Linux capabilities fjernes og at service accounts har minst mulig rettigheter; den anbefaler
non-root, read-only filsystem og NetworkPolicies. Hva som er håndhevet av plattformen, og hva
tenanten må gjøre selv:

| Retningslinjen | På Skybert |
|---|---|
| Ikke privileged, ingen unødvendige capabilities | Kyverno **avviser** `privileged`, capabilities utover PSS-baseline, host-namespaces, `hostPath`, `hostPort` og `allowPrivilegeEscalation: true` på alle klustere |
| Kjør som non-root | Kyverno **avviser** `runAsUser: 0` og **setter** `runAsNonRoot: true` + `runAsUser: 1000` når feltene mangler. Imaget må derfor bygges for UID 1000 (`USER 1000`/`USER node`) |
| Read-only filsystem | Kun **Audit**-funn hvis det mangler. Sett `readOnlyRootFilesystem: true` og `writableDirs` i `SkybertApp` (eller tilsvarende i rå pod-spec) |
| Service account med minst mulig rettigheter | `SkybertApp` bruker `<tenant>-azure`; Azure-roller på identiteten tildeles av tenanten selv, minst mulig og per miljø |
| NetworkPolicies | Rød sone er default deny med plattformens GlobalNetworkPolicies; utenfor rød gir manglende NetworkPolicy et Audit-funn (`recommend-network-policy`) |

Policy-detaljer: [Kyverno-policier](kyverno-policies.md#pod-security-alle-klustere). Anbefalt
`securityContext` og Workload Identity: [Sikkerhet](security.md#anbefalt-sikkerhetskonfigurasjon).
Feilsøking av root-avvisning og UID 1000-krasj: [Feilsøking](troubleshooting.md#container-avvises-fordi-den-kjører-som-root).

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md` §3.10) · https://github.com/FHISkybert/Fhi.Skybert.Infra/blob/main/infra/kyverno-policies/base/policies-green/psp.yaml

## Sjekkliste før push

Retningslinjens §5 har en sjekkliste for base image, dependencies, image-innhold, scanning,
pipeline og registry. Bruk den ved review av Dockerfile og CI-pipeline; punktene over er
Skybert-tolkningen av den.

> Kilde: https://github.com/FHIDev/Fhi.Guidelines/pull/2 (`docs/CI-CD/container-images.md` §5)
