import type { Adapter } from '../adapter.js'
import type { ScrapedListing, TransportResult, Watch } from '@watcher/shared-logic'
import type { Page } from 'playwright'

// Matches £12,500 · $1,800 · FREE (as seen in real Marketplace DOM)
const PRICE_RE = /^[£$€¥₹][\d,]+|^FREE$/i

interface CardData {
  imgAlt: string
  imgSrc: string | null
  href: string | null
  leafTexts: string[]
}

// Facebook Marketplace adapter.
// Cards are <a href="/marketplace/item/ID/"> with no data-testid attributes.
// Title and location are extracted from img[alt]: "Title in Location".
// Price is the first leaf text node matching a currency/FREE pattern.
export class FacebookAdapter implements Adapter {
  readonly name = 'facebook'

  async extract(result: TransportResult, _watch: Watch): Promise<ScrapedListing[]> {
    if (result.type !== 'page') {
      throw new Error('FacebookAdapter requires a Page transport result')
    }

    const { page } = result as { type: 'page', page: Page, transportUsed: string }
    await this.scrollToLoad(page)

    const cards = await page.$$('a[href*="/marketplace/item/"]')
    const listings: ScrapedListing[] = []

    for (const card of cards) {
      try {
        // Single evaluate call extracts all data in the browser context
        const data: CardData = await card.evaluate((el) => {
          const img = el.querySelector('img')
          const imgAlt = img?.getAttribute('alt') ?? ''
          const imgSrc = img?.getAttribute('src') ?? null
          const href = el.getAttribute('href')

          const leafTexts: string[] = []
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let node: Node | null
          while ((node = walker.nextNode())) {
            const t = (node as Text).textContent?.trim() ?? ''
            if (t && !leafTexts.includes(t)) leafTexts.push(t)
          }

          return { imgAlt, imgSrc, href, leafTexts }
        })

        // img alt is always "Title in Location, Region" — split on last " in "
        const inIdx = data.imgAlt.lastIndexOf(' in ')
        const title = inIdx > 0 ? data.imgAlt.substring(0, inIdx).trim() : data.imgAlt.trim()
        const location = inIdx > 0 ? data.imgAlt.substring(inIdx + 4).trim() : null

        if (!title) continue

        // First price-like leaf text is the current price (ignore badges, original prices)
        const rawPrice = data.leafTexts.find(t => PRICE_RE.test(t)) ?? null

        const sourceUrl = data.href
          ? data.href.startsWith('http') ? data.href : `https://www.facebook.com${data.href}`
          : null

        listings.push({
          id: crypto.randomUUID(),
          sourceUrl,
          adapterName: 'facebook',
          title,
          description: null,
          rawPrice,
          extractedPrice: null,
          currency: null,
          images: data.imgSrc ? [data.imgSrc] : [],
          metadata: { location },
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
