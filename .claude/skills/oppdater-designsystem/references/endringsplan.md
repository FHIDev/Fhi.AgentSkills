# Steg 4–5 – Analyser, lag endringsplan og gjennomfør endringer

## Steg 4 – Analyser og lag endringsplan

Sammenlign kildekoden fra taggen med innholdet i `designsystem/`-skillen. Lag en
strukturert endringsplan. Bruk denne sjekklisten systematisk før du skriver planen:

1. **Public API:** Sammenlign `custom-elements.json` / `web-types.json` / publisert pakke med
   komponentreferansene i `designsystem/references/components/` for komponenter, attributter,
   properties, events, metoder, slots og tag-navn.
2. **Runtime-atferd:** Les relevant TypeScript for å fange opp effective defaults,
   normalisering av ugyldige verdier, runtime-validering, warnings/deprecations og
   event-/metodeoppførsel som ikke alltid fremgår av manifests.
3. **Semantikk og bruk:** Les relevant `.docs.mdx` / konsolidert docs og verifiser at
   skillen dekker bruksscenarier, variant-regler, retningslinjer, tilgjengelighet,
   kjente bugs/begrensninger og eventuelle rammeverksnotater.
4. **Publiserte artefakter:** Verifiser exports/entrypoints, ikon-entrypoints,
   `theme/default.css`, andre theme/token-filer og eventuelle README-/installasjonsfiler i
   den publiserte pakken.
5. **Kompatibilitet:** Sammenlign `peerDependencies` og eventuelle `engines`/andre
   kompatibilitetsfelt mellom forrige og ny versjon. Dokumenter bare endringer som faktisk
   påvirker installasjon, oppsett eller brukerråd.
6. **Stale latest-referanser:** Bruk stale-listen fra kildelesingen (3.0) til å identifisere
   filer med versjonsstrenger som peker på forrige latest. Selve oppdateringen gjøres i
   den samlede stale-sjekken (se [versjonsinfrastruktur.md](versjonsinfrastruktur.md)).
7. **Design tokens (farger, typografi, spacing m.m.):** Sammenlign `default.css` med
   `references/design-tokens.md`. Verifiser at skillen dekker:
   - Alle primitive fargepaletter (f.eks. `--fhi-red-*`, `--fhi-blue-*`, `--fhi-green-*` osv.)
     og deres stopp-skala
   - Mapping mellom semantiske og primitive tokens (f.eks. at `neutral-*` er mappet til
     `greyblue`-paletten, `accent-*` til `blue`, osv.)
   - Konseptuell forklaring av to-lags-modellen (primitiv → semantisk) fra design-token MDX-docs
   - Eventuelle nye token-kategorier eller endrede verdier
8. **Eksterne ressurser:** Sjekk om MDX-filer (spesielt `overview.mdx`, `introduction.mdx`,
   design-token-docs) inneholder lenker til Figma, gamle docs-sider eller andre eksterne
   ressurser som bør inkluderes i skillen som referanser.
9. **Upstreams `ai-tooling/SKILL.md`:** Sammenlign med repo-skillen. Avvik (råd upstream
   gir som repo-skillen mangler, eller motstridende anbefalinger) tas inn i planen som
   **vurderingspunkter**. Upstream-skillen overskriver aldri lokal kuratert kunnskap
   automatisk.
10. **Kilde-diff mot forrige arkiv:** Sammenlign artefaktlisten i
    `designsystem/versions/sources/v{forrige}/` med den nye versjonens artefakter.
    Alt som *forsvinner* fra kilden skal eksplisitt vurderes: flyttet hvor? fortsatt
    gyldig? bevart i skillen hvor? Konklusjonen tas inn i planen.

### Domene-dekning

Verifiser at følgende domener er dekket i skillen etter oppdatering. Bruk denne listen
som sjekkliste — hvert domene skal vurderes eksplisitt, slik at ingen deler faller mellom
stolene:

