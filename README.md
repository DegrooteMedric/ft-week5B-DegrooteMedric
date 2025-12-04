# ft-week5B-DegrooteMedric

## Idee – waarvan komt de inspiratie?

Het uitgangspunt van deze opdracht ligt bij de beperkingen van het huidige internetidentiteitsmodel (Web 2.0). Grote platformen zoals Google en Meta beheren onze gegevens en bepalen via protocollen zoals OAuth en OpenID Connect hoe we inloggen. Dit gecentraliseerde model leidt regelmatig tot datalekken, identiteitsdiefstal en weinig controle voor de eindgebruiker.

Gedecentraliseerde Identiteit (Decentralized Identifiers, DID) en Verifieerbare Credentials (VC) — beide W3C-standaarden — bieden een alternatief. Ze geven gebruikers een eigen digitaal paspoort (DID) en gestandaardiseerde bewijzen van claims (VC’s), zodat ze zelf beslissen welke gegevens ze delen en met wie.

### Rollen in het ecosysteem

- **Issuer** – verstrekt de claim, bijvoorbeeld een hogeschool die een diploma uitgeeft.
- **Holder** – bewaart het credential in een digitale wallet en beheert het delen ervan.
- **Verifier** – controleert de ontvangen credentials, zoals een werkgever tijdens een sollicitatie.

Dit lab vormt een “Login met uw Diploma”-proof-of-concept: de werkgever verifieert autonoom of de student afgestudeerd is, zonder de school te hoeven bellen of toegang te krijgen tot een centrale database.
