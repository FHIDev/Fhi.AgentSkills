# Skybert som Codex-plugin

Repoet publiserer en Codex-plugin for `skybert`. For å unngå en ekstra kopi av skillen
**lenkes** innholdet via en symlink i stedet for å kopieres.

Kilden ligger her:

```text
skybert/
```

Codex-pluginen ligger her:

```text
plugins/codex/skybert-plugin/
```

Codex marketplace ligger her:

```text
.agents/plugins/marketplace.json
```

## Struktur

```text
.agents/
  plugins/
    marketplace.json                  # Codex marketplace (source.path -> plugin-mappa)
plugins/
  codex/
    skybert-plugin/
      .codex-plugin/
        plugin.json                   # Codex plugin-manifest (skills: ./skills)
      skills/
        skybert  ->  ../../../../skybert   # SYMLINK til repo-rotens skybert/
```

Codex krever skill-layoutet `skills/<navn>/SKILL.md`. I stedet for å kopiere `skybert/` hit,
er `skills/skybert` en **symlink** til repo-rotens `skybert/`. Slik finnes innholdet bare ett
sted i repoet.

`source.path` i marketplace-fila løses relativt til **repo-roten**, ikke til
`.agents/plugins/`-mappa. Derfor er stien `./plugins/codex/skybert-plugin`.

## Konsekvenser og risiko

Denne symlink-løsningen er bevisst valgt for å unngå duplisering, men har forbehold som
**må testes i faktisk Codex** før den regnes som støttet:

- **Codex cache (udokumentert):** Codex kopierer hele plugin-mappa til
  `~/.codex/plugins/cache/...` ved install, og dokumentasjonen nevner ikke symlinks.
  Symlinken peker utenfor plugin-roten. Løsningen virker bare hvis Codex *følger* symlinken
  ved kopiering; ellers blir det en hengende symlink i cachen og skillen lastes ikke.
- **Windows:** symlinks er upålitelige på Windows-checkout (samme grunn som at
  `.agents/skills` er en kopi). En Windows-bruker uten symlink-støtte kan få en tekstfil i
  stedet for symlinken.
- **Ingen filfiltrering:** symlinken peker på hele `skybert/`, så `.claude-plugin/` og
  `.oppdater-state.json` blir med (harmløst).

### Vakt mot ødelagt symlink

GitHub Actions-workflowen
[`validate-codex-skybert-plugin.yml`](../.github/workflows/validate-codex-skybert-plugin.yml)
sjekker at git-modus for `plugins/codex/skybert-plugin/skills/skybert` er `120000` (symlink),
og feiler ellers. Sjekken leser git-treet, ikke arbeidskopien, så den fanger opp en
Windows-checkout som har staget symlinken som vanlig fil. For at dette skal *hindre* merge til
`main`, må sjekken settes som påkrevd status-check i repoets branch protection.

### Merknad til bidragsytere (Windows)

Slå på symlink-støtte før du jobber med repoet, så du ikke ødelegger symlinken lokalt:

```text
git config --global core.symlinks true
```

(krever Developer Mode eller administrator på Windows). CI-vakten fanger opp brudd uansett.

## Forholdet til Claude-pluginen

Claude-pluginen distribueres **direkte** fra `skybert/` via `.claude-plugin/marketplace.json`
(se [claude-plugin-skybert.md](claude-plugin-skybert.md)) og bruker ikke symlink. De to
oppsettene skal ikke blandes.

## Gjenstår å teste manuelt

Installasjon og lasting av skillen i faktisk Codex (CLI/app/IDE) er **ikke** verifisert.
Det avgjørende testpunktet er om Codex faktisk laster `skybert`-skillen fra cachen etter
install — altså om symlinken følges ved cache-kopiering. Hvis ikke, se fallback-løsningen
(flytte skillen til delt `skills/skybert/`-layout) beskrevet i prosjektets planunderlag.
