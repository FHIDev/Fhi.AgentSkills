@~/.claude/privacy.md

# Fhi.AgentSkills – repo-informasjon for Claude

## Repo-struktur

```
Fhi.AgentSkills/
├── .claude-plugin/      ← Claude Code-marketplace (skybert- og designsystem-plugin)
├── .claude/
│   └── skills/          ← kanonisk plassering for interne vedlikeholds-skills (oppdater-*)
├── .agents/
│   ├── plugins/         ← Codex-marketplace
│   └── skills/          ← kompatibilitetskopi av .claude/skills for Codex
├── designsystem/        ← designsystem-skillen (også Claude-plugin)
├── skybert/             ← skybert-skillen (også Claude-plugin)
├── system-beskrivelse/  ← system-beskrivelse-skillen
├── plugins/
│   └── codex/           ← Codex-plugins (symlinker til skill-mappene)
├── docs/                ← dokumentasjon av plugin-oppsettene
└── README.md
```

## Viktig: `.claude/skills` er kanonisk kilde for vedlikeholds-skills

`.claude/skills` er kanonisk plassering for interne vedlikeholds-skills.
`.agents/skills` er en kompatibilitetskopi for Codex/oppsett uten pålitelig symlink-støtte (f.eks. enkelte Windows-oppsett).

- Rediger alltid filer under `.claude/skills/`
- Speil samme endringer til `.agents/skills/` slik at innholdet forblir identisk
- Opprett nye vedlikeholds-skills under `.claude/skills/` først, og kopier deretter til `.agents/skills/`

## Bidrag og PR-tilgang

- For å opprette PR-er i dette repoet må du ha riktig tilgang
- Kontakt `team-a@fhi.no` for å få tilgang til å lage PR
