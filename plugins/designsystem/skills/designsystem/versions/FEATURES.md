# Feature-historikk

Autoritativ kilde for **når public features ble innført** i
`@folkehelseinstituttet/designsystem`. Én rad per feature. Agenten beregner
«hva mangler i versjon X?» ved å filtrere på `Introduced > X`.

> **Dekningsgrense:** Tabellen dekker features innført **fra og med v0.41.0**.
> Features innført før grensen er dokumentert i delta-filenes «Missing vs
> latest»-seksjoner (se [INDEX.md](INDEX.md)) og skal ikke flyttes hit uten
> eksplisitt beslutning om historisk migrering.

Ved hver release: legg til én rad per ny public feature (ny komponent, nytt
attributt, ny slot, nytt event, ny metode, nytt ikon, ny entrypoint, deprecation,
endret default-atferd). `Source` skal peke på konkret upstream-artefakt.
Eldre delta-filer skal **ikke** backfylles.

Tabellen omfatter også verifiserte atferdsrettelser og komponentenes
CSS-tilpasninger og fjerning av eldre overstyringer. CSS-rader merket «uten stabilitetsgaranti» beskriver
faktisk publisert atferd, ikke en dokumentert stabil stylingkontrakt eller
nye globale theme-tokens. Les komponentreferansen eller den lenkede delta-filen for begrensninger.

| Feature | Introduced | Type | Scope | Source |
|---------|------------|------|-------|--------|
| Ny komponent `fhi-select` (nedtrekksliste, form-assosiert) med entrypoint `./fhi-select` | 0.41.0 | Komponent + entrypoint | `fhi-select` | `custom-elements.json` og `package.json` (exports) i tarball v0.41.2; upstream PR #434 |
| Ny komponent `fhi-select-item` (alternativ i `fhi-select`) med entrypoint `./fhi-select-item` | 0.41.0 | Komponent + entrypoint | `fhi-select-item` | `custom-elements.json` og `package.json` (exports) i tarball v0.41.2; upstream PR #434 |
| Eldre CSS-overstyringer på vertselementet fjernes, blant annet `--color-background` og `--dimension-padding`; se [patch-/migreringsnotat](v0.41.x.md#patch-notes-med-api-impact) | 0.41.3 | CSS-endring uten stabilitetsgaranti | `fhi-tooltip` | `src/components/fhi-tooltip/fhi-tooltip.component.ts`, [tag-diff v0.41.2 → v0.41.3](https://github.com/FHIDev/Fhi.Designsystem/compare/v0.41.2...v0.41.3) |
| Ny komponent `fhi-callout` med entrypoint `./fhi-callout` | 0.42.0 | Komponent + entrypoint | `fhi-callout` | Publisert `package.json` og `fhi-callout.manifest.json` v0.42.0; upstream PR #445 |
| `show()` etterfulgt av `close()` gjenoppretter sidens scrolling | 0.42.1 | Atferdsrettelse | `fhi-modal-dialog` | `src/components/fhi-modal-dialog/fhi-modal-dialog.component.ts`, tag-diff v0.42.0 → v0.42.1; PR #477 |
| Overstyrbar bredde via `--fhi-modal-dialog-width` | 0.42.2 | CSS-tilpasning uten stabilitetsgaranti | `fhi-modal-dialog` | Publisert `fhi-modal-dialog.js`, diff v0.42.1 → v0.42.2; [PR #464](https://github.com/FHIDev/Fhi.Designsystem/pull/464) |
| Ny komponent `fhi-link` med entrypoint `./fhi-link` | 0.43.0 | Komponent + entrypoint | `fhi-link` | Publisert `package.json` og `fhi-link.manifest.json` v0.43.0; PR #473 |
| Overstyrbar farge via `--fhi-link-color`, også ved hover | 0.43.0 | CSS-tilpasning uten stabilitetsgaranti | `fhi-link` | Publisert `fhi-link.js` v0.43.0; PR #473 |
| Reagerer på endringer i barnas `selected`-, `value`- og `label`-attributter; eksisterende ikke-tom select-verdi prioriteres fortsatt | 0.43.2 | Atferd | `fhi-select` | `src/components/select/fhi-select/fhi-select.component.ts`, tag-diff v0.43.1 → v0.43.2; publisert `fhi-select.js`; PR #492 |
| Ikke-tom `value` på select prioriteres foran barnas `selected`, også ved initial rendering | 0.43.2 | Atferd | `fhi-select` | Samme TypeScript-diff og publisert `fhi-select.js` v0.43.2; PR #492 |
| Trimmer tekst brukt som fallback når alternativets `value` mangler | 0.43.2 | Atferd | `fhi-select-item` i `fhi-select` | Publisert `fhi-select.js`, diff v0.43.0 → v0.43.2; PR #492 |
| Visningslabel bruker igjen tekstinnhold som fallback etter regresjonen med kodeverdi i v0.43.2 | 0.43.3 | Atferdsrettelse | `fhi-select` | Publisert `fhi-select.js`, diff v0.43.2 → v0.43.3; PR #495 |
