import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { BEWONERS_DIR, DATA_DIR } from '../config.js'
import { logger } from './logger.js'

// --- Slugify ---

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(mevrouw|meneer|mw|dhr|mevr)\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Bewoner profiles ---

export interface FamilyContact {
  naam: string
  email: string
  kanaal: 'email' | 'whatsapp'
}

export interface BewonderProfile {
  naam: string
  slug: string
  afdeling: string
  evv: string
  familie: FamilyContact[]
}

export function getBewoners(): BewonderProfile[] {
  if (!existsSync(BEWONERS_DIR)) return []
  const dirs = readdirSync(BEWONERS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())

  const profiles: BewonderProfile[] = []
  for (const dir of dirs) {
    const profilePath = join(BEWONERS_DIR, dir.name, 'profile.json')
    if (existsSync(profilePath)) {
      const data = JSON.parse(readFileSync(profilePath, 'utf-8'))
      profiles.push({ ...data, slug: dir.name })
    }
  }
  return profiles
}

export function getBewoner(slug: string): BewonderProfile | null {
  const profilePath = join(BEWONERS_DIR, slug, 'profile.json')
  if (!existsSync(profilePath)) return null
  const data = JSON.parse(readFileSync(profilePath, 'utf-8'))
  return { ...data, slug }
}

export function saveBewoner(profile: Omit<BewonderProfile, 'slug'>): string {
  const slug = slugify(profile.naam)
  const dir = join(BEWONERS_DIR, slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'profile.json'), JSON.stringify({ ...profile }, null, 2))
  logger.info(`💾 Bewoner saved: ${profile.naam} → ${slug}`)
  return slug
}

// --- Check-in data ---

export function saveCheckin(bewoner: string, date: string, source: string, content: string) {
  const slug = slugify(bewoner)
  const dir = join(BEWONERS_DIR, slug)
  mkdirSync(dir, { recursive: true })

  const filePath = join(dir, `${date}.md`)
  const entry = existsSync(filePath)
    ? readFileSync(filePath, 'utf-8')
    : `# Check-in ${date}\n`

  const append = `\n## Bron: ${source} (${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })})\n\n${content}\n`
  writeFileSync(filePath, entry + append)

  logger.info(`💾 Check-in saved: ${bewoner} (${date})`)
}

export function getCheckins(bewoner: string, from: Date, to: Date): string[] {
  const slug = slugify(bewoner)
  const dir = join(BEWONERS_DIR, slug)
  if (!existsSync(dir)) return []

  const files = readdirSync(dir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
    .filter(f => {
      const date = new Date(f.replace('.md', ''))
      return date >= from && date <= to
    })
    .sort()

  return files.map(f => readFileSync(join(dir, f), 'utf-8'))
}

// --- Weekbericht ---

export function saveWeekbericht(bewoner: string, weekNr: number, content: string) {
  const slug = slugify(bewoner)
  const dir = join(BEWONERS_DIR, slug)
  mkdirSync(dir, { recursive: true })

  const filePath = join(dir, `weekbericht-W${String(weekNr).padStart(2, '0')}.md`)
  writeFileSync(filePath, content)
  logger.info(`💾 Weekbericht saved: ${bewoner} W${weekNr}`)
}

// --- Config ---

export function getConfig(): Record<string, unknown> | null {
  const configPath = resolve(DATA_DIR, 'config.yaml')
  if (!existsSync(configPath)) return null
  // Simple YAML-like parse for MVP — key: value
  const raw = readFileSync(configPath, 'utf-8')
  return { raw }
}
