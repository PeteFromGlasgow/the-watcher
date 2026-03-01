import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractPrice, enrichPricing } from '../src/price-extraction.js'
import type { ScrapedListing } from '@watcher/shared-logic'

function makeListing(overrides: Partial<ScrapedListing> = {}): ScrapedListing {
  return {
    id: 'test-id',
    adapterName: 'test',
    title: 'Test Listing',
    description: null,
    rawPrice: null,
    extractedPrice: null,
    currency: null,
    sourceUrl: null,
    images: [],
    metadata: {},
    scrapedAt: new Date(),
    duplicateOf: null,
    llmAnalysis: null,
    ...overrides
  }
}

describe('extractPrice', () => {
  it('parses £4,500 from rawPrice', () => {
    const result = extractPrice('£4,500', null)
    expect(result.extractedPrice).toBe(4500)
    expect(result.currency).toBe('GBP')
  })

  it('parses £4500 (no comma) from rawPrice', () => {
    const result = extractPrice('£4500', null)
    expect(result.extractedPrice).toBe(4500)
    expect(result.currency).toBe('GBP')
  })

  it('parses $3,000 ono from rawPrice', () => {
    const result = extractPrice('$3,000 ono', null)
    expect(result.extractedPrice).toBe(3000)
    expect(result.currency).toBe('USD')
  })

  it('parses price from description when rawPrice is null', () => {
    const result = extractPrice(null, 'asking £1200 or nearest offer')
    expect(result.extractedPrice).toBe(1200)
    expect(result.currency).toBe('GBP')
  })

  it('parses EUR prices', () => {
    const result = extractPrice('€2,500', null)
    expect(result.extractedPrice).toBe(2500)
    expect(result.currency).toBe('EUR')
  })

  it('returns null when no price information is present', () => {
    const result = extractPrice(null, 'Great condition, barely used')
    expect(result.extractedPrice).toBeNull()
    expect(result.currency).toBeNull()
  })

  it('returns null for empty inputs', () => {
    const result = extractPrice(null, null)
    expect(result.extractedPrice).toBeNull()
    expect(result.currency).toBeNull()
  })

  it('ignores zero and negative values', () => {
    const result = extractPrice('£0', null)
    expect(result.extractedPrice).toBeNull()
  })
})

describe('enrichPricing', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('enriches a listing with an extracted price', async () => {
    const listing = makeListing({ rawPrice: '£4,500' })
    const result = await enrichPricing(listing)
    expect(result.extractedPrice).toBe(4500)
    expect(result.currency).toBe('GBP')
  })

  it('skips LLM if no OPENAI_API_KEY and regex fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const listing = makeListing({ description: 'Great deal, price on request' })
    const result = await enrichPricing(listing)
    expect(result.extractedPrice).toBeNull()
  })

  it('returns listing unchanged if price already extracted from rawPrice', async () => {
    const listing = makeListing({ rawPrice: '£1,000' })
    const result = await enrichPricing(listing)
    expect(result.extractedPrice).toBe(1000)
    expect(result.rawPrice).toBe('£1,000')
  })
})
