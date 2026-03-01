import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAlreadyNotified, recordNotification } from '../src/deduplication.js'
import type { Knex } from 'knex'

function makeKnex(firstResult: unknown = undefined) {
  const ignore = vi.fn().mockResolvedValue(undefined)
  const onConflict = vi.fn().mockReturnValue({ ignore })
  const insert = vi.fn().mockReturnValue({ onConflict })
  const first = vi.fn().mockResolvedValue(firstResult)
  const where = vi.fn().mockReturnValue({ first })

  const knex = vi.fn().mockReturnValue({ where, insert }) as unknown as Knex
  return { knex, first, insert, onConflict, ignore, where }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isAlreadyNotified', () => {
  it('returns false when no sent record exists', async () => {
    const { knex } = makeKnex(undefined)
    const result = await isAlreadyNotified('listing-1', 'watch-1', 'ntfy', knex)
    expect(result).toBe(false)
  })

  it('returns true when a sent record exists', async () => {
    const { knex } = makeKnex({ id: 'log-1', status: 'sent' })
    const result = await isAlreadyNotified('listing-1', 'watch-1', 'ntfy', knex)
    expect(result).toBe(true)
  })

  it('returns false for a failed record (allows retry)', async () => {
    // isAlreadyNotified only queries status: 'sent' — so this returns undefined
    const { knex } = makeKnex(undefined)
    const result = await isAlreadyNotified('listing-1', 'watch-1', 'ntfy', knex)
    expect(result).toBe(false)
  })

  it('queries the notification_log table with correct fields', async () => {
    const { knex, where } = makeKnex(undefined)
    await isAlreadyNotified('listing-99', 'watch-42', 'telegram', knex)

    expect(knex).toHaveBeenCalledWith('notification_log')
    expect(where).toHaveBeenCalledWith({
      listing_id: 'listing-99',
      watch_id: 'watch-42',
      notifier: 'telegram',
      status: 'sent'
    })
  })
})

describe('recordNotification', () => {
  it('inserts a sent record with correct fields', async () => {
    const { knex, insert } = makeKnex()
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

    await recordNotification('listing-1', 'watch-1', 'ntfy', 'sent', null, knex)

    expect(knex).toHaveBeenCalledWith('notification_log')
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-uuid',
      listing_id: 'listing-1',
      watch_id: 'watch-1',
      notifier: 'ntfy',
      status: 'sent',
      error: null
    }))

    vi.unstubAllGlobals()
  })

  it('inserts a failed record with error message', async () => {
    const { knex, insert } = makeKnex()

    await recordNotification('listing-1', 'watch-1', 'slack', 'failed', 'timeout', knex)

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      error: 'timeout'
    }))
  })

  it('uses onConflict().ignore() to handle race conditions', async () => {
    const { knex, onConflict, ignore } = makeKnex()

    await recordNotification('listing-1', 'watch-1', 'ntfy', 'sent', null, knex)

    expect(onConflict).toHaveBeenCalledWith(['listing_id', 'watch_id', 'notifier'])
    expect(ignore).toHaveBeenCalled()
  })
})

describe('concurrent multi-notifier dispatch', () => {
  it('checks each notifier independently', async () => {
    // First call (ntfy) returns sent, second (telegram) returns undefined
    const knex = vi.fn()
      .mockReturnValueOnce({
        where: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ status: 'sent' }) })
      })
      .mockReturnValueOnce({
        where: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(undefined) })
      }) as unknown as Knex

    const [ntfyResult, telegramResult] = await Promise.allSettled([
      isAlreadyNotified('listing-1', 'watch-1', 'ntfy', knex),
      isAlreadyNotified('listing-1', 'watch-1', 'telegram', knex)
    ])

    expect(ntfyResult.status === 'fulfilled' && ntfyResult.value).toBe(true)
    expect(telegramResult.status === 'fulfilled' && telegramResult.value).toBe(false)
  })

  it('records failures independently for each notifier', async () => {
    const { knex, insert } = makeKnex()

    await Promise.allSettled([
      recordNotification('listing-1', 'watch-1', 'ntfy', 'sent', null, knex),
      recordNotification('listing-1', 'watch-1', 'telegram', 'failed', 'timeout', knex)
    ])

    expect(insert).toHaveBeenCalledTimes(2)
  })
})
