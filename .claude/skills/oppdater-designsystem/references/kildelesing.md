# Steg 3 – Les eksisterende skill og kildekode fra taggen

## 3.0 Les eksisterende designsystem-skill

Les alle **markdown-filer** i `designsystem/`-mappen i dette repoet — ikke bare `SKILL.md`,
men også alle referansefiler under `references/`, `references/components/` og `versions/` —
samt `.oppdater-state.json`. Hovedfilen alene er aldri nok til å anse skillen som oppdatert;
referansefilene inneholder den faktiske dybden.

**Unntak — `versions/sources/`:** Enumerer innholdet (hvilke versjoner og artefakter som
er arkivert), men **ikke les** arkivartefaktene (`custom-elements.json`, `web-types.json`
osv. — de er store). Les dem kun målrettet når du verifiserer en konkret påstand eller
lager kilde-diff mot forrige versjon (sjekkliste-punkt 10 i
[endringsplan.md](endringsplan.md)).

> Merk: Stien `designsystem/SKILL.md` er relativ til **repo-roten** (`Fhi.AgentSkills/`), ikke til skill-mappen.

Notér underveis:

1. **Komponentlisten:** hvilke komponenter som er dokumentert i
   `designsystem/references/components/` (filnavnene uten `.md`-ending, eller
   komponentnavnene i konsoliderte filer som `typography.md`). Denne listen brukes
   nedenfor til å finne alle TypeScript- og `.docs.mdx`-filer som skal leses.
2. **Stale-referanser:** hvilke filer under `designsystem/` som inneholder eksplisitte
   latest-referanser (versjonsnumre, pakkenavn med versjon, eller vedlikeholdsnotater
   som sier "basert på latest"). Denne listen brukes i den samlede stale-sjekken
   (se [versjonsinfrastruktur.md](versjonsinfrastruktur.md)).

## 3.1 Verifiser npm-pakkenavn

Pakkenavnet kommer fra `designsystem/.oppdater-state.json` (via `check-version.mjs`).
Hvis state-filen mangler eller pakkenavnet virker feil, hent rot-`package.json` fra:

```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/package.json
```

> ⚠️ Hent alltid denne filen fra `main`-branchen, **ikke** fra taggen. Rot-`package.json` finnes ikke nødvendigvis på alle git-tagger.

**Hvis rot-`package.json` ser ut som en monorepo-rot** (f.eks. `"name"` er uten `@`-scope,
eller er ukjent), gjør følgende:

1. Les `pnpm-workspace.yaml` for å identifisere workspace-mapper:
   ```
   https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/main/pnpm-workspace.yaml
   ```
2. Bla i mappestrukturen under `packages/` ved å hente GitHub tree-URL for taggen:
   ```
   https://github.com/FHIDev/Fhi.Designsystem/tree/v{versjon}/packages
   ```
   Identifiser faktisk mappenavn. Les deretter `package.json` fra den mappen (ikke gjett på mappenavn).

## 3.2 Les fra taggen — aldri fra main

> ⚠️ **Kritisk regel:** Les **alltid** kildekode fra den identifiserte git-taggen – **aldri** fra `main`-branchen eller HEAD. Nyere commits kan inneholde upubliserte endringer og er ikke autoritative.

URL-format for å lese filer direkte fra taggen:

```
https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/v{versjon}/{filsti}
```

## 3.3 Triager før du leser dypere

Før du begynner å lese komponentfiler i detalj, bygg et **bredt men billig** bilde av hva som
faktisk er endret:

1. Les publisert `package.json`
2. Les `CHANGELOG.md`
3. List filene i publisert npm-pakke (`npm pack <pakkenavn>@<versjon> --dry-run --json`,
   eller bruk `scripts/fetch-sources.mjs` som samtidig arkiverer artefaktene)
4. Les `custom-elements.json` og/eller `web-types.json` hvis de finnes i den publiserte pakken
5. Les GitHub compare mellom forrige latest og ny latest hvis forrige latest er kjent

Bruk deretter denne regelen:

- **Fast track:** Hvis changelog + compare + publiserte manifests viser at releasen er
  intern/docs-drevet og det ikke er tydelige public API-endringer, kan du lese bare de
  berørte komponentene i detalj i stedet for alle. Du må likevel verifisere hele public API-flaten
  via publiserte manifests/tarball-filene først.
- **Målrettet lesing:** Hvis diffen peker på bestemte komponenter, tokens, entrypoints eller
  rammeverksguider, les disse i detalj.
- **Full gjennomgang:** Hvis changelog er uklar, compare er støyete, manifests mangler, eller
  repoet er omstrukturert på en måte som gjør triagen usikker, fall tilbake til full komponent-
  gjennomgang.

> **Viktig:** Changelog alene er ikke nok til å konkludere at ingenting brukerrettet er endret.
> Bruk changelog som hint, ikke som eneste kilde. **Minimumsnivå per versjon (også
> mellomliggende minors ved multi-hopp) er manifest-/tarball-diff** — aldri changelog alene.

## 3.4 Hvilke filer å lese

### Alltid les — obligatorisk

Disse hentes alltid, for **alle** versjoner og scenarier:

