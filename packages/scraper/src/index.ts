import { TransportResolver, HttpTransport, PlaywrightTransport, FlareSolverrTransport, BrightDataTransport } from '@watcher/transports'
import type { Transport } from '@watcher/transports'
import { adapterRegistry } from '@watcher/adapters'
import type { Watch, ScrapedListing } from '@watcher/shared-logic'

const defaultTransportMap = new Map<string, Transport>([
  ['http', new HttpTransport()],
  ['playwright', new PlaywrightTransport()],
  ['flaresolverr', new FlareSolverrTransport()],
  ['brightdata', new BrightDataTransport()]
])

export interface ScrapeResult {
  listings: ScrapedListing[]
  transportUsed: string
  durationMs: number
}

export async function runScrape(watch: Watch): Promise<ScrapeResult> {
  const startedAt = Date.now()
  const resolver = new TransportResolver(defaultTransportMap)

  if (!watch.transport) {
    throw new Error(`Watch ${watch.id} has no transport chain configured`)
  }

  if (!watch.url) {
    throw new Error(`Watch ${watch.id} has no url configured`)
  }

  // In K8s, secrets are mounted as env vars by the operator (WCH-36)
  // e.g. WATCHER_SECRET_FACEBOOK_SESSION for secretRef: facebook-session
  const cookieHeader = resolveCookieHeader(watch)

  const transportResult = await resolver.resolve(watch.transport, {
    url: watch.url,
    cookieHeader
  })

  const adapter = adapterRegistry.get(watch.adapter)
  if (!adapter) {
    throw new Error(`No adapter registered for: ${watch.adapter}`)
  }

  let listings: ScrapedListing[]
  try {
    listings = await adapter.extract(transportResult, watch)
  } finally {
    if (transportResult.type === 'page') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = transportResult.page as any
      await page.context().browser()?.close()
    }
  }

  return {
    listings,
    transportUsed: transportResult.transportUsed,
    durationMs: Date.now() - startedAt
  }
}

function resolveCookieHeader(watch: Watch): string | undefined {
  if (!watch.transport) return undefined

  for (const entry of watch.transport.chain) {
    if (entry.secretRef) {
      const envKey = `WATCHER_SECRET_${entry.secretRef.toUpperCase().replace(/-/g, '_')}`
      const val = process.env[envKey]
      if (val) return val
    }
  }
  return undefined
}
