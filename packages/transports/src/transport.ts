import type { TransportResult } from '@watcher/shared-logic'

export interface TransportContext {
  url: string
  cookieHeader?: string
  options?: Record<string, unknown>
}

export interface Transport {
  name: string
  execute(context: TransportContext): Promise<TransportResult>
}
