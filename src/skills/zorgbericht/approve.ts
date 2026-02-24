import { generateAllWeekberichten } from './generate.js'
import { createApproval } from '../../portal/tokens.js'
import { sendLink } from '../../channels/whatsapp/client.js'
import { config } from '../../config.js'
import { logger, audit } from '../../core/logger.js'

/**
 * Generate weekberichten and send approval links to EVV'ers
 * Triggered by weekly cron (Friday 14:00)
 */
export async function runWeekberichtFlow(
  toon: string = 'huiselijk',
  instelling: string = 'Zorgcentrum Zonnebloom',
  medewerkers: { naam: string; telefoon: string }[] = []
) {
  logger.info('🔄 Starting weekbericht flow...')

  const results = await generateAllWeekberichten(toon)

  if (results.length === 0) {
    logger.info('⏭️ No weekberichten to generate (no check-ins)')
    return
  }

  const phoneByName = new Map(medewerkers.map(m => [m.naam, m.telefoon]))

  for (const result of results) {
    const evvPhone = phoneByName.get(result.evv)
    if (!evvPhone) {
      logger.warn(`⚠️ No phone for EVV'er: ${result.evv}`)
      continue
    }

    for (const fam of result.familie) {
      const token = createApproval({
        bewoner: result.bewoner,
        weekbericht: result.weekbericht,
        evver: result.evv,
        evverPhone: evvPhone,
        familieEmail: fam.email,
        familieNaam: fam.naam,
        instelling,
      })

      const approveUrl = `${config.BASE_URL}/approve/${token}`

      await sendLink(
        `+${evvPhone}`,
        `📝 Weekbericht ${result.bewoner} is klaar!\n\nBekijk en keur goed:`,
        approveUrl
      )

      audit('approval_link_sent', {
        bewoner: result.bewoner,
        evver: result.evv,
        familieEmail: fam.email,
        token: token.slice(0, 8),
      })
    }
  }

  logger.info(`✅ Weekbericht flow complete: ${results.length} weekberichten generated`)
}
