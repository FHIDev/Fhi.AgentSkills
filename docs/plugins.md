# Plugins

`skybert-plugin` og `designsystem-plugin` distribueres fra samme plugin-mapper.
Skill-navnene er `skybert` og `designsystem`. Katalogen heter `fhi-agent-skills`.
Claude bruker `.claude-plugin/marketplace.json`; Codex bruker `.agents/plugins/marketplace.json`.
Codex-katalogen beholdes også når wrapperne fjernes.

## Oppdatering

Claude Code:

```text
/plugin marketplace update fhi-agent-skills
/plugin update skybert-plugin@fhi-agent-skills
/plugin update designsystem-plugin@fhi-agent-skills
```

Codex, for katalog lagt til fra GitHub:

```sh
codex plugin marketplace upgrade fhi-agent-skills
codex plugin add skybert-plugin@fhi-agent-skills
codex plugin add designsystem-plugin@fhi-agent-skills
```

Start en ny agentprosess og bekreft ønsket versjon. Lokale kataloger oppdateres på disk
og installeres på nytt; de bruker ikke Git-upgrade.

## Migrering

Den offentlige katalogen og plugin-navnene beholdes. Oppdater katalog og plugins.
Codex går fra wrapper-versjon `0.1.0` til direkte plugin `1.0.0`.
Gamle utviklersymlinker skal nå peke på `plugins/<domene>/skills/<domene>`.

Installer hver plugin fra én katalog. Samme navn i to kataloger kan gi identisk
`plugin:skill`-namespace. Ved kanalbytte avinstalleres gammel plugin før ny installeres;
bekreft at bare én kopi er aktiv. Flere kataloger kan være registrert.

## Versjonering

Versjonen står bare i pluginens `.claude-plugin/plugin.json`. Begge starter på `1.0.0`.
Bruk `MAJOR.MINOR.PATCH` uten prerelease eller build-metadata.

| Endring | Versjon |
|---|---|
| Rettelser og presiseringer i distribuert innhold | PATCH |
| Ny dekning, scenarier eller utvidede triggere | MINOR |
| Fjernet dekning eller vesentlig endret kontrakt/oppførsel | MAJOR |
| Bare vedlikeholdsstate, coverage, kildearkiv eller repo-verktøy | Ingen bump |

CI kontrollerer økning; reviewer vurderer nivået. Pluginversjonen er uavhengig av
upstream-versjonen. Også en endret distribuert verifiseringslinje er en innholdsendring.
En feil publisert versjon rettes med høyere versjonsnummer.

## Intern katalog og videre arbeid

Avklar med Kristian Grønli om sentral- eller teamkatalog skal brukes før registrering.
Sentralkatalogen heter `FHIDev/Fhi.AIAgent.Marketplace`; gammel URL videresendes.
Foreslått source er `git-subdir` til `plugins/<domene>` uten katalogversjon. Verifiser
oppdatering A → B med bare bump i pluginmanifestet i begge klienter, særlig Claude Code.
Fallback er versjon begge steder med plugin-release først og katalogoppdatering etterpå.

FHI-utrulling bør bruke managed settings (`extraKnownMarketplaces` og `enabledPlugins`)
for valgt katalog. Konkrete katalogverdier fastsettes etter eierskapsavklaringen.
Eksisterende dobbeltinstallasjoner ryddes ved migrering.

De påkrevde jobbnavnene `validate-claude-plugins`, `validate-codex-plugins` og
`verify-skills-invariants` beholdes. Separat pinnet CLI-validering er ikke lagt inn som
påkrevd i ruleset; runner-kjøringen må bekreftes først.
