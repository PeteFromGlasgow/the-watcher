import { chromium } from 'playwright'
import type { Transport, TransportContext } from './transport.js'
import type { TransportResult } from '@watcher/shared-logic'

export class PlaywrightTransport implements Transport {
  readonly name = 'playwright'

  async execute(context: TransportContext): Promise<TransportResult> {
    const browser = await chromium.launch({ headless: true })

    try {
      const browserContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      })

      if (context.cookieHeader) {
        const cookies = parseCookieHeader(context.cookieHeader, new URL(context.url).hostname)
        await browserContext.addCookies(cookies)
      }

      const page = await browserContext.newPage()

      const response = await page.goto(context.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      if (!response || !response.ok()) {
        throw new Error(`Navigation failed: ${response?.status()} for ${context.url}`)
      }

      const content = await page.content()
      if (
        content.includes('cf-challenge-running')
        || content.includes('g-recaptcha')
        || (content.includes('id="login"') && content.includes('facebook.com'))
      ) {
        throw new Error(`Bot challenge or login wall detected at ${context.url}`)
      }

      // Return the live page — the adapter will interact with it directly
      // Caller is responsible for closing the browser after use
      return { type: 'page', page, transportUsed: 'playwright' }
    } catch (err) {
      await browser.close()
      throw err
    }
  }
}

function parseCookieHeader(cookieHeader: string, domain: string) {
  return cookieHeader.split(';').map((pair) => {
    const [name, ...rest] = pair.trim().split('=')
    return { name: name.trim(), value: rest.join('=').trim(), domain, path: '/' }
  })
}
