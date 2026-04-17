# KIT-klassifiseringsskala

---

## Konfidensialitet (K)

| Nivå | Definisjon | Eksempel |
|------|-----------|---------|
| **Lav** | Lavsensitive data eksponert uten vesentlig skade. Ingen personvern- eller sikkerhetskonsekvenser av betydning. | Offentlig informasjon, intern statistikk uten persondata |
| **Moderat** | Lekkasje av mindre datamengder. Personvernskrenkelse for enkeltpersoner. Begrenset omdømmeskade. | Navn og kontaktinfo for interne ansatte, interne arbeidsdokumenter |
| **Høy** | Lekkasje av sensitive persondata om mange. Negativ nasjonal omtale. Store økonomiske tap. | Helseopplysninger om enkeltpersoner, API-nøkler som gir tilgang til interne systemer |
| **Alvorlig** | Lekkasje av særlig sensitive opplysninger (helse, biometri, straffesak, gradert info). Trussel mot liv og helse. Svekket nasjonal beredskap. | Sensitive helseregistre, nasjonale beredskapsplaner, informasjon som kan utnyttes til målrettede angrep |

---

## Integritet (I)

| Nivå | Definisjon | Eksempel |
|------|-----------|---------|
| **Lav** | Mindre feil uten påvirkning på tjenester eller beslutninger. Kan enkelt rettes opp. | Skrivefeil i ikke-kritisk dokumentasjon |
| **Moderat** | Datamanipulasjon som påvirker enkeltvedtak eller enkeltpersoner. Kortvarige feil. | Feil i én brukers profil, feil i et enkelt vedtak |
| **Høy** | Feil i data som gir feil utbetalinger, feil vedtak for mange, eller forstyrrer kritiske prosesser. | Feil i utbetalingsgrunnlag, manipulert statistikk brukt i politiske beslutninger |
| **Alvorlig** | Endring av kritiske data med konsekvenser for liv og helse, straffesaker eller nasjonal sikkerhet. | Feil i helseinformasjon (giftig råd, feil medisin), manipulert MSIS-data, endring av beredskapsplaner |

---

## Tilgjengelighet (T)

| Nivå | Definisjon | Eksempel |
|------|-----------|---------|
| **Lav** | Forsinkelser under 5 minutter. Ingen vesentlig påvirkning på tjenester. | Kort nedetid i ikke-kritisk verktøy |
| **Moderat** | Midlertidige brudd fra noen minutter til 1 time. Håndterbare tjenestebrudd. | Kortvarig nedetid i et internt system |
| **Høy** | Tjenester nede i 1–6 timer. Redusert tjenesteleveranse. Store kostnader. | Lengre nedetid i systemer ansatte er avhengig av daglig |
| **Alvorlig** | Langvarig nedetid (>6 timer) i kritiske tjenester. Bortfall av essensielle tjenester. Samfunnskonsekvenser. | Nedetid i nasjonale helseregistre, beredskapsrapportering, infrastruktur |

---

## Samlet KIT-klassifisering

Den samlede klassifiseringen for en behandlingsaktivitet eller et system 
settes til **det høyeste nivået** blant K, I og T.

**Prioriter integritet ved tvil** – feil data i kritiske systemer kan ha 
usynlige konsekvenser som oppdages for sent.

---

## Sikkerhetsgradering (systemnivå)

| Gradering | Beskrivelse |
|-----------|-------------|
| **Åpen** | Ingen begrensninger, kan deles offentlig |
| **Intern** | Kun for interne ansatte, ikke for allmennheten |
| **Skjermet** | Begrenset distribusjon, særlig sensitiv informasjon |
| **Strengt hemmelig** | Gradert informasjon etter sikkerhetsloven |