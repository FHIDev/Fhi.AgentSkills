# Modul 13 – Trusselvurdering

**Produserer:** `{systemnavn}/03-vurderinger/3.5-trusselvurdering.md`  
**Avhenger av:** `01-oversikt.md`, `1.2-funksjoner.md`, `2.2-informasjonsmodell.md`, `1.1a-brukere.md`, `3.2-verdivurdering-kit.md`

---

## Formål

Kartlegg hvilke trusselaktører som er relevante for systemet, basert på FHI sin årlige trusselvurdering.
Vurder intensjon og kapasitet for hver aktør, og knytt dette til systemets informasjonsverdier og brukere.

Resultatet er grunnlaget for sårbarhetsvurdering og risikoanalyse.

---

## Fremgangsmåte

1. Hent systemets informasjonsverdier fra `3.2-verdivurdering-kit.md` (KIT-klassifisering)
2. Hent brukerkategorier og tilgangsroller fra `02-brukere.md`
3. Gå gjennom trusselaktørtabellen nedenfor
4. For **hver aktør** — vurder relevansen for dette konkrete systemet
5. Dokumenter særlige hensyn og ev. aktører som ikke er relevante (med begrunnelse)

---

## Trusselaktører (FHI-grunnlag)

| Trusselaktør | Kategori | Beskrivelse | Intensjon (vilje, motivasjon) | Kapasitet (evne, ressurser) |
|---|---|---|---|---|
| Russland | Statlig | Hybride operasjoner; målretting av helsedata og beredskap | Svekkelse av vestlig samhold, destabilisering, etterretning | Avanserte cyberkapasiteter, desinformasjon, innsiderrekruttering |
| Kina | Statlig | Langsiktig etterretning; fokus på genetikk, bioteknologi og helsedata | Teknologisk og økonomisk styrking, data- og kunnskapsinnhenting | Store ressurser, APT-operasjoner, lovpålagt etterretningsplikt |
| Iran | Statlig | Etterretning mot eksilmiljøer og bioteknologi; bruk av kriminelle proxies | Regimets overlevelse, kartlegging av opposisjon, teknologiinnhenting | Økende cyberkapasitet, bruk av kriminelle nettverk |
| Nord-Korea | Statlig | Økonomisk motiverte løsepengevirus-angrep | Finansiere regime og våpenprogrammer | Store ransomware-kampanjer |
| Organiserte cyberkriminelle | Ikke-statlig | Profesjonalisert cyberkriminalitet, RaaS | Økonomisk profitt | Høy teknisk kompetanse, KI-verktøy, utpressingsmodeller |
| Politiske/ideologiske ekstremister | Ikke-statlig | Desinformasjon, trakassering, påvirkning | Destabilisering og svekkelse av tillit | Digital mobilisering, soloaktører |
| Enkeltaksjonister/interessegrupper | Ikke-statlig | Aktivisme som kan belaste drift og omdømme | Fremme enkeltsaker | Bruk av sosiale medier, syntetisk innhold |
| Statlig rekruttert innsider | Innsider | Plassert/rekruttert for å få tilgang til registre og systemer | Informasjonsinnhenting, sabotasje | Legitim tilgang, MICE-metodikk |
| Ondsinnet innsider | Innsider | Lekkasjer, sabotasje eller manipulasjon drevet av motivasjon/hevntanker | Skade eller økonomisk vinning | Tilgang til systemer og data |
| Uaktsom innsider | Innsider | Feil, slurv, bruk av uautoriserte KI-verktøy | Uten intensjon om skade | Muliggjør angrep gjennom uaktsomhet |

---

## Vurdering per aktør

For hver aktør — vurder:

- **Relevant?** Er aktøren reelt motivert for å angripe dette systemet?
- **Angrepsvektorer:** Hvilke teknikker er sannsynlige gitt systemets eksponeringsflate?
- **Kritiske informasjonsverdier:** Hvilke verdier fra KIT-vurderingen er mest attraktive?
- **Brukerkategorier i risiko:** Hvilke brukergrupper er sannsynlige mål eller vektorer?

---

## Output-format

