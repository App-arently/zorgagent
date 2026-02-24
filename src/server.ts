import express from 'express'
import { readFileSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { getApproval, markApproved } from './portal/tokens.js'
import { sendWeekberichtEmail } from './skills/zorgbericht/send.js'
import { logger, audit } from './core/logger.js'

// --- Message handler registry (for WhatsApp webhook) ---

export type MessageHandler = (from: string, body: string, raw: Record<string, unknown>) => Promise<void> | void

const messageHandlers: MessageHandler[] = []

export function onMessage(handler: MessageHandler) {
  messageHandlers.push(handler)
}

// --- HTML template ---

const __dirname = dirname(fileURLToPath(import.meta.url))
const template = readFileSync(resolve(__dirname, 'portal/views/approve.html'), 'utf-8')

function render(content: string): string {
  return template.replace('{{CONTENT}}', content)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

// --- Create app ---

export function createApp(): express.Application {
  const app = express()
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  // --- Static website ---
  app.use(express.static(resolve(__dirname, '../website')))

  // --- Health check ---
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'zorgagent' })
  })

  // --- Twilio WhatsApp webhook ---
  app.post('/webhook/whatsapp', async (req, res) => {
    const { From, Body, MessageSid, ProfileName } = req.body
    const from = (From as string || '').replace('whatsapp:', '')
    const body = (Body as string || '').trim()

    logger.info(`📥 WhatsApp ← ${from} (${ProfileName}): ${body.slice(0, 80)}`)
    audit('whatsapp_received', { from, body: body.slice(0, 200), sid: MessageSid })

    for (const handler of messageHandlers) {
      try {
        await handler(from, body, req.body)
      } catch (err) {
        logger.error({ err, from, body: body.slice(0, 100) }, 'Handler error')
      }
    }

    // Empty TwiML — we reply via API
    res.type('text/xml').send('<Response></Response>')
  })

  // --- Approval portal ---
  app.get('/approve/:token', (req, res) => {
    const approval = getApproval(req.params.token)

    if (!approval) {
      res.status(404).send(render(`
        <div class="error">
          <p>❌ Link niet gevonden of verlopen.</p>
          <p>Vraag een nieuwe link aan via WhatsApp.</p>
        </div>`))
      return
    }

    if (approval.expired) {
      res.status(410).send(render(`
        <div class="error">
          <p>⏰ Deze link is verlopen.</p>
          <p>Vraag een nieuwe link aan via WhatsApp.</p>
        </div>`))
      return
    }

    if (approval.approved) {
      res.send(render(`
        <div class="success">
          <div class="check">✅</div>
          <h2>Al goedgekeurd</h2>
          <p>Dit weekbericht is al goedgekeurd en verstuurd.</p>
        </div>`))
      return
    }

    res.send(render(`
      <div class="card">
        <div class="bewoner-name">Weekbericht — ${escapeHtml(approval.bewoner)}</div>
        <div class="weekbericht">${escapeHtml(approval.weekbericht)}</div>
        <div class="sent-to">
          📧 Wordt verstuurd naar: ${escapeHtml(approval.familieNaam)} (${escapeHtml(approval.familieEmail)})
        </div>
        <div class="actions">
          <form method="POST" action="/approve/${approval.token}" style="flex:1;display:flex;">
            <button type="submit" class="btn btn-approve" style="flex:1;">✅ Goedkeuren & versturen</button>
          </form>
        </div>
      </div>`))
  })

  app.post('/approve/:token', async (req, res) => {
    const approval = markApproved(req.params.token)

    if (!approval) {
      res.status(404).send(render(`
        <div class="error">
          <p>❌ Link niet gevonden, verlopen, of al gebruikt.</p>
        </div>`))
      return
    }

    try {
      await sendWeekberichtEmail(
        approval.familieEmail,
        approval.bewoner,
        approval.weekbericht,
        approval.instelling,
        approval.evver
      )

      audit('weekbericht_approved_and_sent', {
        bewoner: approval.bewoner,
        evver: approval.evver,
        familieEmail: approval.familieEmail,
      })

      res.send(render(`
        <div class="success">
          <div class="check">✅</div>
          <h2>Verstuurd!</h2>
          <p>Het weekbericht voor ${escapeHtml(approval.bewoner)} is goedgekeurd en verstuurd naar ${escapeHtml(approval.familieNaam)}.</p>
        </div>`))
    } catch (err) {
      logger.error({ err }, 'Failed to send weekbericht email')
      res.status(500).send(render(`
        <div class="error">
          <p>❌ Er ging iets mis bij het versturen.</p>
          <p>Probeer het opnieuw of neem contact op met je teamleider.</p>
        </div>`))
    }
  })

  return app
}

export function startServer(): express.Application {
  const app = createApp()
  const port = config.PORT

  app.listen(port, '127.0.0.1', () => {
    logger.info(`🏥 ZorgAgent server on port ${port}`)
    logger.info(`   🔗 Webhook: ${config.BASE_URL}/webhook/whatsapp`)
    logger.info(`   📋 Portal:  ${config.BASE_URL}/approve/:token`)
    logger.info(`   💚 Health:  ${config.BASE_URL}/health`)
  })

  return app
}
