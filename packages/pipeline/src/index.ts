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
import { createNotifiers, isAlreadyNotified, recordNotification } from '@watcher/notifiers'
import { enrichPricing } from './price-extraction.js'
import { downloadAndStoreImages } from './image-download.js'
import { checkDuplicate } from './deduplication.js'
import { runLlmAnalysis } from './llm-analysis.js'
import { createRunLogger } from './logger.js'

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

  const log = createRunLogger(watchId, runId, watch.adapter)
  log.info({ stage: 'run', transport_chain: watch.transport?.chain }, 'Watch run started')

  let scrapedListings: ScrapedListing[] = []
  let transportUsed: string | null = null

  if (watch.transport?.chain?.length) {
    log.info({ stage: 'scrape', transport_chain: watch.transport.chain }, 'Starting scrape')
    try {
      const context = { url: watch.url ?? '', options: {} }
      const result = await resolver.resolve(watch.transport, context)
      transportUsed = result.transportUsed ?? null

      const adapter = registry.get(watch.adapter)
      if (!adapter) throw new Error(`Unknown adapter: ${watch.adapter}`)

      scrapedListings = await adapter.extract(result, watch)
      log.info({ stage: 'scrape', transport_used: transportUsed, listings_found: scrapedListings.length }, 'Scrape complete')

      if (result.type === 'page') await result.page.close()
    } catch (err) {
      errors.push(`Scrape failed: ${err}`)
      log.error({ stage: 'scrape', err }, 'Scrape failed')
    }
  }

  let newListings = 0
  let duplicatesSkipped = 0
  let notificationsSent = 0

  const notifiers = createNotifiers(watch)

  for (const raw of scrapedListings) {
    const listingLog = log.child({ stage: 'listing', listing_id: raw.id })
    try {
      const listing = await enrichPricing(raw)

      if (!passesFilters(listing, watch)) {
        listingLog.debug('Listing filtered out')
        continue
      }

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
        listing.id, listing.images, watch.similarityThreshold ?? 0.85, knex, log
      )

      if (isDuplicate) {
        duplicatesSkipped++
        listingLog.debug('Duplicate listing skipped')
        continue
      }

      listing.llmAnalysis = await runLlmAnalysis(listing, watch, log)

      if (notifiers.length > 0) {
        // Filter out already-notified channels concurrently
        const dedupeResults = await Promise.allSettled(
          notifiers.map(notifier => isAlreadyNotified(listing.id, watchId, notifier.name, knex))
        )

        const pendingNotifiers = notifiers.filter((_, i) => {
          const result = dedupeResults[i]
          return result.status === 'fulfilled' && result.value === false
        })

        // Dispatch all pending notifiers concurrently
        const sendResults = await Promise.allSettled(
          pendingNotifiers.map(notifier => notifier.send(listing, watch))
        )

        // Record outcomes
        await Promise.allSettled(
          pendingNotifiers.map((notifier, i) => {
            const result = sendResults[i]
            if (result.status === 'fulfilled') {
              notificationsSent++
              listingLog.info({ stage: 'notification', notifier: notifier.name }, 'Notification sent')
              return recordNotification(listing.id, watchId, notifier.name, 'sent', null, knex)
            } else {
              errors.push(`Notifier ${notifier.name} failed: ${result.reason}`)
              listingLog.warn({ stage: 'notification', notifier: notifier.name, err: result.reason }, 'Notification failed')
              return recordNotification(listing.id, watchId, notifier.name, 'failed', String(result.reason), knex)
            }
          })
        )
      }

      newListings++
    } catch (err) {
      errors.push(`Listing ${raw.id} failed: ${err}`)
      listingLog.error({ err }, 'Listing processing failed')
    }
  }

  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()
  const status = errors.length > 0 ? 'error' : (newListings > 0 ? 'ok' : 'no_change')

  await knex('run_log').insert({
    watch_id: watchId,
    status,
    transport_chain: watch.transport ? JSON.stringify(watch.transport) : null,
    transport_used: transportUsed,
    listings_found: scrapedListings.length,
    new_listings_count: newListings,
    duplicate_count: duplicatesSkipped,
    notifications_sent_count: notificationsSent,
    error: errors.length > 0 ? errors.join('\n') : null,
    duration_ms: durationMs
  })

  log.info({
    stage: 'run',
    status,
    transport_used: transportUsed,
    listings_found: scrapedListings.length,
    new_listings: newListings,
    duplicates_skipped: duplicatesSkipped,
    notifications_sent: notificationsSent,
    duration_ms: durationMs
  }, 'Watch run complete')

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
