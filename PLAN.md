# ZorgAgent — Design Document

> ZorgAgent is niet het ECD. ZorgAgent is de laag eromheen — het informele, het warme, het zichtbare. Alles wat het ECD niet doet.

---

## Visie

Een modulaire AI-assistent voor zorginstellingen, bereikbaar via WhatsApp, die de informele communicatie- en imagolaag automatiseert. Geen koppelingen met bestaande systemen. Geen IT-afdeling nodig. Morgen operationeel.

De instelling kiest welke modules ze activeert. Elke module volgt hetzelfde UX-patroon. Nieuwe modules kunnen worden toegevoegd zonder het framework te wijzigen.

---

## Positionering

**Wat ZorgAgent NIET is:**
- Geen ECD (Nedap Ons, Puur, Lable doen dat)
- Geen spraak-naar-rapportage voor het dossier (Attendi, Tell James doen dat)
- Geen rooster/planningssoftware (Nedap Planning doet dat)

**Wat ZorgAgent WEL is:**
- De warme laag tussen instelling en buitenwereld
- De informele check-in die nergens anders bestaat
- Het vliegwiel dat imago, werving en kwaliteit aandrijft
- EU AI Act compliant from day one

---

## Het Vliegwiel

```
Dagelijkse check-in (20 sec)
    → Weekberichten naar familie (ZorgBericht)
        → Familie is tevreden
            → Review op ZorgkaartNederland (ZorgReputatie)
                → Hogere score
                    → Meer bewoners kiezen deze instelling
                    → Meer mensen willen hier werken
                        → Betere vacatureteksten (ZorgWerving)
                            → Minder personeelstekort
                                → Betere zorg
                                    → Betere check-ins
                                        → 🔄
```

Eén WhatsApp-bericht van een verzorgende → draait het hele vliegwiel.

---

## Modules

### Kernmodules (MVP)

#### 1. ZorgBericht — Familie weekberichten
**Stakeholder:** Mantelzorgers + instelling (imago)
**Concurrent:** Niemand doet dit proactief zonder dat de familie iets hoeft te doen
**Input:** Dagelijkse check-ins van medewerkers
**Output:** Warm, persoonlijk weekbericht per bewoner → email (of WhatsApp) naar familie
**Goedkeuring:** EVV'er keurt elk weekbericht goed voor verzending

#### 2. ZorgReputatie — Review & imago management
**Stakeholder:** Locatiemanager + bestuurder + potentiële bewoners
**Concurrent:** Feeddex is reactief. Niemand genereert proactief reviews.
**Input:** Nul — follow-up na weekberichten
**Output:** Na 4 weken weekberichten → vriendelijk verzoek aan familie om review te delen op ZorgkaartNederland
**Flow:** Automatisch, maar instelling kan timing/frequentie instellen

#### 3. ZorgWerving — Vacatureteksten + employer branding
**Stakeholder:** Locatiemanager + HR + potentiële medewerkers
**Concurrent:** Generic AI schrijftools, maar niemand combineert met interne sfeerdata
**Input:** "We zoeken een verzorgende IG3 voor Zonnebloom, 24 uur"
**Output:** Authentieke vacaturetekst met echte teamsfeer uit check-in data. Social media posts.

### Uitbreidingsmodules (Post-MVP)

#### 4. ZorgMatch — Diensten vullen & ruilen
**Stakeholder:** Roosteraar + flexpool
**Niche:** Niet alleen vullen, ook **ruilen** — zit in geen enkel systeem goed
**EU AI Act:** High-risk (Annex III, task allocation). Altijd menselijke beslissing.

#### 5. ZorgMelding — Voice-to-incidentmelding (MIC/VIM)
**Stakeholder:** Verzorgende + kwaliteitsmedewerker
**Input:** Voice note of kort bericht na incident
**Output:** Complete MIC-melding, goedkeuren via portaal
**Effect:** Meer meldingen (nu worden incidenten niet gemeld vanwege lange formulieren)

