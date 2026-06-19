# Skybert som Claude Code-plugin

Repoet publiserer `skybert` som en Claude Code-plugin via marketplace-filen
`.claude-plugin/marketplace.json`. Dette er et alternativ til den symlink-baserte
installasjonen som er beskrevet i [README](../README.md) – pluginen lar deg installere
Skybert-skillen direkte med `/plugin`-kommandoer i Claude Code.

> For Codex finnes en egen plugin med annen struktur, se
> [codex-plugin-skybert.md](codex-plugin-skybert.md).

## Struktur

Skillen distribueres **direkte** fra `skybert/`-mappa – det finnes ingen kopi i repoet.
Marketplace-oppslaget peker på `./skybert` som plugin-kilde, og `skybert/`-mappa er
samtidig selve pluginen:

```text
.claude-plugin/
  marketplace.json            # Marketplace-manifest, source: ./skybert
skybert/
  .claude-plugin/
    plugin.json               # Plugin-manifest
  SKILL.md                    # Skillen (enkelt SKILL.md i plugin-roten)
  references/                 # Støttefiler
```

Claude Code støtter at en plugin har skillen som en enkelt `SKILL.md` med støttefiler i
plugin-roten, så `skybert/` fungerer både som vanlig skill (via symlink) og som plugin
(via marketplace) uten duplisering. Rediger alltid `skybert/` direkte.

> **Merk:** Når Claude Code installerer pluginen, kopieres hele `skybert/`-mappa til en
> lokal cache. Den interne `skybert/.oppdater-state.json` (sync-metadata for
> `oppdater-skybert`) blir da med. Det er harmløst – fila inneholder ingen hemmeligheter.

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

## Validering

Manifestene valideres av GitHub Actions-workflowen
[`validate-claude-skybert-plugin.yml`](../.github/workflows/validate-claude-skybert-plugin.yml),
som kjører på pull requests og push til `main` når `skybert/**` eller `.claude-plugin/**`
endres. Workflowen sjekker at manifestene er gyldig JSON og at marketplace-source peker på
`./skybert`.

Lokalt kan du i tillegg kjøre:

```text
claude plugin validate skybert
claude plugin validate .
```

## Oppdatering

Siden skillen distribueres direkte fra `skybert/`, er en endring i `skybert/` på `main`
nok – det finnes ingen kopi som må regenereres. For at Claude Code skal hente oppdateringen
automatisk må marketplace auto-update være aktivert. Pluginen har ingen eksplisitt
`version`; ved git-basert distribusjon kan Claude Code bruke Git commit-SHA som versjon.
