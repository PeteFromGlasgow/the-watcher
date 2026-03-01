import { embed } from '@watcher/embedding-client'
import { findSimilarImages } from '@watcher/db'
import type { Knex } from 'knex'

export interface DeduplicationResult {
  isDuplicate: boolean
  duplicateOf: string | null // listing.id of the original if duplicate
  embedding: number[] | null // The computed embedding (store for future queries)
}

export async function checkDuplicate(
  listingId: string,
  imageUrls: string[],
  similarityThreshold: number,
  knex: Knex
): Promise<DeduplicationResult> {
  if (imageUrls.length === 0) {
    return { isDuplicate: false, duplicateOf: null, embedding: null }
  }

  const primaryImageUrl = imageUrls[0]

  let embedding: number[]
  try {
    embedding = await embed({ url: primaryImageUrl })
  } catch (err) {
    console.warn(`Failed to embed image for listing ${listingId}: ${err}`)
    return { isDuplicate: false, duplicateOf: null, embedding: null }
  }

  // Store the embedding on the listing_images record
  await knex('listing_images')
    .where({ listing_id: listingId })
    .whereNotNull('url')
    .limit(1)
    .update({ embedding: JSON.stringify(embedding) })

  // Search for similar images in previously processed listings
  const similar = await findSimilarImages(knex, embedding, similarityThreshold, 1)

  if (similar.length > 0 && similar[0].listing_id !== listingId) {
    return {
      isDuplicate: true,
      duplicateOf: similar[0].listing_id,
      embedding
    }
  }

  return { isDuplicate: false, duplicateOf: null, embedding }
}
