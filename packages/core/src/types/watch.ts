import type { TransportChainConfig } from './transport-chain.js'

export type WatchStatus = 'active' | 'paused' | 'archived'

export interface WatchFilters {
  priceMin?: number
  priceMax?: number
  keywords: {
    include: string[]
    exclude: string[]
  }
}

export interface LlmConfig {
  provider: 'openai' | 'google'
  model?: string
  baseURL?: string // For OpenAI compatible hosts
  apiKey?: string // Optional, defaults to env var
}

export interface Watch {
  id: string
  user_id: string
  name: string
  adapter: string
  query_params: Record<string, unknown>
  check_interval_minutes: number
  status: WatchStatus
  enabled?: boolean
  created_at: string
  updated_at: string
  // Scraper fields — populated by the operator (WCH-36) at run time
  url?: string
  adapterOptions?: Record<string, unknown>
  transport?: TransportChainConfig
  // Pipeline fields (Epic 4)
  filters?: WatchFilters
  similarityThreshold?: number
  llmQuestions?: string[]
  llmConfig?: LlmConfig
}