```markdown
# Trusselvurdering – {Systemnavn}

*Kartlegging av trusselaktører basert på FHI sin årlige trusselvurdering.*  
**Dato:** {dato}  
**Gjennomført av:** {rolle(r)}

---

## Trusselaktører

| Trusselaktør | Kategori | Relevant | Intensjon | Kapasitet | Sannsynlige angrepsvektorer |
|---|---|---|---|---|---|
| Russland | Statlig | Ja / Nei | Svekkelse av vestlig samhold, destabilisering, etterretning | Avanserte cyberkapasiteter, desinformasjon, innsiderrekruttering | {f.eks. spearphishing, supply chain, innsiderrekruttering} |
| Kina | Statlig | Ja / Nei | Teknologisk og økonomisk styrking, data- og kunnskapsinnhenting | Store ressurser, APT-operasjoner, lovpålagt etterretningsplikt | {f.eks. APT mot helsedata, kompromittering av leverandørkjede} |
| Iran | Statlig | Ja / Nei | Regimets overlevelse, kartlegging av opposisjon, teknologiinnhenting | Økende cyberkapasitet, bruk av kriminelle nettverk | {f.eks. phishing, DDoS via kriminelle proxies} |
| Nord-Korea | Statlig | Ja / Nei | Finansiere regime og våpenprogrammer | Store ransomware-kampanjer | {f.eks. ransomware mot driftsinfrastruktur} |
| Organiserte cyberkriminelle | Ikke-statlig | Ja / Nei | Økonomisk profitt | Høy teknisk kompetanse, KI-verktøy, utpressingsmodeller | {f.eks. ransomware, datalekkasje for utpressing} |
| Politiske/ideologiske ekstremister | Ikke-statlig | Ja / Nei | Destabilisering og svekkelse av tillit | Digital mobilisering, soloaktører | {f.eks. desinformasjonskampanjer, defacement} |
| Enkeltaksjonister/interessegrupper | Ikke-statlig | Ja / Nei | Fremme enkeltsaker | Bruk av sosiale medier, syntetisk innhold | {f.eks. mediestorm, DDoS, datadeling for å skade omdømme} |
| Statlig rekruttert innsider | Innsider | Ja / Nei | Informasjonsinnhenting, sabotasje | Legitim tilgang, MICE-metodikk | {f.eks. uautorisert oppslag, eksfiltrering, sabotasje} |
| Ondsinnet innsider | Innsider | Ja / Nei | Skade eller økonomisk vinning | Tilgang til systemer og data | {f.eks. datalekkasje, manipulasjon av registre} |
| Uaktsom innsider | Innsider | Alltid | Uten intensjon om skade | Muliggjør angrep gjennom uaktsomhet | {f.eks. phishing-offer, feil konfigurasjon, bruk av KI-verktøy} |

---

## Særlige hensyn

{Eventuelle merknader om:
- Sårbare brukergrupper eller spesielt eksponerte roller
- Eksternt personell, innleide konsulenter eller leverandører med tilgang
- Tilgang fra utlandet eller fra miljøer med forhøyet trusselnivå
- Systemets rolle i nasjonal beredskap som øker aktørenes interesse
- Andre forhold som påvirker trusselbilde utover standardaktørene}

---

## Ikke-relevante aktører

| Aktør | Begrunnelse for ikke-relevans |
|---|---|
| {aktør} | {begrunnelse} |

---

## Sammendrag

{2–4 setninger som oppsummerer det samlede trusselbildet for systemet:
hvilke aktørkategorier utgjør størst risiko, hva er de mest sannsynlige angrepsvektorene,
og hvilke informasjonsverdier er mest utsatt.}

---
*Metodikk: FHI årlig trusselvurdering, NSM trekantmodell*  
*Sist oppdatert: {dato} | Relatert: [3.2-verdivurdering-kit](./3.2-verdivurdering-kit.md) | [1.1a-brukere](../beskrivelse/01-funksjonell%20beskrivelse/1.1a-brukere.md)*
```

---

## Tips

- Alle ti aktørene skal vurderes — marker eksplisitt om en aktør ikke er relevant, med begrunnelse
- **Uaktsom innsider** er alltid relevant og trenger ikke begrunnes
- Koble angrepsvektorer til systemets konkrete eksponeringsflate — ikke generiske formuleringer
- **Innsidertrusler** undervurderes ofte i helseregistre; vær konkret om hvilke roller som har kritisk tilgang
- For systemer med nasjonal beredskapsrolle: vurder om **statlige aktører** har forhøyet interesse utover det typiske
- Spør til slutt: *"Vil du fortsette med neste vurderingsmodul, eller er det noe her som skal justeres?"*
