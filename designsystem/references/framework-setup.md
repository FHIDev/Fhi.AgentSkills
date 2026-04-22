# Rammeverk-oppsett

Oppsett av FHI Designsystem i ulike rammeverk. Forutsetter at pakken er installert:

```bash
npm install @folkehelseinstituttet/designsystem
```

---

## IDE-støtte (intellisense og typesjekking)

Designsystemet leverer metadata for webkomponenter via `custom-elements.json` og
`web-types.json`. Fra **v0.34.0** publiseres i tillegg eksplisitte `exports`-entrier
og `.d.ts`-filer per komponent-entrypoint, som gir bedre subpath-import-gjenkjenning
i TypeScript-prosjekter.

### VS Code

1. Pek på `custom-elements.json` i `.vscode/settings.json`:

```json
{
  "html.customData": [
    "./node_modules/@folkehelseinstituttet/designsystem/custom-elements.json"
  ]
}
```

2. Installer utvidelsen [Web Component Language Server](https://wc-toolkit.com/integrations/web-components-language-server/).

Dette gir intellisense for attributter, events og slots i HTML-maler.

### WebStorm / JetBrains-IDE-er

`web-types.json` leses automatisk — ingen konfigurasjon nødvendig.

**Kjente begrensninger:** WebStorm har foreløpig ufullstendig støtte for
egendefinerte elementer; typesjekking og intellisense kan være upålitelig.
Funksjonaliteten i nettleseren påvirkes ikke. JetBrains forbedrer støtten i
nyere versjoner — se [WEB-49361](https://youtrack.jetbrains.com/issue/WEB-49361).

### Generelle begrensninger

- Komponentene er ikke fullt typesatt ennå. TypeScript-/JSX-kompilatorer
  typesjekker ikke attributter på `fhi-*`-elementer.
- Andre IDE-er er ikke dokumentert eller verifisert her.

---

## React 19+

```tsx
// main.tsx
import '@folkehelseinstituttet/designsystem/theme/default.css';
import '@folkehelseinstituttet/designsystem/fhi-button';

function App() {
  return <fhi-button onClick={() => alert('Klikk!')}>Lagre</fhi-button>;
}
```

React 19 støtter custom elements direkte i JSX. Eldre React-versjoner støttes
ikke — se [React sin dokumentasjon](https://react.dev/reference/react-dom/components#custom-html-elements).

**TypeScript:** Legg til global type-deklarasjon for å unngå JSX-feil:

```typescript
// global.d.ts
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: `fhi-${string}`]: { [attribute: string]: unknown; };
    }
  }
}
```

Dette er en midlertidig løsning inntil komponentene er fullt typesatt.

---

## Angular

### Oppsett

1. Legg til `CUSTOM_ELEMENTS_SCHEMA` i komponenten (eller i `NgModule` ved gammel
   modulstruktur):

```typescript
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // ...
})
```

2. Legg til theme CSS i `angular.json`:

```json
{
  "styles": [
    "node_modules/@folkehelseinstituttet/designsystem/theme/default.css",
    "src/styles.css"
  ]
}
```

3. Importer komponenter i TypeScript:

```typescript
import '@folkehelseinstituttet/designsystem/fhi-button';
```

### Om `CUSTOM_ELEMENTS_SCHEMA`

Schemaet forteller Angular at ukjente element-tags er gyldige custom elements,
slik at Angular-kompilatoren ikke feiler. Bieffekter å være klar over:

- Angular-kompilatoren slutter å gi direkte advarsler for ukjente tags og
  skiller derfor ikke lenger mellom custom elements og feilstavede
  Angular-komponent-tags. Enkelte IDE-oppsett kan fortsatt indirekte varsle
  via intellisense, men dette er ikke garantert.
- Angulars støtte for custom elements er fortsatt under utvikling
  ([Angular issue 62484](https://github.com/angular/angular/issues/62484)).

### Angular Forms

FHI sine form-komponenter deltar i native HTML `<form>` via `ElementInternals`,
men Angular Forms krever `ControlValueAccessor` for toveis databinding med
`ngModel`/`formControl`/`formControlName`.

**Modulkrav:** `ngModel` krever at `FormsModule` er importert; `[formGroup]` og
`formControlName` krever `ReactiveFormsModule`. Importer disse enten i modulen
(ved `NgModule`-struktur) eller i `imports`-listen på standalone-komponenten.

**Valg 1 — `ngDefaultControl`-direktiv (enkleste løsning for tekstfelt):**

```html
<fhi-text-input ngDefaultControl name="myInput" [(ngModel)]="myModel" />
```

Krever `FormsModule`. Fungerer bra for tekst-lignende komponenter
(`fhi-text-input`). For ikke-tekst-komponenter (`fhi-radio`, `fhi-checkbox`),
bruk valg 2.

**Valg 2 — gjenbruk Angulars `ControlValueAccessor`-klasser som direktiver
(anbefalt for alle form-komponenter):**

```typescript
import { Directive, forwardRef } from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  DefaultValueAccessor,
  CheckboxControlValueAccessor,
  RadioControlValueAccessor,
} from '@angular/forms';

@Directive({
  selector: 'fhi-radio[formControlName],fhi-radio[formControl],fhi-radio[ngModel]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FHIRadioValueAccessor),
    multi: true,
  }],
})
export class FHIRadioValueAccessor extends RadioControlValueAccessor {}

@Directive({
  selector: 'fhi-checkbox[formControlName],fhi-checkbox[formControl],fhi-checkbox[ngModel]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FHICheckboxValueAccessor),
    multi: true,
  }],
})
export class FHICheckboxValueAccessor extends CheckboxControlValueAccessor {}

@Directive({
  selector: 'fhi-text-input[formControlName],fhi-text-input[formControl],fhi-text-input[ngModel]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FHITextInputValueAccessor),
    multi: true,
  }],
})
export class FHITextInputValueAccessor extends DefaultValueAccessor {}
```

Importer direktivene og `ReactiveFormsModule` i Angular-komponenten:

```typescript
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FHITextInputValueAccessor,
    FHICheckboxValueAccessor,
    FHIRadioValueAccessor,
    // ...
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // ...
})
export class AppComponent {
  myForm = new FormGroup({
    myTextInput: new FormControl(''),
    myRadio: new FormControl(''),
    myCheckbox: new FormControl(false),
  });
}
```

```html
<form [formGroup]="myForm">
  <fhi-text-input formControlName="myTextInput" label="Tekstfelt"></fhi-text-input>
  <fhi-radio formControlName="myRadio" value="option1" label="Alternativ 1"></fhi-radio>
  <fhi-radio formControlName="myRadio" value="option2" label="Alternativ 2"></fhi-radio>
  <fhi-checkbox formControlName="myCheckbox" label="Avkrysningsboks"></fhi-checkbox>
</form>
```

Uten Angular Forms (vanlig HTML-form, JS-event-håndtering) trengs ingen av disse
direktivene — komponentene fungerer direkte.

---

## Blazor

Kopier designsystem-filene fra `node_modules` til `wwwroot` (f.eks. via MSBuild-target eller manuelt), og legg til CSS og script i `index.html` eller `_Host.cshtml`.

**Velg én av to strategier — ikke begge:**

**Alternativ A: Last alle komponenter (enkelt, større bundle)**

```html
<link rel="stylesheet" href="designsystem/theme/default.css">
<script type="module" src="designsystem/index.js"></script>
```

**Alternativ B: Last kun komponentene du bruker (mindre bundle)**

```html
<link rel="stylesheet" href="designsystem/theme/default.css">
<script type="module" src="designsystem/fhi-button.js"></script>
<script type="module" src="designsystem/fhi-text-input.js"></script>
```

**Merk:** Bruk `@onfocusin`/`@onfocusout` i stedet for `@onfocus`/`@onblur` for korrekt event-bubbling.
