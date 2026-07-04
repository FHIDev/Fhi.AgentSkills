# Analyse: forbedring av `skybert`-skillen og `oppdater-skybert`-skillen

**Dato:** 2026-07-03 (revidert samme dag etter ekstern gjennomgang)
**Analysert:** `skybert/` (SKILL.md ~700 linjer / 3169 ord, 14 referansefiler + 3 statiske
YAML-kopier, totalt ~17 000 ord) og `.claude/skills/oppdater-skybert/`
(SKILL.md 1633 ord + 6 referansefiler, totalt ~7 300 ord)

---

## Sammendrag

Begge skillene er godt gjennomarbeidede. `oppdater-skybert` er allerede modulær med
progressive disclosure, NO-OP-fast-path, persistent state, dekningsmatriser,
konsekvenssjekk og ikke-slett-regler — den er den mest robuste oppdater-skillen i repoet.
De viktigste forbedringsmulighetene:

1. **`skybert/SKILL.md` er for stor og for detaljert** (~700 linjer lastes ved hver
   trigging). Mye av innholdet er duplikat av referansefilene eller detaljstoff som hører
   hjemme der (P1).
2. **Samme fakta bor mange steder**: kluster-navn står i 8 filer, Flux-intervallet i 4.
   Dette er både kontekstkostnad og hovedårsaken til at oppdater-skillen trenger en egen
   «konsekvenssjekk» — færre dupliseringspunkter gjør oppdatering billigere og tryggere (P2).
3. **State skrives dobbelt** (HTML-kommentar i SKILL.md + `.oppdater-state.json`) — to
   kilder som kan divergere, og vedlikeholdsmetadata lastes inn i konsumentkonteksten (P4).
4. **Deterministiske steg gjøres manuelt**: SHA-sammenligning, hash-beregning (webscraping-
   modusen krever SHA-256 av normalisert tekst — det kan en agent ikke gjøre pålitelig uten
   script), speiling til `.agents/`, drift-sjekk av statiske kopier (P8).
5. **To hull i informasjonsbevaring**: docs-kildereferanser er ikke commit-pinnet (P6), og
   endringsposter som utsettes, delvis implementeres eller feiler verifikasjon i en
   INKREMENTELL kjøring kan bli usynlige i opptil 30 dager (P7).

Tiltakene er prioritert til slutt. P1, P2, P4 og P8 gir størst effekt.

---

## Nå-situasjon (fakta)

### `skybert/` (consumer-skill)

| Del | Omfang | Vurdering |
|-----|--------|-----------|
| `SKILL.md` | ~700 linjer / 3169 ord | For stor; inneholder detaljstoff og duplikater av referansefiler |
| `references/` (14 md-filer) | 300–1600 ord hver | God granularitet og emneinndeling |
| `references/skybertapp/` | 3 statiske YAML-kopier | God løsning; drift-vern finnes i oppdater-skillen |
| `.oppdater-state.json` + metadata-kommentar | dobbel state | Redundant — se P4 |

Kun `SKILL.md` lastes automatisk ved trigging; referansefilene leses ved behov. Strukturen
er altså riktig — problemet er hva som ligger i `SKILL.md`.

### `oppdater-skybert`

- Allerede delt opp: SKILL.md er orkestrator med «les ved behov»-tabell, 6 referansefiler
  for modus/analyse/implementering. NO-OP-sjekken stopper før tunge referanser leses.
- Sterke mekanismer: 10 hovedregler, ikke-slett-regler, dekningsmatriser A/B/C,
  konsekvenssjekk for avledede påstander, felt-nivå-diff av XRD, `openVurder`-persistens,
  periodisk FULL hver 30. dag, selvoppdatering av routing/filtre.
- Svakheter: intern duplisering (sikkerhetsfiltreringstabellen står i både
  `github-modus.md` og `analyseregler.md`; konfliktregler + domeneeksempel-tabellen i både
  `hovedprinsipper.md` og `analyseregler.md`; dekningsgrad-reglene i både `github-modus.md`
  og `webscraping-modus.md`), ingen scripts, manuell speiling til `.agents/`.

