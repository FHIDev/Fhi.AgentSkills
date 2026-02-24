# Fhi.AgentSkills – repo-informasjon for Claude

## Repo-struktur

```
Fhi.AgentSkills/
├── .claude/
│   └── skills/          ← kanonisk plassering for alle skills
├── .codex/
│   └── skills/          ← kompatibilitetskopi av .claude/skills for Codex
├── designsystem/        ← designsystem-skillen
├── skybert/             ← skybert-skillen
└── README.md
```

## Viktig: `.claude/skills` er kanonisk kilde

`.claude/skills` er kanonisk plassering for interne vedlikeholds-skills.
`.codex/skills` er en kompatibilitetskopi for Codex/oppsett uten pålitelig symlink-støtte (f.eks. enkelte Windows-oppsett).

- Rediger alltid filer under `.claude/skills/`
- Speil samme endringer til `.codex/skills/` slik at innholdet forblir identisk
- Opprett nye vedlikeholds-skills under `.claude/skills/` først, og kopier deretter til `.codex/skills/`

## Bidrag og PR-tilgang

- For å opprette PR-er i dette repoet må du ha riktig tilgang
- Kontakt `team-a@fhi.no` for å få tilgang til å lage PR
