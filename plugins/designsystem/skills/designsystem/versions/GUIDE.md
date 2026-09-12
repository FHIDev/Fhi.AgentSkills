# Versjonsguide — beslutningsflyt

## Identifiser versjon

1. Sjekk `package.json` → `dependencies["@folkehelseinstituttet/designsystem"]`
2. Alternativt: `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`
3. Hvis ukjent: spør eksplisitt

```bash
# Eller kjør:
npm ls @folkehelseinstituttet/designsystem
```

---

## Beslutningsflyt

### Ny app (ingen eksisterende versjon)

→ Bruk latest (SKILL.md uten delta)

### Eksisterende app — versjon oppgitt

0. **Fast path:** Hvis versjonen matcher latest (Latest-raden i INDEX.md /
   `<!-- Basert på ... -->` i SKILL.md) → bruk SKILL.md uten delta, med mindre
   spørsmålet gjelder migrering, eldre versjoner eller støttepolicy.
1. Slå opp versjon i [`versions/INDEX.md`](INDEX.md)
2. Les SKILL.md (latest) som baseline
3. Les [`FEATURES.md`](FEATURES.md) og tilhørende delta-fil
4. Overstyr/supplement SKILL.md med delta-informasjonen (delta vinner ved konflikt)
5. Gi svar basert på den sammensatte informasjonen

### Eksisterende app — versjon ikke oppgitt

→ Spør:

> "Hvilken versjon av `@folkehelseinstituttet/designsystem` bruker du?
> Sjekk `package.json` eller kjør: `npm ls @folkehelseinstituttet/designsystem`"

→ Ikke gi detaljert API-råd før versjon er bekreftet.

### Versjon utenfor support window (< eldste støttede versjon — se INDEX.md)

→ Best effort basert på eldste kjente delta
→ Legg alltid til:

> "Denne versjonen er utenfor støttevinduet. Anbefaler oppgradering til latest."

---

## Versjon-matching

| Input | Matcher |
|-------|---------|
| `0.39.2` | `v0.39.x.md` |
| `^0.31.0` | `v0.31.x.md` |
| `0.31` | `v0.31.x.md` |
| `~0.38.5` | `v0.38.x.md` |

Match alltid på minor-versjon. Patch-versjoner dokumenteres i delta-filen under "Patch notes med API-impact" kun hvis de har API-atferdsendringer.

---

## To kilder: FEATURES.md + delta-filer

Versjonsavvik dokumenteres i to komplementære kilder som **leses sammen**:

- [`FEATURES.md`](FEATURES.md) svarer på **«hva finnes ikke i din versjon?»** —
  én rad per public feature med innføringsversjon. Filtrer på `Introduced > din versjon`.
- **Delta-filen** for din versjon svarer på **«hva oppfører seg annerledes?»** —
  atferdsforskjeller, legacy-only, patch-notes og migreringstips.

**Merk dekningsgrensen i FEATURES.md** (deklarert øverst i filen): features innført
*før* grensen står i delta-filenes «Missing vs latest»-seksjoner, ikke i tabellen.
For eldre versjoner må derfor **begge** kilder konsulteres.

### Kumulativ delta-modell (for innhold før dekningsgrensen)

Delta-filer dokumenterer **eksplisitte avvik**: en delta som er "skrevet mot v0.31.0" er like gyldig når latest er v0.32.0,
fordi eksplisitt dokumenterte avvik (f.eks. "fhi-modal-dialog mangler i v0.28.x") forblir gyldige frem til den eldre
versjonen oppgraderes — uavhengig av ny latest.

**Konsekvens for oppdateringsworkflow:** Når en ny latest-versjon publiseres, opprettes
**én ny delta-fil** for forrige latest-versjon, og nye public features registreres som
rader i `FEATURES.md`. Eksisterende delta-filer regenereres eller backfylles **ikke**.
Delta-filer for versjoner utenfor støttevinduet beholdes på disk, men vedlikeholdes ikke.

---

## Hvordan bruke delta-filer

1. Les SKILL.md som baseline
2. Les [`FEATURES.md`](FEATURES.md) og filtrer på `Introduced > aktuell versjon`
3. Les delta-filen for aktuell versjon
4. Der delta sier noe annet enn SKILL.md → **delta vinner**
5. Der delta er stille → SKILL.md gjelder

Delta-filer lister kun seksjoner med reelle avvik. Områder som er kontrollert og
funnet uendret oppsummeres i én seksjon, «Verifisert uendret vs latest» — fravær av
en seksjon betyr altså *verifisert uendret* når området er nevnt der, og *ukjent*
ellers.

> ⚠️ **Presisering til regel 5:** Gjelder kun for features som fantes i SKILL.md da delta ble skrevet.
> For nye features lagt til latest **etter** at delta ble skrevet: slå opp i FEATURES.md
> (fra og med dekningsgrensen); før grensen er verifiseringsstatus ukjent med mindre
> delta-filen nevner det eksplisitt.

---

## Standard svarformat for versjonsspørsmål

Når brukeren er på eldre versjon, bruk dette mønsteret:

> **For {din-versjon}:** [svar tilpasset brukerens versjon]
>
> **I latest:** [svar for latest]
>
> **Oppgraderingsnotat:** [kort migreringstips hvis relevant]

---

## Kategorier for avvik (breaking vs notat)

**Breaking** (dokumenteres i delta):
- Endrede import-stier
- Fjernede eller renamede komponenter
- Endrede attributtnavn
- Token-endringer
- Endret event-oppførsel

**Notat** (trenger ikke egen delta-seksjon):
- Bugfixer uten API-kontrakt-endring
- Interne refaktoreringer

---

## Public vs internal komponenter

- **Public:** Eksportert entrypoint OG dokumentert i prosjektets docs/README ELLER listet som "supported component"
- **Internal/experimental:** Finnes i koden (`customElements.define`), men ikke dokumentert/eksportert/garantert semver-stabil