| Domene | Hovedfil | Referansefil(er) |
|--------|----------|------------------|
| Installasjon og imports | `SKILL.md` (installasjon, importmønster) | `references/framework-setup.md` |
| Theme / design tokens | `SKILL.md` (kritiske regler) | `references/design-tokens.md` |
| Komponent-API | `SKILL.md` (komponenttabell) | `references/components/*.md` |
| Ikoner | `SKILL.md` (ikonimport) | `references/icon-usage.md` |
| Skjemabruk | `SKILL.md` (kritiske regler) | `references/form-usage.md` |
| Rammeverk (React, Angular, Blazor) | `SKILL.md` (lenke) | `references/framework-setup.md` |
| Versjonsstøtte / deltaer | `SKILL.md` (støttepolicy) | `versions/INDEX.md`, `versions/FEATURES.md`, `versions/v*.md` |

For hvert domene, verifiser:
- Innholdet i referansefilen stemmer med kildekoden fra taggen
- Terminologi og anbefalinger er konsistente mellom hovedfil og referansefil
- Informasjonen hjelper en AI-agent å gi riktige svar — ikke bare at den er korrekt

### Mangler

Innhold som finnes i kildekoden, men ikke i skillen. Eksempler:
- Nye komponenter som ikke er dokumentert
- Props/API-endringer som ikke er reflektert
- Nye CSS-variabler eller design tokens
- Installasjonsinstruksjoner som mangler
- Bruksscenarier eller kjente begrensninger fra docs som ikke er reflektert
- Nye public manifests eller publiserte artefakter som skillen ikke tar høyde for

### Feil eller utdatert innhold

Innhold i skillen som ikke lenger stemmer med kildekoden. Eksempler:
- Feil pakkenavn eller versjonsnummer
- Utgåtte props eller API-er
- Endrede importstier
- Gammel installasjonsmetode
- Feil effective default fordi runtime-logikk overstyrer deklarert/default antatt verdi
- Manglende kompatibilitetsnotat ved endring i `peerDependencies` eller lignende

### Andre forbedringer (kun kildedekning)

Forbedringer som reduserer risikoen for informasjons-tap eller gjør fremtidige verifiseringer
mer presise, **men som fortsatt må være forankret i konkrete observasjoner fra kildene**.
Eksempler:
- En kontraktsjekk som mangler for et nytt publisert artefakt
- Presisering av hvordan en konsolidert docs-kilde mappes til eksisterende referansefiler

Ikke bruk denne kategorien til stilistisk omskriving.

### Format for endringsplanen

Hver post i planen skal angi **hvilken fil** i `designsystem/` som må oppdateres og
**kildegrunnlag** (hvilken upstream-fil eller artefakt som underbygger endringen).

Presenter planen slik:

```
## Endringsplan – Designsystem-skill
Versjon analysert: v{versjon}
Dato: {dato}

### Mangler
- [ ] {beskrivelse} — Fil: `{designsystem/...}` — Kilde: `{upstream-fil}`

### Feil / utdatert
- [ ] {beskrivelse} — Fil: `{designsystem/...}` — Kilde: `{upstream-fil}`

### Forbedringer
- [ ] {beskrivelse} — Fil: `{designsystem/...}` — Kilde: `{upstream-fil}`
```

**Vent på godkjenning fra bruker før du går videre til steg 5.**

---

## Steg 5 – Gjennomfør endringer

Etter godkjenning, oppdater filene i `designsystem/`-mappen. Skillen skal dekke følgende tema:

- **Installasjon og oppsett** – Hvordan installere pakken og komme i gang
- **Komponentoversikt med props/API** – Tilgjengelige komponenter, hvilke props de tar, events de emitter
- **Theming og CSS-variabler** – Tilgjengelige CSS-variabler og design tokens, og hvordan de brukes
- **Kodeeksempler** – Konkrete brukseksempler for de viktigste komponentene

### Retningslinjer for token-dokumentasjon i `references/design-tokens.md`

