import pino from 'pino'

const base = pino({ level: process.env['LOG_LEVEL'] ?? 'info' })

export function createRunLogger(watchId: string, runId: string, adapter: string) {
  return base.child({ watch_id: watchId, run_id: runId, adapter })
}

export type RunLogger = ReturnType<typeof createRunLogger>
