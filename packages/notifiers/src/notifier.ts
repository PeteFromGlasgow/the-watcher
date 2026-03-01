import type { ScrapedListing, Watch } from '@watcher/shared-logic'

export interface NotificationPayload {
  title: string
  extractedPrice: number | null
  currency: string | null
  primaryImageUrl: string | null
  listingUrl: string
  llmAnswers: Record<string, unknown> | null
  watchName: string
}

export interface Notifier {
  readonly name: string
  send(listing: ScrapedListing, watch: Watch): Promise<void>
}

export function buildPayload(listing: ScrapedListing, watch: Watch): NotificationPayload {
  return {
    title: listing.title,
    extractedPrice: listing.extractedPrice,
    currency: listing.currency,
    primaryImageUrl: listing.images[0] ?? null,
    listingUrl: listing.sourceUrl ?? '',
    llmAnswers: listing.llmAnalysis,
    watchName: watch.name
  }
}

export function resolveSecret(secretRef: string): string {
  const envKey = `WATCHER_SECRET_${secretRef.toUpperCase().replace(/-/g, '_')}`
  const value = process.env[envKey]
  if (!value) throw new Error(`Secret not found in environment: ${envKey}`)
  return value
}
