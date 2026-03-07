# Implementeringsregler

## Prinsipper for implementering (steg 8)

- **Seksjonsbasert patching** — oppdater kun seksjoner med evidensbasert grunnlag, behold øvrige uendret.
- Endre kun innhold som er eksplisitt godkjent.
- Behold eksisterende tekst uendret hvis den er korrekt — selv om du ville formulert det annerledes.
- Ikke omformuler/omstruktur avsnitt som er faktariktige.
- Alle endringer begrunnes med konkret observasjon fra kildene.
- Skill-innhold skrives for AI-agent — presis, unngå tvetydighet.
- Foretrekk konkrete kodeeksempler fremfor prose.

---

## Kildereferanse-format (differensiert)

| Kildetype | Format |
|-----------|--------|
| Docs-repo | `> Kilde: https://docs.sky.fhi.no/<sti>/` |
| Infra-repo | `> Kilde: FHISkybert/Fhi.Skybert.Infra/<filbane>` |
| Kombinert | Oppgi begge kilder |
| Web-scraping | `> Kilde: https://docs.sky.fhi.no/<sti>/` |
| Ingen kilde (manuelt kuratert) | Behold eksisterende referanser — legg ikke til ny |

Referansen plasseres direkte etter avsnittet/seksjonen den gjelder.
Hvis et avsnitt allerede har en kilde-referanse, oppdater URL-en hvis den har endret seg.

---

## MkDocs-syntakskonvertering

| MkDocs-syntaks | Konvertert til |
|----------------|---------------|
| `!!! note "Tittel"` | `> **Tittel:** ...` |
| `!!! warning` | `> **Advarsel:** ...` |
| `=== "Tab 1"` | Separate kodeblokker med overskrifter |
| Mermaid-diagrammer | Behold som mermaid-kodeblokker |

---

## Nye filer

Opprettes kun ved godkjente `ny-fil`-poster i endringsplanen. Krav:
- Standard overskrift med filnavn og emne
- Kildereferanser for alt innhold
- Legges til i forutsetninger-treet i `SKILL.md`

---

## Skybert-verdier i CLAUDE.md / AGENTS.md

Skybert-skillen (`skybert/SKILL.md`) skal inneholde en seksjon som anbefaler brukere å legge inn prosjektspesifikke Skybert-verdier i sin `CLAUDE.md` eller `AGENTS.md`. Anbefalt tabell-format:

```markdown
## Skybert-verdier

| Noekkel | Verdi |
|---------|-------|
| Tenant | `<tenant-navn>` |
| Sikkerhetssone | Groenn / Gul / Roed |
| Test namespace | `tn-<tenant>` |
| Prod namespace | `tn-<tenant>` |
| Test hostname | `<app>.skytest.fhi.no` |
| Prod hostname | `<app>.sky.fhi.no` |
| ACR image | `crfhiskybert.azurecr.io/<tenant>/<app>` |
| Deployment | `<app>-deployment` |
| Azure tenant ID | `<azure-tenant-id>` |
```

Ved fullscan: sjekk om `skybert/SKILL.md` inneholder en "Skybert-verdier i CLAUDE.md"-seksjon. Hvis den mangler → opprett som `NY`-post i planen.

---

## Kontrollpunkter etter implementering

Etter implementering, verifiser:

1. Alle docs-sider fra dekningsmatrisen er nå sporet til et sted i skillen.
2. Ingen eksisterende skill-seksjon er slettet uten positiv evidens (sjekk bevaringsseksjonen).
3. Alle nye referansefiler som ble godkjent er opprettet.
4. Infra-funn som ikke passet eksisterende struktur er enten i ny fil eller eksplisitt droppet med begrunnelse.
5. Interne temaer er merket som interne.
6. Ingen sensitiv informasjon fra infra-repo er inkludert.
7. Alle `OMSTRUKTURER`-endringer har beholdt alle detaljer fra opprinnelig plassering.

---

## Bevaringsseksjon i UPDATE-PLAN.md

UPDATE-PLAN.md skal inneholde en egen **Bevaringsseksjon** som dokumenterer all skill-innhold som beholdes selv om det ikke finnes i repoene:

```markdown
## Bevart innhold uten repo-kilde

| Skill-fil | Seksjon | Innhold (kort) | Begrunnelse for bevaring |
|-----------|---------|----------------|--------------------------|
| SKILL.md | Subscription IDs | Azure-verdier | Plattformteam-kunnskap |
| troubleshooting.md | ImagePullBackOff | Feilsøkingstips | Erfaringsbasert |
```

Denne seksjonen sikrer sporbarhet: det er dokumentert *hvorfor* innhold uten kilde beholdes.
