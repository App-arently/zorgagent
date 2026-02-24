# ZorgAgent — Build Guide

> Dit document bevat alles wat je nodig hebt om ZorgAgent te bouwen. Lees PLAN.md voor het volledige ontwerp. Dit document is de implementatie-instructie.

---

## Wat er al staat

```
~/pi-agent/
├── PLAN.md                          ← Volledig ontwerp (lees dit eerst)
├── BUILD.md                         ← Dit bestand
├── package.json                     ← @zorgagent/core, alle deps geïnstalleerd
├── tsconfig.json                    ← TypeScript config
├── website/
│   └── landing-page.md              ← Landing page copy (NL)
├── src/
│   ├── core/
│   │   ├── types/index.ts           ← Oude types (herschrijven)
│   │   └── events/bus.ts            ← Oude event bus (herschrijven)
│   └── security/
│       ├── audit/logger.ts          ← Oude audit logger (herschrijven)
│       ├── policies/tool-policy.ts  ← Oude policy engine (herschrijven)
│       └── sanitize.ts              ← Oude sanitizer (herschrijven)
└── node_modules/                    ← Alle deps geïnstalleerd
```

**Alle code in `src/` is van een eerdere iteratie en moet herschreven worden.** Het ontwerp is fundamenteel veranderd. Gebruik het niet als basis.

## Geïnstalleerde Dependencies

```json
{
  "@whiskeysockets/baileys": "^7.0.0-rc.9",
  "node-cron": "installed",
  "openai": "installed",
  "resend": "installed",
  "express": "^5.2.0",
  "pino": "installed",
  "qrcode-terminal": "installed",
  "nanoid": "^5.0.0",
  "zod": "^3.24.0",
  "dotenv": "^17.0.0",
  "chalk": "^5.4.0"
}
```

Devdeps: `tsx`, `typescript`, `vitest`, `@types/node`, `@types/express`, `@types/node-cron`

## Environment Variables

Beschikbaar in `~/.env` (source met `set -a && source ~/.env && set +a`):

```
OPENAI_API_KEY        → Voor OpenRouter (baseURL override)
OPENROUTER_API_KEY    → Direct OpenRouter access
ELEVENLABS_API_KEY    → TTS (niet nodig voor MVP)
RESEND_API_KEY        → Email verzending
COMPOSIO_API_KEY      → 985 app integraties (Gmail, Docs, etc)
TAVILY_API_KEY        → Web search
BRAVE_API_KEY         → Web search
E2B_API_KEY           → Sandbox (niet nodig voor MVP)
GITHUB_TOKEN          → GitHub API
```

## Doel-architectuur

```
src/
├── index.ts                    ← Entry point: start alles
├── config.ts                   ← Laad .env, valideer, export config object
├── channels/
│   └── whatsapp/
│       ├── connection.ts       ← Baileys socket, auth, reconnect
│       ├── handlers.ts         ← Message routing (check-in reply, commands)
│       └── sender.ts           ← Utility: sendText, sendLink, sendToGroup
├── core/
│   ├── scheduler.ts            ← Cron wrapper rond node-cron
│   ├── checkin.ts              ← Dagelijkse check-in logica
│   ├── storage.ts              ← Markdown + JSON read/write per bewoner
│   └── logger.ts               ← Pino logger (audit trail)
├── skills/
│   └── zorgbericht/
│       ├── generate.ts         ← LLM weekbericht generatie via OpenRouter
│       ├── approve.ts          ← Goedkeuringsflow (token maken, status bijhouden)
│       ├── send.ts             ← Email verzending via Resend
│       └── templates/
│           ├── prompts.ts      ← System prompts per toon (huiselijk/persoonlijk/zakelijk)
│           └── email.html      ← Email template met AI-disclosure
├── portal/
│   ├── server.ts               ← Express app (magic link routes + dashboard)
│   ├── tokens.ts               ← Nanoid token generatie + validatie + expiry
│   └── views/
│       ├── approve.html        ← Weekbericht lezen + goedkeuren pagina
│       └── dashboard.html      ← Teamleider dashboard
└── data/                        ← Runtime data (gitignored)
    ├── auth/                   ← Baileys auth state
    ├── bewoners/
    │   └── [naam-slug]/
    │       ├── profile.json    ← Naam, afdeling, familie contacts
    │       └── YYYY-MM-DD.md   ← Check-in data per dag
    ├── config.yaml             ← Instelling config (modules, toon, timing)
    └── audit.log               ← Pino JSON log
```