### Observert dupliseringskostnad

- `yellow-test-02` (kluster-navn) forekommer i **8 filer** (18 treff). Da yellow-test-02
  ble innført (commit `de0958a`), måtte kluster-tabeller oppdateres flere steder.
- «Flux rekonsilerer hvert 2. minutt» står i **4 filer** (6 treff).
- SKILL.md inneholder komplette YAML-eksempler som også finnes i referansefiler:
  SecretStore/ExternalSecret (≈ `secrets.md`), feilsøkingssteg 1–4 (≈ `troubleshooting.md`),
  GitHub-variabler/secrets og dispatch-payload (≈ `workflows.md`), external-dns-mønsteret
  med tre fulle YAML-blokker (~75 linjer, hører til `hostnames-and-networking.md`).

Konsekvenssjekken i oppdater-skillen finnes nettopp fordi avledede påstander ligger spredt.
Den er et godt sikkerhetsnett — men færre dupliseringspunkter er den egentlige kuren.

---

## Fokusområde 1: Optimal organisering av skybert-skillen

### P1 (høyest prioritet): Gjør SKILL.md til router — flytt detaljstoff til referansefilene

`SKILL.md` skal være det agenten trenger for å orientere seg og svare på enkle spørsmål;
alt annet skal ligge i referansefiler som leses ved behov. Konkret flytting:

| Innhold i SKILL.md i dag | Flyttes til | Beholdes i SKILL.md |
|--------------------------|-------------|---------------------|
| «Image Tag Management og Promotion» (dispatch-payload, sed-detaljer, fallback-tag-regel) | `references/workflows.md` (det meste står der alt) | 3–4 linjer: promotion-flyt `sandbox → test → prod` + peker |
| «Public DNS-oppslag (external-dns)» med 3 YAML-blokker | `references/hostnames-and-networking.md` | 2 linjer: at mønsteret finnes + peker |
| SecretStore/ExternalSecret-YAML + RBAC-forutsetning | `references/secrets.md` | 1 linje + peker (RBAC-403-fella er viktig — behold som kritisk regel) |
| «Påkrevde GitHub Repository-variabler og secrets» (2 tabeller + gh-kommandoer) | `references/workflows.md` | peker |
| «Feilsøking av deployments» steg 1–4 med kubectl-kommandoer | `references/troubleshooting.md` (overlapper alt) | 3 linjer: workflow → vent 2 min på Flux → peker |
| RoleBinding-YAML | `references/security.md` | 2 linjer om `skybert:tenant-admin`-regelen |
| Cert-manager-issuer-tabellen | `references/hostnames-and-networking.md` | — |
| «Instruksjoner for Claude» (generisk veiledning) | slettes/kortes til 3–4 punkter | kritiske regler står allerede øverst |

Behold i SKILL.md: de 5 KRITISK/VIKTIG-reglene, Om Skybert, tenant/GitOps/miljøer/soner
(konsept-nivå), Blåløypa, navnekonvensjoner, minimal SkybertApp, persistence-anbefalingen
(inkl. RWX-regelen), CLAUDE.md-verdi-tabellen, referansetabellen, support/ansvar.

**Estimert effekt:** SKILL.md fra ~3170 til ~1400–1700 ord — nesten halvert kontekstkostnad
ved *hver* trigging, uten informasjonstap (alt lander i filer som allerede eier emnet).

**Definition of done for P1–P3 (bevaringsrapport):** Flytting/omstrukturering skal ikke
bare *love* at ingen detaljer tapes (`OMSTRUKTURER`-regelen) — den skal *bevise* det.
PR-en som gjennomfører P1–P3 skal inneholde en før/etter-rapport med:

1. Liste over hver flyttet seksjon: opprinnelig fil/plassering → ny fil/plassering.
2. Verifisering av at alle `> Kilde:`-referanser fulgte med innholdet.
3. Verifisering av at alt manuelt/erfaringsbasert innhold (avsnitt uten kilde-referanse)
   er gjenfunnet i ny plassering — dette er innholdet som ikke kan regenereres fra kildene.
