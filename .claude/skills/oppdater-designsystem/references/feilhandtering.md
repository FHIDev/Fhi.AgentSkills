# Feilhåndtering

| Problem | Håndtering |
|---|---|
| `check-version.mjs` feiler | Manuell fremgangsmåte: (1) Les versjon fra `designsystem/.oppdater-state.json` eller `<!-- Basert på ... -->` i `designsystem/SKILL.md`. (2) Slå opp latest: `npm view {pakkenavn} version` eller `https://registry.npmjs.org/{pakkenavn}/latest`. (3) Mellomliggende minors: `npm view {pakkenavn} versions --json`, filtrer bort pre-releases, finn høyeste patch per minor mellom forrige og ny latest (begge ekskl.). |
| Git-tag ikke funnet | Sjekk releases-siden (`https://github.com/FHIDev/Fhi.Designsystem/releases`) og prøv varianter som `{versjon}` uten `v`-prefiks |
| npm-registeret returnerer ingen `latest` | Prøv `https://registry.npmjs.org/{pakkenavn}` og les `dist-tags.latest` |
| npm-register-respons trunkeres | Bruk `npm view {pakkenavn} version` og `npm view {pakkenavn} versions --json` i terminalen i stedet for å gjette |
| Fil ikke funnet på taggen | Sjekk mappestrukturen i repoet for å finne riktig filsti |
| Filsti-mønsteret stemmer ikke | Anta ikke at `src/components/{komponent}/...` fortsatt gjelder. Les tree-strukturen, manifests og tarballen først; docs kan være flyttet eller konsolidert |
| `index.js` / forventet exports-sti mangler | Les `package.json` `exports` hvis tilgjengelig, ellers verifiser entrypoints via publisert tarball-filiste |
| Kildekoden er uleselig / minifisert | Let etter `.ts`-kildefiler i `src/`-mappen fremfor kompilerte filer |
| Delta-fil for forrige latest er uklar | Bruk "verifisering kreves"-markering for usikre seksjoner |
| `default.css` trunkeres ved WebFetch | Filen er stor og WebFetch kan kutte innholdet. Bruk terminal i stedet: `curl -sL https://raw.githubusercontent.com/FHIDev/Fhi.Designsystem/v{versjon}/{sti}/src/theme/default.css` og pipe gjennom `grep` for å hente spesifikke seksjoner (f.eks. `grep "^--fhi-" | head -20` for primitive tokens). Alternativt installer pakken lokalt: `npm pack <pakkenavn>@<versjon>` og les filen fra utpakket tarball. |
| `fetch-sources.mjs` feiler (nedlasting/utpakking) | Kjør `npm pack {pakkenavn}@{versjon}` manuelt i en temp-mappe, pakk ut med `tar -xzf`, og kopier `package.json`, `custom-elements.json` (m.fl.) til `designsystem/versions/sources/v{versjon}/`. Skriv `tarball-files.txt` fra `npm pack --dry-run --json`. Oppdater `designsystem/.oppdater-state.json` manuelt (feltene: `package`, `version`, `gitTag`, `tarballUrl`, `distIntegrity`, `verifiedDate`, `archivedArtifacts`). |
| `contract-check.mjs --online` feiler | Kjør de manuelle kommandoene i [kontraktsjekker.md](kontraktsjekker.md) og sammenlign for hånd |
