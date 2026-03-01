import { describe, it, expect, vi } from 'vitest'
import { FacebookAdapter } from '../src/facebook/index.js'
import type { Watch } from '@watcher/shared-logic'

const adapter = new FacebookAdapter()

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
    const mockCard = {
      $eval: vi.fn().mockImplementation((selector: string) => {
        if (selector === '[data-testid="marketplace-pdp-title"]') return Promise.resolve('Test Bike')
        if (selector === '[data-testid="marketplace-pdp-price"]') return Promise.resolve('£200')
        if (selector === 'a') return Promise.resolve('/marketplace/item/123')
        if (selector === 'img') return Promise.resolve('https://example.com/bike.jpg')
        return Promise.resolve(null)
      })
    }

    const mockPage = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      $$: vi.fn().mockResolvedValue([mockCard])
    }

    const result = await adapter.extract(
      { type: 'page', page: mockPage, transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result.length).toBe(1)
    expect(result[0].title).toBe('Test Bike')
    expect(result[0].rawPrice).toBe('£200')
    expect(result[0].sourceUrl).toBe('https://www.facebook.com/marketplace/item/123')
    expect(result[0].images).toContain('https://example.com/bike.jpg')
    expect(result[0].adapterName).toBe('facebook')
    expect(result[0].scrapedAt).toBeInstanceOf(Date)
  })

  it('skips cards with no title', async () => {
    const mockCard = {
      $eval: vi.fn().mockImplementation((selector: string) => {
        if (selector === '[data-testid="marketplace-pdp-title"]') return Promise.resolve('')
        return Promise.resolve(null)
      })
    }

    const mockPage = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      $$: vi.fn().mockResolvedValue([mockCard])
    }

    const result = await adapter.extract(
      { type: 'page', page: mockPage, transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(result).toEqual([])
  })

  it('scrolls the page 5 times before extracting', async () => {
    const mockPage = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      $$: vi.fn().mockResolvedValue([])
    }

    await adapter.extract(
      { type: 'page', page: mockPage, transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(mockPage.evaluate).toHaveBeenCalledTimes(5)
    expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(5)
  })
})
