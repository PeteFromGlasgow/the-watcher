import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildPayload, resolveSecret, createNotifiers } from '../src/index.js'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

function makeListing(overrides: Partial<ScrapedListing> = {}): ScrapedListing {
  return {
    id: 'listing-1',
    adapterName: 'test',
    title: 'VW Crafter 2019',
    description: 'Great van',
    rawPrice: '£12,500',
    extractedPrice: 12500,
    currency: '£',
    sourceUrl: 'https://gumtree.com/listing/1',
    images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    metadata: {},
    scrapedAt: new Date(),
    duplicateOf: null,
    llmAnalysis: null,
    ...overrides
  }
}

function makeWatch(overrides: Partial<Watch> = {}): Watch {
  return {
    id: 'watch-1',
    user_id: 'user-1',
    name: 'VW Crafter Watch',
    adapter: 'gumtree',
    query_params: {},
    check_interval_minutes: 30,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notifiers: [],
    ...overrides
  }
}

describe('buildPayload', () => {
  it('maps listing and watch fields to payload', () => {
    const listing = makeListing()
    const watch = makeWatch()

    const payload = buildPayload(listing, watch)

    expect(payload.title).toBe('VW Crafter 2019')
    expect(payload.extractedPrice).toBe(12500)
    expect(payload.currency).toBe('£')
    expect(payload.primaryImageUrl).toBe('https://example.com/img1.jpg')
    expect(payload.listingUrl).toBe('https://gumtree.com/listing/1')
    expect(payload.watchName).toBe('VW Crafter Watch')
    expect(payload.llmAnswers).toBeNull()
  })

  it('sets primaryImageUrl to null when no images', () => {
    const listing = makeListing({ images: [] })
    const payload = buildPayload(listing, makeWatch())
    expect(payload.primaryImageUrl).toBeNull()
  })

  it('includes llmAnswers when present on listing', () => {
    const listing = makeListing({ llmAnalysis: { 1: 'Yes', 2: 'Good condition' } })
    const payload = buildPayload(listing, makeWatch())
    expect(payload.llmAnswers).toEqual({ 1: 'Yes', 2: 'Good condition' })
  })

  it('sets listingUrl to empty string when sourceUrl is null', () => {
    const listing = makeListing({ sourceUrl: null })
    const payload = buildPayload(listing, makeWatch())
    expect(payload.listingUrl).toBe('')
  })
})

describe('resolveSecret', () => {
  beforeEach(() => {
    vi.stubEnv('WATCHER_SECRET_MY_SECRET', 'secret-value')
    vi.stubEnv('WATCHER_SECRET_TELEGRAM_VW_CRAFTER', '{"botToken":"abc","chatId":"123"}')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves env var using WATCHER_SECRET_ prefix with uppercased ref', () => {
    expect(resolveSecret('my-secret')).toBe('secret-value')
  })

  it('replaces hyphens with underscores in the env key', () => {
    expect(resolveSecret('telegram-vw-crafter')).toBe('{"botToken":"abc","chatId":"123"}')
  })

  it('throws when env var is not set', () => {
    expect(() => resolveSecret('nonexistent')).toThrow('Secret not found in environment: WATCHER_SECRET_NONEXISTENT')
  })
})

describe('createNotifiers', () => {
  it('returns empty array when watch has no notifiers', () => {
    const watch = makeWatch({ notifiers: [] })
    expect(createNotifiers(watch)).toHaveLength(0)
  })

  it('returns empty array when notifiers field is undefined', () => {
    const watch = makeWatch({ notifiers: undefined })
    expect(createNotifiers(watch)).toHaveLength(0)
  })

  it('returns ntfy notifier for ntfy config', () => {
    const watch = makeWatch({ notifiers: [{ type: 'ntfy', secretRef: 'my-ntfy' }] })
    const notifiers = createNotifiers(watch)
    expect(notifiers).toHaveLength(1)
    expect(notifiers[0].name).toBe('ntfy')
  })

  it('returns telegram notifier for telegram config', () => {
    const watch = makeWatch({ notifiers: [{ type: 'telegram', secretRef: 'my-telegram' }] })
    const notifiers = createNotifiers(watch)
    expect(notifiers[0].name).toBe('telegram')
  })

  it('returns slack notifier for slack config', () => {
    const watch = makeWatch({ notifiers: [{ type: 'slack', secretRef: 'my-slack' }] })
    const notifiers = createNotifiers(watch)
    expect(notifiers[0].name).toBe('slack')
  })

  it('returns multiple notifiers for multiple configs', () => {
    const watch = makeWatch({
      notifiers: [
        { type: 'ntfy', secretRef: 'my-ntfy' },
        { type: 'telegram', secretRef: 'my-telegram' },
        { type: 'slack', secretRef: 'my-slack' }
      ]
    })
    const notifiers = createNotifiers(watch)
    expect(notifiers).toHaveLength(3)
    expect(notifiers.map(n => n.name)).toEqual(['ntfy', 'telegram', 'slack'])
  })

  it('throws for unknown notifier type', () => {
    const watch = makeWatch({ notifiers: [{ type: 'unknown' as 'ntfy', secretRef: 'ref' }] })
    expect(() => createNotifiers(watch)).toThrow('Unknown notifier type: unknown')
  })
})

describe('concurrent dispatch', () => {
  it('dispatches all notifiers concurrently via Promise.allSettled', async () => {
    const callOrder: string[] = []
    const makeNotifier = (name: string, delay: number) => ({
      name,
      send: vi.fn().mockImplementation(async () => {
        await new Promise(r => setTimeout(r, delay))
        callOrder.push(name)
      })
    })

    const n1 = makeNotifier('slow', 20)
    const n2 = makeNotifier('fast', 5)
    const listing = makeListing()
    const watch = makeWatch()

    const results = await Promise.allSettled([
      n1.send(listing, watch),
      n2.send(listing, watch)
    ])

    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    expect(callOrder).toEqual(['fast', 'slow'])
  })

  it('a failing notifier does not prevent others from completing', async () => {
    const failingNotifier = {
      name: 'failing',
      send: vi.fn().mockRejectedValue(new Error('channel down'))
    }
    const successNotifier = {
      name: 'success',
      send: vi.fn().mockResolvedValue(undefined)
    }

    const listing = makeListing()
    const watch = makeWatch()

    const results = await Promise.allSettled([
      failingNotifier.send(listing, watch),
      successNotifier.send(listing, watch)
    ])

    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('fulfilled')
    expect(successNotifier.send).toHaveBeenCalledOnce()
  })
})
