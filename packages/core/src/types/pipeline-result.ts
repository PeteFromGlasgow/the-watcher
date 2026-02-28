import type { Listing } from './listing.js'

export type PipelineStatus = 'ok' | 'error' | 'no_change'

export interface PipelineResult {
  watchId: string
  status: PipelineStatus
  newListings: Listing[]
  error?: string
  durationMs: number
}