| Filtype | Formål | Sti (relativ til pakke-undermappen) |
|---------|--------|--------------------------------------|
| `package.json` | Pakkenavn, versjon, peerDependencies, exports | `package.json` |
| `CHANGELOG.md` | Endringer mellom versjoner | `CHANGELOG.md` |
| Publisert tarball-filiste | Fasit for eksporterte filer, entrypoints, `theme/default.css`, ikoner og manifests | `npm pack <pakkenavn>@<versjon> --dry-run --json` |
| `custom-elements.json` og/eller `web-types.json` | Primærkilde for public komponenter, tag-navn, attributter, events, metoder og slots hvis filene finnes i pakken | `custom-elements.json`, `web-types.json` |
| `ai-tooling/SKILL.md` (hvis den finnes i pakken, fra v0.36.0) | Upstreams egen agent-skill — leses som **kildeinput** for å avdekke hull eller nye anbefalinger. Skal **aldri** automatisk overskrive lokal kuratert kunnskap; avvik tas inn i endringsplanen som vurderingspunkter | `ai-tooling/SKILL.md` |
| GitHub compare | Triager hvilke komponenter og docs-områder som faktisk er endret siden forrige latest | `compare/v{gammel}...v{ny}` |
| `src/storybook/get_started/*.mdx` | Rammeverk-integrasjonsguider (React, Angular, Blazor, osv.) | `src/storybook/get_started/` |
| `src/theme/default.css` (eller tilsvarende token-fil) | Fasit for **alle** design token-verdier: primitive fargepaletter, semantisk→primitiv mapping, typografi, spacing, border, motion og opacity. Denne filen er primærkilden for token-innhold i skillen. **NB:** Filen er stor og kan trunkeres ved WebFetch — se [feilhandtering.md](feilhandtering.md). | `src/theme/default.css` |
| Design token MDX-filer i `src/storybook/design-tokens/` | Konseptuell dokumentasjon av token-systemet (f.eks. to-lags-modellen primitiv→semantisk, beskrivelser av roller og sub-grupper). Inneholder også ofte lenker til eksterne ressurser. | `src/storybook/design-tokens/` |

**Komponentlisten** fra 3.0 brukes til å slå opp hvilke public komponenter skillen
allerede dokumenterer. For disse komponentene gjelder:

- Les **TypeScript-kildefil** for alle **berørte** komponenter, eller for alle komponenter hvis
  triagen er usikker. TypeScript er viktig for runtime-logikk som ikke alltid fremgår av
  manifests alene, f.eks. effective defaults, normalisering av ugyldige verdier,
  advarsler, validering i `update`/`updated`, og imperative metoder.
- Les **`.docs.mdx` eller annen relevant docs-fil** for alle **berørte** komponenter, eller for
  alle komponentgrupper hvis docs er konsolidert. Docs-filer er viktige for variant-semantikk,
  bruksscenarier, retningslinjer, tilgjengelighetskrav og kjente begrensninger.

> **Merk:** TypeScript-kildefiler og `.docs.mdx`-filer utfyller hverandre.
> TypeScript gir deg det autoritative API-et; `.docs.mdx` gir deg semantikken og kjente
> fallgruver. Begge er nødvendige — ingen av dem kan erstattes av den andre.

> **Merk:** Filstier i FHI Designsystem-repoet er **heuristikker, ikke kontrakter**.
> Komponenter kan flyttes til undermapper (f.eks. `typography/`), og docs kan være
> konsolidert i én fil for en hel komponentgruppe. Finn alltid faktisk sti ved å lese
> mappestrukturen i taggen og ved å bruke manifests/tarballen som kompass.

> **Merk:** Hvis den publiserte pakken inneholder nye maskinlesbare artefakter eller andre
> docs-kilder som ikke er nevnt eksplisitt her (f.eks. nye manifests, schemas eller genererte
> docs-filer), skal de vurderes som relevante kilder i stedet for å ignoreres fordi de ikke
> passer dagens filnavnsmønster.

### Eksterne lenker og ressurser

MDX-filer kan inneholde lenker til eksterne ressurser som Figma-bibliotek, gamle docs-sider
eller andre verktøy. Typiske plasseringer (per v0.33.0, kan endre seg):

- `src/storybook/overview.mdx` — prosjektoversikt, ofte med Figma-lenke, GitHub-lenke, Teams-kanal
- `src/storybook/design-tokens/introduction.mdx` — konseptuell docs for token-systemet
- `src/storybook/design-tokens/design-tokens-*.mdx` — per-kategori token-docs

> **Merk:** Disse stiene er heuristikker. Repoet har endret mappenavn tidligere
> (f.eks. pakke-mappen het `designsystem` men heter nå `fhi-designsystem`).
> Les alltid mappestrukturen fra taggen først for å verifisere faktiske stier.

Når du finner eksterne lenker:
1. Notér URL og kontekst (hvilken MDX-fil, hva lenken beskrives som)
2. Vurder om lenken bør inkluderes i designsystem-skillen (f.eks. som referanse for brukere)
3. Hvis lenken peker til innhold som utfyller kildekoden (f.eks. Figma med visuelle eksempler),
   nevn det i endringsplanen

### Les om innholdet finnes — skjønnsbasert

| Filtype | Formål |
|---------|--------|
| `README.md` og andre `.md`-filer | Installasjon, oppsett, overordnet dokumentasjon |
| Storybook-stories (`.stories.ts` / `.stories.js`) | Brukseksempler og komponentvarianter — nyttig for å oppdage nye story-scenarier som bør dokumenteres |
| Andre `.mdx`-filer i `src/storybook/` | Tilgjengelighets-guider, FAQ, typografi-guider — les hvis disse endres mellom versjoner |

Start med å hente GitHub tree-URL for taggen for å se mappestrukturen, slik at du
finner riktige filstier:
```
https://github.com/FHIDev/Fhi.Designsystem/tree/v{versjon}/packages/{pakke-mappenavn}/src
```
