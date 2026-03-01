import { describe, it, expect, vi } from 'vitest'
import type { TransportChainConfig } from '@watcher/shared-logic'
import type { Transport, TransportContext } from '../src/transport.js'
import { TransportResolver } from '../src/resolver.js'

const context: TransportContext = { url: 'https://example.com' }

function makeTransport(name: string, html: string): Transport {
  return {
    name,
    execute: vi.fn().mockResolvedValue({ html, transportUsed: name })
  }
}

function makeFailingTransport(name: string, message: string): Transport {
  return {
    name,
    execute: vi.fn().mockRejectedValue(new Error(message))
  }
}

describe('TransportResolver', () => {
  describe('single transport', () => {
    it('returns result when transport succeeds', async () => {
      const transport = makeTransport('http', '<html>ok</html>')
      const resolver = new TransportResolver(new Map([['http', transport]]))
      const chain: TransportChainConfig = { chain: [{ name: 'http' }] }

      const result = await resolver.resolve(chain, context)

      expect(result.html).toBe('<html>ok</html>')
      expect(result.transportUsed).toBe('http')
    })

    it('throws if the only transport fails', async () => {
      const transport = makeFailingTransport('http', 'connection refused')
      const resolver = new TransportResolver(new Map([['http', transport]]))
      const chain: TransportChainConfig = { chain: [{ name: 'http' }] }

      await expect(resolver.resolve(chain, context)).rejects.toThrow(
        'All transports failed:\nhttp: connection refused'
      )
    })
  })

  describe('chain with two transports', () => {
    it('returns first transport result when it succeeds', async () => {
      const first = makeTransport('http', '<html>first</html>')
      const second = makeTransport('flaresolverr', '<html>second</html>')
      const resolver = new TransportResolver(new Map([
        ['http', first],
        ['flaresolverr', second]
      ]))
      const chain: TransportChainConfig = { chain: [{ name: 'http' }, { name: 'flaresolverr' }] }

      const result = await resolver.resolve(chain, context)

      expect(result.html).toBe('<html>first</html>')
      expect(result.transportUsed).toBe('http')
      expect(second.execute).not.toHaveBeenCalled()
    })

    it('falls back to second transport when first fails', async () => {
      const first = makeFailingTransport('http', 'blocked')
      const second = makeTransport('flaresolverr', '<html>second</html>')
      const resolver = new TransportResolver(new Map([
        ['http', first],
        ['flaresolverr', second]
      ]))
      const chain: TransportChainConfig = { chain: [{ name: 'http' }, { name: 'flaresolverr' }] }

      const result = await resolver.resolve(chain, context)

      expect(result.html).toBe('<html>second</html>')
      expect(result.transportUsed).toBe('flaresolverr')
    })

    it('throws listing all failures when all transports fail', async () => {
      const first = makeFailingTransport('http', 'timeout')
      const second = makeFailingTransport('flaresolverr', 'captcha detected')
      const resolver = new TransportResolver(new Map([
        ['http', first],
        ['flaresolverr', second]
      ]))
      const chain: TransportChainConfig = { chain: [{ name: 'http' }, { name: 'flaresolverr' }] }

      await expect(resolver.resolve(chain, context)).rejects.toThrow(
        'All transports failed:\nhttp: timeout\nflaresolverr: captcha detected'
      )
    })
  })

  describe('resolver configuration', () => {
    it('throws for an unknown transport name', async () => {
      const resolver = new TransportResolver(new Map())
      const chain: TransportChainConfig = { chain: [{ name: 'unknown' }] }

      await expect(resolver.resolve(chain, context)).rejects.toThrow(
        'Unknown transport: unknown'
      )
    })

    it('passes entry options to transport context', async () => {
      const transport = makeTransport('http', '<html/>')
      const resolver = new TransportResolver(new Map([['http', transport]]))
      const options = { timeout: 5000 }
      const chain: TransportChainConfig = { chain: [{ name: 'http', options }] }

      await resolver.resolve(chain, context)

      expect(transport.execute).toHaveBeenCalledWith({ ...context, options })
    })
  })
})
