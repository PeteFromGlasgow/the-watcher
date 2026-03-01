import * as cheerio from 'cheerio'
import type { Adapter } from '../adapter.js'
import type { ScrapedListing, TransportResult, Watch } from '@watcher/shared-logic'

export class GumtreeAdapter implements Adapter {
  readonly name = 'gumtree'

  async extract(result: TransportResult, _watch: Watch): Promise<ScrapedListing[]> {
    let html: string

    if (result.type === 'html') {
      html = result.html
    } else {
      html = await result.page.content()
    }

    const $ = cheerio.load(html)
    const listings: ScrapedListing[] = []

    $('[data-q="search-result-anchor"]').each((_, el) => {
      const anchor = $(el)
      const title = anchor.find('[data-q="tile-title"]').text().trim()
      const rawPrice = anchor.find('[data-q="tile-price"]').text().trim() || null
      const href = anchor.attr('href')
      const imageUrl = anchor.find('img').attr('src') ?? null

      if (!title || !href) return

      listings.push({
        id: crypto.randomUUID(),
        sourceUrl: href.startsWith('http') ? href : `https://www.gumtree.com${href}`,
        adapterName: 'gumtree',
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
    })

    return listings
  }
}