---

## Bouw in 5 Stappen

### Stap 1: WhatsApp Connectie

**Doel:** Scan QR, verbind, echo berichten terug.

**File: `src/channels/whatsapp/connection.ts`**

```typescript
// Kernlogica:
import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason 
} from '@whiskeysockets/baileys'

// 1. Auth state laden uit data/auth/
const { state, saveCreds } = await useMultiFileAuthState('data/auth')

// 2. Socket maken
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,  // QR in terminal voor eerste keer
  browser: ['ZorgAgent', 'Chrome', '1.0.0']
})

// 3. Reconnect bij disconnect (tenzij uitgelogd)
sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
    if (statusCode !== DisconnectReason.loggedOut) {
      // reconnect
    }
  }
  if (connection === 'open') {
    console.log('✅ WhatsApp verbonden')
  }
})

// 4. Creds opslaan bij update
sock.ev.on('creds.update', saveCreds)

// 5. Berichten ontvangen
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (!msg.key.fromMe && msg.message?.conversation) {
      // Echo terug
      await sock.sendMessage(msg.key.remoteJid!, { 
        text: msg.message.conversation 
      })
    }
  }
})
```

**File: `src/channels/whatsapp/sender.ts`**

```typescript
// Utility functies:
export async function sendText(sock, jid: string, text: string)
export async function sendLink(sock, jid: string, text: string, url: string)
// JID format: 31612345678@s.whatsapp.net (individu)
//             [id]@g.us (groep)
```

**Test:** `npx tsx src/index.ts` → scan QR → stuur "hoi" vanaf je telefoon → krijg "hoi" terug.

**Let op Baileys v7 breaking changes:** Check https://whiskey.so/migrate-latest als iets niet werkt.

---

### Stap 2: Check-in Engine

**Doel:** Elke dag om 19:00 stuurt agent "Hoi [naam], hoe was het vandaag?" Antwoord wordt geparsed en opgeslagen.

**File: `src/core/scheduler.ts`**

```typescript
import cron from 'node-cron'

// cron.schedule('0 19 * * *', callback)  → elke dag 19:00
// cron.schedule('0 14 * * 5', callback)  → elke vrijdag 14:00
// Timezone: Europe/Amsterdam
```

**File: `src/core/checkin.ts`**

```typescript
// 1. Lees config.yaml → welke medewerkers, welke bewoners
// 2. Stuur check-in bericht naar elke medewerker
// 3. Wacht op antwoord (message handler in whatsapp/handlers.ts)
// 4. Parse antwoord: extract bewoner-namen + observaties
//    - Gebruik LLM (GPT-4o-mini) om vrije tekst te parsen naar:
//      { bewoner: string, observatie: string }[]
// 5. Sla op per bewoner: data/bewoners/[naam]/YYYY-MM-DD.md
// 6. Bevestig: "Bedankt! Genoteerd voor De Vries, Bakker en Jansen ✅"
```

**File: `src/core/storage.ts`**

```typescript
// Markdown operaties:
export function saveCheckin(bewoner: string, date: string, content: string)
  // → schrijf naar data/bewoners/[slug]/YYYY-MM-DD.md
  
export function getCheckins(bewoner: string, from: Date, to: Date): string[]
  // → lees alle .md files in date range
  
export function getBewoners(): BewonderProfile[]
  // → lees alle profile.json files

// Slug: "Mevrouw De Vries" → "de-vries"
```

**File: `src/core/storage.ts` — Markdown format per dag:**

```markdown
# Check-in 2026-02-24

## Bron: Sandra Bakker (19:02)

Mw De Vries lekker buiten geweest vandaag, genoten van de tuin.

## Bron: Karen de Jong (19:15)  

Mw De Vries at goed bij het avondeten. Was vrolijk.
```

**Test:** Hardcode je eigen nummer + 1 bewoner. Run 5 dagen. Check `data/bewoners/test/` voor 5 .md files.

---

### Stap 3: Weekbericht Generatie

