import type { Knex } from 'knex'

/**
 * Check if a notification has already been sent for this listing+watch+notifier combination.
 * Returns true if a sent record already exists (i.e. should skip sending).
 * A failed record returns false, allowing retry on the next run.
 */
export async function isAlreadyNotified(
  listingId: string,
  watchId: string,
  notifierName: string,
  knex: Knex
): Promise<boolean> {
  const existing = await knex('notification_log')
    .where({
      listing_id: listingId,
      watch_id: watchId,
      notifier: notifierName,
      status: 'sent'
    })
    .first()

  return existing !== undefined
}

/**
 * Record a notification dispatch (success or failure) in notification_log.
 * Uses onConflict().ignore() to handle race conditions between concurrent runs.
 */
export async function recordNotification(
  listingId: string,
  watchId: string,
  notifierName: string,
  status: 'sent' | 'failed',
  error: string | null,
  knex: Knex
): Promise<void> {
  await knex('notification_log')
    .insert({
      id: crypto.randomUUID(),
      listing_id: listingId,
      watch_id: watchId,
      notifier: notifierName,
      sent_at: new Date(),
      status,
      error,
      created_at: new Date()
    })
    .onConflict(['listing_id', 'watch_id', 'notifier'])
    .ignore()
}
