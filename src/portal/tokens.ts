import { nanoid } from 'nanoid'
import { logger } from '../core/logger.js'

export interface Approval {
  token: string
  bewoner: string
  weekbericht: string
  evver: string
  evverPhone: string
  familieEmail: string
  familieNaam: string
  instelling: string
  createdAt: Date
  expiresAt: Date
  approved: boolean
  approvedAt?: Date
  expired?: boolean
}

// In-memory store for MVP
const approvals = new Map<string, Approval>()

export function createApproval(opts: {
  bewoner: string
  weekbericht: string
  evver: string
  evverPhone: string
  familieEmail: string
  familieNaam: string
  instelling: string
}): string {
  const token = nanoid(32)
  approvals.set(token, {
    ...opts,
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    approved: false,
  })
  logger.info(`🔑 Approval token created for ${opts.bewoner}: ${token.slice(0, 8)}...`)
  return token
}

export function getApproval(token: string): Approval | null {
  const a = approvals.get(token)
  if (!a) return null
  if (new Date() > a.expiresAt) return { ...a, expired: true }
  return a
}

export function markApproved(token: string): Approval | null {
  const a = approvals.get(token)
  if (!a) return null
  if (new Date() > a.expiresAt) return null
  if (a.approved) return null

  a.approved = true
  a.approvedAt = new Date()
  logger.info(`✅ Approval confirmed for ${a.bewoner} by ${a.evver}`)
  return a
}

export function getPendingApprovals(): Approval[] {
  return Array.from(approvals.values()).filter(a => !a.approved && !a.expired && new Date() < a.expiresAt)
}
