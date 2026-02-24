import { hasActiveCheckin, handleCheckinResponse } from '../../core/checkin.js'
import { sendText } from './client.js'
import { logger } from '../../core/logger.js'
import { onMessage } from '../../server.js'

// Known medewerkers phone → naam mapping
const knownPhones = new Map<string, string>()

export function registerMedewerker(phone: string, naam: string) {
  const clean = `+${phone.replace(/^\+/, '')}`
  knownPhones.set(clean, naam)
}

/**
 * Wire up the main message handler
 */
export function setupHandlers() {
  onMessage(async (from, body) => {
    const phone = `+${from.replace(/^\+/, '')}`

    if (!knownPhones.has(phone)) {
      logger.info(`❓ Unknown number: ${phone}`)
      await sendText(phone, 'Ik ken je nog niet. Vraag je teamleider om je toe te voegen bij ZorgAgent.')
      return
    }

    // Active check-in → handle as response
    if (hasActiveCheckin(phone)) {
      const reply = await handleCheckinResponse(phone, body)
      if (reply) await sendText(phone, reply)
      return
    }

    // Commands
    const lower = body.toLowerCase().trim()

    if (lower === 'help') {
      await sendText(phone, `ZorgAgent commando's:\n\n• Reageer op de dagelijkse check-in met een kort bericht over je bewoners\n• "help" — dit overzicht`)
      return
    }

    await sendText(phone, 'Bedankt voor je bericht! Ik stuur je vanavond de dagelijkse check-in. 😊')
  })
}
