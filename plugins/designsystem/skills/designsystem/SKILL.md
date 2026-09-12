---
name: designsystem
description: Ekspert på FHI Designsystem (@folkehelseinstituttet/designsystem, designsystem.fhi.no). Bruk ved installasjon eller oppsett av designsystemet, bruk av FHI-komponenter (fhi-button, fhi-text-input, fhi-checkbox, etc.), bruk av FHI design tokens (farger, typografi, spacing), ikoner, rammeverk-integrasjon (React, Angular, Blazor), eller spørsmål om komponenter brukeren har sett i designsystemets Storybook. Gjelder også når brukeren sier «FHI-komponent» eller bygger skjema/UI i en FHI-app uten å nevne designsystemet eksplisitt.
---
<!-- Basert på @folkehelseinstituttet/designsystem v0.41.2 -->

# FHI Designsystem — Brukerveiledning

Bruk FHI Designsystem i egne prosjekter. Designsystemet er basert på standard web components og fungerer i alle rammeverk.

> **Pakke:** `@folkehelseinstituttet/designsystem` (v0.41.2 — latest)
> **Dokumentasjon:** https://designsystem.fhi.no/
> **GitHub:** https://github.com/FHIDev/Fhi.Designsystem
> **Figma:** https://www.figma.com/design/VgQG6XeEbFOmHIrxyAOACR/FHI-Designsystem
> **Verifisert mot:** `@folkehelseinstituttet/designsystem@0.41.2` (2026-07-05)
> **Støttepolicy:** Latest + 9 tidligere minor (totalt 10 minor). Se [`versions/INDEX.md`](versions/INDEX.md) for støttede versjoner.
>
> **Versjonsbehandling:**
> - **Sjekk alltid prosjektets `package.json` for `@folkehelseinstituttet/designsystem` FØR du svarer.** Gi ikke detaljert API-råd før versjon er fastslått. Kun hvis `package.json` ikke er tilgjengelig → be brukeren oppgi versjon.
> - **Fast path (latest):** Hvis versjonen matcher versjonen i `<!-- Basert på ... -->` øverst → svar direkte fra dette dokumentet og referansefilene. Ikke les `versions/`. Unntak: spørsmål som eksplisitt gjelder migrering, eldre versjoner eller støttepolicy — da leses [`versions/INDEX.md`](versions/INDEX.md) og [`versions/GUIDE.md`](versions/GUIDE.md) uansett.
> - **Eldre versjon:** Les [`versions/INDEX.md`](versions/INDEX.md), finn tilhørende delta-fil og les den. Delta-fil overstyrer motstridende informasjon i dette dokumentet.
> - **Versjon utenfor support window:** Best effort, anbefal oppgradering.
> - Se [`versions/GUIDE.md`](versions/GUIDE.md) for fullstendig beslutningsflyt og svarformat.

---

## Installasjon

```bash
npm install @folkehelseinstituttet/designsystem
```

### Theme CSS (påkrevd)

Theme-filen inneholder alle design tokens (farger, typografi, spacing) og fonten Roboto Flex. Den **må** importeres før komponentene brukes.

```typescript
// I hovedfilen (main.ts, app.ts, e.l.)
import '@folkehelseinstituttet/designsystem/theme/default.css';
```

### Importere komponenter

Importer hver komponent individuelt:

```typescript
import '@folkehelseinstituttet/designsystem/fhi-button';
import '@folkehelseinstituttet/designsystem/fhi-text-input';
import '@folkehelseinstituttet/designsystem/fhi-icon-search';
```

Etter import er komponentene tilgjengelige som HTML-elementer:

```html
<fhi-button>Lagre</fhi-button>
<fhi-text-input label="Navn" name="name"></fhi-text-input>
```

### CDN (kun prototyping — ikke anbefalt for produksjon)

```html
<link rel="stylesheet" href="https://cdn.designsystem.fhi.no/theme/default.css">
<script type="module" src="https://cdn.designsystem.fhi.no/fhi-designsystem.js" crossorigin="anonymous"></script>
```

CDN laster **hele** biblioteket. For produksjon, bruk npm for tree-shaking.

For React, Angular eller Blazor, se [Rammeverk-oppsett](references/framework-setup.md).

---

## Kritiske regler

**KRITISK**: Importer alltid `theme/default.css` **før** komponentene brukes. Uten theme-filen mangler alle design tokens, og komponentene rendres uten styling.

**KRITISK**: Bruk alltid **semantiske design tokens** i egen CSS. Aldri bruk hardkodede farge- eller størrelsesverdier. Bruk `var(--fhi-color-accent-base-default)`, ikke `#2a76c6`.

