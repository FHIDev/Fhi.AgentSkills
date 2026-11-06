# Fhi.AgentSkills – repo-informasjon for Claude

## Repo-struktur

```
Fhi.AgentSkills/
├── .claude-plugin/      ← offentlig Claude-katalog
├── .agents/plugins/    ← offentlig Codex-katalog
├── plugins/
│   ├── skybert/        ← manifest + skills/skybert/
│   └── designsystem/   ← manifest + skills/designsystem/
├── maintenance/        ← state, coverage og kildearkiver (distribueres ikke)
├── .claude/skills/     ← kanoniske vedlikeholds-skills
├── .agents/skills/     ← identisk kompatibilitetskopi
├── .github/scripts/    ← validering og speiling
├── docs/
└── README.md
```

## Viktig: `.claude/skills` er kanonisk kilde for vedlikeholds-skills

`.claude/skills` er kanonisk plassering for interne vedlikeholds-skills.
`.agents/skills` er en kompatibilitetskopi for Codex/oppsett uten pålitelig symlink-støtte (f.eks. enkelte Windows-oppsett).

- Rediger alltid filer under `.claude/skills/`
- Speil samme endringer til `.agents/skills/` slik at innholdet forblir identisk
- Opprett nye vedlikeholds-skills under `.claude/skills/` først, og kopier deretter til `.agents/skills/`

## Bidrag og PR-tilgang

- Repoet er offentlig. Eksterne bidragsytere forker repoet og åpner PR fra forken
- FHI-vedlikeholdere får skrivetilgang via teamet `Fhi.AgentSkills-Write`. Kontakt `team-a@fhi.no` for å bli lagt til
- `main` er beskyttet av ruleset: endringer må gå via PR med godkjenning og grønne valideringssjekker
