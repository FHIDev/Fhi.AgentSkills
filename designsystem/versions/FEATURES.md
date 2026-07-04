# Feature-historikk

Autoritativ kilde for **når public features ble innført** i
`@folkehelseinstituttet/designsystem`. Én rad per feature. Agenten beregner
«hva mangler i versjon X?» ved å filtrere på `Introduced > X`.

> **Dekningsgrense:** Tabellen dekker features innført **fra og med v0.41.0**.
> Features innført før grensen er dokumentert i delta-filenes «Missing vs
> latest»-seksjoner (se [INDEX.md](INDEX.md)) og skal ikke flyttes hit uten
> eksplisitt beslutning om historisk migrering.

Ved hver release: legg til én rad per ny public feature (ny komponent, nytt
attributt, ny slot, nytt event, ny metode, nytt ikon, ny entrypoint, deprecation,
endret default-atferd). `Source` skal peke på konkret upstream-artefakt.
Eldre delta-filer skal **ikke** backfylles.

| Feature | Introduced | Type | Scope | Source |
|---------|------------|------|-------|--------|

_Tabellen er foreløpig tom — første rader kommer med oppdateringen til v0.41._
