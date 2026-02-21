---
name: designsystem
description: Ekspert på FHI Designsystem (@folkehelseinstituttet/designsystem). Bruk ved installasjon eller oppsett av designsystemet, bruk av FHI-komponenter (fhi-button, fhi-text-input, fhi-checkbox, etc.), bruk av FHI design tokens (farger, typografi, spacing), ikoner, eller rammeverk-integrasjon (React, Angular, Blazor).
---
<!-- Basert på @folkehelseinstituttet/designsystem v0.31.0 -->

# FHI Designsystem — Brukerveiledning

Bruk FHI Designsystem i egne prosjekter. Designsystemet er basert på standard web components og fungerer i alle rammeverk.

> **Pakke:** `@folkehelseinstituttet/designsystem` (v0.31.0 — latest)
> **Dokumentasjon:** https://designsystem.fhi.no/
> **GitHub:** https://github.com/FHIDev/Fhi.Designsystem
> **Verifisert mot:** `@folkehelseinstituttet/designsystem@0.31.0` (2026-02-19)
> **Støttepolicy:** Latest + 9 tidligere minor (totalt 10 minor). Se [`versions/INDEX.md`](versions/INDEX.md) for støttede versjoner.
>
> **Versjonsbehandling:**
> - Ingen versjon oppgitt → svar for latest (dette dokumentet).
> - Bruker sier "eksisterende app" men versjon ukjent → be om versjon før detaljert API-råd.
> - Versjon oppgitt → les [`versions/INDEX.md`](versions/INDEX.md), finn tilhørende delta-fil og les den. Delta-fil overstyrer motstridende informasjon i dette dokumentet.
> - Versjon utenfor support window → best effort, anbefal oppgradering.
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

**KRITISK**: Form-komponenter (fhi-text-input, fhi-checkbox, fhi-radio, fhi-date-input) deltar automatisk i native HTML `<form>` via ElementInternals. Sett `name`-attributt for FormData-deltakelse.

**VIKTIG**: Ikoner importeres som egne komponenter: `import '.../fhi-icon-search'`, ikke som en samlet ikonpakke.

**DEPRECATED (v0.31.0)**: `icon-only`-attributtet (kebab-case) på `fhi-button` er deprecated. Knappen detekterer automatisk om den kun inneholder et ikon.

```html
<!-- Deprecated i v0.31+: -->
<fhi-button icon-only variant="subtle" color="neutral">
  <fhi-icon-search></fhi-icon-search>
</fhi-button>

<!-- Anbefalt mønster (v0.31+): bruk ikon som eneste child uten attributtet -->
<fhi-button variant="subtle" color="neutral">
  <fhi-icon-search></fhi-icon-search>
</fhi-button>
```

**Merk:** `icon-only` var støttet (og ikke deprecated) i v0.22–v0.30. Se delta-filer under `versions/` for versjonsinfo.

---

## Komponenter og referanser

| Kategori | Komponent | Beskrivelse |
|----------|-----------|-------------|
| Form | [`fhi-button`](references/components/fhi-button.md) | Knapp med farger, varianter og størrelser |
| Form | [`fhi-text-input`](references/components/fhi-text-input.md) | Tekstfelt med label, hjelpetekst og validering |
| Form | [`fhi-date-input`](references/components/fhi-date-input.md) | Datofelt med kalender (YYYY-MM-DD) |
| Form | [`fhi-checkbox`](references/components/fhi-checkbox.md) | Avkrysningsboks |
| Form | [`fhi-radio`](references/components/fhi-radio.md) | Radioknapp (grupper med felles `name`) |
| Visuell | [`fhi-tag`](references/components/fhi-tag.md) | Status-/kategorimerke |
| Visuell | [`fhi-tooltip`](references/components/fhi-tooltip.md) | Tooltip med auto-posisjonering |
| Visuell | [`fhi-modal-dialog`](references/components/fhi-modal-dialog.md) | Modal dialog |
| Typografi | [`fhi-display`](references/components/fhi-display.md) | Display-tekst (stor, fremtredende) |
| Typografi | [`fhi-title`](references/components/fhi-title.md) | Tittel-tekst |
| Typografi | [`fhi-headline`](references/components/fhi-headline.md) | Overskrift (h1-h6) |
| Typografi | [`fhi-body`](references/components/fhi-body.md) | Brødtekst |
| Typografi | [`fhi-label`](references/components/fhi-label.md) | Label-tekst |
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
| [Versjonsguide](versions/GUIDE.md) | Beslutningsflyt og svarformat for versjonsspørsmål |

---

## Instruksjoner for Claude

1. **Versjon**: Sjekk alltid hvilken versjon brukeren har. Ingen versjon oppgitt = svar for latest. Versjon oppgitt = les [`versions/INDEX.md`](versions/INDEX.md) og tilhørende delta-fil. Se [`versions/GUIDE.md`](versions/GUIDE.md) for fullstendig beslutningsflyt.
2. **Komponent**: Les referansefilen under `references/components/` for den aktuelle komponenten.
3. **Forms**: Les [Form-bruk](references/form-usage.md) for FormData-integrasjon.
4. **Design tokens**: Les [Design tokens](references/design-tokens.md) for riktige token-navn.
5. **Ikoner**: Les [Ikonbruk](references/icon-usage.md) for import-mønster og tilgjengelige ikoner.

---

## Vedlikehold av denne skillen

Før merge av endringer, kjør følgende sjekker:
- `npm view @folkehelseinstituttet/designsystem version` — sjekk siste publiserte versjon
- Sammenlign komponenttabellen i SKILL.md mot publisert pakke:
  ```bash
  # List alle entrypoints i publisert pakke (unntatt ikoner og theme)
  npm pack @folkehelseinstituttet/designsystem --dry-run --json \
    | jq -r '.[0].files[].path' \
    | grep -E '^fhi-[^i]' | grep -v 'fhi-icon' | sort
  # Forventet: én linje per komponent (fhi-body.js, fhi-button.js, osv.)
  # Sammenlign manuelt mot komponenttabellen i SKILL.md
  ```
- Sjekk at relative markdown-lenker peker til eksisterende filer
