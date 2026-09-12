# Versjonsindeks

Baseline er alltid SKILL.md (latest v0.43.5).
Støttepolicy: Latest + 9 tidligere minor (totalt 10 minor).

| Versjon | Status      | Nøkkelavvik vs latest                             | Delta-fil       |
|---------|-------------|---------------------------------------------------|-----------------|
| 0.43.x  | Latest      | Patch-avvik i Select før 0.43.3: se [Select](../references/components/fhi-select.md#patch-avvik) | — |
| 0.42.x  | Supported   | Mangler `fhi-link`; eldre Select-atferd; modal-patchgrenser i 0.42.1/0.42.2 (se FEATURES.md) | [v0.42.x.md](v0.42.x.md) |
| 0.41.x  | Supported   | Mangler `fhi-callout`/`fhi-link`; eldre Select-atferd og modal-scrolling; tooltip-CSS endret i 0.41.3 (se FEATURES.md) | [v0.41.x.md](v0.41.x.md) |
| 0.40.x  | Supported   | Mangler `fhi-select`/`fhi-select-item` (se FEATURES.md); patch-avvik i 0.40.0–0.40.6 (font, typografi-color) | [v0.40.x.md](v0.40.x.md) |
| 0.39.x  | Supported   | `fhi-tag` mangler `variant="bordered"`            | [v0.39.x.md](v0.39.x.md) |
| 0.38.x  | Supported   | `fhi-tag` mangler `bordered`; typografi-default ≠ `currentcolor` | [v0.38.x.md](v0.38.x.md) |
| 0.37.x  | Supported   | Mangler `fhi-tag` `bordered` og `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.37.x.md](v0.37.x.md) |
| 0.36.x  | Supported   | Mangler Data Table, `fhi-tag` `bordered`, `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.36.x.md](v0.36.x.md) |
| 0.35.x  | Supported   | Mangler Data Table, `fhi-tag` `bordered`, `fhi-icon-file-text`; typografi-default ≠ `currentcolor` | [v0.35.x.md](v0.35.x.md) |
| 0.34.x  | Supported   | `fhi-text-input` mangler `start`/`end` ikon-slots; eldre input-width-atferd; inkl. nyere 0.35–0.40-avvik | [v0.34.x.md](v0.34.x.md) |
| < 0.34  | Ikke støttet | Best effort, anbefal oppgradering                | —               |

Matching- og patch-regler: se [GUIDE.md](GUIDE.md).
Innføringsversjoner for nye features (fra og med v0.41): se [FEATURES.md](FEATURES.md).

## Kilder

Release notes finnes på GitHub: https://github.com/FHIDev/Fhi.Designsystem/releases
npm tarball brukes som fasit for faktisk publisert innhold dersom det er mismatch.
