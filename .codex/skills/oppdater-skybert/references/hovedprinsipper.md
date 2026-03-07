# Hovedprinsipper for oppdatering av Skybert-skillen

## 10 hovedregler

1. **Legg til og utvid** — hovedfokus er å berike skillen med maks detaljer.
2. **Aldri slett uten positiv evidens** — kun direkte feil, deprecated eller erstattet innhold fjernes, med kildehenvisning. Fravær i repoene er aldri nok.
3. **Skillen inneholder mer enn repoene** — den har kunnskap fra plattformteam, Slack, erfaring. Aldri fjern noe bare fordi det mangler i kildene.
4. **All docs-info må dekkes** — hver docs-side må spores til minst ett sted i skillen via obligatorisk dekningsmatrise.
5. **Maks detaljer, minimalt tap** — når innhold komprimeres, flyttes eller konsolideres, skal alle operative detaljer fortsatt være representert. Ingen detaljer tapes ved restrukturering.
6. **Strukturforbedring OK** — omorganisering, nye sider, sammenslåing tillatt — men aldri på bekostning av detaljnivå.
7. **Full gjennomgang** — komplett gjennomgang av hele skillen mot begge kilder.
8. **Kuratert uttrekk, ikke rå dump** — oppsummer og generaliser mønstre, ikke lim inn store YAML-blokker.
9. **Oppdage det ukjente** — vær aktivt åpen for nye mapper, filtyper og dokumentasjonsformer i kilderepoene. Ikke begrens deg til forhåndsdefinerte stier.
10. **Skill mellom faktatyper** — merk tydelig forskjell mellom informasjonstypene (se nedenfor).

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

## Eksplisitte ikke-slett-regler

1. Informasjon fra andre kilder (plattformteam, Slack, erfaring) — aldri slett.
2. Informasjon som mangler i begge repoer men er korrekt — aldri slett.
3. Legacy/deprecated-seksjoner (WebApp, CSI) — behold med mindre kildene eksplisitt sier fjernet/erstattet.
4. Kluster-navn, subscription IDs, tekniske verdier — kun oppdater ved ny verdi, aldri slett.
5. Feilsøkingsoppføringer basert på erfaring — aldri slett med mindre bevist feil.
6. Ved `OMSTRUKTURER`: alle detaljer fra opprinnelig plassering MÅ finnes i ny plassering.

## Merking av interne temaer

Innhold fra `docs/internal/` eller infra-operasjonelle kilder som kun er relevant for plattformteamet skal merkes eksplisitt som intern i skillen. Ikke bland intern plattformdrift-informasjon umerket inn i generell sluttbrukerveiledning. Bruk tydelig markering (f.eks. overskrift eller advarselsboks).

## Informasjonstypemerking

Merk tydelig forskjell mellom disse tre typene i UPDATE-PLAN.md og i skillfiler der det er relevant:

| Type | Beskrivelse | Eksempel |
|------|-------------|---------|
| **Dokumentert fakta** | Eksplisitt beskrevet i docs- eller infra-repo | CRD-felt, onboarding-steg |
| **Utledet mønster** | Observert fra kode/konfigurasjon, ikke eksplisitt dokumentert | Bootstrap-rekkefølge utledet fra scripts |
| **Operasjonell antakelse** | Lokal/erfaringsbasert kunnskap uten kilde i repoene | Feilsøkingstips fra plattformteam |

## Kildehenvisningsformat (differensiert per type)

- **Docs-basert innhold:** `> Kilde: https://docs.sky.fhi.no/<sti>/`
- **Infra-basert innhold:** `> Kilde: FHISkybert/Fhi.Skybert.Infra/<filbane>`
- **Kombinert innhold:** Oppgi begge kilder.
- **Innhold uten kilde i repoene:** Ingen ny kilde-referanse — behold eksisterende referanser.
