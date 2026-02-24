import cron from 'node-cron'
import { logger } from './logger.js'

interface ScheduledTask {
  name: string
  stop: () => void
}

const tasks: ScheduledTask[] = []

/**
 * Schedule a daily task at a specific time (Europe/Amsterdam)
 */
export function scheduleDaily(name: string, time: string, callback: () => Promise<void> | void) {
  const [hour, minute] = time.split(':')
  const expression = `${minute} ${hour} * * *`

  const task = cron.schedule(expression, async () => {
    logger.info(`⏰ Running scheduled task: ${name}`)
    try {
      await callback()
    } catch (err) {
      logger.error({ err, task: name }, `Task failed: ${name}`)
    }
  }, {
    timezone: 'Europe/Amsterdam',
  })

  tasks.push({ name, stop: () => task.stop() })
  logger.info(`📅 Scheduled: ${name} at ${time} (Europe/Amsterdam)`)
}

/**
 * Schedule a weekly task on a specific day and time
 */
export function scheduleWeekly(name: string, day: number, time: string, callback: () => Promise<void> | void) {
  const [hour, minute] = time.split(':')
  // day: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const expression = `${minute} ${hour} * * ${day}`

  const task = cron.schedule(expression, async () => {
    logger.info(`⏰ Running scheduled task: ${name}`)
    try {
      await callback()
    } catch (err) {
      logger.error({ err, task: name }, `Task failed: ${name}`)
    }
  }, {
    timezone: 'Europe/Amsterdam',
  })

  tasks.push({ name, stop: () => task.stop() })
  logger.info(`📅 Scheduled: ${name} on day ${day} at ${time} (Europe/Amsterdam)`)
}

export function stopAll() {
  for (const task of tasks) {
    task.stop()
    logger.info(`🛑 Stopped: ${task.name}`)
  }
  tasks.length = 0
}
