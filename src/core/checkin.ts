import OpenAI from 'openai'
import { config } from '../config.js'
import { sendText } from '../channels/whatsapp/client.js'
import { saveCheckin, getBewoners } from './storage.js'
import { logger, audit } from './logger.js'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.OPENROUTER_API_KEY,
})

// Track active check-in sessions: phone → { waiting: true, name: string }
export interface CheckinSession {
  medewerker: string
  phone: string
  waiting: boolean
  startedAt: Date
}

const activeSessions = new Map<string, CheckinSession>()

/**
 * Send check-in prompts to all medewerkers
 */
export async function sendCheckins(medewerkers: { naam: string; telefoon: string }[]) {
  const today = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  for (const m of medewerkers) {
    const phone = `+${m.telefoon}`
    try {
      await sendText(phone, `Hoi ${m.naam.split(' ')[0]}, hoe was het vandaag bij je bewoners? 😊`)

      activeSessions.set(phone, {
        medewerker: m.naam,
        phone,
        waiting: true,
        startedAt: new Date(),
      })

      audit('checkin_sent', { medewerker: m.naam, phone })
      logger.info(`📤 Check-in sent to ${m.naam}`)
    } catch (err) {
      logger.error({ err, medewerker: m.naam }, 'Failed to send check-in')
    }
  }
}

/**
 * Check if a phone number has an active check-in session
 */
export function hasActiveCheckin(phone: string): boolean {
  const session = activeSessions.get(phone)
  if (!session || !session.waiting) return false
  // Expire after 4 hours
  const elapsed = Date.now() - session.startedAt.getTime()
  if (elapsed > 4 * 60 * 60 * 1000) {
    activeSessions.delete(phone)
    return false
  }
  return true
}

/**
 * Parse a check-in response using LLM and save per bewoner
 */
export async function handleCheckinResponse(phone: string, body: string): Promise<string> {
  const session = activeSessions.get(phone)
  if (!session) return ''

  session.waiting = false
  const date = new Date().toISOString().split('T')[0]

  // Parse free text into structured bewoner observations
  const parsed = await parseCheckinText(body)

  if (parsed.length === 0) {
    // Save as general note
    saveCheckin('onbekend', date, session.medewerker, body)
    audit('checkin_received', { medewerker: session.medewerker, bewoners: 0 })
    return 'Bedankt! Genoteerd ✅'
  }

  // Save per bewoner
  for (const item of parsed) {
    saveCheckin(item.bewoner, date, session.medewerker, item.observatie)
  }

  const namen = parsed.map(p => p.bewoner).join(', ')
  audit('checkin_received', {
    medewerker: session.medewerker,
    bewoners: parsed.length,
    namen,
  })

  activeSessions.delete(phone)
  return `Bedankt! Genoteerd voor ${namen} ✅`
}

interface ParsedObservation {
  bewoner: string
  observatie: string
}

async function parseCheckinText(text: string): Promise<ParsedObservation[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Je bent een parser voor check-in berichten van verzorgenden in een zorginstelling.
Extract de namen van bewoners en hun observaties uit het bericht.
Antwoord ALLEEN met een JSON array: [{"bewoner": "naam", "observatie": "wat er gezegd werd"}]
Als er geen bewoners genoemd worden, antwoord met een lege array: []
Gebruik de volledige naam zoals genoemd (bijv. "Mevrouw De Vries", "Dhr Bakker").`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0,
    })

    const content = response.choices[0]?.message?.content || '[]'
    // Extract JSON from response (might have markdown fences)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    logger.error({ err }, 'Failed to parse check-in text')
    return []
  }
}
