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

## Hva hører hjemme i SKILL.md vs. references/

- `SKILL.md` skal dekke: onboarding-konsepter, tenant-modell, overordnede prinsipper, kritiske regler, miljøoversikt, Blåløypa.
- `references/`-filene skal dekke: tekniske detaljer, CRD-spec, kommandoeksempler, konfigurasjonssyntaks.

---

## Konfliktløsning (Docs vs Infra)

- **Normative tekniske forhold** (CRD-felter, defaults, security contexts, policier): Infra vinner.
- **Konsept/veiledning/onboarding**: Docs supplerer.
- **Uoppløselig konflikt**: `VURDER` med begge kilder sitert.

**Domeneeksempler:**
| Emne | Autoritativ kilde |
|------|-------------------|
| CRD-feltdefinisjoner, defaults, security contexts | Infra |
| Kyverno-policier og deres effekt | Infra |
| Onboarding-veiledning, Blåløypa-steg | Docs |
| Konseptforklaring av tenant-modellen | Docs |
| Faktisk tenant-bootstrap-logikk | Infra |
| Arbeidsflyt-anbefalinger (CI/CD) | Docs |

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
