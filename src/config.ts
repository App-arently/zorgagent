import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
import { homedir } from 'os'
import { z } from 'zod'

// Load project .env first, then ~/.env (home takes precedence for secrets)
dotenvConfig({ path: resolve(process.cwd(), '.env') })
dotenvConfig({ path: resolve(homedir(), '.env') })

const envSchema = z.object({
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_API_KEY_SID: z.string().startsWith('SK'),
  TWILIO_API_KEY_SECRET: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().startsWith('+'),

  // LLM
  OPENROUTER_API_KEY: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),

  // Server (portal + webhook on one port)
  PORT: z.coerce.number().default(3005),
  BASE_URL: z.string().default('https://zorgagent.72-62-149-118.sslip.io'),

  // Test
  TEST_PHONE_NUMBER: z.string().startsWith('+').optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Missing environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const config = parsed.data

export const DATA_DIR = resolve(process.cwd(), 'data')
export const BEWONERS_DIR = resolve(DATA_DIR, 'bewoners')
export const AUDIT_LOG = resolve(DATA_DIR, 'audit.log')
export const CONFIG_FILE = resolve(DATA_DIR, 'config.yaml')
