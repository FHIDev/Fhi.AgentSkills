# Versjonsindeks

Baseline er alltid SKILL.md (latest v0.31.0).
Støttepolicy: Latest + 9 tidligere minor (totalt 10 minor).

| Versjon | Status      | Nøkkelavvik vs latest                             | Delta-fil       |
|---------|-------------|---------------------------------------------------|-----------------|
| 0.31.x  | Latest      | —                                                 | —               |
| 0.30.x  | Supported   | `icon-only` støttet (ikke deprecated)             | [v0.30.x.md](v0.30.x.md) |
| 0.29.x  | Supported   | `icon-only` støttet                               | [v0.29.x.md](v0.29.x.md) |
| 0.28.x  | Supported   | `fhi-modal-dialog` mangler; input event i 0.28.4  | [v0.28.x.md](v0.28.x.md) |
| 0.27.x  | Supported   | `fhi-modal-dialog` mangler                        | [v0.27.x.md](v0.27.x.md) |
| 0.26.x  | Supported   | `fhi-modal-dialog` mangler; verifisering kreves   | [v0.26.x.md](v0.26.x.md) |
| 0.25.x  | Supported   | Verifisering kreves                               | [v0.25.x.md](v0.25.x.md) |
| 0.24.x  | Supported   | Verifisering kreves                               | [v0.24.x.md](v0.24.x.md) |
| 0.23.x  | Supported   | Verifisering kreves                               | [v0.23.x.md](v0.23.x.md) |
| 0.22.x  | Supported   | Verifisering kreves; eldste støttede versjon      | [v0.22.x.md](v0.22.x.md) |
| < 0.22  | Ikke støttet | Best effort, anbefal oppgradering                | —               |

## Matching-regler

- Match på minor: `0.30.*` → `v0.30.x.md`
- Semver-range `^0.30.0` → `v0.30.x.md`
- Bare minor `0.30` (uten patch) → `v0.30.x.md`

## Patch-policy

Patch-versjoner følger nærmeste minor-delta, med mindre release notes indikerer event-/API-atferdsendring. Da dokumenteres det under "Patch notes med API-impact" i den aktuelle minor-deltaen.

## Kilder

Release notes finnes på GitHub: https://github.com/FHIDev/Fhi.Designsystem/releases
npm tarball brukes som fasit for faktisk publisert innhold dersom det er mismatch.
