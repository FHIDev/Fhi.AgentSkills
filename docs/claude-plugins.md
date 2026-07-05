# Skills som Claude Code-plugins

Repoet publiserer `skybert` og `designsystem` som Claude Code-plugins via marketplace-filen
`.claude-plugin/marketplace.json`. Dette er et alternativ til den symlink-baserte
installasjonen som er beskrevet i [README](../README.md) – pluginene lar deg installere
skillene direkte med `/plugin`-kommandoer i Claude Code.

> For Codex finnes egne plugins med annen struktur, se
> [codex-plugins.md](codex-plugins.md).

## Struktur

Skillene distribueres **direkte** fra skill-mappene – det finnes ingen kopier i repoet.
Marketplace-oppslagene peker på skill-mappene som plugin-kilder, og hver skill-mappe er
samtidig selve pluginen:

```text
.claude-plugin/
  marketplace.json            # Marketplace-manifest, source: ./skybert og ./designsystem
skybert/
  .claude-plugin/
    plugin.json               # Plugin-manifest (skybert-plugin)
  SKILL.md                    # Skillen (enkelt SKILL.md i plugin-roten)
  references/                 # Støttefiler
designsystem/
  .claude-plugin/
    plugin.json               # Plugin-manifest (designsystem-plugin)
  SKILL.md                    # Skillen (enkelt SKILL.md i plugin-roten)
  references/                 # Støttefiler
  versions/                   # Støttefiler
```

Claude Code støtter at en plugin har skillen som en enkelt `SKILL.md` med støttefiler i
plugin-roten (v2.1.142+), så skill-mappene fungerer både som vanlige skills (via symlink)
og som plugins (via marketplace) uten duplisering. `name:`-feltet i SKILL.md-frontmatteren
er påkrevd i dette oppsettet – uten det får skillen install-katalognavnet (en
versjonsstreng) som navn. Rediger alltid skill-mappene direkte.

> **Merk:** Når Claude Code installerer en plugin, kopieres hele skill-mappa til en
> lokal cache. Interne filer som `.oppdater-state.json` (sync-metadata for
> `oppdater-*`-skillene) og `designsystem/evals/` blir da med. Det er harmløst –
> filene inneholder ingen hemmeligheter.

## Installer marketplace i Claude Code

```text
/plugin marketplace add FHIDev/Fhi.AgentSkills
```

## Installer plugins

```text
/plugin install skybert-plugin@fhi-agent-skills
/plugin install designsystem-plugin@fhi-agent-skills
```

## Last inn plugins på nytt

```text
/reload-plugins
```

## Validering

Manifestene valideres av GitHub Actions-workflowen
[`validate-claude-plugins.yml`](../.github/workflows/validate-claude-plugins.yml).
Workflowen er datadrevet: den leser alle entries i marketplace-filen og sjekker for hver
plugin at source-mappa finnes, at `plugin.json` er gyldig JSON med samsvarende navn, og at
`SKILL.md` finnes med `name:` i frontmatteren. Den kjører på alle pull requests (uten
path-filter, fordi den er ment som påkrevd status-check på `main`).

Lokalt kan du i tillegg kjøre:

```text
claude plugin validate skybert
claude plugin validate designsystem
claude plugin validate .
```

## Oppdatering

Siden skillene distribueres direkte fra skill-mappene, er en endring på `main`
nok – det finnes ingen kopi som må regenereres. For at Claude Code skal hente oppdateringen
automatisk må marketplace auto-update være aktivert. Pluginene har bevisst ingen eksplisitt
`version`: da bruker Claude Code Git commit-SHA som versjon, og brukere får oppdateringer
på hver commit. Ikke legg til et `version`-felt i `plugin.json` – det pinner pluginen og
stopper automatiske oppdateringer til feltet bumpes manuelt.
