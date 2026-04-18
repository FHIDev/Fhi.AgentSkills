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
| **Lav** | Lavt krav – feil påvirker ikke beslutningsprosesser. | Skrivefeil i ikke-kritisk dokumentasjon |
| **Moderat** | Moderat krav – forventer autentisk og gyldig informasjon. Feil kan gi moderate økonomiske skader og/eller svekket omdømme for instituttet, enkeltindivider eller samarbeidspartnere. | Feil i én brukers profil, feil i et enkelt vedtak |
| **Høy** | Høyt krav – avhengig av autentisk og gyldig informasjon. Feil kan medføre betydelig økonomisk tap, omdømmetap eller annen skade for instituttet, enkeltindivider eller samarbeidspartnere. | Feil i utbetalingsgrunnlag, manipulert statistikk brukt i politiske beslutninger |
| **Alvorlig** | Fullstendig krav – kritisk at autentisk og gyldig informasjon avleveres. Feilinformasjon kan føre til fatale konsekvenser eller tap av liv. | Feil i helseinformasjon (feilbehandling av pasienter), manipulert MSIS-data, endring av beredskapsplaner |

---

## Tilgjengelighet (T)

| Nivå | Definisjon | Eksempel |
|------|-----------|---------|
| **Lav** | Nedetid har minimalt med innvirkning, og gjenoppretting prioriteres ikke. Håndteres etter «best-effort». | Kort nedetid i ikke-kritisk verktøy |
| **Moderat** | Nedetid har ikke-ubetydelige konsekvenser, og må ved feil kunne gjenopprettes i løpet av få dager. | Kortvarig nedetid i et internt system |
| **Høy** | Nedetid er kritisk for instituttet, og må ved feil kunne gjenopprettes i løpet av timer. | Lengre nedetid i systemer ansatte er avhengig av daglig |
| **Alvorlig** | Tjenesten skal ikke være nede foruten ved planlagt vedlikehold, og skal ved feil så godt som umiddelbart kunne gjenopprettes. | Nedetid i nasjonale helseregistre, beredskapsrapportering, infrastruktur |

---

## Samlet KIT-klassifisering

Den samlede klassifiseringen for en behandlingsaktivitet eller et system 
settes til **det høyeste nivået** blant K, I og T.

**Prioriter integritet ved tvil** – feil data i kritiske systemer kan ha 
usynlige konsekvenser som oppdages for sent.

