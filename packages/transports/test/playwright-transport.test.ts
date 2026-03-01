import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PageTransportResult } from '@watcher/shared-logic'
import { PlaywrightTransport } from '../src/playwright-transport.js'

const { mockPage, mockBrowserContext, mockBrowser } = vi.hoisted(() => {
  const mockPage = {
    goto: vi.fn(),
    content: vi.fn()
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
    launch: vi.fn().mockResolvedValue(mockBrowser)
  }
}))

const transport = new PlaywrightTransport()

const okResponse = { ok: () => true, status: () => 200 }

beforeEach(() => {
  vi.clearAllMocks()
  mockBrowser.newContext.mockResolvedValue(mockBrowserContext)
  mockBrowserContext.newPage.mockResolvedValue(mockPage)
})

describe('PlaywrightTransport', () => {
  it('has name "playwright"', () => {
    expect(transport.name).toBe('playwright')
  })

  describe('successful navigation', () => {
    it('returns page and transportUsed on success', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html><body>Listings here</body></html>')

      const result = await transport.execute({ url: 'https://example.com' }) as PageTransportResult

      expect(result.type).toBe('page')
      expect(result.page).toBe(mockPage)
      expect(result.transportUsed).toBe('playwright')

      // Browser is NOT closed on success — caller is responsible
      expect(mockBrowser.close).not.toHaveBeenCalled()
    })

    it('launches headless chromium', async () => {
      const { chromium } = await import('playwright')
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html/>')

      await transport.execute({ url: 'https://example.com' })

      expect(chromium.launch).toHaveBeenCalledWith({ headless: true })
    })

    it('sets a user agent on the browser context', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html/>')

      await transport.execute({ url: 'https://example.com' })

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: expect.any(String) })
      )
    })

    it('navigates with networkidle and 30s timeout', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html/>')

      await transport.execute({ url: 'https://example.com' })

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      })
    })
  })

  describe('cookie injection', () => {
    it('adds cookies to browser context when cookieHeader is provided', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html/>')

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
      mockPage.content.mockResolvedValue('<html/>')

      await transport.execute({ url: 'https://example.com' })

      expect(mockBrowserContext.addCookies).not.toHaveBeenCalled()
    })

    it('handles cookie values containing "="', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html/>')

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
      ).rejects.toThrow('Navigation failed: 403 for https://example.com/protected')

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('throws and closes browser when goto returns null', async () => {
      mockPage.goto.mockResolvedValue(null)

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('Navigation failed')

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

  describe('CAPTCHA / bot detection', () => {
    it('throws and closes browser on cf-challenge-running content', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html><div class="cf-challenge-running"></div></html>')

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('Bot challenge or login wall detected at https://example.com')

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('throws and closes browser on g-recaptcha content', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html><div class="g-recaptcha" data-sitekey="xyz"></div></html>')

      await expect(
        transport.execute({ url: 'https://example.com' })
      ).rejects.toThrow('Bot challenge or login wall detected at https://example.com')

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('throws and closes browser on Facebook login wall', async () => {
      mockPage.goto.mockResolvedValue(okResponse)
      mockPage.content.mockResolvedValue('<html><div id="login">Log in</div><span>facebook.com</span></html>')

      await expect(
        transport.execute({ url: 'https://facebook.com/marketplace' })
      ).rejects.toThrow('Bot challenge or login wall detected at https://facebook.com/marketplace')

      expect(mockBrowser.close).toHaveBeenCalled()
    })
  })
})
