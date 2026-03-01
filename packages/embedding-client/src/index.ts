function clipServiceUrl(): string {
  return process.env['CLIP_SERVICE_URL'] ?? 'http://clip-service:8000'
}

export interface EmbedResult {
  embedding: number[] // 512 floats, unit-normalised
}

/**
 * Get a CLIP embedding for an image.
 * Pass either a public URL or a base64-encoded image string.
 */
export async function embed(input: { url: string } | { base64Image: string }): Promise<number[]> {
  const body = 'url' in input
    ? { url: input.url }
    : { base64_image: input.base64Image }

  const response = await fetch(`${clipServiceUrl()}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`CLIP service error ${response.status}: ${text}`)
  }

  const data = await response.json() as EmbedResult
  return data.embedding
}

/**
 * Check if the CLIP service is healthy.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${clipServiceUrl()}/health`)
    return response.ok
  } catch {
    return false
  }
}
