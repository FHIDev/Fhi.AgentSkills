# Analyseregler for endringer

## Endringskategorier

| Kategori | Definisjon |
|----------|-----------|
| `NY` | Helt nytt innhold som ikke finnes i noen skybert-fil. Flagg `ny-fil` hvis en helt ny referansefil foreslås. |
| `UTVID` | Eksisterende seksjon bør utvides med mer informasjon fra kildene. |
| `KORRIGER` | Faktisk feil innhold — krever positiv evidens fra kildene. |
| `OMSTRUKTURER` | Samme informasjon bør flyttes, slås sammen eller splittes for bedre struktur — uten å tape detaljer. |
| `FORBEDRING` | Bedre eksempler, presisering eller konsolidering som forbedrer klarhet. |
| `FJERN` | Innhold der kilder positivt viser at det er feil/deprecated/erstattet. Krever eksplisitt evidens. |
| `VURDER` | Mulig endring som krever menneskelig vurdering (uklar mapping, tolkning usikker, konflikt mellom kilder). |

`OK` (korrekt og komplett) inkluderes ikke i planen.

---

## Flagg

- `crd-versjon` — CRD API-versjon har endret seg (tillegg til `KORRIGER` eller `UTVID`)
- `ny-fil` — En helt ny referansefil foreslås (tillegg til `NY`)

---

## Terskler

- **`FORBEDRING`** kun ved vesentlig bedre/mer korrekt formulering — ikke stilistiske preferanser.
- **`FJERN`** KUN med positiv evidens: eksplisitt "deprecated", "fjernet", "bruk X i stedet", fjernet fra XRD-spec.
- **Fravær i kildene er ALDRI grunn til `FJERN`** — bruk `VURDER` i stedet.
- **`KORRIGER`** krever at eksisterende innhold er beviselig feil basert på kildene.
- **`UTVID`** brukes når eksisterende innhold er korrekt men ufullstendig.
- **`OMSTRUKTURER`** krever at alle detaljer bevares i ny plassering.
- **WIP/placeholder-sider** → `VURDER` med begrunnelse, aldri brukt til å fjerne eksisterende innhold.
- **Innhold uten `> Kilde:`-referanse** antas manuelt kuratert — ekstra forsiktighet.

---

## Krav til `VURDER`-poster (ingen sovepute)

`VURDER` er et beslutningspunkt, ikke en måte å skyve problemet foran seg. Hver post MÅ inneholde:

1. **Konkret beslutningsspørsmål** — formulert slik at brukeren kan svare ja/nei eller velge mellom navngitte alternativer.
2. **Anbefaling med begrunnelse** — agentens beste forslag, ikke bare «usikkert».
3. **Konsekvens av å utsette** — hva forblir feil/udekket i skillen hvis posten ikke avklares nå.

## Persistens av uferdige poster (`openItems`)

Ingen endringspost skal kunne forsvinne stille mellom kjøringer. Alle poster som ikke når
fullført tilstand lagres i `openItems` i `skybert/.oppdater-state.json` (schema: se
State-kontrakt i SKILL.md) med en av tre statusverdier:

| Status | Betyr |
|--------|-------|
| `deferred` | Brukeren utsatte/avviste posten ikke-endelig i steg 7 (inkl. uavklarte `VURDER`) |
| `partial` | Posten ble godkjent, men bare delvis implementert i steg 8 |
| `failed-verification` | Posten ble implementert, men et kontrollpunkt i steg 8/9 slo feil |

Livssyklus:
- Poster skrives til `openItems` i steg 9 med `id`, `status`, `category`, `target`,
  `source`, `summary`, `firstSeen`, `lastSeen`.
- Ved neste kjøring (uansett modus) tas alle åpne poster inn i planen på nytt, med
  `firstSeen` synlig — en post som har stått åpen over flere kjøringer fremheves øverst i
  planen. `lastSeen` oppdateres.
- En post fjernes først når den er avklart (brukerbeslutning tatt) eller fullført
  implementert og verifisert.
- Endelig avvisning fra brukeren («dropp denne permanent») fjerner posten — noter
  beslutningen i planen, ikke i state.

---

## Presisjon i påstander og endringsposter

- **Skill mellom lag:** hva som *håndheves av policy* (Kyverno mutating/validating), hva som er *RBAC-konsekvens* (hva tenant-roller faktisk tillater), og hva som er *anbefalt brukeratferd* (veiledning i docs). Ikke generaliser på tvers — «kan ikke» (håndhevet) og «skal ikke» (anbefalt) er forskjellige påstander, og kilden avgjør hvilken som er riktig.
- **Siter ordrett:** «Nåværende tekst» i en endringspost skal være ordrett sitat fra skillfilen — aldri parafrase. «Foreslått tekst» skal være den eksakte erstatningsteksten, klar til innsetting.
- **Én påstand, én kilde:** når en setning kombinerer fakta fra flere lag/kilder, splitt den i planen slik at hver del kan vurderes mot riktig kilde.

---

## Hva hører hjemme i SKILL.md vs. references/

- `SKILL.md` skal dekke: onboarding-konsepter, tenant-modell, overordnede prinsipper, kritiske regler, miljøoversikt, Blåløypa.
- `references/`-filene skal dekke: tekniske detaljer, CRD-spec, kommandoeksempler, konfigurasjonssyntaks.

---

## Konfliktløsning (Docs vs Infra)

Kildeautoritet, konfliktregler og domeneeksempler er definert ett sted:
se «Kildeautoritet og konfliktregel» i [hovedprinsipper.md](hovedprinsipper.md).
Kortversjon: Infra vinner for normative tekniske forhold, Docs for konsept/veiledning;
uoppløselig konflikt → `VURDER` med begge kilder sitert.

---

## Regler for dekningsgrad (matrise A, begge moduser)

- `Delvis` er ugyldig uten konkret innhold i «Hva mangler»-kolonnen — det skal stå *hvilke*
  opplysninger fra siden som ikke er representert, ikke bare at noe mangler. Hver mangel
  skal ha en tilhørende endringspost (eller eksplisitt begrunnelse for hvorfor den droppes).
- `Komplett` for normative sider (CRD-referanser, policy-oversikter) krever felt-/regel-
  nivå-verifikasjon — ikke bare at temaet er omtalt.

---

## Anonymisering / sikkerhetsfiltreringsregler

| Kategori | Handling |
|----------|----------|
| **ALDRI inkluder** | Credentials, tokens, connection strings, passord |
| **ALDRI inkluder** | Spesifikke IP-adresser for interne systemer |
| **ALDRI inkluder** | Azure tenant IDs, subscription IDs som ikke allerede er i skillen |
| **ALDRI inkluder** | Service principal secrets eller certificate thumbprints |
| **VURDER** | Interne hostnavn, DNS-oppføringer, ACR-URLer |
| **OK** | Arkitekturmønstre, navnekonvensjoner, CRD-skjemaer, arbeidsflyter |

Azure Subscription IDs og kluster-IP-ranges anonymiseres med plassholdere (`<subscription-id>`, `<ip-range>`) med mindre de allerede er i eksisterende skillfiler. Tenant-navn fra `tenants/`-mappen brukes som eksempler.
