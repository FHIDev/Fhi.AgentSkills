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

1. Slå opp versjon i [`versions/INDEX.md`](INDEX.md)
2. Les SKILL.md (latest) som baseline
3. Les tilhørende delta-fil
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
| `0.30.2` | `v0.30.x.md` |
| `^0.30.0` | `v0.30.x.md` |
| `0.30` | `v0.30.x.md` |
| `~0.28.3` | `v0.28.x.md` |

Match alltid på minor-versjon. Patch-versjoner dokumenteres i delta-filen under "Patch notes med API-impact" kun hvis de har API-atferdsendringer.

---

## Kumulativ delta-modell

Delta-filer dokumenterer **eksplisitte avvik**: en delta som er "skrevet mot v0.31.0" er like gyldig når latest er v0.32.0,
fordi eksplisitt dokumenterte avvik (f.eks. "fhi-modal-dialog mangler i v0.28.x") forblir gyldige frem til den eldre
versjonen oppgraderes — uavhengig av ny latest.

**Viktig begrensning:** Delta-filer fanger **ikke** automatisk opp nye public komponenter lagt til i later latest-versjoner.
Hvis v0.32.0 legger til `fhi-wizard`, vil eldre delta-filer ikke nevne at den mangler i v0.28.x — og
verifiseringsstatus for slike nye tillegg er ukjent med mindre det er eksplisitt dokumentert.

**Konsekvens for oppdateringsworkflow:** Når en ny latest-versjon publiseres, opprettes **kun én ny delta-fil**
for forrige latest-versjon. Eksisterende delta-filer for eldre støttede versjoner trenger **ikke** å regenereres —
**unntatt** hvis ny latest har lagt til nye public komponenter: disse skal da noteres eksplisitt som "Missing"
i alle eksisterende delta-filer som ikke allerede nevner dem.

---

## Hvordan bruke delta-filer

1. Les SKILL.md som baseline
2. Les delta-filen for aktuell versjon
3. Der delta sier noe annet enn SKILL.md → **delta vinner**
4. Der delta er stille → SKILL.md gjelder

> ⚠️ **Presisering til regel 4:** Gjelder kun for features som fantes i SKILL.md da delta ble skrevet.
> For nye komponenter/features lagt til latest **etter** at delta ble skrevet: verifiseringsstatus er ukjent.

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
