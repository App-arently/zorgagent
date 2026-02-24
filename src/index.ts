import { config } from './config.js'
import { logger, audit } from './core/logger.js'
import { scheduleDaily, scheduleWeekly } from './core/scheduler.js'
import { sendCheckins } from './core/checkin.js'
import { setupHandlers, registerMedewerker } from './channels/whatsapp/handlers.js'
import { startServer } from './server.js'
import { runWeekberichtFlow } from './skills/zorgbericht/approve.js'

// --- Config (hardcoded for MVP, later from config.yaml) ---

const INSTELLING = 'Zorgcentrum Zonnebloom'
const TOON = 'huiselijk'

const MEDEWERKERS = [
  { naam: 'Sandra Bakker', telefoon: '31612345678', rol: 'verz-ig3', evv: true },
  { naam: 'Karen de Jong', telefoon: '31687654321', rol: 'verz-ig2', evv: false },
]

// For testing: use your own number
if (config.TEST_PHONE_NUMBER) {
  MEDEWERKERS[0].telefoon = config.TEST_PHONE_NUMBER.replace('+', '')
}

// --- Start ---

async function main() {
  logger.info('🏥 ZorgAgent starting...')
  audit('system_start', { instelling: INSTELLING })

  // Register known medewerkers
  for (const m of MEDEWERKERS) {
    registerMedewerker(m.telefoon, m.naam)
  }

  // Setup WhatsApp message handlers
  setupHandlers()

  // Start unified server (webhook + portal)
  startServer()

  // Daily check-in at 19:00
  scheduleDaily('checkin', '19:00', async () => {
    await sendCheckins(MEDEWERKERS.map(m => ({ naam: m.naam, telefoon: m.telefoon })))
  })

  // Weekly weekbericht on Friday 14:00
  scheduleWeekly('weekbericht', 5, '14:00', async () => {
    await runWeekberichtFlow(
      TOON,
      INSTELLING,
      MEDEWERKERS.map(m => ({ naam: m.naam, telefoon: m.telefoon }))
    )
  })

  logger.info('✅ ZorgAgent running')
  logger.info(`   ⏰ Check-in: dagelijks 19:00`)
  logger.info(`   📝 Weekbericht: vrijdag 14:00`)
}

main().catch(err => {
  logger.error({ err }, 'Fatal error')
  process.exit(1)
})
