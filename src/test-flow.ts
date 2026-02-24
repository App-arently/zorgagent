/**
 * Test: Generate weekbericht → create approval token → start server → show URL
 * Run: npx tsx src/test-flow.ts
 */
import { config } from './config.js'
import { logger } from './core/logger.js'
import { generateAllWeekberichten } from './skills/zorgbericht/generate.js'
import { createApproval } from './portal/tokens.js'
import { startServer } from './server.js'

async function test() {
  console.log('\n🧪 ZorgAgent — Test Flow\n')

  console.log('📝 Generating weekbericht from check-in data...\n')
  const results = await generateAllWeekberichten('huiselijk')

  if (results.length === 0) {
    console.log('❌ No weekberichten generated. Check data/bewoners/')
    process.exit(1)
  }

  for (const r of results) {
    console.log(`--- Weekbericht: ${r.bewoner} ---`)
    console.log(r.weekbericht)
    console.log('---\n')

    const token = createApproval({
      bewoner: r.bewoner,
      weekbericht: r.weekbericht,
      evver: r.evv,
      evverPhone: '31612345678',
      familieEmail: r.familie[0]?.email || 'test@example.com',
      familieNaam: r.familie[0]?.naam || 'Familie',
      instelling: 'Zorgcentrum Zonnebloom',
    })

    console.log(`🔗 Approve URL: ${config.BASE_URL}/approve/${token}\n`)
  }

  startServer()
  console.log('✅ Open the approve URL in your browser.\n')

  // Keep process alive
  await new Promise(() => {})
}

test().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