**KRITISK**: Form-komponenter (fhi-text-input, fhi-checkbox, fhi-radio, fhi-date-input, fhi-select) deltar automatisk i native HTML `<form>` via ElementInternals. Sett `name`-attributt for FormData-deltakelse.

**VIKTIG**: Ikoner importeres som egne komponenter: `import '.../fhi-icon-search'`, ikke som en samlet ikonpakke.

**DEPRECATED (v0.31.0)**: `icon-only`-attributtet på `fhi-button` er deprecated — knappen detekterer automatisk om den kun inneholder et ikon. Se [`fhi-button`](references/components/fhi-button.md) for anbefalt mønster og versjonsinfo.

---

## Komponenter og referanser

| Kategori | Komponent | Beskrivelse |
|----------|-----------|-------------|
| Form | [`fhi-button`](references/components/fhi-button.md) | Knapp med farger, varianter og størrelser |
| Form | [`fhi-text-input`](references/components/fhi-text-input.md) | Tekstfelt med label, hjelpetekst, validering og ikon-slots (`start`/`end`, fra v0.35.0) |
| Form | [`fhi-date-input`](references/components/fhi-date-input.md) | Datofelt med kalender (YYYY-MM-DD) |
| Form | [`fhi-checkbox`](references/components/fhi-checkbox.md) | Avkrysningsboks |
| Form | [`fhi-radio`](references/components/fhi-radio.md) | Radioknapp (grupper med felles `name`) |
| Form | [`fhi-select`](references/components/fhi-select.md) | Nedtrekksliste — fra v0.41.0 |
| Form | [`fhi-select-item`](references/components/fhi-select.md) | Alternativ i `fhi-select` |
| Visuell | [`fhi-tag`](references/components/fhi-tag.md) | Status-/kategorimerke |
| Visuell | [`fhi-tooltip`](references/components/fhi-tooltip.md) | Tooltip med auto-posisjonering |
| Visuell | [`fhi-modal-dialog`](references/components/fhi-modal-dialog.md) | Modal dialog |
| Data | [`fhi-data-table`](references/components/fhi-data-table.md) | Tabell-container (caption, striped) — fra v0.37.0 |
| Data | [`fhi-data-table-row`](references/components/fhi-data-table.md) | Tabellrad (`variant` header/body) |
| Data | [`fhi-data-table-cell`](references/components/fhi-data-table.md) | Tabellcelle |
| Typografi | [`fhi-display`](references/components/typography.md) | Display-tekst (stor, fremtredende) |
| Typografi | [`fhi-title`](references/components/typography.md) | Tittel-tekst |
| Typografi | [`fhi-headline`](references/components/typography.md) | Overskrift (h1-h6) |
| Typografi | [`fhi-body`](references/components/typography.md) | Brødtekst |
| Typografi | [`fhi-label`](references/components/typography.md) | Label-tekst |
| Layout | [`fhi-flex`](references/components/fhi-flex.md) | Flexbox-container |
| Layout | [`fhi-grid`](references/components/fhi-grid.md) | CSS Grid-container |
| Ikoner | [`fhi-icon-{navn}`](references/icon-usage.md) | Ikoner basert på Lucide Icons (se [ikonlisten](references/icon-usage.md)) |

### Øvrige referanser

| Dokument | Innhold |
|----------|---------|
| [Rammeverk-oppsett](references/framework-setup.md) | React, Angular, Blazor |
| [Form-bruk](references/form-usage.md) | FormData, reset, submit |
| [Design tokens](references/design-tokens.md) | Farger, typografi, spacing, border, motion |
| [Versjonsindeks](versions/INDEX.md) | Støttede versjoner og nøkkelavvik vs latest |
| [Feature-historikk](versions/FEATURES.md) | Når public features ble innført (fra og med v0.41) |
| [Versjonsguide](versions/GUIDE.md) | Beslutningsflyt og svarformat for versjonsspørsmål |

---

## Instruksjoner for Claude

1. **Versjon**: Følg **Versjonsbehandling** øverst i dokumentet (fast path for latest; delta-fil for eldre versjoner).
2. **Komponent**: Les referansefilen under `references/components/` for den aktuelle komponenten.
3. **Forms**: Les [Form-bruk](references/form-usage.md) for FormData-integrasjon.
4. **Design tokens**: Les [Design tokens](references/design-tokens.md) for riktige token-navn.
5. **Ikoner**: Les [Ikonbruk](references/icon-usage.md) for import-mønster og tilgjengelige ikoner.

> Vedlikehold av denne skillen gjøres med `oppdater-designsystem`-skillen i dette repoet.
