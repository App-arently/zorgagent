import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { AUDIT_LOG, BEWONERS_DIR } from '../config.js'
import { logger, audit } from '../core/logger.js'
import { sendCheckins } from '../core/checkin.js'
import { runWeekberichtFlow } from '../skills/zorgbericht/approve.js'

// --- Manual trigger: check-in now ---

export async function triggerCheckinNow(medewerkers: { naam: string; telefoon: string }[]) {
  logger.info('⚡ Manual check-in trigger')
  audit('manual_checkin_trigger', { medewerkers: medewerkers.length })
  await sendCheckins(medewerkers)
  return { success: true, sent: medewerkers.length }
}

// --- Manual trigger: weekberichten now ---

export async function triggerWeekberichtenNow(
  toon: string,
  instelling: string,
  medewerkers: { naam: string; telefoon: string }[]
) {
  logger.info('⚡ Manual weekbericht trigger')
  audit('manual_weekbericht_trigger', {})
  await runWeekberichtFlow(toon, instelling, medewerkers)
  return { success: true }
}

// --- Export audit log as JSON ---

export function exportAuditLog(): Array<Record<string, unknown>> {
  if (!existsSync(AUDIT_LOG)) return []
  const content = readFileSync(AUDIT_LOG, 'utf-8')
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line) } catch { return null }
    })
    .filter((e): e is Record<string, unknown> => e !== null)
}

// --- Export all bewoner data (AVG inzageverzoek) ---

export function exportBewonersData(): Array<{
  naam: string
  files: Array<{ name: string; content: string }>
}> {
  if (!existsSync(BEWONERS_DIR)) return []

  const dirs = readdirSync(BEWONERS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())
  return dirs.map(dir => {
    const dirPath = join(BEWONERS_DIR, dir.name)
    const files = readdirSync(dirPath).map(f => ({
      name: f,
      content: readFileSync(join(dirPath, f), 'utf-8'),
    }))
    return { naam: dir.name, files }
  })
}

// --- Full audit log for display ---

export function getFullAuditLog(limit: number = 100): Array<Record<string, unknown>> {
  if (!existsSync(AUDIT_LOG)) return []
  const content = readFileSync(AUDIT_LOG, 'utf-8')
  const lines = content.trim().split('\n').filter(Boolean)
  return lines
    .slice(-limit)
    .reverse()
    .map(line => {
      try { return JSON.parse(line) } catch { return null }
    })
    .filter((e): e is Record<string, unknown> => e !== null)
}
