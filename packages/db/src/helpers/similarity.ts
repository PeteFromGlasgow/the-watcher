import type { Knex } from 'knex'

/**
 * Adds a cosine similarity filter to a query builder for listing_images.
 * Uses the pgvector <=> operator (cosine distance).
 *
 * @param qb - Knex query builder targeting listing_images
 * @param embedding - Query embedding as an array of 512 floats
 * @param limit - Maximum number of results
 */
export function similarListingImages(
  qb: Knex.QueryBuilder,
  embedding: number[],
  limit = 10
) {
  const vectorLiteral = `[${embedding.join(',')}]`
  return qb
    .orderByRaw('embedding <=> ?::vector', [vectorLiteral])
    .limit(limit)
}
