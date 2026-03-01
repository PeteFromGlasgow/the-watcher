import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PageTransportResult } from '@watcher/shared-logic'
import { BrightDataTransport } from '../src/brightdata-transport.js'

const { mockPage, mockBrowserContext, mockBrowser } = vi.hoisted(() => {
  const mockPage = {
    goto: vi.fn()
  }
  const mockBrowserContext = {
    addCookies: vi.fn(),
    newPage: vi.fn().mockResolvedValue(mockPage)
  }
  const mockBrowser = {
    newContext: vi.fn().mockResolvedValue(mockBrowserContext),
    close: vi.fn()
  }
  return { mockPage, mockBrowserContext, mockBrowser }
})

vi.mock('playwright', () => ({
  chromium: {
    connectOverCDP: vi.fn().mockResolvedValue(mockBrowser)
  }
}))

const transport = new BrightDataTransport()

const okResponse = { ok: () => true, status: () => 200 }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('BRIGHTDATA_ENDPOINT', 'wss://brd-customer-test:password@brd.superproxy.io:9222')
  mockBrowser.newContext.mockResolvedValue(mockBrowserContext)
  mockBrowserContext.newPage.mockResolvedValue(mockPage)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('BrightDataTransport', () => {
  it('has name "brightdata"', () => {
    expect(transport.name).toBe('brightdata')
  })

  describe('successful navigation', () => {
    it('returns page and transportUsed on success', async () => {
      mockPage.goto.mockResolvedValue(okResponse)

      const result = await transport.execute({ url: 'https://example.com' }) as PageTransportResult

      expect(result.type).toBe('page')
      expect(result.page).toBe(mockPage)
      expect(result.transportUsed).toBe('brightdata')

      // Browser is NOT closed on success — caller is responsible
      expect(mockBrowser.close).not.toHaveBeenCalled()
    })

    it('connects via CDP using BRIGHTDATA_ENDPOINT', async () => {
      const { chromium } = await import('playwright')
      mockPage.goto.mockResolvedValue(okResponse)

      await transport.execute({ url: 'https://example.com' })

      expect(chromium.connectOverCDP).toHaveBeenCalledWith(
        'wss://brd-customer-test:password@brd.superproxy.io:9222'
      )
    })

    it('navigates with networkidle and 60s timeout', async () => {
      mockPage.goto.mockResolvedValue(okResponse)

      await transport.execute({ url: 'https://example.com' })

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle',
        timeout: 60000
      })
    })
  })

  describe('missing environment variable', () => {
    it('throws when BRIGHTDATA_ENDPOINT is not set', async () => {
      vi.unstubAllEnvs()

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('BRIGHTDATA_ENDPOINT environment variable not set')
    })
  })

  describe('cookie injection', () => {
    it('adds cookies to browser context when cookieHeader is provided', async () => {
      mockPage.goto.mockResolvedValue(okResponse)

      await transport.execute({
        url: 'https://example.com',
        cookieHeader: 'session=abc123; user=pete'
      })

      expect(mockBrowserContext.addCookies).toHaveBeenCalledWith([
        { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        { name: 'user', value: 'pete', domain: 'example.com', path: '/' }
      ])
    })

    it('does not call addCookies when no cookieHeader is provided', async () => {
      mockPage.goto.mockResolvedValue(okResponse)

      await transport.execute({ url: 'https://example.com' })

      expect(mockBrowserContext.addCookies).not.toHaveBeenCalled()
    })

    it('handles cookie values containing "="', async () => {
      mockPage.goto.mockResolvedValue(okResponse)

      await transport.execute({
        url: 'https://example.com',
        cookieHeader: 'token=abc=def=='
      })

      expect(mockBrowserContext.addCookies).toHaveBeenCalledWith([
        { name: 'token', value: 'abc=def==', domain: 'example.com', path: '/' }
      ])
    })
  })

  describe('navigation failure', () => {
    it('throws and closes browser when goto returns a non-ok response', async () => {
      mockPage.goto.mockResolvedValue({ ok: () => false, status: () => 403 })

      await expect(
        transport.execute({ url: 'https://example.com/protected' })
      ).rejects.toThrow('BrightData navigation failed: 403 for https://example.com/protected')

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('throws and closes browser when goto returns null', async () => {
      mockPage.goto.mockResolvedValue(null)

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('BrightData navigation failed')

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('throws and closes browser when goto rejects', async () => {
      mockPage.goto.mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('net::ERR_CONNECTION_REFUSED')

      expect(mockBrowser.close).toHaveBeenCalled()
    })
  })
})
