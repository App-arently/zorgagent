import Twilio from 'twilio'
import { config } from '../../config.js'
import { logger, audit } from '../../core/logger.js'

const client = Twilio(config.TWILIO_API_KEY_SID, config.TWILIO_API_KEY_SECRET, {
  accountSid: config.TWILIO_ACCOUNT_SID,
})

const FROM = `whatsapp:${config.TWILIO_WHATSAPP_NUMBER}`

/**
 * Send a WhatsApp text message
 */
export async function sendText(to: string, text: string): Promise<string> {
  const toJid = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/^\+/, '')}`

  const message = await client.messages.create({
    from: FROM,
    to: toJid,
    body: text,
  })

  audit('whatsapp_sent', { to: toJid, sid: message.sid, body: text.slice(0, 100) })
  logger.info(`📤 WhatsApp → ${toJid}: ${text.slice(0, 80)}`)

  return message.sid
}

/**
 * Send a WhatsApp message with a link
 */
export async function sendLink(to: string, text: string, url: string): Promise<string> {
  return sendText(to, `${text}\n\n${url}`)
}

export { client as twilioClient }
