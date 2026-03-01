import { createHash } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Knex } from 'knex'

export async function downloadAndStoreImages(
  listingId: string,
  imageUrls: string[],
  knex: Knex
): Promise<string[]> {
  const storedPaths: string[] = []

  for (const url of imageUrls) {
    const urlHash = createHash('sha256').update(url).digest('hex')

    const existing = await knex('listing_images').where({ url_hash: urlHash }).first()
    if (existing) {
      storedPaths.push(existing.storage_path)
      continue
    }

    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const buffer = Buffer.from(await response.arrayBuffer())
      const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg'
      const filename = `${urlHash}.${ext}`
      const storagePath = await storeImage(filename, buffer)

      await knex('listing_images').insert({
        id: crypto.randomUUID(),
        listing_id: listingId,
        url,
        url_hash: urlHash,
        storage_path: storagePath,
        created_at: new Date()
      })

      storedPaths.push(storagePath)
    } catch {
      // A failed image download should not fail the pipeline
    }
  }

  return storedPaths
}

async function storeImage(filename: string, buffer: Buffer): Promise<string> {
  if (process.env['IMAGE_STORAGE_TYPE'] === 's3') {
    return storeImageS3(filename, buffer)
  }

  const basePath = process.env['IMAGE_STORAGE_PATH'] ?? '/data/images'
  await mkdir(basePath, { recursive: true })
  const fullPath = join(basePath, filename)
  await writeFile(fullPath, buffer)
  return fullPath
}

async function storeImageS3(filename: string, buffer: Buffer): Promise<string> {
  const bucket = process.env['S3_BUCKET']
  const endpoint = process.env['S3_ENDPOINT']
  const accessKey = process.env['S3_ACCESS_KEY']
  const secretKey = process.env['S3_SECRET_KEY']

  if (!bucket || !endpoint || !accessKey || !secretKey) {
    throw new Error('S3 environment variables not set (S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY)')
  }

  // Dynamic import to keep @aws-sdk/client-s3 an optional dependency
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    endpoint,
    region: 'auto',
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
  })

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer
  }))

  return `s3://${bucket}/${filename}`
}
