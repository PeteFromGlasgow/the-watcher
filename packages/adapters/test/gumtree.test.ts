import { readFileSync } from 'fs'
import { describe, it, expect } from 'vitest'
import { GumtreeAdapter } from '../src/gumtree/index.js'
import type { Watch } from '@watcher/shared-logic'

const fixture = readFileSync(new URL('./fixtures/gumtree-search.html', import.meta.url), 'utf8')
const adapter = new GumtreeAdapter()
const mockWatch = { url: 'https://www.gumtree.com', adapter: 'gumtree' } as unknown as Watch

describe('GumtreeAdapter', () => {
  it('has name "gumtree"', () => {
    expect(adapter.name).toBe('gumtree')
  })

  describe('extract from html result', () => {
    it('extracts listings from gumtree search results', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      expect(listings.length).toBeGreaterThanOrEqual(3)
    })

    it('sets correct adapterName on each listing', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      for (const listing of listings) {
        expect(listing.adapterName).toBe('gumtree')
      }
    })

    it('extracts non-empty titles', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      for (const listing of listings) {
        expect(listing.title).toBeTruthy()
      }
    })

    it('extracts gumtree.com source URLs', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      for (const listing of listings) {
        expect(listing.sourceUrl).toContain('gumtree.com')
      }
    })

    it('extracts price as rawPrice string', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      const withPrices = listings.filter(l => l.rawPrice !== null)
      expect(withPrices.length).toBeGreaterThan(0)
      expect(withPrices[0].rawPrice).toContain('£')
    })

    it('sets scrapedAt as a Date', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      for (const listing of listings) {
        expect(listing.scrapedAt).toBeInstanceOf(Date)
      }
    })

    it('generates unique IDs for each listing', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      const ids = listings.map(l => l.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('skips cards without a title', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        mockWatch
      )

      // The fixture has 4 cards but 1 has no title — only 3 should be extracted
      expect(listings.length).toBe(3)
    })

    it('returns empty array for HTML with no matching listings', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: '<html><body><p>No results</p></body></html>', transportUsed: 'http' },
        mockWatch
      )
      expect(listings).toEqual([])
    })
  })
})