4. Bekreftelse på at routing-tabellen og Forutsetninger-treet peker på de nye målfilene.

Dette er samme kontrakt som bevaringsseksjonen i UPDATE-PLAN.md, anvendt på
restruktureringen selv.

### P2: Én kanonisk plassering per faktum

Innfør prinsippet «hvert faktum har én eier-fil; andre filer lenker» og rydd de verste:

- **Kluster-tabellen** (navn, soner, subscription-IDer): kanonisk i
  `references/kubectl-access.md` (har mest detalj i dag). `SKILL.md` beholder den enkle
  sone-oversikten uten kluster-detaljer; `platform-architecture.md` lenker.
- **Flux-intervallet**: kanonisk i `platform-architecture.md`; andre steder skriver
  «vent på Flux-rekonsiliering (se platform-architecture)» eller refererer uten tall.
  (Alternativt: aksepter tallet som stabilt og behold — men da vit at konsekvenssjekken
  må fange 4 filer ved endring.)
- **Domene/issuer-tabellene**: kanonisk i `hostnames-and-networking.md`.

Dette er samme grep som gjør oppdater-skillens jobb enklere: routing-tabellen får færre
mål per kildefil, og konsekvenssjekken får færre treff å vurdere.

### P3: Samle legacy-innhold i én fil

`configuration.md` har 4 seksjoner merket **Legacy** (WebApp ×2, CSI driver ×2) — omtrent
halve filen — pluss egen `webapp-crd.md`. Flytt legacy-eksemplene fra `configuration.md`
inn i `webapp-crd.md` (omdøpt f.eks. `legacy-webapp-csi.md`), slik at `configuration.md`
er ren «slik gjør du det i dag». Agenter som svarer på nye oppsett slipper å laste legacy-
støy; migrering fra WebApp/CSI har fortsatt alt samlet ett sted. (Ikke-slett-reglene
overholdes: alt bevares, bare flyttes — `OMSTRUKTURER`-kategori.)

### P4: Én state-kilde — fjern metadata-kommentaren fra SKILL.md

I dag skrives commit-SHAs/datoer to steder: HTML-kommentaren i `skybert/SKILL.md` og
`skybert/.oppdater-state.json`. Det er en dual-write-kontrakt som kan divergere (og
divergens gir feil inkrementell base = stille tapte endringer), og metadataen lastes inn i
konsumentkonteksten ved hver trigging uten å ha verdi der.

**Forslag:** `.oppdater-state.json` blir eneste state. NO-OP-sjekken leser JSON-filen i
stedet for kommentaren (like billig). Viktig presisering: ikke erstatt kommentaren med en
ny håndskrevet state-linje i SKILL.md — det ville bare bli en tredje sannhet. Hvis en
«Sist verifisert»-linje beholdes for mennesker, skal den være ren visning *generert fra*
`.oppdater-state.json` i steg 9 (skrives av samme operasjon som oppdaterer state-filen,
aldri redigeres manuelt). Metadata-kontrakt-seksjonen i oppdater-skillen forenkles
tilsvarende (schema_version-bump; migreringsregel: kommentar finnes men ikke JSON → FULL,
som i dag). Dette fjerner også dagens tre-datoer-i-synk-problem (`docs_commit_date`,
`last_fullscan_date`, «Sist verifisert»-linjen).

### Referansetabellen: legg til «Les når»-kolonne

Oppdater-skillens underdokument-tabell har en «Les når»-kolonne — det samme grepet i
`skybert/SKILL.md` sin referansetabell gjør ruting mer treffsikker (f.eks.
«kubectl-access.md — les når brukeren skal koble til kluster, får tilkoblingsfeil, eller
spør om PIM»). Billig, og reduserer feillasting av store filer.

---

## Fokusområde 2: Minst mulig kontekstbruk

- **P1 er hovedgrepet**: ~1500 ord spart per trigging av skybert-skillen.
- **P4** fjerner 12 linjer metadata fra hver trigging og hindrer at maintainer-stoff
  lastes hos konsumenter.
