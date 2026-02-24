import OpenAI from 'openai'
import { config } from '../../config.js'
import { getCheckins, getBewoners, saveWeekbericht } from '../../core/storage.js'
import { logger, audit } from '../../core/logger.js'
import { TOON_PROMPTS } from './templates/prompts.js'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.OPENROUTER_API_KEY,
})

/**
 * Generate a weekbericht for a single bewoner
 */
export async function generateWeekbericht(
  bewoner: string,
  checkins: string[],
  toon: string = 'huiselijk',
  familienaam: string = 'familie',
  evverNaam: string = 'de verzorgende'
): Promise<string> {
  const systemPrompt = TOON_PROMPTS[toon] || TOON_PROMPTS.huiselijk

  const response = await openai.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Genereer een warm weekbericht voor de familie van ${bewoner}.
De familie heet ${familienaam}.

Check-in data van deze week:
${checkins.join('\n---\n')}

Schrijf een persoonlijk weekbericht van 100-200 woorden.
Eindig met exact deze regel:
"🤖 Dit bericht is gegenereerd door ZorgAgent (AI). Gecontroleerd door ${evverNaam}."`,
      },
    ],
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content || ''
  logger.info(`📝 Weekbericht generated for ${bewoner} (${content.length} chars)`)
  return content
}

/**
 * Generate weekberichten for all bewoners
 */
export async function generateAllWeekberichten(toon: string = 'huiselijk'): Promise<{
  bewoner: string
  weekbericht: string
  evv: string
  familie: { naam: string; email: string }[]
}[]> {
  const bewoners = getBewoners()
  const results = []

  // Get date range: last 7 days
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 7)

  // Get current week number
  const weekNr = getWeekNumber(to)

  for (const b of bewoners) {
    const checkins = getCheckins(b.naam, from, to)

    if (checkins.length === 0) {
      logger.info(`⏭️ Skipping ${b.naam}: no check-ins this week`)
      continue
    }

    const familienaam = b.familie[0]?.naam || 'familie'
    const weekbericht = await generateWeekbericht(b.naam, checkins, toon, familienaam, b.evv)

    // Save to disk
    saveWeekbericht(b.naam, weekNr, weekbericht)

    results.push({
      bewoner: b.naam,
      weekbericht,
      evv: b.evv,
      familie: b.familie.map(f => ({ naam: f.naam, email: f.email })),
    })

    audit('weekbericht_generated', { bewoner: b.naam, weekNr, checkins: checkins.length })
  }

  return results
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
