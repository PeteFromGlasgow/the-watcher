import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LlmAdapter } from '../src/llm/index.js'
import type { Watch } from '@watcher/shared-logic'

const adapter = new LlmAdapter()

const sampleApiResponse = JSON.stringify([
  {
    title: 'Used Bicycle',
    rawPrice: '£75',
    sourceUrl: 'https://example.com/bicycle',
    description: 'Good condition',
    images: ['https://example.com/bike.jpg']
  },
  {
    title: 'Vintage Camera',
    rawPrice: null,
    sourceUrl: null,
    description: null,
    images: []
  }
])

beforeEach(() => {
  vi.stubEnv('LLM_ADAPTER_API_KEY', 'test-key')
  vi.stubEnv('LLM_ADAPTER_PROVIDER', 'anthropic')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('LlmAdapter', () => {
  it('has name "llm"', () => {
    expect(adapter.name).toBe('llm')
  })

  it('throws if LLM_ADAPTER_API_KEY is not set', async () => {
    vi.unstubAllEnvs()

    await expect(
      adapter.extract({ type: 'html', html: '<html/>', transportUsed: 'http' }, {} as unknown as Watch)
    ).rejects.toThrow('LLM_ADAPTER_API_KEY is not set')
  })

  it('calls Anthropic API and maps listings from html result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        content: [{ text: sampleApiResponse }]
      })
    }))

    const listings = await adapter.extract(
      { type: 'html', html: '<html><body>Some page content</body></html>', transportUsed: 'http' },
      {} as unknown as Watch
    )

    expect(listings.length).toBe(2)
    expect(listings[0].title).toBe('Used Bicycle')
    expect(listings[0].rawPrice).toBe('£75')
    expect(listings[0].sourceUrl).toBe('https://example.com/bicycle')
    expect(listings[0].description).toBe('Good condition')
    expect(listings[0].images).toContain('https://example.com/bike.jpg')
    expect(listings[0].adapterName).toBe('llm')
    expect(listings[0].scrapedAt).toBeInstanceOf(Date)
  })

  it('calls OpenAI API when provider is openai', async () => {
    vi.stubEnv('LLM_ADAPTER_PROVIDER', 'openai')
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        choices: [{ message: { content: sampleApiResponse } }]
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const listings = await adapter.extract(
      { type: 'html', html: '<html/>', transportUsed: 'http' },
      {} as unknown as Watch
    )

    expect(listings.length).toBe(2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('openai.com'),
      expect.any(Object)
    )
  })

  it('returns empty array when LLM returns unparseable JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        content: [{ text: 'not valid json' }]
      })
    }))

    const listings = await adapter.extract(
      { type: 'html', html: '<html/>', transportUsed: 'http' },
      {} as unknown as Watch
    )

    expect(listings).toEqual([])
  })

  it('returns empty array when LLM returns non-array JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        content: [{ text: '{"title": "not an array"}' }]
      })
    }))

    const listings = await adapter.extract(
      { type: 'html', html: '<html/>', transportUsed: 'http' },
      {} as unknown as Watch
    )

    expect(listings).toEqual([])
  })

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const listings = await adapter.extract(
      { type: 'html', html: '<html/>', transportUsed: 'http' },
      {} as unknown as Watch
    )

    expect(listings).toEqual([])
  })

  it('extracts text from page result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ content: [{ text: '[]' }] })
    })
    vi.stubGlobal('fetch', fetchMock)

    const mockPage = {
      evaluate: vi.fn().mockResolvedValue('Page text content here')
    }

    await adapter.extract(
      { type: 'page', page: mockPage, transportUsed: 'playwright' },
      {} as unknown as Watch
    )

    expect(mockPage.evaluate).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('Page text content here')
      })
    )
  })
})
