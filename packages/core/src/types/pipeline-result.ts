export type PipelineStatus = 'ok' | 'error' | 'no_change'

export interface PipelineResult {
  watchId: string
  runId: string
  startedAt: Date
  completedAt: Date
  transportUsed: string | null
  listingsFound: number
  newListings: number
  duplicatesSkipped: number
  notificationsSent: number
  errors: string[]
}
