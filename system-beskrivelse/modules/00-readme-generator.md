# Modul 00 – README (Avsluttende oppsummering)

**Produserer:** `{systemnavn}/README.md`  
**Avhenger av:** Alle fullførte moduler  
**Kjøres:** Sist, når ønskede moduler er ferdigstilt

---

## Formål

Generer en README som gir en komplett oversikt over systemet og 
viser status på alle moduler. Dette er inngangspunktet for alle 
som skal lese dokumentasjonen.

---

## Fremgangsmåte

1. Les alle eksisterende moduler i `{systemnavn}/`-mappen
2. Ekstraher nøkkelinformasjon fra hver fil
3. Generer index med sammendrag og status

---

## Output-format

Skriv filen `{systemnavn}/README.md` med denne strukturen:

```markdown
# {Systemnavn} - Sammendrag og status

> {Én setning fra 01-oversikt som beskriver systemet}

**Organisasjon:** {fra 01-oversikt}  
**Systemeier:** {fra 01-oversikt}  
**Livssyklusfase:** {fra 01-oversikt}  
**Sist oppdatert:** {dato}

---

## Dokumentasjonsstatus

| Modul | Fil | Status | Sist oppdatert |
|-------|-----|--------|----------------|
| Oversikt | [00_oversikt.md](./00_oversikt.md) | ✅ Ferdig / 🔄 Under arbeid / 🔲 Ikke startet | |
| Brukere | [01-funksjonell-beskrivelse/01_brukere.md](./01-funksjonell-beskrivelse/01_brukere.md) | | |
| Roller og rettigheter | [01-funksjonell-beskrivelse/01_roller-og-rettigheter.md](./01-funksjonell-beskrivelse/01_roller-og-rettigheter.md) | | |
| Funksjoner | [01-funksjonell-beskrivelse/01_funksjoner.md](./01-funksjonell-beskrivelse/01_funksjoner.md) | | |
| Komponenter | [02-teknisk-beskrivelse/02_komponenter.md](./02-teknisk-beskrivelse/02_komponenter.md) | | |
| Informasjonsmodell | [02-teknisk-beskrivelse/02_informasjonsmodell.md](./02-teknisk-beskrivelse/02_informasjonsmodell.md) | | |
| Datamodell | [02-teknisk-beskrivelse/02_datamodell.md](./02-teknisk-beskrivelse/02_datamodell.md) | | |
| Dataflyt | [02-teknisk-beskrivelse/02_dataflyt.md](./02-teknisk-beskrivelse/02_dataflyt.md) | | |
| Drift | [02-teknisk-beskrivelse/02_drift.md](./02-teknisk-beskrivelse/02_drift.md) | | |
| Verdivurdering sikkerhetsgradering | [03-vurderinger/03_verdivurdering-sikkerhetsgradering.md](./03-vurderinger/03_verdivurdering-sikkerhetsgradering.md) | | |
| Verdivurdering KIT | [03-vurderinger/03_verdivurdering-kit.md](./03-vurderinger/03_verdivurdering-kit.md) | | |
| Verdivurdering personvern | [03-vurderinger/03_verdivurdering-personvern.md](./03-vurderinger/03_verdivurdering-personvern.md) | | |
| Verdivurdering automatiserte beslutninger | [03-vurderinger/03_verdivurdering-automatiserte-beslutninger.md](./03-vurderinger/03_verdivurdering-automatiserte-beslutninger.md) | | |
| Trusselvurdering | [03-vurderinger/03_trusselvurdering.md](./03-vurderinger/03_trusselvurdering.md) | | |
| Sårbarhetsvurdering | [03-vurderinger/03_sårbarhetsvurdering.md](./03-vurderinger/03_sårbarhetsvurdering.md) | | |

---

## Sammendrag

### Systemet

{2–4 setninger om systemets formål og kontekst, basert på 01-oversikt.}

### Brukere

{1–2 setninger om hvem som bruker systemet, basert på 02-brukere.}

### Nøkkelfunksjoner

{Liste over behandlingsaktivitetene fra 01_funksjoner.md, én linje per aktivitet.}

- **A1 – {navn}:** {én linje}
- **A2 – {navn}:** {én linje}

### Teknisk plattform

{1–2 setninger om hovdkomponenter og infrastruktur, basert på 02_komponenter.md.}

### Sikkerhetsklassifisering

| Dimensjon | Nivå |
|-----------|------|
| Konfidensialitet | {fra 03_verdivurdering-kit.md} |
| Integritet | {fra 03_verdivurdering-kit.md} |
| Tilgjengelighet | {fra 03_verdivurdering-kit.md} |
| **Samlet** | **{fra 03_verdivurdering-kit.md}** |

### Personvern

**DPIA nødvendig:** {Ja / Nei / Uavklart} ({begrunnelse fra 03_verdivurdering-personvern.md})  
**Åpne personvernspørsmål:** {antall 🔲-punkter fra 03_verdivurdering-personvern.md}

---

## Åpne spørsmål og neste steg

{Saml alle 🔲 Ikke kartlagt-punkter på tvers av moduler}

| Spørsmål | Modul | Prioritet |
|---------|-------|-----------|
| | | Høy / Middels / Lav |

### Anbefalte neste steg

{Basert på hva som er ferdigstilt — foreslå hva som mangler eller 
hva som bør gjøres videre, f.eks. trusselvurdering, sårbarhetsvurdering, DPIA}

---

## Om denne dokumentasjonen

Denne systemdokumentasjonen er utarbeidet med `system-beskrivelse`-skillen 
og følger en modulær struktur for design- og planleggingsfasen.

Modulene kan brukes selvstendig eller som grunnlag for:
- NSM risikovurdering (trekantmodellen)
- GDPR personvernkonsekvensvurdering (DPIA)
- Teknisk onboarding av nye teammedlemmer
- Anskaffelse og leverandørvurdering
```

---

## Tips

- README er levende — oppdater den når moduler revideres
- Status-kolonnen (`✅ / 🔄 / 🔲`) gir raskt overblikk over hva som mangler
- Åpne spørsmål bør samles og tildeles eiere med frist
- Avslutt med: *"Systemdokumentasjonen er nå komplett. Ønsker du å eksportere noen av filene til Word, eller starte en trusselvurdering?"*
