# Fhi.AgentSkills

En samling domenekunnskap i markdown-format som AI-agenter kan bruke for å gi bedre assistanse til utviklere ved Folkehelseinstituttet.

## Hva er Agent Skills?

Agent Skills er strukturert domenekunnskap pakket som markdown-filer som AI-verktøy kan lese og bruke som kontekst. I stedet for at hver utvikler må forklare komplekse systemer til AI-assistenten sin gang på gang, kan vi dele denne kunnskapen på tvers av organisasjonen.

**Fordeler:**
- Konsistent og kvalitetssikret informasjon
- Slipper å gjenta forklaringer
- AI-en får dyp forståelse av FHI-spesifikke systemer
- Enkel oppdatering når ting endres

## Tilgjengelige Skills

| Skill | Beskrivelse |
|-------|-------------|
| [skybert](skybert/SKILL.md) | Skybert-plattformen (FHI sin Kubernetes-plattform). GitOps, WebApp CRD, Azure Workload Identity, Linkerd, Flux, onboarding og feilsøking. |

## Installasjon

### 1. Klon repoet

```bash
git clone https://github.com/FHIDev/Fhi.AgentSkills.git
```

Velg en plassering du husker, f.eks. `~/repos/Fhi.AgentSkills` eller `C:\repos\Fhi.AgentSkills`.

### 2. Sett opp for ditt AI-verktøy

#### Claude Code

Claude Code støtter skills på to nivåer:

**Globalt (alle prosjekter):**
```bash
# macOS/Linux
mkdir -p ~/.claude/skills
ln -s ~/repos/Fhi.AgentSkills/skybert ~/.claude/skills/skybert

# Windows (PowerShell som admin)
mkdir -Force "$env:USERPROFILE\.claude\skills"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
```

**Per prosjekt:**
```bash
# macOS/Linux
mkdir -p .claude/skills
ln -s ~/repos/Fhi.AgentSkills/skybert .claude/skills/skybert

# Windows (PowerShell som admin)
mkdir -Force ".claude\skills"
New-Item -ItemType SymbolicLink -Path ".claude\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
```

#### OpenAI Codex

Codex bruker `AGENTS.md` og kan referere til eksterne filer.

**Global plassering:**
```bash
# macOS/Linux
mkdir -p ~/.codex/skills
ln -s ~/repos/Fhi.AgentSkills/skybert ~/.codex/skills/skybert

# Windows (PowerShell som admin)
mkdir -Force "$env:USERPROFILE\.codex\skills"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.codex\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
```

**I AGENTS.md:**
```markdown
## Domenekunnskap

Se [skybert skill](~/.codex/skills/skybert/SKILL.md) for Skybert-plattformen.
```

#### Cursor

Cursor bruker `.cursor/rules/` for prosjektspesifikke regler.

```bash
# macOS/Linux
mkdir -p .cursor/rules
ln -s ~/repos/Fhi.AgentSkills/skybert .cursor/rules/skybert

# Windows (PowerShell som admin)
mkdir -Force ".cursor\rules"
New-Item -ItemType SymbolicLink -Path ".cursor\rules\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
```

> **Tips:** Cursor kan også bruke `.mdc`-filer. Hvis du trenger dette formatet, kan du konvertere markdown-filer manuelt.

## Skill-struktur

Hver skill følger denne strukturen:

```
skill-navn/
├── SKILL.md              # Hovedfil med YAML frontmatter
└── references/           # Detaljert dokumentasjon (valgfritt)
    ├── configuration.md
    ├── troubleshooting.md
    └── ...
```

### SKILL.md-format

```markdown
---
name: skill-navn
description: Kort beskrivelse som vises i verktøyet
---

# Skill-tittel

Hovedinnhold med konsepter, instruksjoner og eksempler.

## Referansedokumentasjon

| Dokument | Innhold |
|----------|---------|
| [configuration.md](references/configuration.md) | Detaljert konfigurasjon |
```

**YAML frontmatter:**
- `name`: Identifikator for skillen (lowercase, ingen mellomrom)
- `description`: Kort beskrivelse som vises når skillen er tilgjengelig

## Hvordan bidra

### Opprette ny skill

1. **Lag en ny mappe** med skill-navnet (lowercase):
   ```bash
   mkdir min-skill
   ```

2. **Opprett SKILL.md** med YAML frontmatter:
   ```markdown
   ---
   name: min-skill
   description: Kort beskrivelse av hva denne skillen dekker
   ---

   # Min Skill

   Hovedinnhold her...
   ```

3. **Legg til referansedokumenter** ved behov:
   ```bash
   mkdir min-skill/references
   ```

4. **Opprett PR** med endringene

### Tips for god skill-struktur

- **Fokus på praktiske eksempler** - kodeeksempler og kommandoer er mer nyttige enn lange forklaringer
- **Inkluder troubleshooting** - vanlige problemer og løsninger sparer mye tid
- **Bruk navnekonvensjoner** - placeholders som `<tenant>` gjør det enkelt å tilpasse
- **Hold det oppdatert** - utdatert informasjon er verre enn ingen informasjon
- **Tenk på AI-kontekst** - skriv slik at en AI kan forstå og bruke informasjonen effektivt

### Eksempel på god struktur

Se [skybert](skybert/) for et komplett eksempel med:
- Tydelig YAML frontmatter
- Konseptforklaringer
- Steg-for-steg guider
- Referansedokumentasjon
- Troubleshooting-seksjon

## Oppdatering

For å hente siste versjon av skills:

```bash
cd ~/repos/Fhi.AgentSkills  # eller din plassering
git pull
```

Symlinks oppdateres automatisk siden de peker til repoet.

## Lisens og eierskap

Dette repoet eies og vedlikeholdes av Folkehelseinstituttet (FHI).

**Kontakt:** Spørsmål om repoet kan stilles via GitHub Issues eller interne kanaler.
