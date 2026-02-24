import pino from 'pino'
import { AUDIT_LOG } from '../config.js'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

mkdirSync(dirname(AUDIT_LOG), { recursive: true })

export const logger = pino({
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: AUDIT_LOG, mkdir: true },
        level: 'info',
      },
      {
        target: 'pino/file',
        options: { destination: 1 }, // stdout
        level: 'info',
      },
    ],
  },
})

export function audit(event: string, data: Record<string, unknown> = {}) {
  logger.info({ event, ...data, audit: true })
}
