import { describe, it, expect, vi } from 'vitest'
import { FacebookAdapter } from '../src/facebook/index.js'
import type { Watch } from '@watcher/shared-logic'

const adapter = new FacebookAdapter()

function makeMockPage(cards: object[]) {
  return {
    evaluate: vi.fn().mockResolvedValue(undefined), // scroll calls
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    $$: vi.fn().mockResolvedValue(cards)
  }
}

function makeCard(data: { imgAlt: string, imgSrc?: string | null, href?: string | null, leafTexts?: string[] }) {
  return {
    evaluate: vi.fn().mockResolvedValue({
      imgAlt: data.imgAlt,
      imgSrc: data.imgSrc ?? null,
      href: data.href ?? null,
      leafTexts: data.leafTexts ?? []
    })
  }
}

describe('FacebookAdapter', () => {
  it('has name "facebook"', () => {
    expect(adapter.name).toBe('facebook')
  })

  it('throws if transport result is not a page', async () => {
    await expect(
      adapter.extract({ type: 'html', html: '', transportUsed: 'http' }, {} as unknown as Watch)
    ).rejects.toThrow('requires a Page transport result')
  })

  it('extracts listings from a mocked Playwright page', async () => {
    const card = makeCard({
      imgAlt: 'Test Bike in Glasgow, United Kingdom',
      imgSrc: 'https://example.com/bike.jpg',
      href: '/marketplace/item/123/',
      leafTexts: ['£200', 'Test Bike', 'Glasgow, United Kingdom']
    })

    const result = await adapter.extract(
      { type: 'page', page: makeMockPage([card]), transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result.length).toBe(1)
    expect(result[0].title).toBe('Test Bike')
    expect(result[0].rawPrice).toBe('£200')
    expect(result[0].sourceUrl).toBe('https://www.facebook.com/marketplace/item/123/')
    expect(result[0].images).toContain('https://example.com/bike.jpg')
    expect(result[0].adapterName).toBe('facebook')
    expect(result[0].scrapedAt).toBeInstanceOf(Date)
    expect(result[0].metadata).toEqual({ location: 'Glasgow, United Kingdom' })
  })

  it('extracts price correctly when a badge precedes it', async () => {
    const card = makeCard({
      imgAlt: 'Nintendo Switch in Cowdenbeath, Fife',
      href: '/marketplace/item/456/',
      leafTexts: ['Just listed', '£60', 'Nintendo Switch', 'Cowdenbeath, Fife']
    })

    const result = await adapter.extract(
      { type: 'page', page: makeMockPage([card]), transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result[0].title).toBe('Nintendo Switch')
    expect(result[0].rawPrice).toBe('£60')
  })

  it('extracts FREE listings correctly', async () => {
    const card = makeCard({
      imgAlt: 'Free Table Tennis Table in Giffnock',
      href: '/marketplace/item/789/',
      leafTexts: ['FREE', 'Free Table Tennis Table', 'Giffnock']
    })

    const result = await adapter.extract(
      { type: 'page', page: makeMockPage([card]), transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result[0].rawPrice).toBe('FREE')
  })

  it('skips cards with no title (empty img alt)', async () => {
    const card = makeCard({ imgAlt: '', href: '/marketplace/item/999/' })

    const result = await adapter.extract(
      { type: 'page', page: makeMockPage([card]), transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result).toEqual([])
  })

  it('scrolls the page 5 times before extracting', async () => {
    const mockPage = makeMockPage([])

    await adapter.extract(
      { type: 'page', page: mockPage, transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(mockPage.evaluate).toHaveBeenCalledTimes(5)
    expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(5)
  })

  it('uses absolute href as-is when card links to external URL', async () => {
    const card = makeCard({
      imgAlt: 'Some Item in Somewhere',
      href: 'https://www.facebook.com/marketplace/item/111/',
      leafTexts: ['£50', 'Some Item', 'Somewhere']
    })

    const result = await adapter.extract(
      { type: 'page', page: makeMockPage([card]), transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result[0].sourceUrl).toBe('https://www.facebook.com/marketplace/item/111/')
  })
})
