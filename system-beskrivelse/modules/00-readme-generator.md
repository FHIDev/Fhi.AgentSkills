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
| Oversikt | [01-oversikt.md](./01-oversikt.md) | ✅ Ferdig / 🔄 Under arbeid / 🔲 Ikke startet | |
| Brukere | [brukere/02-brukere.md](./brukere/02-brukere.md) | | |
| Funksjoner | [funksjoner/03-funksjoner.md](./funksjoner/03-funksjoner.md) | | |
| Komponenter | [arkitektur/04-komponenter.md](./arkitektur/04-komponenter.md) | | |
| Informasjonsmodell | [arkitektur/05-informasjonsmodell.md](./arkitektur/05-informasjonsmodell.md) | | |
| Drift | [drift/06-drift.md](./drift/06-drift.md) | | |
| KIT-verdivurdering | [vurderinger/07-kit-verdivurdering.md](./vurderinger/07-kit-verdivurdering.md) | | |
| Personvern | [vurderinger/08-personvern.md](./vurderinger/08-personvern.md) | | |

---

## Sammendrag

### Systemet

{2–4 setninger om systemets formål og kontekst, basert på 01-oversikt.}

### Brukere

{1–2 setninger om hvem som bruker systemet, basert på 02-brukere.}

### Nøkkelfunksjoner

{Liste over behandlingsaktivitetene fra 03-funksjoner, én linje per aktivitet.}

- **A1 – {navn}:** {én linje}
- **A2 – {navn}:** {én linje}

### Teknisk plattform

{1–2 setninger om hovdkomponenter og infrastruktur, basert på 04-komponenter.}

### Sikkerhetsklassifisering

| Dimensjon | Nivå |
|-----------|------|
| Konfidensialitet | {fra 07-kit} |
| Integritet | {fra 07-kit} |
| Tilgjengelighet | {fra 07-kit} |
| **Samlet** | **{fra 07-kit}** |

### Personvern

**DPIA nødvendig:** {Ja / Nei / Uavklart} ({begrunnelse fra 08-personvern})  
**Åpne personvernspørsmål:** {antall 🔲-punkter fra 08-personvern}

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

Denne systemdokumentasjonen er utarbeidet med `system-describe`-skillen 
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
