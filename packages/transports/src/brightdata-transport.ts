import { chromium } from 'playwright'
import type { Transport, TransportContext } from './transport.js'
import type { TransportResult } from '@watcher/shared-logic'

export class BrightDataTransport implements Transport {
  readonly name = 'brightdata'

  async execute(context: TransportContext): Promise<TransportResult> {
    const endpoint = process.env['BRIGHTDATA_ENDPOINT']
    if (!endpoint) {
      throw new Error('BRIGHTDATA_ENDPOINT environment variable not set')
    }

    const browser = await chromium.connectOverCDP(endpoint)

    try {
      const browserContext = await browser.newContext()

      if (context.cookieHeader) {
        const cookies = parseCookieHeader(context.cookieHeader, new URL(context.url).hostname)
        await browserContext.addCookies(cookies)
      }

      const page = await browserContext.newPage()

      const response = await page.goto(context.url, {
        waitUntil: 'networkidle',
        timeout: 60000
      })

      if (!response || !response.ok()) {
        throw new Error(`BrightData navigation failed: ${response?.status()} for ${context.url}`)
      }

      return { type: 'page', page, transportUsed: 'brightdata' }
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
