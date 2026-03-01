import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

vi.mock('../src/notifier.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/notifier.js')>()
  return {
    ...actual,
    resolveSecret: vi.fn()
  }
})

import { TelegramNotifier } from '../src/telegram.js'
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
    updated_at: new Date().toISOString()
  }
}

const validSecret = JSON.stringify({ botToken: 'bot123', chatId: '-1001234567890' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mockFetch)
  vi.mocked(resolveSecret).mockReturnValue(validSecret)
  mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('')
  } as Response)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TelegramNotifier', () => {
  it('calls sendPhoto when a primary image is available', async () => {
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await notifier.send(makeListing(), makeWatch())

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot123/sendPhoto',
      expect.objectContaining({ method: 'POST' })
    )

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.photo).toBe('https://example.com/img1.jpg')
    expect(body.chat_id).toBe('-1001234567890')
    expect(body.parse_mode).toBe('HTML')
  })

  it('calls sendMessage when no image is available', async () => {
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await notifier.send(makeListing({ images: [] }), makeWatch())

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot123/sendMessage',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('truncates caption to 1024 chars for sendPhoto', async () => {
    const longTitle = 'A'.repeat(2000)
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await notifier.send(makeListing({ title: longTitle }), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.caption.length).toBeLessThanOrEqual(1024)
  })

  it('truncates text to 4096 chars for sendMessage', async () => {
    const longTitle = 'A'.repeat(5000)
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await notifier.send(makeListing({ title: longTitle, images: [] }), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.text.length).toBeLessThanOrEqual(4096)
  })

  it('includes LLM answers in caption', async () => {
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    const listing = makeListing({ llmAnalysis: { 1: 'Yes', 2: 'Good' } })
    await notifier.send(listing, makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.caption).toContain('Q1: Yes')
    expect(body.caption).toContain('Q2: Good')
  })

  it('throws on non-ok sendPhoto response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request')
    } as Response)

    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await expect(notifier.send(makeListing(), makeWatch())).rejects.toThrow('Telegram sendPhoto failed: 400 Bad Request')
  })

  it('throws on non-ok sendMessage response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request')
    } as Response)

    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'my-telegram' })
    await expect(notifier.send(makeListing({ images: [] }), makeWatch())).rejects.toThrow('Telegram sendMessage failed: 400 Bad Request')
  })

  it('has name "telegram"', () => {
    const notifier = new TelegramNotifier({ type: 'telegram', secretRef: 'ref' })
    expect(notifier.name).toBe('telegram')
  })
})
