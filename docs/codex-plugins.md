# Skills som Codex-plugins

Repoet publiserer Codex-plugins for `skybert` og `designsystem`. For å unngå ekstra kopier
av skillene **lenkes** innholdet via symlinks i stedet for å kopieres.

Kildene ligger her:

```text
skybert/
designsystem/
```

Codex-pluginene ligger her:

```text
plugins/codex/skybert-plugin/
plugins/codex/designsystem-plugin/
```

Codex marketplace ligger her:

```text
.agents/plugins/marketplace.json
```

## Struktur

```text
.agents/
  plugins/
    marketplace.json                  # Codex marketplace (source.path -> plugin-mappene)
plugins/
  codex/
    skybert-plugin/
      .codex-plugin/
        plugin.json                   # Codex plugin-manifest (skills: ./skills)
      skills/
        skybert  ->  ../../../../skybert           # SYMLINK til repo-rotens skybert/
    designsystem-plugin/
      .codex-plugin/
        plugin.json                   # Codex plugin-manifest (skills: ./skills)
      skills/
        designsystem  ->  ../../../../designsystem # SYMLINK til repo-rotens designsystem/
```

Codex krever skill-layoutet `skills/<navn>/SKILL.md`. I stedet for å kopiere skill-mappene
hit, er `skills/<navn>` en **symlink** til skill-mappa i repo-roten. Slik finnes innholdet
bare ett sted i repoet.

`source.path` i marketplace-fila løses relativt til **repo-roten**, ikke til
`.agents/plugins/`-mappa. Derfor er stiene `./plugins/codex/<plugin-navn>`.

## Versjonering

Codex-manifestene har et eksplisitt `version`-felt (i motsetning til Claude-pluginene, som
bruker commit-SHA). **Bump `version` i `.codex-plugin/plugin.json` når skill-innholdet
endres** – hvis Codex bruker versjonen som cache-nøkkel, får brukere ellers aldri
oppdateringer.

## Konsekvenser og risiko

Denne symlink-løsningen er bevisst valgt for å unngå duplisering, men har forbehold som
**må testes i faktisk Codex** før den regnes som støttet:

- **Codex cache (udokumentert):** Codex kopierer hele plugin-mappa til
  `~/.codex/plugins/cache/...` ved install, og dokumentasjonen nevner ikke symlinks.
  Symlinkene peker utenfor plugin-rotene. Løsningen virker bare hvis Codex *følger*
  symlinken ved kopiering; ellers blir det en hengende symlink i cachen og skillen lastes
  ikke.
- **Windows:** symlinks er upålitelige på Windows-checkout (samme grunn som at
  `.agents/skills` er en kopi). En Windows-bruker uten symlink-støtte kan få en tekstfil i
  stedet for symlinken.
- **Ingen filfiltrering:** symlinkene peker på hele skill-mappene, så `.claude-plugin/`,
  `.oppdater-state.json` og `designsystem/evals/` blir med (harmløst).

### Vakt mot ødelagte symlinker

GitHub Actions-workflowen
[`validate-codex-plugins.yml`](../.github/workflows/validate-codex-plugins.yml)
sjekker at git-modus for alle lenker under `plugins/codex/*/skills/` er `120000` (symlink),
og feiler ellers. Sjekken leser git-treet, ikke arbeidskopien, så den fanger opp en
Windows-checkout som har staget en symlink som vanlig fil. For at dette skal *hindre* merge
til `main`, må sjekken være påkrevd status-check i repoets ruleset (workflowen kjører derfor
uten path-filter på pull requests).

### Merknad til bidragsytere (Windows)

Slå på symlink-støtte før du jobber med repoet, så du ikke ødelegger symlinkene lokalt:

```text
git config --global core.symlinks true
```

(krever Developer Mode eller administrator på Windows). CI-vakten fanger opp brudd uansett.
Uten symlink-støtte kan en ny symlink stages direkte i git-indeksen:

```bash
h=$(printf '../../../../<skill-navn>' | git hash-object -w --stdin)
git update-index --add --cacheinfo 120000,$h,plugins/codex/<plugin-navn>/skills/<skill-navn>
```

## Forholdet til Claude-pluginene

Claude-pluginene distribueres **direkte** fra skill-mappene via `.claude-plugin/marketplace.json`
(se [claude-plugins.md](claude-plugins.md)) og bruker ikke symlink. De to
oppsettene skal ikke blandes.

## Gjenstår å teste manuelt

Installasjon og lasting av skillene i faktisk Codex (CLI/app/IDE) er **ikke** verifisert.
Det avgjørende testpunktet er om Codex faktisk laster skillene fra cachen etter
install — altså om symlinkene følges ved cache-kopiering. Hvis ikke, se fallback-løsningen
(flytte skillene til delt `skills/<navn>/`-layout) beskrevet i prosjektets planunderlag.
