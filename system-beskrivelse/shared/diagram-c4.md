# Dataflyt og komponentstruktur

Denne modulen brukes til å generere C4-diagrammer i SVG for system-
beskrivelser. Diagrammene eksporteres som `.svg`-filer og legges ved
dokumentasjonen.

---


## System Context-diagram (nivå 1) – dataflyt-modulen

### Hensikt
Viser systemet i sammenheng med brukere og eksterne systemer.
Svarer på: *Hvem bruker systemet og hva snakker det med?*

### Informasjon som må innhentes før tegning

Spør bruker om følgende før du genererer SVG:

```
1. Hva heter systemet og hva gjør det (én setning)?
2. Hvem bruker systemet internt (roller)?
3. Er det eksterne brukere (innbyggere, kunder, partnere)?
4. Hvilke eksterne systemer integrerer det med?
5. Hva flyter mellom systemet og disse aktørene?
   (hva sendes, hentes, mottas – og hvilken protokoll?)
```

### SVG-konvensjoner

**Farger:**
- `c-blue`   → Hovdsystemet (i scope), alle containere inni systemet
- `c-teal`   → **Menneskelige brukere** som direkte betjener systemet (klikker, leser, skriver)
- `c-gray`   → Eksterne systemer og API-konsumenter utenfor scope
- `c-purple` → Databaser (kun i container-diagram)

> **Viktig distinksjon — person vs. system:**
> Bruk person-ikon (teal) kun for **ekte sluttbrukere** — mennesker som sitter foran skjermen.
> Bruk **grå ekstern-system-boks** for alt som integrerer maskin-til-maskin: API-konsumenter,
> helseregistre, bakgrunnstjenester og andre systemer som kaller APIet automatisk,
> selv om de autentiserer med HelseID/Maskinporten.

**Person-ikon (kun for menneskelige sluttbrukere — erstatter boks):**

Bare elementer der et **menneske** er den direkte aktøren skal tegnes som person-ikon.
Eksempler: saksbehandler, datafaglig ansvarlig, admin som bruker et GUI.
API-konsumenter (helseregistre, andre systemer) skal tegnes som grå ekstern-system-bokser.

```svg
<!-- Person-ikon: CX = senterpunkt horisontalt, Y = topp -->
<g onclick="sendPrompt('...')">
  <!-- Hode -->
  <circle cx="CX" cy="Y+14" r="12"
          fill="#E1F5EE" stroke="#1D9E75" stroke-width="1"/>
  <!-- Kropp -->
  <path d="M CX-20 Y+52 Q CX-22 Y+28 CX Y+28 Q CX+22 Y+28 CX+20 Y+52 Z"
        fill="#E1F5EE" stroke="#1D9E75" stroke-width="1"/>
  <!-- Navn (14px bold) -->
  <text font-family="sans-serif" font-size="14" font-weight="500" fill="#085041"
        x="CX" y="Y+68" text-anchor="middle" dominant-baseline="central">Navn</text>
  <!-- Type (12px) -->
  <text font-family="sans-serif" font-size="12" fill="#0F6E56"
        x="CX" y="Y+86" text-anchor="middle" dominant-baseline="central">[Intern bruker]</text>
  <!-- Beskrivelse (12px) -->
  <text font-family="sans-serif" font-size="12" fill="#0F6E56"
        x="CX" y="Y+102" text-anchor="middle" dominant-baseline="central">Kort beskrivelse</text>
</g>
```

Fotavtrykk: bredde ≈ 60px (±30 fra CX), høyde ≈ 110px (Y til Y+110)
Tilkoblingspunkt for piler: høyre side → `(CX+22, Y+40)`, venstre → `(CX-22, Y+40)`

**Boksstruktur (for systemer, containere og databaser — alltid tre linjer):**
```
Navn                        ← 14px bold
[Type]                      ← 12px, f.eks. [Eksternt system]
Kort beskrivelse, maks 5 ord ← 12px
```

**Typeverdier:**
- `[Intern bruker]` / `[Ekstern bruker]` / `[Person]` → person-ikon (se over)
- `[Internt system]` / `[Eksternt system]`
- `[Container: teknologi]` f.eks. `[Container: HTTP API]`
- `[Database: teknologi]` f.eks. `[Database: PostgreSQL]`

**Boksemål (ikke for person-ikoner):**
- Hovdsystem: min 200×94px
- Øvrige: min 156×94px (kan smalnes til 80px hvis plass er knapp)
- `rx="10"`, `stroke-width="0.5"`

**Layout:**
- Hovdsystemet sentrert
- Interne brukere: til venstre
- Eksterne brukere: til venstre under interne (eller nede)
- Eksterne systemer: til høyre, fordelt vertikalt
- Systemgrense: stiplet `<rect>` rundt hovdsystemet
  ```svg
  <rect x="..." y="..." width="..." height="..." rx="16"
    fill="none" stroke="#B4B2A9" stroke-width="1" stroke-dasharray="6 4"/>
  <text class="ts" x="..." y="..." text-anchor="middle" fill="#888780">
    Systemgrense
  </text>
  ```

