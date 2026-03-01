import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

const mockOpenAiCreate = vi.hoisted(() => vi.fn())
const mockGoogleGenerateContent = vi.hoisted(() => vi.fn())

interface OpenAiConfig {
  apiKey?: string
  baseURL?: string
}

interface OpenAiMessage {
  role: string
  content: string | Array<{ type: string, image_url?: { url: string, detail: string } }>
}

interface OpenAiCreateArgs {
  model: string
  messages: OpenAiMessage[]
}

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function (this: { baseURL?: string }, config: OpenAiConfig) {
    this.baseURL = config.baseURL
    return {
      chat: {
        completions: {
          create: (args: OpenAiCreateArgs) => {
            return mockOpenAiCreate(args, config)
          }
        }
      }
    }
  })
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockImplementation((config: { model: string }) => ({
        generateContent: (args: unknown) => mockGoogleGenerateContent(args, config)
      }))
    }
  })
}))

// Mock fetch for image downloads
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

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
    check_interval_minutes: 60,
    status: 'active',
    llmQuestions: ['Is this a high-roof variant?', 'Does it have a reversing camera?'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
  vi.stubEnv('GOOGLE_API_KEY', 'test-google-key')

  mockFetch.mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    headers: { get: () => 'image/jpeg' }
  } as unknown as Response)
})

describe('runLlmAnalysis', () => {
  describe('General', () => {
    it('returns null when llmQuestions is empty', async () => {
      const result = await runLlmAnalysis(makeScrapedListing(), makeWatch({ llmQuestions: [] }))
      expect(result).toBeNull()
    })

    it('returns null when listing has no images', async () => {
      const result = await runLlmAnalysis(makeScrapedListing({ images: [] }), makeWatch())
      expect(result).toBeNull()
    })
  })

  describe('OpenAI Provider', () => {
    it('returns null when OPENAI_API_KEY is not set and no config provided', async () => {
      vi.stubEnv('OPENAI_API_KEY', '')
      const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())
      expect(result).toBeNull()
    })

    it('uses default model and env API key', async () => {
      mockOpenAiCreate.mockResolvedValue({
        choices: [{ message: { content: '{"1":"Yes"}' } }]
      })

      const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())

      expect(result).toEqual({ 1: 'Yes' })
      const [args, config] = mockOpenAiCreate.mock.calls[0] as [OpenAiCreateArgs, OpenAiConfig]
      expect(args.model).toBe('gpt-4o')
      expect(config.apiKey).toBe('test-openai-key')
    })

    it('uses configured model and baseURL', async () => {
      mockOpenAiCreate.mockResolvedValue({
        choices: [{ message: { content: '{"1":"Yes"}' } }]
      })

      const watch = makeWatch({
        llmConfig: {
          provider: 'openai',
          model: 'gpt-4-turbo',
          baseURL: 'https://my-proxy.com/v1',
          apiKey: 'custom-key'
        }
      })

      await runLlmAnalysis(makeScrapedListing(), watch)

      const [args, config] = mockOpenAiCreate.mock.calls[0] as [OpenAiCreateArgs, OpenAiConfig]
      expect(args.model).toBe('gpt-4-turbo')
      expect(config.baseURL).toBe('https://my-proxy.com/v1')
      expect(config.apiKey).toBe('custom-key')
    })

    it('sends at most 4 images', async () => {
      mockOpenAiCreate.mockResolvedValue({
        choices: [{ message: { content: '{"1":"answer"}' } }]
      })

      const manyImages = Array.from({ length: 6 }, (_, i) => `https://example.com/img${i}.jpg`)
      await runLlmAnalysis(makeScrapedListing({ images: manyImages }), makeWatch())

      const [args] = mockOpenAiCreate.mock.calls[0] as [OpenAiCreateArgs]
      const content = args.messages[0]?.content
      if (Array.isArray(content)) {
        const imageItems = content.filter(c => c.type === 'image_url')
        expect(imageItems).toHaveLength(4)
      } else {
        throw new Error('Expected content to be an array')
      }
    })
  })

  describe('Google Provider', () => {
    it('returns null when GOOGLE_API_KEY is not set', async () => {
      vi.stubEnv('GOOGLE_API_KEY', '')
      const watch = makeWatch({ llmConfig: { provider: 'google' } })
      const result = await runLlmAnalysis(makeScrapedListing(), watch)
      expect(result).toBeNull()
    })

    it('uses default model and env API key', async () => {
      mockGoogleGenerateContent.mockResolvedValue({
        response: { text: () => '{"1":"Yes"}' }
      })

      const watch = makeWatch({ llmConfig: { provider: 'google' } })
      const result = await runLlmAnalysis(makeScrapedListing(), watch)

      expect(result).toEqual({ 1: 'Yes' })
      const [args, config] = mockGoogleGenerateContent.mock.calls[0] as [(string | object)[], { model: string }]
      expect(config.model).toBe('gemini-1.5-flash')
      expect(args).toHaveLength(3) // 1 prompt + 2 images
      expect(typeof args[0]).toBe('string')
      expect(args[0]).toContain('Questions:')
      expect((args[1] as { inlineData: unknown }).inlineData).toBeDefined()
    })

    it('uses configured model', async () => {
      mockGoogleGenerateContent.mockResolvedValue({
        response: { text: () => '{"1":"Yes"}' }
      })

      const watch = makeWatch({
        llmConfig: {
          provider: 'google',
          model: 'gemini-1.5-pro'
        }
      })
      await runLlmAnalysis(makeScrapedListing(), watch)

      const [, config] = mockGoogleGenerateContent.mock.calls[0] as [unknown, { model: string }]
      expect(config.model).toBe('gemini-1.5-pro')
    })

    it('fetches images and converts to base64', async () => {
      mockGoogleGenerateContent.mockResolvedValue({
        response: { text: () => '{"1":"Yes"}' }
      })

      const watch = makeWatch({ llmConfig: { provider: 'google' } })
      await runLlmAnalysis(makeScrapedListing(), watch)

      expect(mockFetch).toHaveBeenCalledTimes(2)
      const [args] = mockGoogleGenerateContent.mock.calls[0] as [Array<{ inlineData: { data: string, mimeType: string } }>]
      expect(args[1]?.inlineData?.data).toBeDefined()
      expect(args[1]?.inlineData?.mimeType).toBe('image/jpeg')
    })
  })

  it('returns null when LLM throws', async () => {
    mockOpenAiCreate.mockRejectedValue(new Error('OpenAI unavailable'))

    const result = await runLlmAnalysis(makeScrapedListing(), makeWatch())

    expect(result).toBeNull()
  })
})
