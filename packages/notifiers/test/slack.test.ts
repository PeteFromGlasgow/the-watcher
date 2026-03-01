import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

vi.mock('../src/notifier.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/notifier.js')>()
  return {
    ...actual,
    resolveSecret: vi.fn()
  }
})

import { SlackNotifier } from '../src/slack.js'
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

const validSecret = JSON.stringify({ webhookUrl: 'https://hooks.slack.com/services/T.../B.../xxx' })

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

describe('SlackNotifier', () => {
  it('posts to the webhook URL', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await notifier.send(makeListing(), makeWatch())

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/T.../B.../xxx',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sends a Block Kit message with title, price, and watch name', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await notifier.send(makeListing(), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    const section = body.blocks[0]
    expect(section.type).toBe('section')
    expect(section.text.text).toContain('VW Crafter 2019')
    expect(section.text.text).toContain('£12,500')
    expect(section.text.text).toContain('VW Watch')
  })

  it('includes image accessory when primary image is available', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await notifier.send(makeListing(), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    const section = body.blocks[0]
    expect(section.accessory).toBeDefined()
    expect(section.accessory.type).toBe('image')
    expect(section.accessory.image_url).toBe('https://example.com/img1.jpg')
  })

  it('omits image accessory when no primary image', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await notifier.send(makeListing({ images: [] }), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    const section = body.blocks[0]
    expect(section.accessory).toBeUndefined()
  })

  it('appends LLM answers as a context block when present', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    const listing = makeListing({ llmAnalysis: { 1: 'Yes', 2: 'Good condition' } })
    await notifier.send(listing, makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.blocks).toHaveLength(2)
    const contextBlock = body.blocks[1]
    expect(contextBlock.type).toBe('context')
    expect(contextBlock.elements[0].text).toContain('Q1: Yes')
    expect(contextBlock.elements[0].text).toContain('Q2: Good condition')
  })

  it('omits context block when llmAnswers is null', async () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await notifier.send(makeListing(), makeWatch())

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.blocks).toHaveLength(1)
  })

  it('throws on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('channel_not_found')
    } as Response)

    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'my-slack' })
    await expect(notifier.send(makeListing(), makeWatch())).rejects.toThrow('Slack notification failed: 404 channel_not_found')
  })

  it('has name "slack"', () => {
    const notifier = new SlackNotifier({ type: 'slack', secretRef: 'ref' })
    expect(notifier.name).toBe('slack')
  })
})
