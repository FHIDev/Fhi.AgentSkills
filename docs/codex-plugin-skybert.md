# Skybert som Codex-plugin

Repoet bygger en Codex-plugin fra `skybert/`.

Kilden ligger her:

```text
skybert/
```

Generert Codex-plugin ligger her:

```text
plugins/codex/skybert-plugin/
```

Codex marketplace ligger her:

```text
.agents/plugins/marketplace.json
```

Skillen kopieres inn i pluginen her:

```text
plugins/codex/skybert-plugin/skills/skybert/
```

## Struktur

```text
.agents/
  plugins/
    marketplace.json                  # Codex marketplace (source.path -> plugin-mappa)
plugins/
  codex/
    skybert-plugin/
      .codex-plugin/
        plugin.json                   # Codex plugin-manifest (skills: ./skills)
      skills/
        skybert/
          SKILL.md
          references/
```

`source.path` i marketplace-fila løses relativt til **repo-roten** (marketplace-roten),
ikke til `.agents/plugins/`-mappa. Derfor er stien `./plugins/codex/skybert-plugin`.

## Hva som ekskluderes fra kopien

Ved kopiering fra `skybert/` utelates:

- `skybert/.claude-plugin/` – Claude-spesifikk pluginmetadata, ikke relevant for Codex
- `skybert/.oppdater-state.json` – intern sync-metadata for `oppdater-skybert`, ikke nødvendig i pluginpakken

## Bygging

Etter endringer i `skybert/` bygges Codex-pluginstrukturen automatisk av GitHub
Actions-workflowen [`build-codex-skybert-plugin.yml`](../.github/workflows/build-codex-skybert-plugin.yml).

Workflowen:

- trigges ved push til `main` når `skybert/**` eller workflowen selv endres
- kan også startes manuelt via `workflow_dispatch`
- kopierer `skybert/` til `plugins/codex/skybert-plugin/skills/skybert/` (uten
  `.claude-plugin/` og `.oppdater-state.json`)
- skriver/oppdaterer `.codex-plugin/plugin.json` og `.agents/plugins/marketplace.json`
- validerer JSON
- committer og pusher kun når det faktisk er endringer

## Forholdet til Claude-pluginen

Claude-pluginen bruker en annen struktur og distribueres **direkte** fra `skybert/` via
`.claude-plugin/marketplace.json` (se [claude-plugin-skybert.md](claude-plugin-skybert.md)).
Denne skal ikke blandes med Codex-pluginstrukturen.

## Gjenstår å teste manuelt

Automatisk oppdatering og installasjon i Codex (CLI/app/IDE) er **ikke** verifisert og må
testes i faktisk Codex før det dokumenteres som støttet. Codex-plugin-formatet her følger
offisiell dokumentasjon (developers.openai.com/codex/plugins), men er ikke kjørt mot en
Codex-valideringskommando.
