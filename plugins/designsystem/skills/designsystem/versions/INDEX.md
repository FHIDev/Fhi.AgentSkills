# Versjonsindeks

Baseline er alltid SKILL.md (latest v0.47.1).
Støttepolicy: Latest + 9 tidligere minor (totalt 10 minor).

| Versjon | Status      | Nøkkelavvik vs latest                             | Delta-fil       |
|---------|-------------|---------------------------------------------------|-----------------|
| 0.47.x  | Latest      | — | — |
| 0.46.x  | Supported   | Mangler `fhi-segmented-control` (se FEATURES.md) | [v0.46.x.md](v0.46.x.md) |
| 0.45.x  | Supported   | Mangler `fhi-body` `strong`/`emphasized`; `fhi-tag` icon-slot fra 0.45.2, ikonoffset fra 0.45.4 (se FEATURES.md) | [v0.45.x.md](v0.45.x.md) |
| 0.44.x  | Supported   | Mangler `fhi-text-area` (se FEATURES.md) | [v0.44.x.md](v0.44.x.md) |
| 0.43.x  | Supported   | Mangler checkbox-/radio-hjelpetekst og `fhi-text-area`; Select-patchavvik før 0.43.3 | [v0.43.x.md](v0.43.x.md) |
| 0.42.x  | Supported   | Mangler `fhi-link`; eldre Select-atferd; modal-patchgrenser i 0.42.1/0.42.2 (se FEATURES.md) | [v0.42.x.md](v0.42.x.md) |
| 0.41.x  | Supported   | Mangler `fhi-callout`/`fhi-link`; eldre Select-atferd og modal-scrolling; tooltip-CSS endret i 0.41.3 (se FEATURES.md) | [v0.41.x.md](v0.41.x.md) |
| 0.40.x  | Supported   | Mangler `fhi-select`/`fhi-select-item` (se FEATURES.md); patch-avvik i 0.40.0–0.40.6 (font, typografi-color) | [v0.40.x.md](v0.40.x.md) |
| 0.39.x  | Supported   | `fhi-tag` mangler `variant="bordered"`            | [v0.39.x.md](v0.39.x.md) |
| 0.38.x  | Supported   | `fhi-tag` mangler `bordered`; typografi-default ≠ `currentcolor` | [v0.38.x.md](v0.38.x.md) |
| < 0.38  | Ikke støttet | Best effort, anbefal oppgradering                | —               |

Matching- og patch-regler: se [GUIDE.md](GUIDE.md).
Innføringsversjoner for nye features (fra og med v0.41): se [FEATURES.md](FEATURES.md).

## Kilder

Release notes finnes på GitHub: https://github.com/FHIDev/Fhi.Designsystem/releases
npm tarball brukes som fasit for faktisk publisert innhold dersom det er mismatch.
