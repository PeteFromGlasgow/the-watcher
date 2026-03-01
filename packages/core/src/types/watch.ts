import type { TransportChainConfig } from './transport-chain.js'

export type WatchStatus = 'active' | 'paused' | 'archived'

export interface Watch {
  id: string
  user_id: string
  name: string
  adapter: string
  query_params: Record<string, unknown>
  check_interval_minutes: number
  status: WatchStatus
  created_at: string
  updated_at: string
  // Scraper fields — populated by the operator (WCH-36) at run time
  url?: string
  adapterOptions?: Record<string, unknown>
  transport?: TransportChainConfig
}