- **P3** gjør at `configuration.md` (880 ord) halveres for det vanligste behovet.
- **P5: Dedupliser internt i oppdater-skillen.** Sikkerhetsfiltreringstabellen,
  konfliktreglene m/domeneeksempler og dekningsgrad-reglene står i to filer hver. Velg
  kanonisk plassering (forslag: sikkerhetsfiltrering → `analyseregler.md`; konfliktregler →
  `hovedprinsipper.md`; dekningsgrad-regler → egen kort seksjon i `analyseregler.md` som
  begge modus-filene lenker til). Sparer ~40 linjer og fjerner divergensrisiko — i dag kan
  en regelendring lande i én av kopiene og gi to ulike sannheter.
- **Referansefilene er allerede riktig dimensjonert** (300–1600 ord, lastes ved behov) —
  ingen oppsplitting nødvendig. De statiske YAML-kopiene lastes kun ved lokal rendering —
  riktig plassering.

---

## Fokusområde 3: Informasjon skal aldri tapes fra kilden

Dagens sterke sider — behold: infra-kildereferanser er pinnet til commit-SHA (uforanderlige
så lenge repoet finnes), ikke-slett-regler med krav om positiv evidens, bevaringsseksjon
for innhold uten repo-kilde, `openVurder`-persistens, statiske kopier av XRD/composition/
functions med drift-vern, periodisk FULL hver 30. dag som fanger akkumulert drift, og
webscraping-modusens forbud mot å endre infra-basert innhold den ikke kan verifisere.

Hullene:

### P6: Pin docs-kildereferanser til commit

Docs-innhold refereres som `> Kilde: https://docs.sky.fhi.no/<sti>/` — en levende URL.
Flyttes eller slettes siden, kan påstanden ikke lenger re-verifiseres, og lenken dør.
Infra-referansene har allerede løsningen: commit-pinnede GitHub-URLer.

**Forslag:** I GitHub-modus skrives docs-referanser med begge former:
`> Kilde: https://docs.sky.fhi.no/build/environments/ (repo: blob/<docs_commit>/docs/build/environments.md)`.
Den levende URL-en er for mennesker, den pinnede for re-verifisering. `docs_commit` finnes
allerede i state.

**Migreringsregel for eksisterende referanser:** Nye referanser er ikke nok — skillen har
i dag mange upinnede `docs.sky.fhi.no`-referanser. Legg inn i implementeringsreglene at
GitHub-modus-kjøringer *opportunistisk* oppgraderer eksisterende docs-referanser i filer
som likevel berøres: verifiser at siden fortsatt finnes på stien i docs-repoet ved gjeldende
commit, og legg til den pinnede formen. Ved FULL modus tas hele restanselisten. I
webscraping-modus er pinning ikke mulig — eksisterende referanser røres ikke der.

### P7: Lukk tapsvinduet for utsatte endringsposter ved INKREMENTELL

`openVurder` bevarer uavklarte `VURDER`-poster — bra. Men andre kategorier
(`NY`/`UTVID`/`KORRIGER`...) som brukeren *ikke godkjenner* i steg 7, forsvinner med
`.tmp/` når state-SHAs likevel oppdateres etter delvis Apply. Kildediffen som utløste dem
er da «konsumert», og postene gjenoppstår først ved neste FULL (opptil 30 dager senere).

**Forslag:** Generaliser `openVurder` til `openItems` som dekker *alle* poster som ikke
nådde fullført tilstand — ikke bare utsatte. Tre status-verdier:

- `deferred` — brukeren utsatte/avviste ikke-endelig i steg 7
- `partial` — godkjent, men bare delvis implementert i steg 8
- `failed-verification` — implementert, men et kontrollpunkt i steg 8/9 slo feil

Felter per post: `id`, `status`, `category` (NY/UTVID/KORRIGER/…), `target` (målfil),
`source` (kildereferansen som utløste posten), `summary`, `firstSeen`, `lastSeen`.
Alle åpne poster tas inn i neste plan — samme mekanikk som dagens `openVurder`, som blir
et spesialtilfelle (`status: deferred`, `category: VURDER`). Da er verken delvis
godkjenning, avbrutt implementering eller feilet verifikasjon et informasjonstap.

