# Hovedprinsipper for oppdatering av Skybert-skillen

## 13 hovedregler

1. **Repo-basert og kuratert** — skillen gjengir det kildene sier, korrekt og Skybert-spesifikt. Innhold legges til når det tilfører noe en agent ikke får fra docs-lenken alene; det fjernes når det er feil, utdatert, generisk, duplisert eller kildeløst uten å være Skybert-spesifikk erfaring.
2. **Fjerning krever oppgitt grunn** — hver `FJERN` skal ha én av grunnene `feil` (motsagt av kilde), `utdatert` (kilden er endret), `generisk` (kunnskap som ikke er Skybert-spesifikk), `duplikat` (finnes i kanonisk fil), `ustøttet` (uten kilde og ikke Skybert-spesifikk erfaring) eller `meta` (datostempel, historikk, forbehold uten handlingsverdi). Fravær i repoene alene er ikke `feil`, men det er heller ikke et vern: kildeløst innhold beholdes bare når det er korrekt, Skybert-spesifikt og merket «Operasjonell antakelse». Evidens for `feil` omfatter også motstrid med faktisk implementasjon i infra-repoet (f.eks. en default-verdi eller policy som beviser at en påstand i skillen er feil) — ikke bare eksplisitt «deprecated»-tekst i docs. Bevaringsreglene skal aldri brukes til å la beviselig feil innhold leve videre: ved motstrid er `KORRIGER` riktig, ikke bevaring.
3. **Erfaringskunnskap er betinget velkommen** — skillen kan inneholde kunnskap utover repoene (plattformteam, Slack, erfaring), men bare når den er (i) ikke motsagt av kildene, (ii) Skybert-spesifikk og (iii) merket `> **Operasjonell antakelse:**` der den står. Umerket kildeløst innhold er ikke beskyttet og skal merkes eller fjernes i samme kjøring.
4. **All docs-info må dekkes** — hver docs-side må spores til minst ett sted i skillen via obligatorisk dekningsmatrise.
5. **Presisjon, ikke volum** — ved komprimering, flytting eller konsolidering skal alle kildestøttede, Skybert-spesifikke operative detaljer (feltnavn, defaults, navnekonvensjoner, policy-effekter) fortsatt finnes i kanonisk fil. Generisk innhold, duplikater og ordrette docs-kopier er ikke detaljer som skal bevares.
6. **Strukturforbedring OK** — omorganisering, nye sider, sammenslåing tillatt — men aldri på bekostning av kildestøttede detaljer.
7. **Full gjennomgang** — komplett gjennomgang av hele skillen mot begge kilder.
8. **Kuratert uttrekk, ikke rå dump** — oppsummer og generaliser mønstre, ikke lim inn store YAML-blokker. Kodeeksempler kun der de viser Skybert-spesifikk syntaks (SkybertApp-felt, dispatch-payload, navnekonvensjoner, `az connectedk8s proxy`-argumenter). Generiske kubectl/Helm/Kustomize/PromQL/C#/Python-eksempler erstattes med én setning og lenke.
9. **Oppdage det ukjente** — vær aktivt åpen for nye mapper, filtyper og dokumentasjonsformer i kilderepoene. Ikke begrens deg til forhåndsdefinerte stier.
10. **Skill mellom faktatyper** — merk tydelig forskjell mellom informasjonstypene (se nedenfor).
11. **Én kanonisk plassering per faktum** — hvert faktum, hver YAML-blokk og hvert eksempel har én kanonisk fil (se «Kanonisk plassering for tverrgående fakta» i [routing-tabell.md](routing-tabell.md)). Andre filer får kun kryssreferanse eller én oppsummerende setning, aldri kopi.
12. **Nåtilstand uten datostempler** — brødtekst beskriver hvordan plattformen er nå. Ingen «per 2026-xx», «ny juni 2026», «tidligere var», «ikke lenger», «under utrulling», «sist oppdatert». Verifiseringstidspunkt og SHA-er bor kun i `skybert/.oppdater-state.json`; eneste unntak er den genererte «Sist verifisert»-linjen i `skybert/SKILL.md`.
13. **Tilfører-det-noe-testen** — hver seksjon skal bestå én av tre: (a) kuratert sammendrag med Skybert-spesifikke fakta som ikke står samlet i én docs-side, (b) kobling av docs og infra (f.eks. «docs sier X, composition gjør Y»), (c) merket Operasjonell antakelse. Består seksjonen ingen av dem, reduseres den til én setning + `> Kilde:`-lenke.

## Kildeautoritet og konfliktregel

- **Docs-repo** er autoritativt for: bruker- og plattformdokumentasjon, konsepter, onboarding, how-to, brukerveiledning.
- **Infra-repo** er autoritativt for: GitOps-mønstre, bootstrap, tenant-mekanismer, cluster-oppsett, plattformkomponenter, faktisk implementasjon.

**Konfliktregel:**
- Docs trumfer Infra for: brukerrettet veiledning, anbefalte fremgangsmåter, konseptforklaringer.
- Infra trumfer Docs for: faktisk teknisk implementasjon, reelle verdier, konfigurasjonsdetaljer.
- Ved reell konflikt der ingen kilde har tydelig forrang: beskriv begge versjoner med kildehenvisning, bruk `VURDER`-kategori, og la brukeren avgjøre.

