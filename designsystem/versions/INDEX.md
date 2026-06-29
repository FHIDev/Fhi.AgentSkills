# Versjonsindeks

Baseline er alltid SKILL.md (latest v0.40.0).
Støttepolicy: Latest + 9 tidligere minor (totalt 10 minor).

| Versjon | Status      | Nøkkelavvik vs latest                             | Delta-fil       |
|---------|-------------|---------------------------------------------------|-----------------|
| 0.40.x  | Latest      | —                                                 | —               |
| 0.39.x  | Supported   | `fhi-tag` mangler `variant="bordered"`            | [v0.39.x.md](v0.39.x.md) |
| 0.38.x  | Supported   | `fhi-tag` mangler `bordered`; typografi-default ≠ `currentcolor` | [v0.38.x.md](v0.38.x.md) |
| 0.37.x  | Supported   | Mangler `fhi-tag` `bordered` og `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.37.x.md](v0.37.x.md) |
| 0.36.x  | Supported   | Mangler Data Table, `fhi-tag` `bordered`, `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.36.x.md](v0.36.x.md) |
| 0.35.x  | Supported   | Mangler Data Table, `fhi-tag` `bordered`, `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.35.x.md](v0.35.x.md) |
| 0.34.x  | Supported   | `fhi-text-input` mangler `start`/`end` ikon-slots; eldre input-width-atferd; inkl. nyere 0.35–0.40-avvik | [v0.34.x.md](v0.34.x.md) |
| 0.33.x  | Supported   | Mangler publiserte `exports`/`.d.ts` for import-intellisense; inkl. nyere 0.35–0.40-avvik | [v0.33.x.md](v0.33.x.md) |
| 0.32.x  | Supported   | `fhi-grid` mangler `rows`-property; inkl. nyere 0.35–0.40-avvik | [v0.32.x.md](v0.32.x.md) |
| 0.31.x  | Supported   | Robustere håndtering av null-/ugyldige verdier i latest; inkl. nyere 0.35–0.40-avvik | [v0.31.x.md](v0.31.x.md) |
| < 0.31  | Ikke støttet | Best effort, anbefal oppgradering                | —               |

## Matching-regler

- Match på minor: `0.39.*` → `v0.39.x.md`
- Semver-range `^0.31.0` → `v0.31.x.md`
- Bare minor `0.31` (uten patch) → `v0.31.x.md`

## Patch-policy

Patch-versjoner følger nærmeste minor-delta, med mindre release notes indikerer event-/API-atferdsendring. Da dokumenteres det under "Patch notes med API-impact" i den aktuelle minor-deltaen.

## Kilder

Release notes finnes på GitHub: https://github.com/FHIDev/Fhi.Designsystem/releases
npm tarball brukes som fasit for faktisk publisert innhold dersom det er mismatch.
