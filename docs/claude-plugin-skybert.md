# Skybert som Claude Code-plugin

Repoet publiserer `skybert` som en Claude Code-plugin via marketplace-filen
`.claude-plugin/marketplace.json`. Dette er et alternativ til den symlink-baserte
installasjonen som er beskrevet i [README](../README.md) – pluginen lar deg installere
Skybert-skillen direkte med `/plugin`-kommandoer i Claude Code.

## Struktur

```text
.claude-plugin/
  marketplace.json            # Marketplace-manifest

plugins/
  skybert-plugin/
    .claude-plugin/
      plugin.json             # Plugin-manifest
    skills/
      skybert/                # Generert kopi av /skybert
        SKILL.md
        references/
```

Innholdet under `plugins/skybert-plugin/skills/skybert/` er en **generert kopi** av
`/skybert`. Rediger alltid kilden i `/skybert/` – ikke den genererte kopien.

## Installer marketplace i Claude Code

```text
/plugin marketplace add FHIDev/Fhi.AgentSkills
```

## Installer plugin

```text
/plugin install skybert-plugin@fhi-agent-skills
```

## Last inn plugins på nytt

```text
/reload-plugins
```

## Hvordan pluginen bygges

Pluginen bygges automatisk fra innholdet i `/skybert` av GitHub Actions-workflowen
[`build-claude-skybert-plugin.yml`](../.github/workflows/build-claude-skybert-plugin.yml).

Workflowen:

- trigges ved push til `main` når `skybert/**` eller workflowen selv endres
- kan også startes manuelt via `workflow_dispatch`
- kopierer `/skybert` til `plugins/skybert-plugin/skills/skybert` (uten den interne
  `.oppdater-state.json`)
- skriver/oppdaterer `.claude-plugin/marketplace.json` og
  `plugins/skybert-plugin/.claude-plugin/plugin.json`
- committer og pusher kun når det faktisk er endringer

## Oppdatering

Når `/skybert` endres på `main`, regenererer workflowen plugin-filene og committer dem.
For at Claude Code skal hente oppdateringen automatisk må marketplace auto-update være
aktivert. Pluginen har ingen eksplisitt `version`; ved git-basert distribusjon kan
Claude Code bruke Git commit-SHA som versjon.
