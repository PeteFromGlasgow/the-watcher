import { readFileSync } from 'fs'
import { describe, it, expect } from 'vitest'
import { GenericHtmlAdapter } from '../src/generic-html/index.js'
import type { Watch } from '@watcher/shared-logic'

const fixture = readFileSync(new URL('./fixtures/generic-html-sample.html', import.meta.url), 'utf8')
const adapter = new GenericHtmlAdapter()

const watchWithSelectors = {
  adapter: 'generic-html',
  url: 'https://example.com',
  adapterOptions: {
    containerSelector: '.listing-card',
    titleSelector: '.title',
    priceSelector: '.price',
    imageSelector: '.listing-photo',
    linkSelector: '.listing-link',
    baseUrl: 'https://example.com'
  }
} as unknown as Watch

describe('GenericHtmlAdapter', () => {
  it('has name "generic-html"', () => {
    expect(adapter.name).toBe('generic-html')
  })

  describe('extract with configured selectors', () => {
    it('extracts listings using configured selectors', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      expect(listings.length).toBe(3)
    })

    it('extracts correct titles', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      expect(listings[0].title).toBe('Blue Mountain Bike - Trek 820')
      expect(listings[1].title).toBe('Sony PlayStation 5 Console - Disc Edition')
      expect(listings[2].title).toBe('IKEA KALLAX Shelf Unit 4x4')
    })

    it('extracts price as rawPrice', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      expect(listings[0].rawPrice).toBe('£150')
      expect(listings[1].rawPrice).toBe('£350')
    })

    it('prepends baseUrl to relative hrefs', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      expect(listings[0].sourceUrl).toBe('https://example.com/listings/bike-trek-820')
    })

    it('extracts image src', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      expect(listings[0].images).toContain('https://example.com/images/bike1.jpg')
    })

    it('returns empty images array when no image found', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      // Third card has no image
      expect(listings[2].images).toEqual([])
    })

    it('sets adapterName to generic-html', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      for (const listing of listings) {
        expect(listing.adapterName).toBe('generic-html')
      }
    })

    it('sets scrapedAt as a Date', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: fixture, transportUsed: 'http' },
        watchWithSelectors
      )

      for (const listing of listings) {
        expect(listing.scrapedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe('missing selectors', () => {
    it('throws if containerSelector is missing', async () => {
      const watch = {
        adapterOptions: { titleSelector: '.title' }
      } as unknown as Watch

      await expect(
        adapter.extract({ type: 'html', html: '<html/>', transportUsed: 'http' }, watch)
      ).rejects.toThrow('containerSelector')
    })

    it('throws if titleSelector is missing', async () => {
      const watch = {
        adapterOptions: { containerSelector: '.listing-card' }
      } as unknown as Watch

      await expect(
        adapter.extract({ type: 'html', html: '<html/>', transportUsed: 'http' }, watch)
      ).rejects.toThrow('titleSelector')
    })

    it('throws if adapterOptions is not set', async () => {
      await expect(
        adapter.extract({ type: 'html', html: '<html/>', transportUsed: 'http' }, {} as Watch)
      ).rejects.toThrow('containerSelector')
    })
  })

  describe('empty results', () => {
    it('returns empty array when no containers match', async () => {
      const listings = await adapter.extract(
        { type: 'html', html: '<html><body><p>nothing here</p></body></html>', transportUsed: 'http' },
        watchWithSelectors
      )
      expect(listings).toEqual([])
    })
  })
})
