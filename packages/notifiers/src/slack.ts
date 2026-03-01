import { buildPayload, resolveSecret } from './notifier.js'
import type { Notifier } from './notifier.js'
import type { NotifierConfig, ScrapedListing, Watch } from '@watcher/shared-logic'

interface SlackConfig {
  webhookUrl: string
}

export class SlackNotifier implements Notifier {
  readonly name = 'slack'

  constructor(private config: NotifierConfig) {}

  async send(listing: ScrapedListing, watch: Watch): Promise<void> {
    const secretValue = resolveSecret(this.config.secretRef)
    const { webhookUrl } = JSON.parse(secretValue) as SlackConfig

    const payload = buildPayload(listing, watch)

    const priceStr = payload.extractedPrice
      ? `${payload.currency ?? ''}${payload.extractedPrice.toLocaleString()}`
      : 'Price unknown'

    const blocks: unknown[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${payload.listingUrl}|${payload.title}>*\n${priceStr}\n_Watch: ${payload.watchName}_`
        },
        ...(payload.primaryImageUrl
          ? {
              accessory: {
                type: 'image',
                image_url: payload.primaryImageUrl,
                alt_text: payload.title
              }
            }
          : {})
      }
    ]

    if (payload.llmAnswers && Object.keys(payload.llmAnswers).length > 0) {
      const answersText = Object.entries(payload.llmAnswers)
        .map(([k, v]) => `Q${k}: ${v}`)
        .join(' | ')

      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: answersText.slice(0, 3000)
        }]
      })
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Slack notification failed: ${response.status} ${text}`)
    }
  }
}