**Piler og protokolletiketter:**
- Alltid `marker-end="url(#arrow)"`
- Bruker → system: `stroke="#1D9E75"`, etikett i `fill="#0F6E56"`
- System → eksternt: `stroke="#888780"`, etikett i `fill="#5F5E5A"`
- Bruk L-bøyde `<path>` ved kryssing for å unngå overlapp med bokser
- Protokolletikett (HTTPS, HTTP, OIDC osv.) plasseres nær pilen, aldri
  midt på en linje som krysser en boks

**Legende:**
Inkluder alltid en legende nederst med fargeforklaring og pilforklaring.
Se eksempel-SVG for korrekt format.

**Klikkbarhet:**
Alle bokser skal være klikkbare med `sendPrompt()`:
```svg
<g class="node c-blue"
   onclick="sendPrompt('Hvilke containere inngår i [systemnavn]?')">
```

### Eksempel-SVG
Se `c4_system_context_eksempel.svg` i samme mappe.

### Eksport
Når dokumentasjon genereres, eksporter SVG-en til:
`beskrivelse/dataflyt/c4_system_context.svg`

### Kvalitetssjekk
- [ ] Alle elementer har navn, [type] og beskrivelse
- [ ] Sluttbrukere er tegnet som person-ikoner (hode + kropp), ikke bokser
- [ ] Hovdsystemet er blått med stiplet systemgrense
- [ ] Brukere er grønne (teal), eksterne systemer er grå
- [ ] Ingen piler skjærer gjennom bokser eller ikoner
- [ ] Protokolletiketter er synlige og ikke overlappende
- [ ] Legende er inkludert
- [ ] Alle elementer er klikkbare med relevante sendPrompt-spørsmål
- [ ] viewBox-høyde = nederste element + 40px

---

## Container-diagram (nivå 2) – komponent-modulen

### Hensikt
Viser hva systemet består av inni – containere, databaser og protokoller.
Svarer på: *Hva er systemet bygd av og hvordan snakker delene sammen?*

### Informasjon som må innhentes før tegning

```
1. Hvilke containere/applikasjoner finnes i systemet?
   (web-app, API, bakgrunnstjeneste, osv. – og hvilken teknologi?)
2. Hvilke databaser eller lagringsløsninger brukes?
3. Hvilke protokoller brukes internt mellom containerne?
   (HTTP, gRPC, SQL, meldingskø, osv.)
4. Hvilke eksterne systemer kommuniserer direkte med containerne?
   (og hvilken protokoll?)
5. Hvilke brukere treffer hvilken container direkte?
```

### SVG-konvensjoner

Samme grunnregler som System Context, med følgende tillegg:

**Farger:**
- `c-blue`   → Alle applikasjons-containere (web, API, tjenester)
- `c-purple` → Databaser og lagringsløsninger
- `c-teal`   → Brukere/personer
- `c-gray`   → Eksterne systemer

**Systemgrense:**
Samme stiplete `<rect>` rundt alle interne containere og databaser.
Etiketten skal inneholde systemnavnet:
```svg
<text class="ts" fill="#888780">
  [Systemnavn] – systemgrense
</text>
```

**Protokolletiketter på piler:**
I container-diagram skal alle piler ha protokolletikett:
- Mellom containere internt: `HTTP/JSON`, `SQL`, `gRPC`, `AMQP` osv.
- Mot eksterne: `OIDC`, `HTTP`, `SOAP` osv.
- Mot brukere: `HTTPS`

**Pilfarge etter relasjon:**
- Bruker → container: `stroke="#1D9E75"`
- Container → container (intern): `stroke="#185FA5"`
- Container → database: `stroke="#534AB7"`
- Container → eksternt system: `stroke="#888780"`

**Layout:**
- Containere stables vertikalt i systemgrensen (topp til bunn: UI → API → DB)
- Brukere til venstre utenfor grensen
- Eksterne systemer til høyre utenfor grensen

### Eksempel-SVG
Se `c4_container_eksempel.svg` i samme mappe.

### Eksport
Når dokumentasjon genereres, eksporter SVG-en til:
`beskrivelse/komponent/c4_container.svg`

### Kvalitetssjekk
- [ ] Alle containere har navn, [Container: teknologi] og beskrivelse
- [ ] Sluttbrukere er tegnet som person-ikoner (hode + kropp), ikke bokser
- [ ] Databaser er lilla (purple), containere er blå
- [ ] Alle piler har protokolletikett
- [ ] Systemgrense inkluderer alle interne elementer
- [ ] Ingen piler skjærer gjennom bokser eller ikoner
- [ ] Legende er inkludert
- [ ] Alle elementer er klikkbare
- [ ] viewBox-høyde = nederste element + 40px

---

## Felles SVG-oppsett (begge nivåer)

```svg
<svg width="100%" viewBox="0 0 680 [H]" xmlns="http://www.w3.org/2000/svg">
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
<!-- Innhold her -->
</svg>
```

Sett `[H]` til nederste elements bunn-y + 40px.
