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
| [skybert](skybert/SKILL.md) | Skybert-plattformen (FHI sin Kubernetes-plattform). GitOps, SkybertApp CRD, Azure Workload Identity, Flux, onboarding og feilsøking. |
| [designsystem](designsystem/SKILL.md) | FHI Designsystem (`@folkehelseinstituttet/designsystem`). Komponenter, design tokens, ikoner og rammeverk-integrasjon (React, Angular, Blazor). |

## Interne vedlikeholds-skills

Disse skillene brukes til å holde domenekunnskap-skillene i dette repoet oppdatert.

| Skill | Beskrivelse |
|-------|-------------|
| [oppdater-skybert](.claude/skills/oppdater-skybert/SKILL.md) | Synkroniserer skybert-skillen med siste versjon av `docs.sky.fhi.no`. |
| [oppdater-designsystem](.claude/skills/oppdater-designsystem/SKILL.md) | Synkroniserer designsystem-skillen med siste publiserte npm-versjon. |

> **Merk:** Disse ligger kanonisk under `.claude/skills/` og skal ikke symlinkes til andre prosjekter.

## Installasjon

### 1. Klon repoet

```bash
git clone https://github.com/FHIDev/Fhi.AgentSkills.git
```

Velg en plassering du husker, f.eks. `~/repos/Fhi.AgentSkills` eller `C:\repos\Fhi.AgentSkills`.

### 2. Sett opp for ditt AI-verktøy

Symlink skillene du ønsker å bruke. Tilgjengelige skills for bruk i prosjekter er `skybert` og `designsystem`.

#### Claude Code

Claude Code støtter skills på to nivåer:

**Globalt (alle prosjekter):**
```bash
# macOS/Linux
mkdir -p ~/.claude/skills
# Generisk mønster:
# ln -s ~/repos/Fhi.AgentSkills/<skill-navn> ~/.claude/skills/<skill-navn>

ln -s ~/repos/Fhi.AgentSkills/skybert ~/.claude/skills/skybert
ln -s ~/repos/Fhi.AgentSkills/designsystem ~/.claude/skills/designsystem

# Windows (PowerShell som admin)
mkdir -Force "$env:USERPROFILE\.claude\skills"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills\designsystem" -Target "C:\repos\Fhi.AgentSkills\designsystem"
```

**Per prosjekt:**
```bash
# macOS/Linux
mkdir -p .claude/skills
# Generisk mønster:
# ln -s ~/repos/Fhi.AgentSkills/<skill-navn> .claude/skills/<skill-navn>

ln -s ~/repos/Fhi.AgentSkills/skybert .claude/skills/skybert
ln -s ~/repos/Fhi.AgentSkills/designsystem .claude/skills/designsystem

# Windows (PowerShell som admin)
mkdir -Force ".claude\skills"
New-Item -ItemType SymbolicLink -Path ".claude\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
New-Item -ItemType SymbolicLink -Path ".claude\skills\designsystem" -Target "C:\repos\Fhi.AgentSkills\designsystem"
```

#### OpenAI Codex

Codex bruker `AGENTS.md` og kan referere til eksterne filer.

**Global plassering:**
```bash
# macOS/Linux
mkdir -p ~/.codex/skills
# Generisk mønster:
# ln -s ~/repos/Fhi.AgentSkills/<skill-navn> ~/.codex/skills/<skill-navn>

ln -s ~/repos/Fhi.AgentSkills/skybert ~/.codex/skills/skybert
ln -s ~/repos/Fhi.AgentSkills/designsystem ~/.codex/skills/designsystem

# Windows (PowerShell som admin)
mkdir -Force "$env:USERPROFILE\.codex\skills"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.codex\skills\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.codex\skills\designsystem" -Target "C:\repos\Fhi.AgentSkills\designsystem"
```

**I AGENTS.md:**
```markdown
## Domenekunnskap

Se [skybert skill](~/.codex/skills/skybert/SKILL.md) for Skybert-plattformen.
Se [designsystem skill](~/.codex/skills/designsystem/SKILL.md) for FHI Designsystem.
```

> **Merk:** `~` er kun et eksempel (hjemmekatalog). Tilpass stien til din faktiske plassering og operativsystem.

#### Cursor

Cursor bruker `.cursor/rules/` for prosjektspesifikke regler.

```bash
# macOS/Linux
mkdir -p .cursor/rules
# Generisk mønster:
# ln -s ~/repos/Fhi.AgentSkills/<skill-navn> .cursor/rules/<skill-navn>

ln -s ~/repos/Fhi.AgentSkills/skybert .cursor/rules/skybert
ln -s ~/repos/Fhi.AgentSkills/designsystem .cursor/rules/designsystem

# Windows (PowerShell som admin)
mkdir -Force ".cursor\rules"
New-Item -ItemType SymbolicLink -Path ".cursor\rules\skybert" -Target "C:\repos\Fhi.AgentSkills\skybert"
New-Item -ItemType SymbolicLink -Path ".cursor\rules\designsystem" -Target "C:\repos\Fhi.AgentSkills\designsystem"
```

