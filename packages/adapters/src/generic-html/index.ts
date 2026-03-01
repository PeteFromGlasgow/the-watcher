import * as cheerio from 'cheerio'
import type { Adapter } from '../adapter.js'
import type { ScrapedListing, TransportResult, Watch, GenericHtmlOptions } from '@watcher/shared-logic'

export class GenericHtmlAdapter implements Adapter {
  readonly name = 'generic-html'

  async extract(result: TransportResult, watch: Watch): Promise<ScrapedListing[]> {
    let html: string

    if (result.type === 'html') {
      html = result.html
    } else {
      html = await result.page.content()
    }

    const opts = watch.adapterOptions as GenericHtmlOptions | undefined
    if (!opts?.containerSelector || !opts?.titleSelector) {
      throw new Error('generic-html adapter requires containerSelector and titleSelector in adapterOptions')
    }

    const $ = cheerio.load(html)
    const listings: ScrapedListing[] = []

    $(opts.containerSelector).each((_, el) => {
      const card = $(el)
      const title = card.find(opts.titleSelector).text().trim()
      const rawPrice = opts.priceSelector ? card.find(opts.priceSelector).text().trim() || null : null
      const imageUrl = opts.imageSelector ? card.find(opts.imageSelector).attr('src') ?? null : null
      let href = opts.linkSelector ? card.find(opts.linkSelector).attr('href') ?? null : null

      if (!title) return
      if (href && opts.baseUrl && !href.startsWith('http')) {
        href = `${opts.baseUrl}${href}`
      }

      listings.push({
        id: crypto.randomUUID(),
        sourceUrl: href ?? watch.url ?? null,
        adapterName: 'generic-html',
        title,
        description: null,
        rawPrice,
        extractedPrice: null,
        currency: null,
        images: imageUrl ? [imageUrl] : [],
        metadata: { selectors: opts },
        scrapedAt: new Date(),
        duplicateOf: null,
        llmAnalysis: null
      })
    })

    return listings
  }
}
