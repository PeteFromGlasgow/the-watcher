import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

vi.mock('../src/price-extraction.js', () => ({ enrichPricing: vi.fn() }))
vi.mock('../src/image-download.js', () => ({ downloadAndStoreImages: vi.fn() }))
vi.mock('../src/deduplication.js', () => ({ checkDuplicate: vi.fn() }))
vi.mock('../src/llm-analysis.js', () => ({ runLlmAnalysis: vi.fn() }))
vi.mock('@watcher/notifiers', () => ({
  createNotifiers: vi.fn().mockReturnValue([]),
  isAlreadyNotified: vi.fn().mockResolvedValue(false),
  recordNotification: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@watcher/db', () => ({ getKnex: vi.fn() }))

import { enrichPricing } from '../src/price-extraction.js'
import { downloadAndStoreImages } from '../src/image-download.js'
import { checkDuplicate } from '../src/deduplication.js'
import { runWatch } from '../src/index.js'

const mockWatch: Watch = {
  id: 'watch-1',
  user_id: 'user-1',
  name: 'Test Watch',
  adapter: 'generic-html',
  query_params: {},
  check_interval_minutes: 60,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockListing: ScrapedListing = {
  id: 'listing-1',
  adapterName: 'generic-html',
  title: 'Test Listing',
  description: 'A test listing',
  rawPrice: '£100',
  extractedPrice: 100,
  currency: 'GBP',
  sourceUrl: 'https://example.com/1',
  images: ['https://example.com/img.jpg'],
  metadata: {},
  scrapedAt: new Date(),
  duplicateOf: null,
  llmAnalysis: null
}

function makeKnex(watchOverride?: Partial<Watch> | null) {
  const insert = vi.fn().mockReturnValue({
    onConflict: vi.fn().mockReturnValue({ ignore: vi.fn().mockResolvedValue(1) })
  })
  const first = vi.fn().mockResolvedValue(
    watchOverride === null ? undefined : { ...mockWatch, ...watchOverride }
  )
  const where = vi.fn().mockReturnValue({ first })

  const knex = vi.fn((table: string) => {
    if (table === 'run_log') return { insert }
    if (table === 'listings') return { insert }
    return { where }
  }) as unknown as import('knex').Knex

  return { knex, insert }
}

function makeResolver(listings: ScrapedListing[] = [mockListing]) {
  const extract = vi.fn().mockResolvedValue(listings)
  const adapter = { name: 'generic-html', extract }
  const registry = { get: vi.fn().mockReturnValue(adapter) } as unknown as typeof import('@watcher/adapters').adapterRegistry

  const resolve = vi.fn().mockResolvedValue({ type: 'html', html: '<html/>', transportUsed: 'http' })
  const resolver = { resolve } as unknown as import('@watcher/transports').TransportResolver

  return { resolver, registry, extract }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(enrichPricing).mockImplementation(async l => l)
  vi.mocked(downloadAndStoreImages).mockResolvedValue([])
  vi.mocked(checkDuplicate).mockResolvedValue({ isDuplicate: false, duplicateOf: null, embedding: null })
})

describe('runWatch', () => {
  it('throws if watch is not found', async () => {
    const { knex } = makeKnex(null)
    await expect(runWatch('missing-watch', { knex })).rejects.toThrow('Watch not found: missing-watch')
  })

  it('returns pipeline result with correct shape', async () => {
    const { knex } = makeKnex({ transport: undefined })
    const result = await runWatch('watch-1', { knex })

    expect(result).toMatchObject({
      watchId: 'watch-1',
      listingsFound: 0,
      newListings: 0,
      duplicatesSkipped: 0,
      notificationsSent: 0,
      errors: []
    })
    expect(result.runId).toBeTypeOf('string')
    expect(result.startedAt).toBeInstanceOf(Date)
    expect(result.completedAt).toBeInstanceOf(Date)
  })

  it('skips scraping when watch has no transport chain', async () => {
    const { knex } = makeKnex({ transport: undefined })
    const { resolver, registry } = makeResolver()

    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(resolver.resolve).not.toHaveBeenCalled()
    expect(result.listingsFound).toBe(0)
  })

  it('scrapes and processes listings through the pipeline', async () => {
    const { knex, insert } = makeKnex({
      transport: { chain: [{ name: 'http', options: {} }] }
    })
    const { resolver, registry, extract } = makeResolver()

    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(resolver.resolve).toHaveBeenCalledOnce()
    expect(extract).toHaveBeenCalledOnce()
    expect(enrichPricing).toHaveBeenCalledWith(mockListing)
    expect(downloadAndStoreImages).toHaveBeenCalledWith(mockListing.id, mockListing.images, knex)
    expect(checkDuplicate).toHaveBeenCalledOnce()
    expect(result.listingsFound).toBe(1)
    expect(result.newListings).toBe(1)
    expect(insert).toHaveBeenCalledTimes(2) // listings + run_log
  })

  it('increments duplicatesSkipped and skips notification for duplicates', async () => {
    const { knex } = makeKnex({ transport: { chain: [{ name: 'http', options: {} }] } })
    const { resolver, registry } = makeResolver()
    vi.mocked(checkDuplicate).mockResolvedValue({ isDuplicate: true, duplicateOf: 'listing-original', embedding: null })

    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(result.duplicatesSkipped).toBe(1)
    expect(result.newListings).toBe(0)
  })

  it('applies price filters and skips listings that do not match', async () => {
    const { knex } = makeKnex({
      transport: { chain: [{ name: 'http', options: {} }] },
      filters: { priceMin: 500, priceMax: 1000, keywords: { include: [], exclude: [] } }
    })
    const { resolver, registry } = makeResolver()
    // listing has extractedPrice: 100 which is below priceMin: 500
    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(result.listingsFound).toBe(1)
    expect(result.newListings).toBe(0) // filtered out
  })

  it('catches scrape errors and records them', async () => {
    const { knex } = makeKnex({ transport: { chain: [{ name: 'http', options: {} }] } })
    const resolver = { resolve: vi.fn().mockRejectedValue(new Error('Network error')) } as unknown as import('@watcher/transports').TransportResolver
    const { registry } = makeResolver()

    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Scrape failed')
  })

  it('catches per-listing errors and continues processing', async () => {
    const listing2 = { ...mockListing, id: 'listing-2' }
    const { knex } = makeKnex({ transport: { chain: [{ name: 'http', options: {} }] } })
    const { resolver, registry } = makeResolver([mockListing, listing2])

    let callCount = 0
    vi.mocked(enrichPricing).mockImplementation(async (l) => {
      callCount++
      if (callCount === 1) throw new Error('Enrichment failed')
      return l
    })

    const result = await runWatch('watch-1', { knex, resolver, registry })

    expect(result.listingsFound).toBe(2)
    expect(result.newListings).toBe(1) // second listing succeeds
    expect(result.errors).toHaveLength(1)
  })

  it('writes run_log record after execution', async () => {
    const { knex, insert } = makeKnex({ transport: undefined })

    await runWatch('watch-1', { knex })

    const runLogCall = insert.mock.calls.find(c => c[0]?.status !== undefined)
    expect(runLogCall).toBeDefined()
    expect(runLogCall![0]).toMatchObject({
      watch_id: 'watch-1',
      status: 'no_change'
    })
  })
})
