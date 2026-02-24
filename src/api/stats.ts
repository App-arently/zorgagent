import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { BEWONERS_DIR, AUDIT_LOG, DATA_DIR } from '../config.js'
import { getBewoners, getCheckins, slugify } from '../core/storage.js'
import { getPendingApprovals } from '../portal/tokens.js'

// --- Helpers ---

function getWeekRange(): { from: Date; to: Date; weekNr: number } {
  const now = new Date()
  const day = now.getDay() || 7 // Monday = 1
  const from = new Date(now)
  from.setDate(now.getDate() - day + 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(from.getDate() + 6)
  to.setHours(23, 59, 59, 999)

  // Week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNr = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  return { from, to, weekNr }
}

function countCheckinFiles(bewonerSlug: string, from: Date, to: Date): number {
  const dir = join(BEWONERS_DIR, bewonerSlug)
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
    .filter(f => {
      const d = new Date(f.replace('.md', ''))
      return d >= from && d <= to
    }).length
}

function getWeekberichtStatus(bewonerSlug: string, weekNr: number): 'sent' | 'pending' | 'none' {
  const dir = join(BEWONERS_DIR, bewonerSlug)
  const file = join(dir, `weekbericht-W${String(weekNr).padStart(2, '0')}.md`)
  if (existsSync(file)) return 'sent'
  // Check pending approvals
  const pending = getPendingApprovals()
  if (pending.some(a => slugify(a.bewoner) === bewonerSlug)) return 'pending'
  return 'none'
}

function parseAuditLog(maxLines: number = 50): Array<Record<string, unknown>> {
  if (!existsSync(AUDIT_LOG)) return []
  const content = readFileSync(AUDIT_LOG, 'utf-8')
  const lines = content.trim().split('\n').filter(Boolean)
  return lines
    .slice(-maxLines)
    .reverse()
    .map(line => {
      try { return JSON.parse(line) } catch { return null }
    })
    .filter((e): e is Record<string, unknown> => e !== null && e.audit === true)
}

function getMedewerkerCheckins(from: Date, to: Date): Map<string, number> {
  const counts = new Map<string, number>()
  if (!existsSync(BEWONERS_DIR)) return counts

  const dirs = readdirSync(BEWONERS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())
  for (const dir of dirs) {
    const files = readdirSync(join(BEWONERS_DIR, dir.name))
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .filter(f => {
        const d = new Date(f.replace('.md', ''))
        return d >= from && d <= to
      })

    for (const f of files) {
      const content = readFileSync(join(BEWONERS_DIR, dir.name, f), 'utf-8')
      const sources = content.match(/## Bron: (.+?) \(/g) || []
      for (const src of sources) {
        const name = src.replace('## Bron: ', '').replace(' (', '')
        counts.set(name, (counts.get(name) || 0) + 1)
      }
    }
  }
  return counts
}

// --- API Responses ---

export function getDashboardStats() {
  const { from, to, weekNr } = getWeekRange()
  const bewoners = getBewoners()
  const medewerkerCheckins = getMedewerkerCheckins(from, to)

  // Total check-ins expected vs received
  const totalDays = Math.min(
    Math.floor((Date.now() - from.getTime()) / 86400000) + 1,
    7
  )
  const totalMedewerkers = medewerkerCheckins.size || 1
  const totalExpected = totalMedewerkers * totalDays
  const totalReceived = Array.from(medewerkerCheckins.values()).reduce((a, b) => a + b, 0)

  // Weekbericht status per bewoner
  const weekberichten = bewoners.map(b => {
    const slug = slugify(b.naam)
    const checkins = countCheckinFiles(slug, from, to)
    const status = getWeekberichtStatus(slug, weekNr)
    return {
      bewoner: b.naam,
      slug,
      familie: b.familie[0]?.naam || '',
      checkins,
      status,
    }
  })

  const sent = weekberichten.filter(w => w.status === 'sent').length
  const total = weekberichten.length

  // Team activity
  const team = Array.from(medewerkerCheckins.entries()).map(([naam, count]) => ({
    naam,
    initials: naam.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    checkins: count,
    total: totalDays,
    percentage: Math.round((count / totalDays) * 100),
  }))

  // Recent events from audit log
  const events = parseAuditLog(20).map(e => ({
    time: e.time ? new Date(e.time as number).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '',
    event: e.event,
    ...e,
  }))

  return {
    weekNr,
    weekLabel: `Week ${weekNr} — ${from.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} t/m ${to.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    checkins: {
      received: totalReceived,
      expected: totalExpected,
      percentage: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0,
    },
    weekberichten: {
      sent,
      total,
      percentage: total > 0 ? Math.round((sent / total) * 100) : 0,
      items: weekberichten,
    },
    team,
    events,
  }
}

export function getAdminStats() {
  const dashboard = getDashboardStats()
  const bewoners = getBewoners()

  // Count all check-in files
  let totalCheckins = 0
  let totalWeekberichten = 0
  if (existsSync(BEWONERS_DIR)) {
    const dirs = readdirSync(BEWONERS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())
    for (const dir of dirs) {
      const files = readdirSync(join(BEWONERS_DIR, dir.name))
      totalCheckins += files.filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/)).length
      totalWeekberichten += files.filter(f => f.startsWith('weekbericht-')).length
    }
  }

  // Audit log size
  const auditSize = existsSync(AUDIT_LOG) ? statSync(AUDIT_LOG).size : 0
  const events = parseAuditLog(30)

  return {
    platform: {
      instellingen: 1,
      afdelingen: 1,
      medewerkers: dashboard.team.length,
      bewoners: bewoners.length,
      mrr: 0,
    },
    allTime: {
      totalCheckins,
      totalWeekberichten,
      auditLogSize: `${(auditSize / 1024).toFixed(1)} KB`,
    },
    thisWeek: dashboard,
    events,
  }
}

export function getBewonersWithHighlights() {
  const { from, to } = getWeekRange()
  const bewoners = getBewoners()

  return bewoners.map(b => {
    const checkins = getCheckins(b.naam, from, to)
    // Extract source count
    const sources = new Set<string>()
    for (const c of checkins) {
      const matches = c.match(/## Bron: (.+?) \(/g) || []
      matches.forEach(m => sources.add(m.replace('## Bron: ', '').replace(' (', '')))
    }

    return {
      naam: b.naam,
      slug: slugify(b.naam),
      checkins: checkins.length,
      medewerkers: sources.size,
      // Combine all check-in text for a summary
      samenvatting: checkins.join('\n').replace(/^# .+$/gm, '').replace(/^## Bron:.+$/gm, '').trim().slice(0, 200),
    }
  })
}
