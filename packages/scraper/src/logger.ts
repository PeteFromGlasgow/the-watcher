import pino from 'pino'

const base = pino({ level: process.env['LOG_LEVEL'] ?? 'info' })

export function createScrapeLogger(watchId: string, adapter: string) {
  return base.child({ watch_id: watchId, adapter })
}

export type ScrapeLogger = ReturnType<typeof createScrapeLogger>
