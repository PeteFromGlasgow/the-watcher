import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Watch, ScrapedListing, TransportResult } from '@watcher/shared-logic'

const { mockResolve, mockExtract, mockRegistryGet } = vi.hoisted(() => ({
  mockResolve: vi.fn(),
  mockExtract: vi.fn(),
  mockRegistryGet: vi.fn()
}))

vi.mock('@watcher/transports', () => ({
  // vi.fn() can be called with `new`; returning a plain object from the ctor makes new return it
  TransportResolver: vi.fn(function MockResolver() {
    return { resolve: mockResolve }
  }),
  HttpTransport: vi.fn(),
  PlaywrightTransport: vi.fn(),
  FlareSolverrTransport: vi.fn(),
  BrightDataTransport: vi.fn()
}))

vi.mock('@watcher/adapters', () => ({
  adapterRegistry: { get: mockRegistryGet }
}))

import { runScrape } from '../src/index.js'

const mockWatch: Watch = {
  id: 'watch-123',
  user_id: 'user-456',
  name: 'Test Watch',
  adapter: 'gumtree',
  query_params: {},
  check_interval_minutes: 60,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  url: 'https://www.gumtree.com/search?q=van',
  transport: { chain: [{ name: 'http' }] }
}

const mockListing: ScrapedListing = {
  id: 'listing-abc',
  adapterName: 'gumtree',
  title: 'VW Transporter',
  description: null,
  rawPrice: '£8,500',
  extractedPrice: null,
  currency: null,
  sourceUrl: 'https://www.gumtree.com/p/123',
  images: [],
  metadata: {},
  scrapedAt: new Date(),
  duplicateOf: null,
  llmAnalysis: null
}

const htmlResult: TransportResult = {
  type: 'html',
  html: '<html>ok</html>',
  transportUsed: 'http'
}

beforeEach(() => {
  vi.clearAllMocks()
  mockResolve.mockResolvedValue(htmlResult)
  mockExtract.mockResolvedValue([mockListing])
  mockRegistryGet.mockReturnValue({ name: 'mock-adapter', extract: mockExtract })
})

describe('runScrape', () => {
  it('returns listings, transportUsed, and durationMs', async () => {
    const result = await runScrape(mockWatch)

    expect(result.listings).toEqual([mockListing])
    expect(result.transportUsed).toBe('http')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('calls adapterRegistry.get with watch.adapter', async () => {
    await runScrape(mockWatch)

    expect(mockRegistryGet).toHaveBeenCalledWith('gumtree')
  })

  it('throws if adapter is not registered', async () => {
    mockRegistryGet.mockReturnValueOnce(undefined)

    await expect(runScrape(mockWatch)).rejects.toThrow('No adapter registered for: gumtree')
  })

  it('throws if watch has no transport configured', async () => {
    const watchNoTransport = { ...mockWatch, transport: undefined }

    await expect(runScrape(watchNoTransport)).rejects.toThrow('no transport chain configured')
  })

  it('throws if watch has no url configured', async () => {
    const watchNoUrl = { ...mockWatch, url: undefined }

    await expect(runScrape(watchNoUrl)).rejects.toThrow('no url configured')
  })

  it('closes browser when transport returns a page', async () => {
    const mockClose = vi.fn().mockResolvedValue(undefined)
    const mockBrowser = { close: mockClose }
    const mockContext = { browser: vi.fn().mockReturnValue(mockBrowser) }
    const mockPage = { context: vi.fn().mockReturnValue(mockContext) }

    const pageResult: TransportResult = {
      type: 'page',
      page: mockPage,
      transportUsed: 'playwright'
    }
    mockResolve.mockResolvedValue(pageResult)
    mockExtract.mockResolvedValue([])

    await runScrape(mockWatch)

    expect(mockClose).toHaveBeenCalled()
  })

  it('closes browser even if adapter throws', async () => {
    const mockClose = vi.fn().mockResolvedValue(undefined)
    const mockBrowser = { close: mockClose }
    const mockContext = { browser: vi.fn().mockReturnValue(mockBrowser) }
    const mockPage = { context: vi.fn().mockReturnValue(mockContext) }

    const pageResult: TransportResult = {
      type: 'page',
      page: mockPage,
      transportUsed: 'playwright'
    }
    mockResolve.mockResolvedValue(pageResult)
    mockExtract.mockRejectedValue(new Error('adapter failed'))

    await expect(runScrape(mockWatch)).rejects.toThrow('adapter failed')
    expect(mockClose).toHaveBeenCalled()
  })

  it('resolves cookie header from env var when secretRef is set', async () => {
    vi.stubEnv('WATCHER_SECRET_FACEBOOK_SESSION', 'c_user=123; xs=abc')

    const watchWithSecret: Watch = {
      ...mockWatch,
      adapter: 'facebook',
      transport: { chain: [{ name: 'playwright', secretRef: 'facebook-session' }] }
    }

    await runScrape(watchWithSecret)

    expect(mockResolve).toHaveBeenCalledWith(
      watchWithSecret.transport,
      expect.objectContaining({ cookieHeader: 'c_user=123; xs=abc' })
    )

    vi.unstubAllEnvs()
  })
})
