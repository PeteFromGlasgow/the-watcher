import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDuplicate } from '../src/deduplication.js'
import type { Knex } from 'knex'

// Mock the external dependencies
vi.mock('@watcher/embedding-client', () => ({
  embed: vi.fn()
}))

vi.mock('@watcher/db', () => ({
  findSimilarImages: vi.fn()
}))

import { embed } from '@watcher/embedding-client'
import { findSimilarImages } from '@watcher/db'

const mockEmbedding = Array.from({ length: 512 }, (_, i) => i / 512)

function makeKnex(updateResult = 1, _findResult: unknown[] = []) {
  const limit = vi.fn().mockReturnThis()
  const whereNotNull = vi.fn().mockReturnThis()
  const where = vi.fn().mockReturnThis()
  const update = vi.fn().mockResolvedValue(updateResult)

  const knex = vi.fn().mockReturnValue({ where, whereNotNull, limit, update }) as unknown as Knex
  return { knex, update }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(embed).mockResolvedValue(mockEmbedding)
  vi.mocked(findSimilarImages).mockResolvedValue([])
})

describe('checkDuplicate', () => {
  it('returns not-duplicate when no similar images exist', async () => {
    const { knex } = makeKnex()
    vi.mocked(findSimilarImages).mockResolvedValue([])

    const result = await checkDuplicate('listing-1', ['https://example.com/img.jpg'], 0.85, knex)

    expect(result.isDuplicate).toBe(false)
    expect(result.duplicateOf).toBeNull()
    expect(result.embedding).toEqual(mockEmbedding)
  })

  it('returns isDuplicate:true when a similar image from a different listing exists', async () => {
    const { knex } = makeKnex()
    vi.mocked(findSimilarImages).mockResolvedValue([
      { id: 'img-99', listing_id: 'listing-original', url: 'https://example.com/orig.jpg', storage_path: '/data/images/orig.jpg' }
    ])

    const result = await checkDuplicate('listing-new', ['https://example.com/new.jpg'], 0.85, knex)

    expect(result.isDuplicate).toBe(true)
    expect(result.duplicateOf).toBe('listing-original')
  })

  it('does not flag as duplicate when the similar image belongs to the same listing', async () => {
    const { knex } = makeKnex()
    vi.mocked(findSimilarImages).mockResolvedValue([
      { id: 'img-1', listing_id: 'listing-1', url: 'https://example.com/img.jpg', storage_path: '/data/images/img.jpg' }
    ])

    const result = await checkDuplicate('listing-1', ['https://example.com/img.jpg'], 0.85, knex)

    expect(result.isDuplicate).toBe(false)
  })

  it('returns not-duplicate and skips dedup when imageUrls is empty', async () => {
    const { knex } = makeKnex()
    const result = await checkDuplicate('listing-1', [], 0.85, knex)

    expect(result.isDuplicate).toBe(false)
    expect(result.embedding).toBeNull()
    expect(embed).not.toHaveBeenCalled()
  })

  it('returns not-duplicate when embed() fails (does not throw)', async () => {
    const { knex } = makeKnex()
    vi.mocked(embed).mockRejectedValue(new Error('CLIP service unavailable'))

    const result = await checkDuplicate('listing-1', ['https://example.com/img.jpg'], 0.85, knex)

    expect(result.isDuplicate).toBe(false)
    expect(result.embedding).toBeNull()
  })

  it('stores the embedding on the listing_images record', async () => {
    const { knex, update } = makeKnex()
    vi.mocked(findSimilarImages).mockResolvedValue([])

    await checkDuplicate('listing-1', ['https://example.com/img.jpg'], 0.85, knex)

    expect(update).toHaveBeenCalledWith({ embedding: JSON.stringify(mockEmbedding) })
  })
})
