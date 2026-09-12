# fhi-link

Lenke til en side, et dokument eller et anker. Innført i v0.43.0.
Rendrer et native `<a>`-element i shadow DOM.

```typescript
import '@folkehelseinstituttet/designsystem/fhi-link';
```

## Properties

| Property | Attributt | Type | Default | Beskrivelse |
|----------|-----------|------|---------|-------------|
| `href` | `href` | `string \| undefined` | `undefined` | Lenkens URL, som for native `<a href>` |
| `target` | `target` | `'_self' \| '_blank' \| '_parent' \| '_top' \| undefined` | `undefined` | Hvor målet åpnes; uten verdi gjelder nettleserens kontekst, normalt samme fane |

`rel` er en beregnet readonly getter, ikke et konfigurerbart attributt.
Når `target` er satt og forskjellig fra `_self`, får det interne `<a>`-elementet
automatisk `rel="noopener noreferrer"`. Ellers utelates `rel`.

## Slot og bruk

Default slot inneholder lenketeksten. Beskriv målet, for eksempel
«Retningslinjer for rapportering», fremfor «Klikk her». Teksten skal gi mening
også uten setningen rundt. Oppgi gjerne nettstedet når lenken går eksternt.

Bruk normalt samme fane. Ny fane kan vurderes når navigasjon ellers kan føre
til tap av utfylt informasjon i en lengre prosess.

```html
<fhi-link href="/veiledning">Veiledning for rapportering</fhi-link>
<fhi-link href="https://www.fhi.no/" target="_blank">Folkehelseinstituttet (fhi.no)</fhi-link>
```

## Farge via CSS

Komponenten arver normalt tekstfargen (`currentcolor`) og bruker
`--fhi-color-accent-text-subtle` ved hover. Fra v0.43.0 kan komponentvariabelen
`--fhi-link-color` overstyres på vertselementet:

```css
fhi-link {
  --fhi-link-color: var(--fhi-color-danger-text-default);
}
```

Overstyringen gjelder også ved hover og erstatter dermed den vanlige
hover-fargen. Dette er verifisert atferd i publisert CSS, ikke en dokumentert
stabil stylingkontrakt. Variabelen er ikke et globalt theme-token og er ikke
beskrevet som `cssProperties` i manifestet eller i komponentens MDX.

[Dokumentasjon](https://designsystem.fhi.no/?path=/docs/komponenter-link--docs)
