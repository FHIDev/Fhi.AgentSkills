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

- For å opprette PR-er i dette repoet må du ha riktig tilgang
- Kontakt `team-a@fhi.no` for å få tilgang til å lage PR