#### 6. ZorgInwerk — Onboarding nieuwe medewerkers
**Stakeholder:** Nieuwe medewerker + teamleider
**Input:** Startdatum + afdeling + rol
**Output:** 2 weken dagelijkse tips, protocollen, check-ins. Samenvatting naar teamleider.

#### 7. ZorgSignaal — Proactieve signalering
**Stakeholder:** EVV'er + teamleider
**Concurrent:** Niemand. ECD's tonen data, maar signaleren niet proactief.
**Input:** Nul — analyseert bestaande check-ins automatisch
**Output:** WhatsApp-bericht naar EVV'er wanneer een patroon opvalt
**Voorbeelden:**
- "Dhr Bakker is 3 dagen achter elkaar als onrustig gemeld. Aandachtspunt?"
- "Mw Jansen wordt al 5 dagen niet genoemd in check-ins. Alles oké?"
- "Afdeling Zonnebloom: 4 van 6 medewerkers noemen hoge werkdruk deze week."
**Belangrijk:** Signaal ≠ diagnose. Altijd een vraag, nooit een conclusie. De mens beoordeelt.
**Dit is het verschil tussen een tool en een collega.**

#### 8. ZorgKwaliteit — Automatische kwaliteitsrapportage
**Stakeholder:** Bestuurder + kwaliteitsmedewerker + IGJ
**Input:** Nul — gegenereerd uit bestaande check-ins + meldingen
**Output:** Kwartaalrapportage per afdeling met trends en aandachtspunten

---

## De Dagelijkse Check-in — Brandstof voor Alles

De check-in is het hart van ZorgAgent. Eén informeel moment per dag voedt alle modules.

```
Elke dag 19:00 (configureerbaar per afdeling):

ZorgAgent: "Hoi Sandra, hoe was het vandaag? 
           Iets bijzonders bij je bewoners?"

Sandra:    "Mw De Vries genoten van de tuin, 
           dhr Bakker was onrustig vanmiddag, 
           mw Jansen heeft goed gegeten voor het eerst 
           in dagen"

ZorgAgent: "Bedankt! Genoteerd voor De Vries, 
           Bakker en Jansen ✅"
```

- Drie zinnen. Twintig seconden. Drie bewoners afgedekt.
- Over vijf werkdagen: 15+ datapunten per bewoner.
- Dit is GEEN rapportage. Geen ECD-invoer. Geen formulier.
- Concurreert niet met Attendi of het ECD.

### Wat de check-in voedt

| Module | Hoe het de check-in gebruikt |
|--------|------------------------------|
| ZorgBericht | Destilleert weekbericht uit 5 dagen check-ins per bewoner |
| ZorgReputatie | Bepaalt of het een goed moment is om review te vragen |
| ZorgWerving | Trekt sfeer en teamcultuur uit check-ins voor vacatureteksten |
| ZorgSignaal | Detecteert patronen en stuurt proactief signalen naar EVV'er/teamleider |
| ZorgKwaliteit | Aggregeert trends over weken/maanden voor kwartaalrapportage |
| ZorgInwerk | Nieuwe medewerker check-ins volgen hetzelfde patroon |

---

## Universeel UX-Patroon

Elke interactie in ZorgAgent volgt hetzelfde patroon:

```
Input (vrij, Nederlands) 
    → Gestructureerde terugkoppeling 
        → ✅ Goedkeuren of correctie sturen 
            → Actie
```

Voorbeelden:
- Check-in → "Genoteerd voor De Vries, Bakker en Jansen ✅"
- Open dienst → gestructureerd overzicht → ✅ → flexpool benaderen
- Weekbericht → concept → ✅ door EVV'er → versturen naar familie
- Vacaturetekst → concept → ✅ door teamleider → publiceren

### AI Disclosure

Elke externe output bevat:

