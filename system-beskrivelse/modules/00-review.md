# Modul 00 – Konsistensgjennomgang

**Kjøres:** Etter at ønskede moduler er ferdigstilt  
**Leser:** Alle genererte filer under `{systemnavn}/`  
**Produserer:** Konsistensrapport i samtalen (ikke en ny fil)

---

## Formål

Les alle ferdigstilte dokumentasjonsfiler og kontroller at navn, referanser og
klassifiseringer er konsistente på tvers av modulene.

---

## Fremgangsmåte

1. List filene under `{systemnavn}/` og les dem alle.
2. Kjør sjekkene nedenfor.
3. Presenter rapporten.

---

## Sjekker

### K1 — Komponentnavn
Navnene på komponenter i `04-komponenter.md` skal brukes konsekvent i
`07-dataflyt.md` og vurderingsfilene. Avvik: ulike navn for samme komponent.

### K2 — Behandlingsaktiviteter
Aktivitetene i `03-funksjoner.md` skal dekke alle aktiviteter som refereres i
`verdivurdering-kit.md` og `verdivurdering-personvern.md`.
Avvik: aktivitet nevnt i vurdering, men mangler i 03-funksjoner, eller omvendt.

### K3 — KIT og GDPR-annotasjoner i 03-funksjoner
Etter at `verdivurdering-kit.md` og `verdivurdering-personvern.md` er kjørt
skal `03-funksjoner.md` være oppdatert med KIT-nivå og GDPR-grunnlag per
aktivitet. Avvik: manglende eller motstridende annotasjoner.

### K4 — Sikkerhetsgradering i 01-oversikt
Etter `verdivurdering-sikkerhetsgradering.md` skal `01-oversikt.md` inneholde
oppdatert sikkerhetsgradering. Avvik: gradering mangler eller samsvarer ikke
med konklusjonen i vurderingen.

### K5 — Informasjonsobjekter
Informasjonsobjektene i `05-informasjonsmodell.md` skal gjenkjennes i
`07-dataflyt.md`. Avvik: objekt beskrevet i modellen men aldri nevnt i
dataflyten, eller omvendt.

### K6 — Eksterne systemer
Eksterne systemer nevnt i `07-dataflyt.md` (integrasjoner) skal finnes igjen
i `04-komponenter.md` eller være eksplisitt markert som utenfor scope.
Avvik: eksternt system i dataflyt uten motpart i komponentoversikten.

### K7 — Ukartlagte felter
Tell opp alle `🔲 Ikke kartlagt` på tvers av alle filer og list dem samlet.

---

## Rapportformat

```
# Konsistensgjennomgang – {systemnavn}

## Sammendrag
{1–2 setninger: alt ok / N avvik funnet}

## Resultat per sjekk

| Sjekk | Status | Funn |
|-------|--------|------|
| K1 Komponentnavn           | ✅ / ⚠️ / ❌ | |
| K2 Behandlingsaktiviteter  | ✅ / ⚠️ / ❌ | |
| K3 KIT og GDPR-annotasjoner| ✅ / ⚠️ / ❌ | |
| K4 Sikkerhetsgradering     | ✅ / ⚠️ / ❌ | |
| K5 Informasjonsobjekter    | ✅ / ⚠️ / ❌ | |
| K6 Eksterne systemer       | ✅ / ⚠️ / ❌ | |
| K7 Ukartlagte felter       | ✅ / ⚠️ / ❌ | {antall} felt |

## Avvik som må rettes

### {K#} {Navn}
- **Fil:** `{filnavn}`
- **Problem:** {beskrivelse}
- **Forslag:** {konkret rettingsforslag}

## Ukartlagte felter ({antall} totalt)

| Fil | Felt |
|-----|------|
| {fil} | {feltnavn / kontekst} |
```

Statusverdier:
- ✅ Ingen avvik
- ⚠️ Mindre avvik eller manglende informasjon
- ❌ Inkonsistens som bør rettes før dokumentasjonen brukes videre