### P8 bidrar også her (webscraping-hash)

Webscraping-modusens NO-OP/inkrementell-logikk hviler på SHA-256 av normalisert tekst.
En agent kan ikke regne SHA-256 «i hodet» — uten script blir hashen enten beregnet med
improvisert kode (variasjon i normalisering → falske endringer/falske NO-OPs) eller
tilnærmet. En falsk NO-OP er stille informasjonstap. Ship et kanonisk script (se P8) slik
at normaliseringen er identisk i hver kjøring.

### Mindre: arkiver ekstraherte docs-sider i webscraping-modus (eksplisitt valgfritt — IKKE standard)

I webscraping-modus finnes ingen uforanderlig kilde: når en side endres, er den gamle
teksten borte (kun hash gjenstår). GitHub-modus har ikke problemet (git-historikk).
Hvis webscraping-modus faktisk brukes i praksis, *kan* normalisert sidetekst lagres per
kjøring (f.eks. `skybert/.sources/<location>.txt`) slik at forrige tilstand kan diffes.

Dette skal i så fall være et eksplisitt opt-in, aldri standardatferd, av to grunner:
(1) det gir mye commit-støy for lav verdi så lenge GitHub-modus er normalveien, og
(2) det legger en levende kopi av docs-innhold — potensielt inkludert internt stoff —
inn i dette repoet, med egen vedlikeholds- og sensitivitetsrisiko. Hvis webscraping-modus
primært er en teoretisk fallback: dropp hele tiltaket.

---

## Fokusområde 4: Optimal virkemåte (ytelse og presisjon)

### P8: Script de deterministiske stegene

Legg `scripts/` under `.claude/skills/oppdater-skybert/` (speiles til `.agents/`):

1. **`check-state`** (steg 1 komplett): leser `.oppdater-state.json`, spør `gh api` om
   HEAD-SHAs for begge repoer (med retry/backoff fra feilhåndteringstabellen), sjekker
   `LOCAL_SKYBERT_DOC_CLONE`, evaluerer modus-tabellen (FULL/INKREMENTELL/NO-OP inkl.
   30-dagers-regelen) og skriver JSON-svar. NO-OP-kjøringen blir én scriptkjøring i
   stedet for en flertrinns manuell prosedyre — raskere, billigere og deterministisk.
2. **`docs-hash`** (webscraping steg 1–3): henter `search_index.json`, normaliserer,
   beregner `globalHash` + per-side-hasher, diffar mot state og skriver
   `changed-files`-lignende output. Fjerner hele klassen «agent-improvisert hashing».
3. **`compare-sources`** (INKREMENTELL steg 2): kjører compare-API-kallene og skriver
   `.tmp/oppdater-skybert/changed-files.json` — i dag beskrevet som manuelle kommandoer.
4. **`verify-static-copies`**: diffar `references/skybertapp/*.yaml` mot kildefilene ved
   pinnet/ny commit (inkl. sjekk av at xpkg-omskrivingen i `functions.yaml` er intakt) og
   rapporterer drift. Gjør «kopiene skal ALDRI drifte stille»-regelen verifiserbar.
5. **`sync-agents`**: kopierer `.claude/skills/oppdater-skybert/` → `.agents/skills/…` og
   diffar (se P10).
6. **`validate`** (samle-script): kjører alle invariant-sjekkene i én operasjon —
   `.claude`↔`.agents`-likhet, state-fil mot schema (inkl. `openItems`-feltene fra P7),
   manglende/ugyldig kildepinning i endrede filer (P6), drift i statiske YAML-kopier
   (delegerer til `verify-static-copies`), og eval-filformat (P11). Samme script kjøres
   lokalt før PR og i CI (P10) — én definisjon av «gyldig», to håndhevingspunkter.
   Merk: validate bygges inkrementelt — første versjon dekker speiling og statiske kopier;
   sjekkene for state-schema, pinning og evals legges til etter hvert som P4/P6/P7/P11
   definerer kontraktene de skal håndheve.