```
🤖 Dit bericht is gegenereerd door ZorgAgent (AI). 
   Gecontroleerd door [naam EVV'er/medewerker].
```

---

## Twee Kanalen: De Bel en De Kluis

### WhatsApp — De Bel
- Check-ins ontvangen
- Notificaties sturen ("weekbericht klaar voor goedkeuring")
- ZorgMatch communicatie (geen medische data)
- Onboarding chat na account aanmaken
- Geen medische of persoonsgebonden data in de chat

### Beveiligd Portaal — De Kluis
- Weekberichten lezen en goedkeuren (magic link)
- Dashboard bekijken
- Beheer (teamleden, modules, instellingen)
- Incidentmeldingen goedkeuren
- Kwaliteitsrapportages inzien

```
┌──────────────────┐     ┌──────────────────────┐
│   WhatsApp        │     │   Beveiligd Portaal   │
│   (de bel)        │     │   (de kluis)           │
│                   │     │                        │
│ • Check-ins in    │     │ • Weekberichten lezen  │
│ • Notificaties    │     │ • Goedkeuren           │
│ • ZorgMatch       │     │ • Dashboard            │
│ • Onboarding chat │     │ • Beheer               │
└────────┬──────────┘     └────────┬───────────────┘
         │                         │
         └────────┬────────────────┘
                  ↓
         ┌────────────────┐
         │  ZorgAgent      │
         │  eigen server   │
         │  (verwerking)   │
         └────────────────┘
```

---

## Authenticatie

### Medewerker → Portaal
**Magic link.** ZorgAgent stuurt een unieke link via WhatsApp. Tik, je bent in. Geen wachtwoord.

- Link is uniek per actie (bijv. specifiek weekbericht)
- Gebonden aan WhatsApp-nummer (device check)
- Verloopt na 1 uur
- Eenmalig gebruik na goedkeuring
- HTTPS, eigen server

PIN als optionele extra laag voor instellingen die dat eisen vanuit NEN 7510.

### Teamleider/Beheerder → Dashboard
Login via website (email + wachtwoord). Verwerkersovereenkomst getekend bij aanmelding.

---

## Onboarding

### Stap 1: Website (account + juridisch)
```
zorgagent.nl → Account aanmaken → Verwerkersovereenkomst tekenen → QR-code
```

### Stap 2: WhatsApp (setup via chat)
```
Teamleider scant QR → verbonden met ZorgAgent

ZorgAgent: "Welkom! Hoe heet je team?"
Teamleider: "Afdeling Zonnebloom"

ZorgAgent: "Welke modules wil je activeren?"
          ✅ ZorgBericht — weekberichten familie
          ✅ ZorgReputatie — reviews & imago
          ✅ ZorgWerving — vacatureteksten
          ☐ ZorgMatch — diensten vullen
          ☐ ZorgMelding — incidentmeldingen
          ☐ ZorgInwerk — onboarding

Teamleider: "Eerste drie"

ZorgAgent: "Top. Stuur me je teamlijst. 
           Naam, telefoonnummer, rol. 
           Mag als tekst, foto van de lijst, of Excel."

Teamleider: [stuurt foto van telefoonlijst]

ZorgAgent: "Dit heb ik eruit gehaald:
           ┌─────────────────────────────────┐
           │ Sandra Bakker  06-123  verz IG3  │
           │ Karen de Jong  06-456  verz IG2  │
           │ Piet Mol       06-789  EVV       │
           └─────────────────────────────────┘
           Klopt dit? ✅ of stuur correctie"

Teamleider: ✅

ZorgAgent: "Hoe praat jullie instelling met families?
           🏠 Huiselijk
           🤝 Persoonlijk
           📋 Zakelijk"

Teamleider: 🏠

ZorgAgent: "En de bewoners op Zonnebloom? 
           Stuur me de namen. Mag als tekst of foto."

Teamleider: [stuurt lijst]

ZorgAgent: "Familie contactgegevens? 
           Per bewoner een emailadres of telefoonnummer 
           van de contactpersoon."

Teamleider: [stuurt lijst]

ZorgAgent: "Klaar! Ik stuur je teamleden nu een welkomstbericht.
           De dagelijkse check-in komt elke dag om 19:00.
           Eerste weekbericht gaat volgende week vrijdag."
```

