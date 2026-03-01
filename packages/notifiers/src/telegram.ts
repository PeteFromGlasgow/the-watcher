import { buildPayload, resolveSecret } from './notifier.js'
import type { Notifier } from './notifier.js'
import type { NotifierConfig, ScrapedListing, Watch } from '@watcher/shared-logic'

interface TelegramConfig {
  botToken: string
  chatId: string
}

export class TelegramNotifier implements Notifier {
  readonly name = 'telegram'

  constructor(private config: NotifierConfig) {}

  async send(listing: ScrapedListing, watch: Watch): Promise<void> {
    const secretValue = resolveSecret(this.config.secretRef)
    const { botToken, chatId } = JSON.parse(secretValue) as TelegramConfig

    const payload = buildPayload(listing, watch)

    const priceStr = payload.extractedPrice
      ? `<b>${payload.currency ?? ''}${payload.extractedPrice.toLocaleString()}</b>`
      : '<i>Price unknown</i>'

    const llmSection = payload.llmAnswers
      ? '\n\n' + Object.entries(payload.llmAnswers)
        .map(([k, v]) => `Q${k}: ${v}`)
        .join('\n')
      : ''

    const caption = [
      `<b>${payload.title}</b>`,
      priceStr,
      `<a href="${payload.listingUrl}">View listing</a>`,
      llmSection
    ].filter(Boolean).join('\n')

    const baseUrl = `https://api.telegram.org/bot${botToken}`

    if (payload.primaryImageUrl) {
      const response = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: payload.primaryImageUrl,
          caption: caption.slice(0, 1024),
          parse_mode: 'HTML'
        })
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Telegram sendPhoto failed: ${response.status} ${text}`)
      }
    } else {
      const response = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption.slice(0, 4096),
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Telegram sendMessage failed: ${response.status} ${text}`)
      }
    }
  }
}
