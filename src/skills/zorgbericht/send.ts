import { Resend } from 'resend'
import { config } from '../../config.js'
import { logger, audit } from '../../core/logger.js'

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null

/**
 * Send weekbericht as email to family
 */
export async function sendWeekberichtEmail(
  to: string,
  bewoner: string,
  weekbericht: string,
  instelling: string,
  evver: string
): Promise<void> {
  const html = renderEmailHtml(bewoner, weekbericht, instelling, evver)

  if (!resend) {
    logger.warn('📧 Resend not configured — logging email instead')
    logger.info({ to, bewoner, instelling }, `📧 Would send email to ${to}`)
    console.log('\n--- EMAIL PREVIEW ---')
    console.log(`To: ${to}`)
    console.log(`Subject: Weekbericht ${bewoner} — ${instelling}`)
    console.log(weekbericht)
    console.log('--- END PREVIEW ---\n')
    return
  }

  const result = await resend.emails.send({
    from: `ZorgAgent <weekbericht@zorgagent.nl>`,
    to: [to],
    subject: `Weekbericht ${bewoner} — ${instelling}`,
    html,
  })

  audit('email_sent', { to, bewoner, instelling, id: (result as any)?.data?.id })
  logger.info(`📧 Email sent to ${to} for ${bewoner}`)
}

function renderEmailHtml(
  bewoner: string,
  weekbericht: string,
  instelling: string,
  evver: string
): string {
  const escapedBericht = weekbericht
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #f0f8f0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
    <h2 style="color: #2d5a2d; margin: 0 0 4px 0;">🏠 ${instelling}</h2>
    <p style="color: #666; margin: 0;">Weekbericht — ${bewoner}</p>
  </div>

  <div style="line-height: 1.7; padding: 0 4px;">
    ${escapedBericht}
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

  <p style="color: #999; font-size: 13px; line-height: 1.5;">
    Met vriendelijke groet,<br>
    Het team van ${instelling}
  </p>

  <p style="color: #bbb; font-size: 11px; margin-top: 20px; padding: 12px; background: #fafafa; border-radius: 8px;">
    🤖 Dit bericht is gegenereerd door ZorgAgent (AI). Gecontroleerd door ${evver}.<br>
    <a href="#" style="color: #999;">Uitschrijven</a>
  </p>
</body>
</html>`
}