Token-dokumentasjonen skal gi en AI-agent nok informasjon til å velge riktig token uten å
måtte slå opp `default.css`. Dokumenter tokens i disse lagene:

1. **To-lags-modellen:** Forklar kort at systemet har primitive tokens (globale fargeskalaer)
   og semantiske tokens (navngitt etter bruksområde). Agenter trenger å forstå at de
   **alltid skal bruke semantiske tokens** i bruker-CSS, og at primitive tokens forklarer
   hva som ligger bak.

2. **Primitive fargepaletter:** List opp alle palettnavn (f.eks. `red`, `blue`, `green`,
   `greyblue`, `teal`, `purple`, `orange`, `yellow`, `greybeige`) og stopp-skalaen
   (f.eks. `010, 050, 100–900`). Inkluder navnemønsteret (`--fhi-{palett}-{stopp}`).
   Ikke list opp alle hex-verdier — det er for mange og de endres mellom versjoner.
   Et par representative eksempler per palett (lyseste og mørkeste) er nok til å gi
   agenten en idé om fargetonen.

3. **Semantisk→primitiv mapping:** Dokumenter hvilken primitiv palett hver semantisk rolle
   er mappet til (f.eks. `neutral` → `greyblue`, `accent` → `blue`, `danger` → `red`).
   Denne mappingen er viktig for at agenten skal forstå fargesammenhengen og gi riktige
   råd om visuell konsistens.

4. **Semantiske tokens:** Dokumenter roller, bruksområder og tilstander (dette finnes
   allerede i skillen — behold og oppdater ved behov).

5. **Andre token-kategorier** (typografi, spacing, border, motion, opacity): Dokumenter
   mønster, verdier og brukseksempler som i dag.

### Prinsipper for god skill-innhold

- Skill-innhold skrives **for en AI-agent**, ikke for en menneskelig leser. Vær presis og unngå tvetydighet.
- Foretrekk **konkrete kodeeksempler** fremfor lange prosatekster.
- Ikke inkluder informasjon du ikke har verifisert i kildekoden fra taggen.
- Hold innhold relevant for den publiserte versjonen – ikke spekuler om fremtidige endringer.
- Når publisert pakke og intern repo-struktur peker i ulike retninger, la den publiserte pakken
  styre hva som regnes som public API.

### Fjern støy — hold skillen fokusert

- Ikke dokumenter alt som finnes i koden — dokumenter det som hjelper agenten gi riktige svar.
- Ikke løft interne refaktorer eller repo-flyttinger inn i docs med mindre de påvirker public kontrakt.
- Ikke gjør skillen bredere ved hver release uten at det gir bedre beslutningsstøtte.
  Spør: "endrer dette rådene agenten gir?" Hvis nei → ikke legg det til.
- Fjern innhold som har blitt irrelevant (f.eks. workarounds for bugs som er fikset)
  fremfor å bare legge til nytt oppå.

### Kontrakt for endringer

> **Endre kun det som faktisk er feil, mangler eller er utdatert.**

Disse reglene er absolutte:

- **Behold eksisterende tekst uendret** hvis den fortsatt er korrekt i henhold til kildekoden fra taggen – selv om du ville formulert det annerledes selv.
- **Ikke omformuler, omstruktur eller "forbedre"** avsnitt som er faktariktige. Stilistiske preferanser er ikke et gyldig endringsgrunnlag.
- **Alle endringer skal begrunnes** med en konkret observasjon fra kildekoden – ikke med skjønn alene.
- Minimalt inngrep: Foretrekk å legge til nytt innhold fremfor å skrive om eksisterende.
- **Ikke slett historiske delta-filer** når de faller ut av support-vinduet. Fjern dem kun fra
  `versions/INDEX.md`, med mindre brukeren eksplisitt ber om sletting.
- **Ikke kast informasjon** bare fordi upstream har flyttet eller konsolidert filer. Hvis flere
  gamle kilder er slått sammen til én ny kilde, skal fakta fra den nye kilden fortsatt vurderes
  og mappes inn i skillen.
