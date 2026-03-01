import type { Knex } from 'knex'
import type { PipelineResult, ScrapedListing, Watch } from '@watcher/shared-logic'
import {
  TransportResolver,
  HttpTransport,
  PlaywrightTransport,
  BrightDataTransport,
  FlareSolverrTransport,
  type Transport
} from '@watcher/transports'
import { adapterRegistry } from '@watcher/adapters'
import { getKnex } from '@watcher/db'
import { enrichPricing } from './price-extraction.js'
import { downloadAndStoreImages } from './image-download.js'
import { checkDuplicate } from './deduplication.js'
import { runLlmAnalysis } from './llm-analysis.js'

export interface RunWatchDeps {
  knex?: Knex
  resolver?: TransportResolver
  registry?: typeof adapterRegistry
}

export function createDefaultResolver(): TransportResolver {
  const transports = new Map<string, Transport>([
    ['http', new HttpTransport()],
    ['playwright', new PlaywrightTransport()],
    ['brightdata', new BrightDataTransport()],
    ['flaresolverr', new FlareSolverrTransport()]
  ])
  return new TransportResolver(transports)
}

function passesFilters(listing: ScrapedListing, watch: Watch): boolean {
  if (!watch.filters) return true
  const { priceMin, priceMax, keywords } = watch.filters
  if (priceMin !== undefined && listing.extractedPrice !== null && listing.extractedPrice < priceMin) return false
  if (priceMax !== undefined && listing.extractedPrice !== null && listing.extractedPrice > priceMax) return false
  const text = `${listing.title} ${listing.description ?? ''}`.toLowerCase()
  if (keywords.include.length > 0 && !keywords.include.some(kw => text.includes(kw.toLowerCase()))) return false
  if (keywords.exclude.some(kw => text.includes(kw.toLowerCase()))) return false
  return true
}

export async function runWatch(watchId: string, deps: RunWatchDeps = {}): Promise<PipelineResult> {
  const knex = deps.knex ?? getKnex()
  const resolver = deps.resolver ?? createDefaultResolver()
  const registry = deps.registry ?? adapterRegistry
  const runId = crypto.randomUUID()
  const startedAt = new Date()
  const errors: string[] = []

  const watch = await knex('watches').where({ id: watchId }).first() as Watch | undefined
  if (!watch) throw new Error(`Watch not found: ${watchId}`)

  let scrapedListings: ScrapedListing[] = []
  let transportUsed: string | null = null

  if (watch.transport?.chain?.length) {
    try {
      const context = { url: watch.url ?? '', options: {} }
      const result = await resolver.resolve(watch.transport, context)
      transportUsed = result.transportUsed ?? null

      const adapter = registry.get(watch.adapter)
      if (!adapter) throw new Error(`Unknown adapter: ${watch.adapter}`)

      scrapedListings = await adapter.extract(result, watch)

      if (result.type === 'page') await result.page.close()
    } catch (err) {
      errors.push(`Scrape failed: ${err}`)
    }
  }

  let newListings = 0
  let duplicatesSkipped = 0
  const notificationsSent = 0

  for (const raw of scrapedListings) {
    try {
      const listing = await enrichPricing(raw)

      if (!passesFilters(listing, watch)) continue

      const now = new Date().toISOString()
      await knex('listings').insert({
        id: listing.id,
        watch_id: watchId,
        external_id: listing.id,
        url: listing.sourceUrl ?? '',
        title: listing.title,
        price: listing.extractedPrice,
        currency: listing.currency,
        location: null,
        description: listing.description,
        attributes: JSON.stringify(listing.metadata),
        first_seen_at: now,
        last_seen_at: now
      }).onConflict(['watch_id', 'external_id']).ignore()

      await downloadAndStoreImages(listing.id, listing.images, knex)

      const { isDuplicate } = await checkDuplicate(
        listing.id, listing.images, watch.similarityThreshold ?? 0.85, knex
      )

      if (isDuplicate) {
        duplicatesSkipped++
        continue
      }

      await runLlmAnalysis(listing, watch)

      // TODO(WCH-29): send notifications via configured notifiers

      newListings++
    } catch (err) {
      errors.push(`Listing ${raw.id} failed: ${err}`)
    }
  }

  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()

  await knex('run_log').insert({
    watch_id: watchId,
    status: errors.length > 0 ? 'error' : (newListings > 0 ? 'ok' : 'no_change'),
    new_listings_count: newListings,
    error: errors.length > 0 ? errors.join('\n') : null,
    duration_ms: durationMs
  })

  return {
    watchId,
    runId,
    startedAt,
    completedAt,
    transportUsed,
    listingsFound: scrapedListings.length,
    newListings,
    duplicatesSkipped,
    notificationsSent,
    errors
  }
}