### Stap 3: Welkomstbericht naar team
```
ZorgAgent → Sandra: "Hoi Sandra! Ik ben ZorgAgent, 
           de assistent van afdeling Zonnebloom. 
           Elke avond vraag ik even hoe het was. 
           Kort zinnetje over je bewoners is genoeg. 
           Makkelijker kan niet! 😊"
```

---

## Rollen & Dashboard

### Verzorgende
- Ontvangt dagelijkse check-in via WhatsApp
- Ontvangt magic links voor goedkeuring (als EVV'er)

### Teamleider — Dashboard
```
┌─────────────────────────────────────────┐
│ 🏠 Zonnebloom — deze week               │
│                                          │
│ 📝 Check-ins ontvangen    23/25 (92%)   │
│ 💌 Weekberichten verstuurd 14/15         │
│ ⭐ ZorgkaartNL reviews     2 nieuw       │
│ 📋 Vacatureteksten         1 gegenereerd │
│                                          │
│ Team activiteit:                         │
│ Sandra ████████░░ 80%                    │
│ Karen  ██████████ 100%                   │
│ Piet   ██████░░░░ 60%                    │
└─────────────────────────────────────────┘
```

### Beheerder — Dashboard + Beheer
```
Alles van teamleider, plus:
┌─────────────────────────────────────────┐
│ Teamleden beheren                        │
│ Modules aan/uit                          │
│ Toon weekberichten aanpassen             │
│ Bewoners/familie beheren                 │
│ Check-in tijdstip wijzigen               │
│ Facturen & abonnement                    │
│ Verwerkersovereenkomst downloaden        │
│ AVG-logboek exporteren                   │
└─────────────────────────────────────────┘
```

---

## ZorgMatch — Gedetailleerd Ontwerp

### Diensten Vullen

```
Roosteraar: "Nachtdienst zaterdag 23:00-07:00 Zonnebloom, 
            moet IG3 hebben"

ZorgAgent:  "📋 Open dienst:
            ┌──────────────────────────┐
            │ Dag:    zaterdag 14 mrt  │
            │ Tijd:   23:00 - 07:00    │
            │ Afd:    Zonnebloom       │
            │ Niveau: IG3              │
            └──────────────────────────┘
            Klopt dit? ✅ of stuur correctie"

Roosteraar: ✅
```

### Escalatielogica (op basis van urgentie)

```
Dienst over 5+ dagen → groepsbericht → escalatie na 24u
Dienst over 2-4 dagen → groepsbericht → escalatie na 4u  
Dienst over <24u      → skip groep, direct individueel
Dienst over <6u       → individueel + melding "dit wordt krap"

Roosteraar kan altijd overrulen: "wacht tot woensdag" / "stuur nu"
```

### Diensten Ruilen (niche)

```
Sandra: "Ik kan woensdag niet, wie wil ruilen met mijn donderdag?"

ZorgAgent: "Sandra wil ruilen:
           Biedt aan: donderdag 8 mrt dagdienst 07:00-15:00
           Zoekt:     woensdag 7 mrt dagdienst 07:00-15:00
           
           Wie wil ruilen? Reageer met ✅"
           
→ Stuurt naar team → Karen reageert ✅
→ Roosteraar krijgt: "Sandra ↔ Karen willen wo/do ruilen. Akkoord?"
→ Roosteraar: ✅
→ Bevestiging naar Sandra en Karen
```

---

## Privacy & Compliance

### AVG

- **Verwerkersovereenkomst** getekend bij account aanmaken
- **Geen medische data in WhatsApp** — alleen informele check-ins en notificaties met links
- **Single-tenant** — elke instelling een eigen geïsoleerde Docker container
- **Data eigenaarschap** — instelling kan altijd exporteren of laten verwijderen
- **Inzageverzoek** — export bewoner-map als zip
- **Verwijderingsverzoek** — delete bewoner-map, weg is weg
- **Bewaartermijn** — configureerbaar per instelling

### EU AI Act

| Vereiste | Hoe ZorgAgent dit invult |
|----------|--------------------------|
| **Menselijk toezicht** | ✅-patroon op elke output. Geen autonome acties. |
| **Transparantie** | AI-disclosure op elke externe output |
| **Logging** | Elke actie, goedkeuring, wijziging gelogd (Ledger) |
| **Data-isolatie** | Single-tenant Docker per instelling |
| **Bias-monitoring** | ZorgMatch: monitoren of bepaalde medewerkers vaker/minder worden benaderd |
| **Technische documentatie** | Hoe het werkt, welke modellen, welke data — voor autoriteiten |
| **Conformiteitsbeoordeling** | Voorbereid op self-assessment per augustus 2027 |
| **High-risk classificatie** | ZorgMatch (Annex III: task allocation) — menselijk toezicht ingebouwd |

### NEN 7510
- HTTPS, eigen server
- Magic links met vervaltijd
- Optionele PIN voor instellingen die dat eisen
- Audit trail op alle data-toegang

---

## Error Handling

Principe: **ZorgAgent faalt nooit stil.** Altijd een bericht terug, altijd een alternatief of escalatie.

| Scenario | Reactie |
|----------|---------|
| **Medewerker reageert niet op check-in** | Geen reminder dezelfde dag. Volgende dag gewoon opnieuw. Geen druk. |
| **Te weinig check-ins voor weekbericht** | ZorgAgent aan EVV'er: "Niet genoeg input voor weekbericht mw De Vries. Kun je een kort zinnetje sturen?" |
| **EVV'er keurt weekbericht niet goed** | Vrijdag 14:00 → reminder 17:00 → niet goedgekeurd = niet verstuurd. "Volgende week opnieuw?" |
| **Niemand reageert op ZorgMatch** | Groep → individueel → "Niet gevuld, zelf actie nodig." |
| **Portaal is down** | "Bewaar je rapportage, nieuwe link zodra het weer werkt." |
| **Slechte audio (ZorgMelding)** | "Kon je niet goed verstaan. Opnieuw inspreken of typ het kort." |

---

## Pricing

### Freemium → Per Afdeling

```
Gratis:
├── 1 module naar keuze
├── 1 afdeling  
├── 30 dagen volledige toegang
└── Dashboard

Basis — €349/afdeling/maand:
├── Alle modules
├── Onbeperkt
├── Dashboard + beheer
└── AVG-logboek export

Groei — €249/afdeling/maand (3+ afdelingen):
├── Alles van Basis
├── Volumekorting
├── Dedicated onboarding
└── Kwartaal review

Instelling — op maat (10+ afdelingen):
├── Custom pricing
├── API toegang
├── SLA
└── Account manager
```

---

## Technische Architectuur

### Stack

| Component | Keuze | Waarom |
|-----------|-------|--------|
| Runtime | Node.js / TypeScript | Pi ecosystem, Baileys, alles in TS |
| WhatsApp | Baileys (pilot) → Business API (productie) | Uitwisselbare adapter |
| LLM | OpenRouter — GPT-4o-mini (parsing) + Claude (generatie) | Best-of-breed per taak |
| Portaal | Express + server-rendered HTML templates | Simpel, snel, 5-6 pagina's |
| Hosting | Docker per instelling (single-tenant) | AVG + AI Act compliance |
| Data | Markdown (bron) + JSON index (queries) | Leesbaar, exporteerbaar, AVG-proof |
| Email | Composio Gmail/Outlook of Resend | ZorgBericht naar families |
| Audit | Eigen log file per container | Ledger-primitief |

### LLM Kosten per Afdeling/Dag

```
~5 check-ins verwerken (GPT-4o-mini):    €0.02
~3 weekberichten genereren (Claude):      €0.08
~1 vacaturetekst (Claude):               €0.03
Overig (parsing, matching):              €0.02
                                         ─────
                                   ~€0.15/dag
                                   ~€4.50/maand

Bij €349/maand = ~1.3% LLM-kosten
```

### Single-Tenant Container

```
Per instelling:
┌──────────────────────────────────┐
│ Docker container                  │
│ ├── ZorgAgent runtime (Node.js)   │
│ ├── Portaal (Express + templates) │
│ ├── Nginx (reverse proxy + TLS)   │
│ ├── data/                         │
│ │   ├── bewoners/                 │
│ │   │   └── [naam]/              │
│ │   │       ├── 2026-02-24.md    │
│ │   │       └── weekbericht-W09.md│
│ │   ├── medewerkers/             │
│ │   ├── diensten/                │
│ │   ├── index.json               │
│ │   └── audit.log                │
│ └── config.yaml                   │
│                                   │
│ Eén poort: 443                    │
│ [instelling].zorgagent.nl         │
└──────────────────────────────────┘

Kosten: ~€15-30/maand per container (VPS)
```

### Data Opslag

```
data/
├── bewoners/
│   └── de-vries/
│       ├── 2026-02-24.md        ← check-in data die dag
│       ├── 2026-02-21.md
│       ├── weekbericht-W09.md   ← gegenereerd weekbericht
│       └── profile.json         ← naam, afdeling, familie contacten
├── medewerkers/
│   └── sandra-bakker/
│       └── profile.json         ← naam, nummer, rol, afdeling
├── diensten/
│   └── 2026-03-14.md            ← open/gevuld die dag
├── index.json                    ← snelle queries
├── config.yaml                   ← modules, toon, timing
└── audit.log                     ← ledger
```

AVG-inzageverzoek? `zip bewoners/de-vries/`. Verwijderingsverzoek? `rm -rf bewoners/de-vries/`.

---

## Modulaire Skills Architectuur

Geïnspireerd door GravityClaw / OpenClaw / Vercel Skills. Elke module is een self-contained skill.

### Skill Format

```
skills/zorgbericht/
├── SKILL.md          # Instructies voor het LLM
├── config.yaml       # Triggers, kanalen, timing, autonomy level
├── templates/        # Email templates, toonpresets
└── scripts/          # Optionele runtime scripts
```

### Installatie

Via onboarding UI (WhatsApp) of beheerportaal.

Skills kunnen komen van:
1. **Built-in** — ships met ZorgAgent (MVP modules)
2. **Community** — GitHub repos (toekomst)
3. **Custom** — instelling-specifiek via skill-creator

### Compatibiliteit

Skill format is compatible met OpenClaw, Claude Code, AntiGravity en Vercel Skills ecosysteem.

---

## Subsidies

| Subsidie | Bedrag | Wanneer | Status |
|----------|--------|---------|--------|
| **WBSO** | €15.979 aftrek + €7.996 startersaftrek = **€23.975** | Rolling | Klaar om aan te vragen |
| **MIT R&D AI** | Tot €350K (35%, min €200K project) | 2026 ronde | MKB-partner nodig (zorginstelling) |
| **SIDN Fonds** | Tot €10K pioniersproject | Doorlopend | Lage drempel |

### WBSO — Solo Developer

- Eenmanszaak/ZZP: vaste S&O-aftrek, geen percentage van loonkosten
- Minimaal 500 S&O-uren/jaar (~10 uur/week)
- Aanvragen VOOR de werkperiode
- Uren-administratie bijhouden
- Kwalificerend: framework architectuur, NLP pipeline, security/AVG model, WhatsApp integratie, testen
- Niet kwalificerend: routine dev, marketing, admin

---

## Concurrentie

| Domein | Concurrent | Wat zij doen | Wat wij anders doen |
|--------|-----------|-------------|---------------------|
| Rapportage | Attendi, Tell James | Spraak → ECD | Wij doen geen ECD. Wij doen de laag eromheen. |
| Planning | Nedap Ons Planning | Rooster in ECD | Wij doen WhatsApp-communicatie rond het rooster. |
| Familie | Connect2Care, Carenzorgt | Familie moet app/account aanmaken | Wij sturen proactief email. Familie hoeft niks. |
| Reviews | Feeddex | Reactief reviews verzamelen | Wij genereren proactief reviews uit tevreden families. |
| Vacatures | Indeed, LinkedIn | Platform | Wij genereren authentieke teksten uit interne sfeerdata. |
| Vrijwilligers | Hello's | Coördinatie platform | Niet ons domein (nu). |

---

## Bouwvolgorde

### Phase 1: Foundation (week 1-3)
1. WhatsApp channel adapter (Baileys, uitwisselbaar)
2. Gateway (Node.js server: WhatsApp → agent → WhatsApp)
3. Dagelijkse check-in engine (timing, bewoner-matching, opslag)
4. Beveiligd portaal (Express, magic links, basis pagina's)
5. Audit logger

### Phase 2: MVP Modules (week 4-6)
1. ZorgBericht skill (check-ins → weekbericht → goedkeuring → email)
2. ZorgReputatie skill (follow-up na weekberichten → review verzoek)
3. ZorgWerving skill (vacaturetekst generatie uit check-in data)

### Phase 3: Onboarding & Polish (week 7-8)
1. Website (account, verwerkersovereenkomst, QR-code)
2. WhatsApp onboarding flow (team, bewoners, familie, modules, toon)
3. Dashboard (teamleider view)
4. Beheerportaal (admin view)

### Phase 4: Uitbreiding (week 9+)
1. ZorgSignaal (proactieve signalering uit check-in patronen)
2. ZorgMatch (diensten vullen + ruilen)
3. ZorgMelding (incidentmeldingen)
4. ZorgInwerk (onboarding nieuwe medewerkers)
5. ZorgKwaliteit (kwartaalrapportages)
6. WhatsApp Business API migratie

---

## Success Metrics — Pilot

| Metric | Target |
|--------|--------|
| Check-in response rate | >70% na week 2 |
| Weekberichten verstuurd per week | 90% van bewoners |
| Familie tevredenheid (NPS) | >50 |
| Nieuwe ZorgkaartNL reviews per maand | >5 |
| Tijd voor teamleider per week op communicatie | -50% |
| Adoptie na 30 dagen | >80% van team gebruikt het |

---

## Build Steps — Grounded in Dependencies

### Dependencies & Versions

```
@whiskeysockets/baileys@7.0.0-rc.9  — WhatsApp Web WebSocket client
node-cron                            — Cron scheduling for check-ins/weekberichten
openai                               — OpenRouter-compatible SDK (chat completions)
resend                               — Email delivery (3 lines of code)
express@5                            — Beveiligd portaal (magic links, dashboard)
pino                                 — Structured JSON logging (audit trail)
qrcode-terminal                      — QR display for WhatsApp pairing
nanoid                               — Unique tokens for magic links
zod                                  — Input validation
dotenv                               — Environment variables from .env
```

### Stap 1: WhatsApp Draait

**Doel:** Bericht sturen, bericht ontvangen. Meer niet.

**Baileys v7 essentials (from docs):**
- `makeWASocket({ auth: state, printQRInTerminal: true })` — connect
- `useMultiFileAuthState('data/auth')` — persist session, no QR re-scan
- `sock.ev.on('connection.update', ...)` — handle connect/disconnect/reconnect
- `sock.ev.on('creds.update', saveCreds)` — save auth on every update
- `sock.ev.on('messages.upsert', ...)` — receive messages
- `sock.sendMessage(jid, { text: '...' })` — send text
- Reconnect on close unless `DisconnectReason.loggedOut`
- JID format: `[number]@s.whatsapp.net` (individual), `[id]@g.us` (group)

**File:** `src/channels/whatsapp/connection.ts`

**Test:** Start → scan QR → send "hoi" → receive "hoi" terug.

### Stap 2: Check-in Werkt

**Doel:** Elke dag om 19:00 stuurt agent check-in naar hardcoded nummer. Antwoord wordt opgeslagen als markdown.

**Depends on:** Stap 1 (WhatsApp connection)
- `node-cron`: `cron.schedule('0 19 * * *', callback)` — dagelijks 19:00
- Markdown write: `fs.writeFile('data/bewoners/[naam]/YYYY-MM-DD.md', content)`
- Parse antwoord: LLM extract bewoner-namen uit vrije tekst

**Files:**
- `src/core/scheduler.ts` — cron wrapper
- `src/core/checkin.ts` — check-in logic
- `src/core/storage.ts` — markdown read/write

**Test:** 5 dagen check-ins → 5 .md files in `data/bewoners/`.

### Stap 3: Weekbericht Generatie

**Doel:** Vrijdag 14:00, lees check-ins van de week, genereer warm weekbericht.

**Depends on:** Stap 2 (check-in data)
- `openai` SDK tegen OpenRouter: `baseURL: 'https://openrouter.ai/api/v1'`
- Model: `anthropic/claude-sonnet-4-20250514` (toon/warmte)
- System prompt met toon-instelling (huiselijk/persoonlijk/zakelijk)
- Output: markdown weekbericht per bewoner

**Files:**
- `src/skills/zorgbericht/generate.ts` — LLM weekbericht generatie
- `src/skills/zorgbericht/templates/` — toon presets

**Test:** Weekbericht in terminal uit 5 check-in files.

### Stap 4: Goedkeuring via Portaal

**Doel:** Magic link via WhatsApp → Express pagina → lees weekbericht → ✅

**Depends on:** Stap 3 (weekbericht)
- `express` v5: simpele server, 2-3 routes
- `nanoid`: token generatie voor magic links
- Routes: `GET /approve/:token` (toon weekbericht), `POST /approve/:token` (goedkeuren)
- Token verloopt na 1 uur, eenmalig gebruik
- HTTPS via reverse proxy (nginx in Docker) of lokaal HTTP voor dev

**Files:**
- `src/portal/server.ts` — Express app
- `src/portal/views/` — HTML templates (approval page, dashboard)
- `src/portal/tokens.ts` — token generatie + validatie

**Test:** Klik link → zie weekbericht → keur goed → status updated.

### Stap 5: Email Verzending

**Doel:** Na goedkeuring, stuur weekbericht naar familie email.

**Depends on:** Stap 4 (goedkeuring)
- `resend`: `new Resend(apiKey).emails.send({ from, to, subject, html })`
- HTML email template met weekbericht + AI-disclosure footer
- Fallback: Composio Gmail als Resend niet werkt

**Files:**
- `src/skills/zorgbericht/send.ts` — email verzending
- `src/skills/zorgbericht/templates/email.html` — email template

**Test:** Email in je inbox. Met AI-disclosure footer.

---

## Open voor Later

- Integratie met ECD's (als zorginstellingen erom vragen)
- Meerdere talen (voor anderstalige medewerkers)
- Voice interface (bellen naar ZorgAgent i.p.v. WhatsApp)
- Mantelzorger-initiated vragen ("Hoe gaat het met mama?")
- Proactieve signalering ("Dhr Bakker is 4 dagen onrustig — aandachtspunt?")
