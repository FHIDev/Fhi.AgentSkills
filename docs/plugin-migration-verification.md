# Verifisering av strukturmigreringen

Utført 2026-09-12 på Linux med Codex CLI 0.154.0, Claude Code 2.1.269 og Node 22.14.0.
Gammel struktur: commit `fc61a40` (før migreringen). Alle installasjonstester brukte
midlertidige kataloger og separate klientprofiler. Ingen brukerinstallasjoner ble endret.

## Resultater

| Kontroll | Resultat |
|---|---|
| Codex: nyinstallasjon via `local`-objekt til nye plugin-mapper | Begge plugins installert som 1.0.0 |
| Codex: gammel wrapper 0.1.0 → direkte plugin 1.0.0 | Begge oppdatert; installert innhold byte-identisk med arbeidskopien |
| Codex: ny app-server-prosess, `skills/list` med `forceReload` | Begge namespacede skills lastet og aktivert, ingen lastefeil |
| Claude: nyinstallasjon via relativ streng-source | Begge plugins installert som 1.0.0 |
| Claude: gammel installasjon uten manifestversjon → 1.0.0 | Begge oppdatert; installert innhold byte-identisk med arbeidskopien |
| Begge klienters installerte pakker | Ingen state, coverage eller kildearkiver |
| Claude `plugin validate --strict` | Begge manifester godkjent uten autentisering lokalt |
| Offline CI-kontroller | Kataloger, lenker, state, speiling og designsystemkontrakt godkjent |
| Versjonsvakt | Førstegangsintroduksjon godkjent; fem tester for økning, metadata og ugyldige versjoner bestått |

Gjenta nyinstallasjon og migrering lokalt:

```sh
python3 .github/scripts/test_plugin_migration.py --base fc61a40
```

Scriptet tester den opprinnelige overgangen til 1.0.0, ikke fremtidige releaseversjoner.
Det starter ingen modell. CLI-ene må være installert. Midlertidige profiler slettes ved slutt.

## Avgrensninger og gjenstående porter

- Testkatalogene var lokale snapshots. GitHub-transport og oppdatering av en fjernkatalog
  etter merge må bekreftes før ferdig utrulling.
- Faktisk Windows-kjøring er ikke utført. Pakkevalideringen avviser symlinker,
  og de nye plugin-pakkene inneholder ingen.
- Codex lesing av streng-source i Claude-katalogen er ikke nødvendig for denne leveransen:
  `.agents/plugins/marketplace.json` beholdes. Eventuell sletting krever isolert test uten dette manifestet.
- Claude CLI-valideringen er bekreftet lokalt. Ny jobb må kjøre på GitHub-runner før
  den eventuelt gjøres påkrevd. Eksisterende tre påkrevde jobbnavn er bevart.
- Trigger- og svarkvalitet er ikke evaluert med modellkall i denne migreringen.
- Intern katalog avklares med Kristian Grønli. `git-subdir` med bare manifestversjon
  krever egen A → B-oppdateringstest før registrering/utrulling.

Wrapperne ble fjernet etter bestått direkte installasjon og oppdatering. Revert av
strukturendringen gjenoppretter dem fra Git. For allerede distribuerte feilversjoner
publiseres rettelse med høyere versjonsnummer.
