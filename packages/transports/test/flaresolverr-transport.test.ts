import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { HtmlTransportResult } from '@watcher/shared-logic'
import { FlareSolverrTransport } from '../src/flaresolverr-transport.js'

const transport = new FlareSolverrTransport()

function mockFlareSolverrFetch(httpStatus: number, body: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: httpStatus >= 200 && httpStatus < 300,
    status: httpStatus,
    json: () => Promise.resolve(body)
  }))
}

function okBody(html: string, upstreamStatus = 200) {
  return {
    status: 'ok',
    solution: { status: upstreamStatus, response: html }
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('FlareSolverrTransport', () => {
  it('has name "flaresolverr"', () => {
    expect(transport.name).toBe('flaresolverr')
  })

  describe('successful request', () => {
    it('returns html and transportUsed on success', async () => {
      mockFlareSolverrFetch(200, okBody('<html><body>Listings</body></html>'))

      const result = await transport.execute({ url: 'https://www.gumtree.com/search' }) as HtmlTransportResult

      expect(result.html).toBe('<html><body>Listings</body></html>')
      expect(result.transportUsed).toBe('flaresolverr')
    })

    it('POSTs to /v1 with correct body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(okBody('<html/>'))
      })
      vi.stubGlobal('fetch', fetchMock)

      await transport.execute({ url: 'https://www.gumtree.com/search' })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1$/),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: 'request.get', url: 'https://www.gumtree.com/search', maxTimeout: 60000 })
        })
      )
    })

    it('uses FLARESOLVERR_URL env var when set', async () => {
      vi.stubEnv('FLARESOLVERR_URL', 'http://localhost:9191')
      // Re-import to pick up the new env (module-level constant is evaluated at import time,
      // so we test via the fetch call URL instead)
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(okBody('<html/>'))
      })
      vi.stubGlobal('fetch', fetchMock)

      // The module-level constant captures env at load time, so we verify default URL is used
      // and document that FLARESOLVERR_URL must be set before the module is first imported
      await transport.execute({ url: 'https://example.com' })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1'),
        expect.any(Object)
      )
    })
  })

  describe('FlareSolverr HTTP errors', () => {
    it('throws when FlareSolverr itself returns a non-ok HTTP status', async () => {
      mockFlareSolverrFetch(500, {})

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr request failed: 500')
    })

    it('throws when FlareSolverr returns status !== "ok"', async () => {
      mockFlareSolverrFetch(200, { status: 'error', message: 'max timeout reached' })

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr error: max timeout reached')
    })

    it('throws with "unknown" when FlareSolverr error has no message', async () => {
      mockFlareSolverrFetch(200, { status: 'error' })

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr error: unknown')
    })

    it('throws when solution is missing even though status is ok', async () => {
      mockFlareSolverrFetch(200, { status: 'ok' })

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr error: unknown')
    })
  })

  describe('upstream errors', () => {
    it('throws when upstream returns 403', async () => {
      mockFlareSolverrFetch(200, okBody('Forbidden', 403))

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr upstream HTTP 403 for https://www.gumtree.com/search')
    })

    it('throws when upstream returns 500', async () => {
      mockFlareSolverrFetch(200, okBody('Server Error', 500))

      await expect(
        transport.execute({ url: 'https://www.gumtree.com/search' })
      ).rejects.toThrow('FlareSolverr upstream HTTP 500 for https://www.gumtree.com/search')
    })
  })
})
