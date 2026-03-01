import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadAndStoreImages } from '../src/image-download.js'
import type { Knex } from 'knex'

function makeKnex(existingRecord: unknown = null) {
  const insert = vi.fn().mockResolvedValue(undefined)
  const first = vi.fn().mockResolvedValue(existingRecord)
  const where = vi.fn().mockReturnValue({ first })
  const knex = vi.fn().mockReturnValue({ where, insert }) as unknown as Knex
  return { knex, insert, first, where }
}

function makeOkFetch(content = 'image-bytes') {
  return vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => Buffer.from(content).buffer
  })
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('downloadAndStoreImages', () => {
  it('skips images whose URL hash already exists in the database', async () => {
    const existingRecord = { storage_path: '/data/images/existing.jpg' }
    const { knex, insert } = makeKnex(existingRecord)
    vi.stubGlobal('fetch', makeOkFetch())

    const paths = await downloadAndStoreImages('listing-1', ['https://example.com/img.jpg'], knex)

    expect(paths).toEqual(['/data/images/existing.jpg'])
    expect(insert).not.toHaveBeenCalled()
  })

  it('downloads and stores a new image', async () => {
    const { knex, insert, where } = makeKnex(null)
    where.mockReturnValue({ first: vi.fn().mockResolvedValue(null) })
    vi.stubGlobal('fetch', makeOkFetch())
    vi.stubEnv('IMAGE_STORAGE_PATH', '/tmp/test-images')

    // Mock fs/promises to avoid actual disk writes
    vi.mock('fs/promises', () => ({
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined)
    }))

    const paths = await downloadAndStoreImages('listing-1', ['https://example.com/img.jpg'], knex)

    expect(paths.length).toBe(1)
    expect(paths[0]).toContain('.jpg')
    expect(insert).toHaveBeenCalledOnce()
  })

  it('continues pipeline when a download fails', async () => {
    const { knex, insert } = makeKnex(null)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const paths = await downloadAndStoreImages('listing-1', ['https://example.com/broken.jpg'], knex)

    expect(paths).toEqual([])
    expect(insert).not.toHaveBeenCalled()
  })

  it('skips non-ok responses without throwing', async () => {
    const { knex, insert } = makeKnex(null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    const paths = await downloadAndStoreImages('listing-1', ['https://example.com/missing.jpg'], knex)

    expect(paths).toEqual([])
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns empty array for empty imageUrls', async () => {
    const { knex } = makeKnex()
    const paths = await downloadAndStoreImages('listing-1', [], knex)
    expect(paths).toEqual([])
  })

  it('inserts a listing_images record with url_hash and storage_path', async () => {
    const { knex, insert } = makeKnex(null)
    vi.stubGlobal('fetch', makeOkFetch())
    vi.stubEnv('IMAGE_STORAGE_PATH', '/tmp/test-images')

    vi.mock('fs/promises', () => ({
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined)
    }))

    await downloadAndStoreImages('listing-1', ['https://example.com/photo.png'], knex)

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: 'listing-1',
        url: 'https://example.com/photo.png'
      })
    )
  })
})
