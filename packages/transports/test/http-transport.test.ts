import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HtmlTransportResult } from '@watcher/shared-logic'
import { HttpTransport } from '../src/http-transport.js'

const transport = new HttpTransport()

function mockFetch(status: number, body: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 403 ? 'Forbidden' : 'Error',
    text: () => Promise.resolve(body)
  }))
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('HttpTransport', () => {
  it('has name "http"', () => {
    expect(transport.name).toBe('http')
  })

  describe('successful fetch', () => {
    it('returns html and transportUsed on success', async () => {
      mockFetch(200, '<html><body>Hello</body></html>')

      const result = await transport.execute({ url: 'https://example.com' }) as HtmlTransportResult

      expect(result.html).toBe('<html><body>Hello</body></html>')
      expect(result.transportUsed).toBe('http')
    })

    it('sends default User-Agent header', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('<html/>')
      })
      vi.stubGlobal('fetch', fetchMock)

      await transport.execute({ url: 'https://example.com' })

      expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
        headers: expect.objectContaining({ 'User-Agent': 'Mozilla/5.0 (compatible; Watcher/1.0)' })
      })
    })

    it('merges extra headers from context options', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('<html/>')
      })
      vi.stubGlobal('fetch', fetchMock)

      await transport.execute({
        url: 'https://example.com',
        options: { headers: { 'Accept-Language': 'en-GB' } }
      })

      expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
        headers: expect.objectContaining({ 'Accept-Language': 'en-GB' })
      })
    })

    it('sets Cookie header when cookieHeader is provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('<html/>')
      })
      vi.stubGlobal('fetch', fetchMock)

      await transport.execute({ url: 'https://example.com', cookieHeader: 'session=abc123' })

      expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
        headers: expect.objectContaining({ Cookie: 'session=abc123' })
      })
    })
  })

  describe('HTTP error responses', () => {
    it('throws on 403 response', async () => {
      mockFetch(403, 'Forbidden')

      await expect(transport.execute({ url: 'https://example.com/protected' })).rejects.toThrow(
        'HTTP 403 Forbidden for https://example.com/protected'
      )
    })

    it('throws on 500 response', async () => {
      mockFetch(500, 'Internal Server Error')

      await expect(transport.execute({ url: 'https://example.com' })).rejects.toThrow(
        'HTTP 500'
      )
    })
  })

  describe('CAPTCHA / bot detection', () => {
    it('throws when page contains cf-challenge-running', async () => {
      mockFetch(200, '<html><div class="cf-challenge-running">...</div></html>')

      await expect(transport.execute({ url: 'https://example.com' })).rejects.toThrow(
        'CAPTCHA or bot challenge detected at https://example.com'
      )
    })

    it('throws when page contains "Checking your browser"', async () => {
      mockFetch(200, '<html><p>Checking your browser before accessing</p></html>')

      await expect(transport.execute({ url: 'https://example.com' })).rejects.toThrow(
        'CAPTCHA or bot challenge detected at https://example.com'
      )
    })

    it('throws when page contains g-recaptcha', async () => {
      mockFetch(200, '<html><div class="g-recaptcha" data-sitekey="xyz"></div></html>')

      await expect(transport.execute({ url: 'https://example.com' })).rejects.toThrow(
        'CAPTCHA or bot challenge detected at https://example.com'
      )
    })
  })
})
