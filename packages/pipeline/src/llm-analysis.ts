import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

async function fetchImageAsBase64(url: string): Promise<{ data: string, mimeType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    return {
      data: Buffer.from(buffer).toString('base64'),
      mimeType: contentType
    }
  } catch {
    return null
  }
}

async function runOpenAiAnalysis(
  listing: ScrapedListing,
  watch: Watch,
  questionsText: string
): Promise<Record<string, unknown> | null> {
  const config = watch.llmConfig
  const apiKey = config?.apiKey || process.env['OPENAI_API_KEY']
  if (!apiKey) return null

  const openai = new OpenAI({
    apiKey,
    baseURL: config?.baseURL
  })

  const imageContent = listing.images.slice(0, 4).map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'low' as const }
  }))

  const response = await openai.chat.completions.create({
    model: config?.model || 'gpt-4o',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are analysing a classified ad listing image. Answer each question with a brief, direct answer. Format your response as JSON where each key is the question number and the value is the answer.\n\nQuestions:\n${questionsText}\n\nRespond ONLY with a JSON object, no other text.`
        },
        ...imageContent
      ]
    }]
  })

  const raw = response.choices[0]?.message?.content?.trim()
  if (!raw) return null

  const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned) as Record<string, unknown>
}

async function runGoogleAnalysis(
  listing: ScrapedListing,
  watch: Watch,
  questionsText: string
): Promise<Record<string, unknown> | null> {
  const config = watch.llmConfig
  const apiKey = config?.apiKey || process.env['GOOGLE_API_KEY']
  if (!apiKey) return null

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: config?.model || 'gemini-1.5-flash'
  })

  const prompt = `You are analysing a classified ad listing image. Answer each question with a brief, direct answer. Format your response as JSON where each key is the question number and the value is the answer.\n\nQuestions:\n${questionsText}\n\nRespond ONLY with a JSON object, no other text.`

  const images = await Promise.all(
    listing.images.slice(0, 4).map(url => fetchImageAsBase64(url))
  )
  const validImages = images.filter((img): img is { data: string, mimeType: string } => img !== null)

  const result = await model.generateContent([
    prompt,
    ...validImages.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType
      }
    }))
  ])

  const raw = result.response.text().trim()
  if (!raw) return null

  const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned) as Record<string, unknown>
}

export async function runLlmAnalysis(
  listing: ScrapedListing,
  watch: Watch
): Promise<Record<string, unknown> | null> {
  if (!watch.llmQuestions?.length) return null
  if (!listing.images?.length) return null

  const questionsText = watch.llmQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')

  const provider = watch.llmConfig?.provider || 'openai'

  try {
    if (provider === 'google') {
      return await runGoogleAnalysis(listing, watch, questionsText)
    } else {
      return await runOpenAiAnalysis(listing, watch, questionsText)
    }
  } catch (err) {
    console.warn(`LLM analysis failed for listing ${listing.id} (${provider}): ${err}`)
    return null
  }
}
