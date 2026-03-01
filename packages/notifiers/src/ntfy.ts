import { buildPayload, resolveSecret } from './notifier.js'
import type { Notifier } from './notifier.js'
import type { NotifierConfig, ScrapedListing, Watch } from '@watcher/shared-logic'

interface NtfyConfig {
  endpoint: string
  topic: string
  token?: string
}

export class NtfyNotifier implements Notifier {
  readonly name = 'ntfy'

  constructor(private config: NotifierConfig) {}

  async send(listing: ScrapedListing, watch: Watch): Promise<void> {
    const secretValue = resolveSecret(this.config.secretRef)
    const { endpoint, topic, token } = JSON.parse(secretValue) as NtfyConfig

    const payload = buildPayload(listing, watch)

    const priceStr = payload.extractedPrice
      ? `${payload.currency ?? ''}${payload.extractedPrice.toLocaleString()}`
      : 'Price unknown'

    const body = [
      `${payload.title} — ${priceStr}`,
      payload.listingUrl
    ].join('\n')

    const headers: Record<string, string> = {
      Title: `[${payload.watchName}] ${payload.title}`,
      Priority: 'high',
      Tags: 'shopping,bell'
    }

    if (payload.primaryImageUrl) {
      headers['Attach'] = payload.primaryImageUrl
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${endpoint}/${topic}`, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      throw new Error(`ntfy notification failed: ${response.status} ${response.statusText}`)
    }
  }
}