Skjønnsbaserte steg (dekningsmatriser, kategorisering, konfliktvurdering) forblir
agent-arbeid — det er riktig arbeidsdeling.

### P9: Subagent-fan-out ved FULL modus (valgfri optimalisering)

FULL modus leser i dag *alle* docs-sider + infra-filer i scope sekvensielt i
hovedkonteksten. Med to repoer er det titusenvis av tokens før analysen begynner — med
risiko for kontekstkomprimering midt i arbeidet (som i seg selv er et informasjonstap i
kjøringen). Forslag: beskriv i `github-modus.md` at FULL-discovery *kan* fan-outes til
underagenter per område (docs-navigasjon, infra/crossplane, kyverno+nettverk, scripts/
tenant-bootstrap).

Viktige avgrensninger:

- **Valgfritt, ikke obligatorisk** — sekvensiell lesing forblir gyldig fremgangsmåte for
  mindre kjøringer.
- **Strengt output-format**: underagenter leverer kun strukturerte funn (kildefil,
  ordrett sitert påstand, foreslått målfil, informasjonstype) — aldri ferdige
  endringsposter eller konklusjoner.
- **Hovedagenten eier alt normativt**: kildeautoritet/konfliktregler, ikke-slett-reglene,
  kategorisering og de endelige dekningsmatrisene og planen settes sammen av hovedagenten.
  Underagentene er lesere, ikke beslutningstakere.

### P10: Automatiser `.claude` ↔ `.agents`-speilingen

Speilingen er i dag en instruks («skal alltid speiles identisk») uten verktøy — kjent
driftrisiko. Minimum: `sync-agents`-scriptet (P8.5). Bedre: en GitHub Action som feiler
PR-en hvis trærne divergerer (gjelder alle skills i repoet, ikke bare oppdater-skybert —
samme tiltak er foreslått i designsystem-analysen P11; implementer én gang for hele
repoet).

### P11: Innfør regresjonstest-spørsmål (evals)

Ingen systematisk måte å oppdage at en oppdatering *forverret* skillen. Opprett
`skybert/evals/evals.json` med 8–12 representative spørsmål med fasit, f.eks.:

- «Hvordan får jeg kubectl-tilgang til yellow-test?» (fasit: `az connectedk8s proxy`,
  riktig kluster `aks-yellow-test-02`, ikke `az aks get-credentials`)
- «ExternalSecret feiler med 403 ForbiddenByRbac» (fasit: `Key Vault Secrets User`-rollen
  mangler på vaulten)
- «Kan jeg bruke NetworkPolicy i rød sone?» (fasit: native forbudt, Calico ingress-only
  med `order < 1200`)
- «Hvorfor deployes ikke endringen min?» (fasit: workflow → OCI → Flux 2 min-flyten)
- «Sett opp en app med hemmeligheter fra Key Vault» (fasit: SkybertApp inline secrets,
  ikke WebApp/CSI)
- Et spørsmål der fasit er «kontakt plattformteamet» (f.eks. egress-unntak i rød sone)

Kjør spørsmålene mot oppdatert skill som del av kontrollpunktene i steg 8/9. Fanger både
faktafeil og strukturregresjon (f.eks. at P1-flyttingen brøt et svar).

### P12: Trigger-kvalitet i skybert-beskrivelsen

Beskrivelsen i `skybert/SKILL.md` er i dag «hva skillen er» («Ekspert på …»). Beste
praksis er symptom-/situasjonsbaserte triggere: legg til ord brukere faktisk skriver —
«deployment feiler», «ImagePullBackOff», «ExternalSecret», «kubectl», «Flux»,
«tn-namespace», «SkybertApp» — gjerne også engelske fraser. Reduserer under-trigging
uten kontekstkostnad (beskrivelsen er allerede i systemprompten). Kan verifiseres med
skill-creators trigger-evals.

### Mindre presisjonsforbedringer

- **Forutsetninger-treet** i oppdater-SKILL.md vedlikeholdes manuelt og verifiseres av
  selvoppdateringen — med `check-state`-scriptet kan faktisk filliste genereres og diffes
  automatisk i stedet.