> **Tips:** Cursor kan også bruke `.mdc`-filer. Hvis du trenger dette formatet, kan du konvertere markdown-filer manuelt.

## Repostruktur for vedlikeholdere

- `.claude/skills/` – kanonisk plassering for interne vedlikeholds-skills (`oppdater-*`)
- `.codex/skills/` – kompatibilitetskopi av `.claude/skills/` for Codex/oppsett uten symlink-støtte
- Rediger alltid interne vedlikeholds-skills under `.claude/skills/`, og speil endringene til `.codex/skills/`
- `AGENTS.md` – repo-informasjon for OpenAI Codex-agenter
- `CLAUDE.md` – repo-informasjon for Claude Code

## Skill-struktur

Hver skill følger denne strukturen (med valgfrie mapper etter behov):

```
skill-navn/
├── SKILL.md              # Hovedfil med YAML frontmatter
├── references/           # Detaljert dokumentasjon (valgfritt)
│   ├── configuration.md
│   └── ...
└── versions/             # Versjonsspesifikk info (valgfritt)
    ├── INDEX.md
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

## Bidra

### Før du starter

For å kunne opprette PR-er i dette repoet må du ha riktig tilgang.

- Kontakt `team-a@fhi.no` for å få tilgang til å lage PR
- Avklar gjerne tidlig om endringen gjelder en ny skill, oppdatering av eksisterende skill, eller vedlikehold av interne `oppdater-*`-skills

### Vanlige bidrag

- Oppdatere eksisterende skills (`skybert/`, `designsystem/`)
- Legge til nye skills
- Forbedre struktur, eksempler og referansedokumentasjon
- Rette utdaterte lenker eller feil beskrivelser i `README.md`

### Opprette ny skill

1. **Lag en ny mappe** med skill-navnet (lowercase):
   ```bash
   mkdir min-skill
   ```

2. **Opprett `SKILL.md`** med YAML frontmatter:
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

4. **Oppdater `README.md`**:
   - legg til skillen i tabellen under `Tilgjengelige Skills`
   - legg til installasjonseksempel hvis det er en skill som skal brukes i prosjekter

5. **Opprett PR** med endringene

### Tips for god skill-struktur

- **Fokus på praktiske eksempler** - kodeeksempler og kommandoer er mer nyttige enn lange forklaringer
- **Inkluder troubleshooting** - vanlige problemer og løsninger sparer mye tid
- **Bruk navnekonvensjoner** - placeholders som `<tenant>` gjør det enkelt å tilpasse
- **Hold det oppdatert** - utdatert informasjon er verre enn ingen informasjon
- **Tenk på AI-kontekst** - skriv slik at en AI kan forstå og bruke informasjonen effektivt

### Eksempel på god struktur

Se [skybert](skybert/) og [designsystem](designsystem/) for komplette eksempler:
- `skybert`: tydelig YAML frontmatter, steg-for-steg guider, referansedokumentasjon og troubleshooting
- `designsystem`: versjonshåndtering i `versions/` og komponentreferanser i `references/components/`

## Oppdatering

For å hente siste versjon av skills:

```bash
cd ~/repos/Fhi.AgentSkills  # eller din plassering
git pull
```

Symlinks oppdateres automatisk siden de peker til repoet.

### Automatisk oppdatering via oppdateringsskills

Noen skills har tilhørende oppdateringsskills (f.eks. `oppdater-skybert`) som kan hente og sammenligne med kildedata automatisk. Disse krever:

- **`gh` CLI** installert og autentisert
- **Lesetilgang** til kilderepoene (f.eks. `FHISkybert/Fhi.Skybert.Docs` og `FHISkybert/Fhi.Skybert.Infra`)

**Installere `gh` CLI:**

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Ubuntu/Debian
sudo apt install gh
```

**Autentisere:**
```bash
gh auth login
```

Uten repo-tilgang faller oppdateringsskillene tilbake til web-scraping av offentlig dokumentasjon der dette er tilgjengelig.

## Eierskap og kontakt

Dette repoet eies og vedlikeholdes av Folkehelseinstituttet (FHI).

**Kontakt:** Spørsmål om repoet kan stilles via GitHub Issues, interne kanaler eller `team-a@fhi.no`.

**PR-tilgang:** Kontakt `team-a@fhi.no` for å få tilgang til å lage PR.