**Domeneeksempler:**
| Emne | Autoritativ kilde |
|------|-------------------|
| CRD-feltdefinisjoner, defaults, security contexts | Infra |
| Kyverno-policier og deres effekt | Infra |
| Onboarding-veiledning, Blåløypa-steg | Docs |
| Konseptforklaring av tenant-modellen | Docs |
| Faktisk tenant-bootstrap-logikk | Infra |
| Arbeidsflyt-anbefalinger (CI/CD) | Docs |

## Avledede påstander

Skillen inneholder mange tekniske verdier som er *avledet* fra kildene uten å stå i filen kilden ruter til: rekonsilieringsintervaller, CRD-defaults, versjonsnumre, hostnames, image-stier, namespace-mønstre. Når en kildefil endres, skal alle avledede påstander i **hele** skillen re-verifiseres — ikke bare målfilene fra routing-tabellen. Konkret: identifiser nøkkelverdiene som endret seg, og søk etter forekomster av dem i alle skybert/-filer. Se konsekvenssjekken i [github-modus.md](github-modus.md). Treff på samme nøkkelverdi i flere filer er samtidig en duplikatindikasjon: rett verdien i kanonisk fil og erstatt øvrige forekomster med kryssreferanse (`OMSTRUKTURER`), ikke `KORRIGER` i hver fil.

## Re-validering ved FULL

Ved FULL modus skal alle påstander merket **Operasjonell antakelse** vurderes på nytt mot kildene:
- Dekker kildene nå temaet og bekrefter påstanden → oppgrader til dokumentert fakta med kildereferanse.
- Motsier kildene påstanden → `KORRIGER`/`FJERN` med evidens.
- Er antakelsen generisk eller duplisert → `FJERN` (`generisk`/`duplikat`) uavhengig av om den er korrekt.
- Fortsatt udekket i kildene → behold, men bekreft i seksjonen «Operasjonelle antakelser» i UPDATE-PLAN.md at den fremdeles er korrekt og Skybert-spesifikk.
- Umerkede avsnitt uten `> Kilde:` behandles som Operasjonell antakelse-kandidater: de skal enten få kilde, få merke, eller fjernes — ingen kildeløse avsnitt skal overleve en FULL umerket.

## Bevaringsregler (betinget)

1. Erfaringskunnskap (plattformteam, Slack, egen drift) beholdes når den er korrekt, Skybert-spesifikk og merket Operasjonell antakelse. Ellers `FJERN` (`ustøttet`).
2. Legacy-seksjoner (WebApp, CSI) beholdes i `legacy-webapp-csi.md` som kanonisk fil, med status beskrevet slik kildene faktisk sier det (WebApp: udokumentert, ikke deprecated; CSI/SecretProviderClass: deprecated per RBAC-kommentar). Andre filer nevner status i maks én setning med lenke.
3. Kluster-navn, subscription IDs, tekniske verdier — kun oppdater ved ny verdi, aldri slett — og kun i kanonisk fil; klustertabellen skal ikke gjentas.
4. Feilsøkingsoppføringer beholdes når de er Skybert-spesifikke (Kyverno-avvisning, Flux-latens, proxy-oppsett) og merket. Generiske K8s/Azure-feil (ImagePullBackOff-mekanikk, AADSTS-koder, CRD-pruning) → `FJERN` (`generisk`).
5. Ved `OMSTRUKTURER`: alle detaljer fra opprinnelig plassering MÅ finnes i ny plassering.

## Merking av interne temaer

Innhold fra `docs/internal/` eller infra-operasjonelle kilder som kun er relevant for plattformteamet skal merkes eksplisitt som intern i skillen. Ikke bland intern plattformdrift-informasjon umerket inn i generell sluttbrukerveiledning. Bruk tydelig markering (f.eks. overskrift eller advarselsboks). Én merking per seksjon (i overskriften eller én innledende linje), ikke gjentatte advarselsbokser per avsnitt.

## Informasjonstypemerking

Merk tydelig forskjell mellom disse tre typene:

| Type | Beskrivelse | Eksempel |
|------|-------------|---------|
| **Dokumentert fakta** | Eksplisitt beskrevet i docs- eller infra-repo | CRD-felt, onboarding-steg |
| **Utledet mønster** | Observert fra kode/konfigurasjon, ikke eksplisitt dokumentert | Bootstrap-rekkefølge utledet fra scripts |
| **Operasjonell antakelse** | Lokal/erfaringsbasert kunnskap uten kilde i repoene | Feilsøkingstips fra plattformteam |

I UPDATE-PLAN.md merkes alle tre typene. I skillfilene gjelder: *Dokumentert fakta* og *Utledet mønster* får `> Kilde:` (utledet mønster lenker til infra-stien mønsteret er lest ut fra; ordet «utledet» skrives ikke i brødteksten). *Operasjonell antakelse* er den eneste typen som merkes i skillteksten, med den faste formen `> **Operasjonell antakelse:** <én setning om hvorfor den er Skybert-spesifikk>` i stedet for `> Kilde:`-linjen. Et avsnitt har enten Kilde eller Operasjonell antakelse, aldri ingen av delene.

## Kildehenvisningsformat

Definert ett sted: se «Kildereferanse-format» i [implementeringsregler.md](implementeringsregler.md).
