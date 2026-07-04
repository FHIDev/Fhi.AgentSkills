---
name: oppdater-designsystem
description: Oppdaterer designsystem-skillen i dette repoet basert på siste publiserte versjon av FHI Designsystem. Bruk denne skillen når designsystem-skillen skal synkroniseres med ny kildekode, eller når du mistenker at skillen er utdatert eller mangelfull.
---

# Oppdater Designsystem-skillen

Arbeidsflyt for å holde `designsystem/`-skillen i dette repoet oppdatert og korrekt i
henhold til siste **publiserte** versjon av FHI Designsystem.

```
Fhi.AgentSkills (dette repoet)
└── designsystem/          ← skillen som skal oppdateres
    ├── SKILL.md
    ├── .oppdater-state.json   ← maskinlesbar state (autoritativ for scripting)
    ├── references/
    └── versions/          (INDEX.md, GUIDE.md, FEATURES.md, delta-filer, sources/)

Kilder:
├── github.com/FHIDev/Fhi.Designsystem  (leses kun fra publisert git-tag)
└── npm / publisert tarball for `@folkehelseinstituttet/designsystem`
```

> **Kildehierarki:**
>
> 1. **Publisert npm-pakke / tarball er fasit** for public API, entrypoints, `theme/`-filer,
>    `custom-elements.json`, `web-types.json`, ikoner og andre eksporterte artefakter.
> 2. **Git-taggen er fasit** for lesbar kildekode, changelog og Storybook-/MDX-dokumentasjon
>    som forklarer semantikk, bruksscenarier og kjente begrensninger.
> 3. **Intern repo-struktur er ikke public API.** Interne flyttinger eller omorganiseringer
>    skal ikke dokumenteres som breaking changes med mindre den publiserte pakken faktisk
>    endrer exports, entrypoints, token-navn eller annen brukerrettet kontrakt.

---

## Steg 1 – Versjonssjekk (fast path)

Kjør versjonssjekk-scriptet fra repo-roten:

```bash
node .claude/skills/oppdater-designsystem/scripts/check-version.mjs
```

Scriptet leser gjeldende versjon fra `designsystem/.oppdater-state.json` (fallback:
`<!-- Basert på ... -->`-kommentaren i `designsystem/SKILL.md`), slår opp siste
publiserte versjon i npm-registeret, lister mellomliggende minor-versjoner
(pre-releases filtrert bort, høyeste patch per minor) og verifiserer git-taggen.
Output er JSON. Hvis scriptet feiler, se [Feilhåndtering](references/feilhandtering.md)
for manuell fremgangsmåte.

## Steg 2 – Beslutning

> Hvis `upToDate: true` og brukeren **ikke** har bedt om full gjennomgang:
> → skillen er allerede basert på siste publiserte versjon.
> **Stopp her.** Informer bruker om at skillen er à jour og ikke trenger oppdatering.
> Ikke les kildekode, ikke lag endringsplan, ikke gjør endringer.
>
> Hvis `upToDate: true` men brukeren **eksplisitt** ber om gjennomgang av innhold
> (f.eks. "verifiser innholdet", "sjekk om alt er riktig", "gjennomgå kildekoden"):
> → følg full flyt nedenfor, men hopp over versjonsinfrastrukturen (steg 6–7).

Kun hvis versjonene er **forskjellige** → følg hele flyten nedenfor.

## Full oppdateringsflyt

Les referansefilene i denne rekkefølgen, hver når du kommer til steget:

| Steg | Innhold | Referansefil |
|------|---------|--------------|
| 3 | Les eksisterende skill + kildekode fra taggen (triage, fillister) | [kildelesing.md](references/kildelesing.md) |
| 4–5 | Analyser, lag endringsplan, gjennomfør endringer | [endringsplan.md](references/endringsplan.md) |
| 6–7 | Versjonsinfrastruktur: FEATURES.md, delta-filer, INDEX, state-fil, stale-sjekk | [versjonsinfrastruktur.md](references/versjonsinfrastruktur.md) |
| 8–9 | Contract checks, kvalitetskontrakt, evals | [kontraktsjekker.md](references/kontraktsjekker.md) |
| — | Feilhåndtering (oppslag ved behov) | [feilhandtering.md](references/feilhandtering.md) |

**Endringsplanen (steg 4) skal godkjennes av bruker før steg 5 gjennomføres.**

## Absolutte regler (gjelder hele flyten)

- **Endre kun det som faktisk er feil, mangler eller er utdatert.** Behold korrekt
  tekst uendret; stilistiske preferanser er ikke endringsgrunnlag. Full kontrakt i
  [endringsplan.md](references/endringsplan.md).
- **Les kildekode fra git-taggen, aldri fra `main`/HEAD.**
- **Ikke kast informasjon** når upstream flytter eller konsoliderer filer.
- **Ikke slett historiske delta-filer** — de fjernes kun fra `versions/INDEX.md`.

## Synkronisering `.claude` ↔ `.agents`

`.claude/skills` er kanonisk kilde; `.agents/skills` er en kompatibilitetskopi som
holdes identisk. Etter alle endringer under `.claude/skills/`, kjør det delte
sync-scriptet fra repo-roten (speiler hele treet og verifiserer):

```bash
bash .claude/skills/oppdater-skybert/scripts/sync-agents.sh
```

CI-workflowen `.github/workflows/skills-sync-check.yml` feiler PR-en hvis trærne
divergerer; `contract-check.mjs` kjører samme sjekk lokalt.
