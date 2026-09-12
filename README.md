# Fhi.AgentSkills

Domenekunnskap for AI-agenter som bistår utviklere ved Folkehelseinstituttet.

| Skill | Innhold |
|---|---|
| [skybert](plugins/skybert/skills/skybert/SKILL.md) | Skybert: GitOps, Kubernetes, onboarding og feilsøking. |
| [designsystem](plugins/designsystem/skills/designsystem/SKILL.md) | FHI Designsystem: komponenter, tokens, ikoner og integrasjon. |

## Installasjon

Begge klienter installerer samme innhold fra den offentlige katalogen `fhi-agent-skills`.

Claude Code:

```text
/plugin marketplace add FHIDev/Fhi.AgentSkills
/plugin install skybert-plugin@fhi-agent-skills
/plugin install designsystem-plugin@fhi-agent-skills
```

Codex:

```sh
codex plugin marketplace add FHIDev/Fhi.AgentSkills
codex plugin add skybert-plugin@fhi-agent-skills
codex plugin add designsystem-plugin@fhi-agent-skills
```

Se [oppdatering og migrering](docs/plugins.md). Valgt intern katalog er
`FHIDev/Fhi.AIAgent.Marketplace`; registreringen leveres i en separat PR.
Installer hver plugin fra én katalog, selv om flere kataloger er registrert.

## Vedlikehold og bidrag

| Vedlikeholds-skill | Formål |
|---|---|
| [oppdater-skybert](.claude/skills/oppdater-skybert/SKILL.md) | Synkroniserer mot kilderepoer eller dokumentasjon. |
| [oppdater-designsystem](.claude/skills/oppdater-designsystem/SKILL.md) | Synkroniserer mot publisert FHI Designsystem. |

`.claude/skills/` er kanonisk. Speil endringer med `bash .github/scripts/sync-agents.sh`.
State, coverage og kildearkiver ligger i `maintenance/` og distribueres ikke.

For live-redigering: symlink `plugins/<domene>/skills/<domene>` til klientens skills-mappe.
Oppdater gamle symlinker til rotmappene, og deaktiver installert plugin mens utviklingskopien brukes.

Endret distribuert innhold krever versjonsøkning i pluginens manifest.
Se [versjonsreglene](docs/plugins.md#versjonering).

Kjør fra repo-roten:

```sh
bash .github/scripts/validate.sh
python3 .github/scripts/validate_plugins.py claude
python3 .github/scripts/validate_plugins.py codex
node .claude/skills/oppdater-designsystem/scripts/contract-check.mjs
python3 .github/scripts/test_versions.py
```

Versjonsvakt: `python3 .github/scripts/check_versions.py --base <base-SHA>`.
Kontakt `team-a@fhi.no` for PR-tilgang.

Nye skills skal ha `SKILL.md` med YAML-frontmatter (`name` og `description`) og
relative lenker til referanser innenfor pluginen. Nye plugins registreres i begge kataloger
og legges til i katalog- og versjonsvalideringen.
