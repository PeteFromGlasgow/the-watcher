import { describe, it, expect, vi, beforeEach } from 'vitest'
import { embed, healthCheck } from '../src/index.js'

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('embed', () => {
  it('calls the CLIP service with a URL and returns the embedding array', async () => {
    const mockEmbedding = Array.from({ length: 512 }, () => Math.random())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: mockEmbedding })
    }))

    const result = await embed({ url: 'https://example.com/image.jpg' })

    expect(result).toHaveLength(512)
    expect(fetch).toHaveBeenCalledWith(
      'http://clip-service:8000/embed',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sends base64_image field when base64Image input is given', async () => {
    const mockEmbedding = Array.from({ length: 512 }, () => 0)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: mockEmbedding })
    }))

    await embed({ base64Image: 'abc123==' })

    const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(callBody).toEqual({ base64_image: 'abc123==' })
    expect(callBody).not.toHaveProperty('url')
  })

  it('throws with a descriptive error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Could not load image'
    }))

    await expect(embed({ url: 'https://bad-url.com' })).rejects.toThrow('CLIP service error 422')
  })

  it('uses CLIP_SERVICE_URL env var when set', async () => {
    vi.stubEnv('CLIP_SERVICE_URL', 'http://localhost:9999')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: new Array(512).fill(0) })
    }))

    await embed({ url: 'https://example.com/img.jpg' })

    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('localhost:9999')
  })
})

describe('healthCheck', () => {
  it('returns true when the service is healthy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await healthCheck()
    expect(result).toBe(true)
  })

  it('returns false when the service returns a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await healthCheck()
    expect(result).toBe(false)
  })

  it('returns false when fetch throws (service unreachable)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    const result = await healthCheck()
    expect(result).toBe(false)
  })
})
