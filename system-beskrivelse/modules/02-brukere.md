# Modul 02 – Brukere og konsumenter

**Produserer:**
- `{systemnavn}/beskrivelse/01-funksjonell beskrivelse/1.1a-brukere.md`
- `{systemnavn}/beskrivelse/01-funksjonell beskrivelse/1.1b-roller-og-rettigheter.md`

**Avhenger av:** `01-oversikt.md` (systemnavn, organisasjon, formål)  
**Neste modul:** 03-funksjoner

---

## Formål

Kartlegg alle som bruker eller påvirkes av systemet — mennesker og systemer.
Skill tydelig mellom **sluttbrukere** (mennesker med roller) og **systembrukere** (konsumenter via API).

---

## Spørsmål å stille brukeren

### Sluttbrukere
- Hvem bruker systemet direkte? (rollenavn, ikke enkeltpersoner)
- Er det forskjell på **interne** og **eksterne** brukere?
- Er det brukere som bare **leser** vs. de som kan **endre** data?
- Finnes det brukere som kun **godkjenner** eller **kontrollerer**?

### Systembrukere / konsumenter
- Hvilke **systemer** kaller inn i dette systemet? (API-klienter, batch-jobber)
- Hvilken **autentiseringsmekanisme** brukes? (HelseID, Entra ID, API-nøkkel)
- Brukes **scopes** eller andre tilgangsbegrensninger?

### Omfang
- Omtrent hvor mange brukere per brukergruppe?

---

## Output-format

### `02-brukere.md`

```markdown
# Brukere og konsumenter

## Brukergrupper

| Brukergruppe | Type | Beskrivelse | Omtrent antall | Rolle/rettigheter |
|-------------|------|-------------|----------------|-------------------|
| {Rolle} | Intern/Ekstern | | 🔲 | |
| {Systemintegrasjon} | System | | N/A | API-tilgang |

## API Konsumenter

Systemer som integrerer mot {systemnavn} autentiserer med {autentiseringsmekanisme}.

| System | Beskrivelse |
|--------|-------------|
| {System A} | {API eller tjeneste de kaller} |

## Sluttbruker

Se [02b-roller-og-rettigheter](02b-roller-og-rettigheter.md) for roller og rettigheter.

## Systembruker

Se [02b-roller-og-rettigheter](02b-roller-og-rettigheter.md) for rettigheter.

> {Systemets} egne utgående integrasjoner dokumenteres i [2.1-komponenter](../02-teknisk%20beskrivelse/2.1-komponenter.md).

---
*Sist oppdatert: {dato} | Forrige: [01-oversikt](../../01-oversikt.md) | Neste: [1.2-funksjoner](../01-funksjonell%20beskrivelse/1.2-funksjoner.md)*
```

### `02b-roller-og-rettigheter.md`

```markdown
# Roller og rettigheter

## Sluttbruker

### Roller

| Rolle | Beskrivelse | Rettigheter |
|-------|-------------|-------------|
| {Rolle} | | |

### Rettigheter

| Rettighet | Beskrivelse |
|-----------|-------------|
| {Rettighet} | |

## Systembruker

### Rettigheter

| Rettighet | Beskrivelse |
|-----------|-------------|
| {Rettighet} | |

---
*Sist oppdatert: {dato} | Tilhører: [02-brukere](02-brukere.md) | Neste: [1.2-funksjoner](../01-funksjonell%20beskrivelse/1.2-funksjoner.md)*
```

---

## Tips

- Skill tydelig mellom sluttbrukere (mennesker) og systembrukere (API-konsumenter)
- Ikke navngi enkeltpersoner — bruk rollebetegnelser
- Systembrukere autentiserer typisk maskin-til-maskin — noter hvilken mekanisme (HelseID, Entra ID, etc.)
- Systemets egne utgående integrasjoner (hva systemet henter fra andre) hører hjemme i 04-komponenter og 07-dataflyt, ikke her
- Legg inn `🔲 Ikke kartlagt` der informasjon mangler
- Spør til slutt: *"Vil du fortsette med Modul 03 (Funksjoner), eller er det noe her som skal justeres?"*