- **`docs/internal/component-versions.md`-raden** i routing-tabellen (VURDER, «endres
  hyppig») bør lande på lenking, ikke kopiering — hyppig endrede versjonsmatriser i
  skillen gir evig oppdateringsstøy for lav verdi.

---

## Prioritert tiltaksliste

| # | Tiltak | Effekt | Innsats |
|---|--------|--------|---------|
| P1 | SKILL.md som router: flytt detaljstoff/duplikater til referansefilene (m/bevaringsrapport) | Stor: ~halvert kontekst ved hver trigging; mindre duplisering | Middels |
| P2 | Én kanonisk plassering per faktum (kluster-tabell, Flux-intervall, domener) | Færre filer å oppdatere per kildeendring; mindre driftrisiko | Liten–middels |
| P3 | Samle legacy (WebApp/CSI) i én fil | Renere configuration.md, mindre støy | Liten |
| P4 | Én state-kilde: fjern metadata-kommentaren; ev. «Sist verifisert»-linje genereres fra state | Fjerner divergensrisiko + metadata i konsumentkontekst | Liten |
| P5 | Dedupliser regler internt i oppdater-skillen (3 dublerte tabeller/regelsett) | Ingen divergerende regelsett; ~40 linjer spart | Liten |
| P6 | Commit-pin docs-kildereferanser (nye + opportunistisk migrering av eksisterende) | Re-verifiserbarhet selv når docs-sider flyttes/slettes | Liten (per kjøring) |
| P7 | Persister alle uferdige endringsposter (`openItems`: deferred/partial/failed-verification) | Lukker 30-dagers tapsvindu ved delvis godkjenning, avbrudd og feilet verifikasjon | Liten |
| P8 | Scripts: `check-state`, `docs-hash`, `compare-sources`, `verify-static-copies`, `sync-agents`, `validate` | Raskere/billigere kjøringer; deterministisk hashing, modusvalg og invariant-sjekk | Middels |
| P9 | Valgfri subagent-fan-out ved FULL modus (strengt output-format; hovedagent eier normene) | Unngår kontekstkollaps i store kjøringer | Liten (instruksendring) |
| P10 | CI-sjekk for `.claude`↔`.agents`-speiling via `validate` (hele repoet) | Fjerner kjent driftrisiko | Liten |
| P11 | Evals for skybert-skillen + kjøring i kontrollpunktene | Regresjonssikkerhet ved oppdateringer | Middels |
| P12 | Symptombasert trigger-beskrivelse i skybert/SKILL.md | Mindre under-trigging, null kontekstkostnad | Liten |

**Anbefalt rekkefølge:**
1. **P10 + første versjon av `validate`/`sync-agents`** (vern først: speiling og
   invariants beskyttes før noe annet endres, slik at restruktureringen skjer med
   sikkerhetsnett på plass)
2. **P4 + P7 + P5** (state- og regelkontrakten ryddes før innholdet flyttes —
   `schemaVersion`-bump med migreringsregel tas samlet her)
3. **P1 + P2 + P3 + P12** (restrukturering av skybert-skillen — gjøres som én
   `OMSTRUKTURER`-runde via oppdater-skybert-planflyten med bevaringsrapport, slik at
   ikke-slett-reglene og bevaringskontrollen gjelder; routing-tabellen oppdateres i samme
   kjøring)
4. **P6 + resten av P8** (kildepinning med migreringsregel, øvrige scripts; `validate`
   utvides med pinning- og state-schema-sjekkene)
5. **P11 + P9** (evals — deretter valgfri fan-out; `validate` utvides med eval-formatsjekk)

Merk: alle endringer i `.claude/skills/oppdater-skybert/` skal speiles til
`.agents/skills/oppdater-skybert/` (repo-regel), og P1–P3 endrer målfil-strukturen slik at
routing-tabellen og Forutsetninger-treet må oppdateres i samme PR (selvoppdaterings-
mekanismen i oppdater-skillen dekker akkurat dette). P4 og P7 krever `schemaVersion`-bump
med migreringsregel i begge modus-filene.
