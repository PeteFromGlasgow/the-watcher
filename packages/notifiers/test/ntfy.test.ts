import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

vi.mock('../src/notifier.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/notifier.js')>()
  return {
    ...actual,
    resolveSecret: vi.fn()
  }
})

import { NtfyNotifier } from '../src/ntfy.js'
import { resolveSecret } from '../src/notifier.js'

const mockFetch = vi.fn()

function makeListing(overrides: Partial<ScrapedListing> = {}): ScrapedListing {
  return {
    id: 'listing-1',
    adapterName: 'test',
    title: 'VW Crafter 2019',
    description: null,
    rawPrice: '£12,500',
    extractedPrice: 12500,
    currency: '£',
    sourceUrl: 'https://gumtree.com/listing/1',
    images: ['https://example.com/img1.jpg'],
    metadata: {},
    scrapedAt: new Date(),
    duplicateOf: null,
    llmAnalysis: null,
    ...overrides
  }
}

function makeWatch(): Watch {
  return {
    id: 'watch-1',
    user_id: 'user-1',
    name: 'VW Watch',
    adapter: 'gumtree',
    query_params: {},
    check_interval_minutes: 30,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notifiers: [{ type: 'ntfy', secretRef: 'my-ntfy' }]
  }
}

const validSecret = JSON.stringify({ endpoint: 'https://ntfy.sh', topic: 'my-topic' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mockFetch)
  vi.mocked(resolveSecret).mockReturnValue(validSecret)
  mockFetch.mockResolvedValue({ ok: true } as Response)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NtfyNotifier', () => {
  it('sends a POST to the correct ntfy endpoint', async () => {
    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await notifier.send(makeListing(), makeWatch())

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ntfy.sh/my-topic',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('includes the image URL in Attach header when available', async () => {
    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await notifier.send(makeListing(), makeWatch())

    const call = mockFetch.mock.calls[0][1] as RequestInit
    expect((call.headers as Record<string, string>)['Attach']).toBe('https://example.com/img1.jpg')
  })

  it('omits Attach header when no primary image', async () => {
    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await notifier.send(makeListing({ images: [] }), makeWatch())

    const call = mockFetch.mock.calls[0][1] as RequestInit
    expect((call.headers as Record<string, string>)['Attach']).toBeUndefined()
  })

  it('adds Authorization header when token is present in secret', async () => {
    vi.mocked(resolveSecret).mockReturnValue(
      JSON.stringify({ endpoint: 'https://ntfy.sh', topic: 'my-topic', token: 'secret-token' })
    )

    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await notifier.send(makeListing(), makeWatch())

    const call = mockFetch.mock.calls[0][1] as RequestInit
    expect((call.headers as Record<string, string>)['Authorization']).toBe('Bearer secret-token')
  })

  it('omits Authorization header when no token in secret', async () => {
    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await notifier.send(makeListing(), makeWatch())

    const call = mockFetch.mock.calls[0][1] as RequestInit
    expect((call.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('throws on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' } as Response)

    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'my-ntfy' })
    await expect(notifier.send(makeListing(), makeWatch())).rejects.toThrow('ntfy notification failed: 403 Forbidden')
  })

  it('has name "ntfy"', () => {
    const notifier = new NtfyNotifier({ type: 'ntfy', secretRef: 'ref' })
    expect(notifier.name).toBe('ntfy')
  })
})
