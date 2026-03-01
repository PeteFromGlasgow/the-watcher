import knexFactory from 'knex'
import type { Knex } from 'knex'
import { similarListingImages } from './helpers/similarity.js'

export { similarListingImages }

let _knex: Knex | null = null

/** Returns a shared Knex instance configured from DATABASE_URL. */
export function getKnex(): Knex {
  if (!_knex) {
    _knex = knexFactory({ client: 'pg', connection: process.env['DATABASE_URL'] })
  }
  return _knex
}

/**
 * Find listing_images records whose embeddings are within the given cosine
 * similarity threshold of the query embedding.
 *
 * @param knex - Knex instance
 * @param embedding - 512-dimension query vector
 * @param similarityThreshold - Minimum similarity (0–1). Converted to max cosine distance internally.
 * @param limit - Maximum results to return
 */
export async function findSimilarImages(
  knex: Knex,
  embedding: number[],
  similarityThreshold: number,
  limit = 10
): Promise<Array<{ id: string, listing_id: string, url: string, storage_path: string }>> {
  const maxDistance = 1 - similarityThreshold
  const vectorLiteral = `[${embedding.join(',')}]`

  return knex('listing_images')
    .whereNotNull('embedding')
    .whereRaw('embedding <=> ?::vector <= ?', [vectorLiteral, maxDistance])
    .orderByRaw('embedding <=> ?::vector', [vectorLiteral])
    .limit(limit)
    .select('id', 'listing_id', 'url', 'storage_path')
}