**Doel:** Vrijdag 14:00, lees check-ins, genereer weekbericht via Claude.

**File: `src/skills/zorgbericht/generate.ts`**

```typescript
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
})

// Model: anthropic/claude-sonnet-4-20250514 (toon/warmte)
// Alternatief: anthropic/claude-3.5-sonnet (goedkoper)

export async function generateWeekbericht(
  bewoner: string,
  checkins: string[],     // markdown content van de week
  toon: 'huiselijk' | 'persoonlijk' | 'zakelijk',
  familienaam: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4-20250514',
    messages: [
      { role: 'system', content: TOON_PROMPTS[toon] },
      { role: 'user', content: `
        Genereer een warm weekbericht voor de familie van ${bewoner}.
        De familie heet ${familienaam}.
        
        Check-in data van deze week:
        ${checkins.join('\n---\n')}
        
        Schrijf een persoonlijk weekbericht van 100-200 woorden.
        Eindig met de AI-disclosure:
        "🤖 Dit bericht is gegenereerd door ZorgAgent (AI). 
         Gecontroleerd door [EVV'er naam]."
      `}
    ]
  })
  return response.choices[0].message.content
}
```

**File: `src/skills/zorgbericht/templates/prompts.ts`**

```typescript
export const TOON_PROMPTS = {
  huiselijk: `Je schrijft weekberichten namens een zorginstelling naar families 
    van bewoners. Je toon is warm, huiselijk, alsof je een brief schrijft aan 
    een goede bekende. Gebruik "uw moeder/vader" of de voornaam. 
    Geen medisch jargon. Geen bullet points. Gewoon een warm verhaal.`,
    
  persoonlijk: `Je schrijft weekberichten namens een zorginstelling naar families.
    Je toon is persoonlijk maar professioneel. Warm maar niet informeel.
    Gebruik "uw moeder/vader". Helder en gestructureerd.`,
    
  zakelijk: `Je schrijft weekberichten namens een zorginstelling naar families.
    Je toon is professioneel en informatief. Gestructureerd. 
    Gebruik "mevrouw/meneer [achternaam]".`
}
```

**Test:** Voer handmatig 5 check-in .md files aan → run generate → weekbericht in terminal.

---

### Stap 4: Goedkeuring via Portaal

**Doel:** EVV'er ontvangt WhatsApp link → opent pagina → leest weekbericht → keurt goed.

**File: `src/portal/server.ts`**

```typescript
import express from 'express'

const app = express()

// GET /approve/:token → toon weekbericht + goedkeurknop
app.get('/approve/:token', async (req, res) => {
  const approval = getApproval(req.params.token)
  if (!approval || approval.expired || approval.used) {
    return res.status(404).send('Link verlopen of al gebruikt.')
  }
  // Render HTML met weekbericht + ✅ knop
  res.send(renderApprovalPage(approval.weekbericht, approval.bewoner))
})

// POST /approve/:token → markeer als goedgekeurd → trigger email
app.post('/approve/:token', async (req, res) => {
  const approval = markApproved(req.params.token)
  if (!approval) return res.status(404).send('Link verlopen.')
  // Trigger email verzending
  await sendWeekbericht(approval)
  res.send(renderSuccessPage(approval.bewoner))
})

// Dashboard (later, stap 5+)
// app.get('/dashboard', authMiddleware, ...)

app.listen(3000)
```

**File: `src/portal/tokens.ts`**

```typescript
import { nanoid } from 'nanoid'

interface Approval {
  token: string
  bewoner: string
  weekbericht: string
  evver: string          // wie moet goedkeuren
  createdAt: Date
  expiresAt: Date        // +1 uur
  approved: boolean
  approvedAt?: Date
}

// In-memory store voor MVP. Later: JSON file of SQLite.
const approvals = new Map<string, Approval>()

export function createApproval(bewoner, weekbericht, evver): string {
  const token = nanoid(32)
  approvals.set(token, {
    token,
    bewoner,
    weekbericht,
    evver,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 uur
    approved: false
  })
  return token
}

export function getApproval(token: string): Approval | null {
  const a = approvals.get(token)
  if (!a) return null
  if (new Date() > a.expiresAt) return { ...a, expired: true }
  return a
}
```

**File: `src/portal/views/approve.html`**

Simpele HTML pagina:
- ZorgAgent logo bovenaan
- Bewoner naam
- Weekbericht tekst
- Grote groene "✅ Goedkeuren" knop (POST naar /approve/:token)
- "✏️ Correctie sturen" link (opent WhatsApp deeplink naar ZorgAgent)
- Footer: "Dit weekbericht wordt na goedkeuring verstuurd naar [familie email]"

**Flow:**
1. Weekbericht gegenereerd (stap 3)
2. Token aangemaakt (portal/tokens.ts)
3. WhatsApp bericht naar EVV'er: "Weekbericht mw De Vries klaar. Bekijk: https://[host]/approve/[token]"
4. EVV'er tikt op link → ziet weekbericht → tikt ✅
5. Token gemarkeerd als approved → trigger stap 5

**Test:** Genereer weekbericht → maak token → open link in browser → klik goedkeuren → check status.

---

### Stap 5: Email Verzending

**Doel:** Na goedkeuring, stuur weekbericht als email naar familie.

**File: `src/skills/zorgbericht/send.ts`**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWeekberichtEmail(
  to: string,              // familie email
  bewoner: string,         // "Mevrouw De Vries"  
  weekbericht: string,     // gegenereerde tekst
  instelling: string,      // "Zorgcentrum Zonnebloom"
  evver: string            // "Sandra Bakker" (wie heeft goedgekeurd)
) {
  await resend.emails.send({
    from: 'ZorgAgent <weekbericht@zorgagent.nl>',
    to: [to],
    subject: `Weekbericht ${bewoner} — ${instelling}`,
    html: renderEmailTemplate({
      bewoner,
      weekbericht,
      instelling,
      evver,
      // AI disclosure wordt in template toegevoegd
    })
  })
}
```

**Email template bevat:**
- Header met instelling naam
- "Beste familie [naam],"
- Weekbericht tekst
- Footer: "Met vriendelijke groet, het team van [instelling]"
- AI-disclosure: "🤖 Dit bericht is gegenereerd door ZorgAgent (AI). Gecontroleerd door [EVV'er naam]."
- Uitschrijflink (AVG vereiste)

**Test:** Na goedkeuring in stap 4 → email in je inbox.

---

## Config Format

**File: `data/config.yaml`** (aangemaakt tijdens onboarding)

```yaml
instelling:
  naam: "Zorgcentrum Zonnebloom"
  
modules:
  zorgbericht:
    enabled: true
    toon: huiselijk          # huiselijk | persoonlijk | zakelijk
    dag: vrijdag             # welke dag weekbericht
    tijd: "14:00"            # welk tijdstip
  zorgmatch:
    enabled: false
  zorgreputatie:
    enabled: false

checkin:
  tijd: "19:00"
  timezone: "Europe/Amsterdam"

medewerkers:
  - naam: "Sandra Bakker"
    telefoon: "31612345678"
    rol: verz-ig3
    afdeling: Zonnebloom
    evv: true                 # is EVV'er
  - naam: "Karen de Jong"
    telefoon: "31687654321"
    rol: verz-ig2
    afdeling: Zonnebloom

bewoners:
  - naam: "Mevrouw De Vries"
    afdeling: Zonnebloom
    evv: "Sandra Bakker"      # wie is EVV'er voor deze bewoner
    familie:
      - naam: "Dochter De Vries"
        email: "dochter@email.nl"
        kanaal: email          # email | whatsapp
  - naam: "Meneer Bakker"
    afdeling: Zonnebloom
    evv: "Sandra Bakker"
    familie:
      - naam: "Zoon Bakker"
        email: "zoon@email.nl"
        kanaal: email
```

---

## Message Routing

**File: `src/channels/whatsapp/handlers.ts`**

De message handler moet onderscheid maken tussen:

```
Inkomend bericht
├── Van medewerker?
│   ├── Is er een actieve check-in?
│   │   └── Ja → parse als check-in antwoord → opslaan
│   ├── Begint met commando?
│   │   ├── "voeg toe" → beheer flow
│   │   ├── "open dienst" → ZorgMatch (later)
│   │   └── "help" → uitleg sturen
│   └── Anders → vrije tekst → probeer te begrijpen met LLM
├── Van teamleider/beheerder?
│   └── Beheer commando's (team, modules, etc.)
└── Onbekend nummer?
    └── Negeer of antwoord: "Ik ken je nog niet. 
        Vraag je teamleider om je toe te voegen."
```

Gebruik het telefoonnummer (JID) om op te zoeken in config.yaml wie het is.

---

## De Complete Flow — Van Check-in tot Email

```
19:00  scheduler.ts triggert checkin.ts
       ↓
       checkin.ts leest config.yaml → stuurt WhatsApp naar elke medewerker
       ↓
       "Hoi Sandra, hoe was het vandaag bij je bewoners?"
       ↓
19:02  Sandra antwoordt via WhatsApp
       ↓
       handlers.ts ontvangt → herkent als check-in antwoord
       ↓
       checkin.ts parsed met GPT-4o-mini → 
       [{ bewoner: "De Vries", observatie: "lekker buiten geweest" }]
       ↓
       storage.ts schrijft data/bewoners/de-vries/2026-02-24.md
       ↓
       sender.ts → "Bedankt! Genoteerd voor De Vries ✅"

[... 5 dagen lang ...]

Vrijdag 14:00  scheduler.ts triggert zorgbericht/generate.ts
               ↓
               storage.ts leest data/bewoners/de-vries/*.md (deze week)
               ↓
               generate.ts stuurt naar Claude via OpenRouter
               ↓
               Weekbericht gegenereerd
               ↓
               tokens.ts maakt approval token
               ↓
               sender.ts → WhatsApp naar EVV'er:
               "Weekbericht mw De Vries klaar. Bekijk: [link]"
               ↓
14:01          EVV'er tikt op link → portal/server.ts
               ↓
               approve.html → leest weekbericht → klikt ✅
               ↓
               tokens.ts markeert approved
               ↓
               send.ts → Resend email naar dochter@email.nl
               ↓
               "Lieve familie De Vries, wat een fijne week..."
               ↓
               logger.ts → audit.log: 
               { event: "weekbericht_sent", bewoner: "de-vries", 
                 approved_by: "sandra-bakker", sent_to: "dochter@email.nl",
                 timestamp: "2026-02-28T14:01:23Z" }
```

---

## Volgorde van Bouwen

Bouw elke stap als werkend geheel. Test voordat je doorgaat.

```
1. src/config.ts                          ← .env laden, config type
2. src/core/logger.ts                     ← Pino setup
3. src/channels/whatsapp/connection.ts    ← Baileys connect + echo
4. src/channels/whatsapp/sender.ts        ← sendText utility
5. --- TEST: echo bot werkt ---
6. src/core/storage.ts                    ← markdown read/write
7. src/core/scheduler.ts                  ← cron wrapper
8. src/core/checkin.ts                    ← check-in logic
9. src/channels/whatsapp/handlers.ts      ← message routing
10. --- TEST: check-in flow werkt, .md files verschijnen ---
11. src/skills/zorgbericht/templates/prompts.ts  ← toon presets
12. src/skills/zorgbericht/generate.ts    ← LLM weekbericht
13. --- TEST: weekbericht in terminal ---
14. src/portal/tokens.ts                  ← token management
15. src/portal/server.ts                  ← Express app
16. src/portal/views/approve.html         ← goedkeur pagina
17. --- TEST: magic link flow werkt ---
18. src/skills/zorgbericht/send.ts        ← Resend email
19. --- TEST: email in inbox ---
20. src/index.ts                          ← Alles aan elkaar knopen
21. --- TEST: volledige flow van check-in tot email ---
```

## Niet Vergeten

- `data/` toevoegen aan `.gitignore` (bevat auth + bewoner data)
- `data/auth/` is Baileys session — verliezen = opnieuw QR scannen
- Elke externe output bevat AI-disclosure footer
- Audit log elke actie (pino → data/audit.log)
- Tijdzone altijd `Europe/Amsterdam` in cron
- WhatsApp JID: nummer zonder + of 0, met landcode → `31612345678@s.whatsapp.net`
- Baileys v7 heeft breaking changes — check migrate docs als iets niet klopt
- OpenRouter API key, niet OpenAI key, voor de LLM calls
- Resend vereist een verified domain voor production (dev mode: alleen naar eigen email)
