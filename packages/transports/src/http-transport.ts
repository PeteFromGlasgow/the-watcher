import type { Transport, TransportContext } from './transport.js'
import type { TransportResult } from '@watcher/shared-logic'

export class HttpTransport implements Transport {
  readonly name = 'http'

  async execute(context: TransportContext): Promise<TransportResult> {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; Watcher/1.0)',
      ...context.options?.headers as Record<string, string> | undefined
    }

    if (context.cookieHeader) {
      headers['Cookie'] = context.cookieHeader
    }

    const response = await fetch(context.url, { headers })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${context.url}`)
    }

    const html = await response.text()

    if (
      html.includes('cf-challenge-running')
      || html.includes('Checking your browser')
      || html.includes('g-recaptcha')
    ) {
      throw new Error(`CAPTCHA or bot challenge detected at ${context.url}`)
    }

    return { type: 'html', html, transportUsed: 'http' }
  }
}
