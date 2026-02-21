# Fhi.AgentSkills – repo-informasjon for Claude

## Repo-struktur

```
Fhi.AgentSkills/
├── .claude/
│   └── skills/          ← kanonisk plassering for alle skills
├── .codex/
│   └── skills -> .claude/skills   ← SYMLINK (ikke en egen mappe)
├── designsystem/        ← designsystem-skillen
├── skybert/             ← skybert-skillen
└── README.md
```

## Viktig: `.codex/skills` er en symlink

`.codex/skills` peker til `.claude/skills`. De er fysisk samme mappe.

- Rediger alltid filer under `.claude/skills/` – endringer reflekteres automatisk i `.codex/skills/`
- Kjør aldri diff eller synkronisering mellom `.claude/skills/` og `.codex/skills/` – det er unødvendig
- Opprett aldri nye filer direkte under `.codex/skills/` – bruk `.claude/skills/`
