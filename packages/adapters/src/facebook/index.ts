import type { Adapter } from '../adapter.js'
import type { ScrapedListing, TransportResult, Watch } from '@watcher/shared-logic'
import type { Page } from 'playwright'

// ⚠️ Spike ticket (WCH-18): selectors below are based on current Facebook DOM and may
// change. Validate data-testid attributes before relying on this adapter in production.
export class FacebookAdapter implements Adapter {
  readonly name = 'facebook'

  async extract(result: TransportResult, _watch: Watch): Promise<ScrapedListing[]> {
    if (result.type !== 'page') {
      throw new Error('FacebookAdapter requires a Page transport result')
    }

    const { page } = result as { type: 'page', page: Page, transportUsed: string }
    const listings: ScrapedListing[] = []

    await this.scrollToLoad(page)

    const cards = await page.$$('[data-testid="marketplace_search_feed_item"]')

    for (const card of cards) {
      try {
        const title = await card.$eval(
          '[data-testid="marketplace-pdp-title"]',
          el => el.textContent?.trim() ?? ''
        )
        const rawPrice = await card
          .$eval('[data-testid="marketplace-pdp-price"]', el => el.textContent?.trim() ?? null)
          .catch(() => null)
        const href = await card.$eval('a', el => el.getAttribute('href')).catch(() => null)
        const imageUrl = await card.$eval('img', el => el.getAttribute('src')).catch(() => null)

        if (!title || !href) continue

        listings.push({
          id: crypto.randomUUID(),
          sourceUrl: `https://www.facebook.com${href}`,
          adapterName: 'facebook',
          title,
          description: null,
          rawPrice,
          extractedPrice: null,
          currency: null,
          images: imageUrl ? [imageUrl] : [],
          metadata: {},
          scrapedAt: new Date(),
          duplicateOf: null,
          llmAnalysis: null
        })
      } catch {
        // Skip malformed cards
      }
    }

    return listings
  }

  private async scrollToLoad(page: Page): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)
    }
  }
}
