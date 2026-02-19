# Rammeverk-oppsett

Oppsett av FHI Designsystem i ulike rammeverk. Forutsetter at pakken er installert:

```bash
npm install @folkehelseinstituttet/designsystem
```

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

**TypeScript:** Legg til type-deklarasjon for å unngå JSX-feil:

```typescript
// global.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: `fhi-${string}`]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
```

---

## Angular

1. Legg til `CUSTOM_ELEMENTS_SCHEMA` i komponenten:

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

---

## Blazor

Kopier designsystem-filene fra `node_modules` til `wwwroot` (f.eks. via MSBuild-target eller manuelt), og legg til CSS og script i `index.html` eller `_Host.cshtml`:

```html
<link rel="stylesheet" href="designsystem/theme/default.css">
<script type="module" src="designsystem/fhi-designsystem.js"></script>
```

**Merk:** Bruk `@onfocusin`/`@onfocusout` i stedet for `@onfocus`/`@onblur` for korrekt event-bubbling.
