import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } }
  })
}))

import { runLlmAnalysis } from '../src/llm-analysis.js'

function makeScrapedListing(overrides: Partial<ScrapedListing> = {}): ScrapedListing {
  return {
    id: 'listing-1',
    adapterName: 'test',
    title: 'Test Listing',
    description: null,
    rawPrice: null,
    extractedPrice: null,
    currency: null,
    sourceUrl: 'https://example.com/listing/1',
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
    adapter: 'test',
    query_params: {},
    interval: 60,
    status: 'active',
    transport_chain: [],
    llmQuestions: ['Is this a high-roof variant?', 'Does it have a reversing camera?'],
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('OPENAI_API_KEY', 'test-key')
})

describe('runLlmAnalysis', () => {
  it('returns null when llmQuestions is empty', async () => {
    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch({ llmQuestions: [] }))
    expect(result).toBeNull()
  })

  it('returns null when llmQuestions is undefined', async () => {
    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch({ llmQuestions: undefined }))
    expect(result).toBeNull()
  })

  it('returns null when OPENAI_API_KEY is not set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())
    expect(result).toBeNull()
  })

  it('returns null when listing has no images', async () => {
    const result = await runLlmAnalysis(makeScrapedListing({ images: [] }), makeWatch())
    expect(result).toBeNull()
  })

  it('returns parsed JSON from LLM response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"1":"Yes, high-roof","2":"No camera visible"}' } }]
    })

    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())

    expect(result).toEqual({ 1: 'Yes, high-roof', 2: 'No camera visible' })
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('strips markdown code fences from LLM response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '```json\n{"1":"Yes"}\n```' } }]
    })

    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())

    expect(result).toEqual({ 1: 'Yes' })
  })

  it('sends at most 4 images to the LLM', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"1":"answer"}' } }]
    })

    const manyImages = Array.from({ length: 6 }, (_, i) => `https://example.com/img${i}.jpg`)
    await runLlmAnalysis(makeScrapedListing({ images: manyImages }), makeWatch())

    const call = mockCreate.mock.calls[0]?.[0] as { messages: Array<{ content: unknown[] }> }
    const content = call.messages[0]?.content as Array<{ type: string }>
    const imageItems = content.filter(c => c.type === 'image_url')
    expect(imageItems).toHaveLength(4)
  })

  it('returns null and logs when LLM throws (does not propagate)', async () => {
    mockCreate.mockRejectedValue(new Error('OpenAI unavailable'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())

    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('LLM analysis failed'))
    warnSpy.mockRestore()
  })

  it('returns null when LLM returns empty content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '' } }]
    })

    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())
    expect(result).toBeNull()
  })
})
