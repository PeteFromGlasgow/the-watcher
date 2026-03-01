import OpenAI from 'openai'
import type { ScrapedListing, Watch } from '@watcher/shared-logic'

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
}

export async function runLlmAnalysis(
  listing: ScrapedListing,
  watch: Watch
): Promise<Record<string, unknown> | null> {
  if (!watch.llmQuestions?.length) return null
  if (!process.env['OPENAI_API_KEY']) return null
  if (!listing.images?.length) return null

  const questionsText = watch.llmQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')

  const imageContent = listing.images.slice(0, 4).map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'low' as const }
  }))

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
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
  } catch (err) {
    console.warn(`LLM analysis failed for listing ${listing.id}: ${err}`)
    return null
  }
}
