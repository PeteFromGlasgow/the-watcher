import type { Adapter } from '../adapter.js'
import type { ScrapedListing, TransportResult, Watch } from '@watcher/shared-logic'

const SYSTEM_PROMPT = `You are a web scraping assistant. Given the text content of a web page, extract all product or classified ad listings visible on the page. Return a JSON array of objects. Each object must have:
- title: string (listing title)
- rawPrice: string | null (price as it appears on the page, or null)
- sourceUrl: string | null (URL of the individual listing if present, or null)
- description: string | null (short description if available, or null)
- images: string[] (image URLs if present, else [])

Return ONLY the JSON array, no explanation.`

// Environment variables:
//   LLM_ADAPTER_PROVIDER  — anthropic | openai (default: anthropic)
//   LLM_ADAPTER_MODEL     — model string for the chosen provider (default: claude-haiku-4-5-20251001)
//   LLM_ADAPTER_API_KEY   — API key (required)
//   LLM_ADAPTER_MAX_TOKENS — max tokens for the response (default: 2048)
export class LlmAdapter implements Adapter {
  readonly name = 'llm'

  async extract(result: TransportResult, _watch: Watch): Promise<ScrapedListing[]> {
    let pageText: string

    if (result.type === 'html') {
      pageText = result.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    } else {
      pageText = await result.page.evaluate(() => document.body.innerText)
    }

    const apiKey = process.env['LLM_ADAPTER_API_KEY']
    const provider = process.env['LLM_ADAPTER_PROVIDER'] ?? 'anthropic'
    const model = process.env['LLM_ADAPTER_MODEL'] ?? 'claude-haiku-4-5-20251001'
    const maxTokens = parseInt(process.env['LLM_ADAPTER_MAX_TOKENS'] ?? '2048', 10)

    if (!apiKey) throw new Error('LLM_ADAPTER_API_KEY is not set')

    let rawJson: string

    try {
      if (provider === 'anthropic') {
        rawJson = await this.callAnthropic(apiKey, model, maxTokens, pageText)
      } else {
        rawJson = await this.callOpenAI(apiKey, model, maxTokens, pageText)
      }
    } catch {
      return []
    }

    let extracted: unknown[]
    try {
      const parsed = JSON.parse(rawJson)
      extracted = Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }

    return extracted.map((item) => {
      const entry = item as Record<string, unknown>
      return {
        id: crypto.randomUUID(),
        adapterName: 'llm',
        title: typeof entry['title'] === 'string' ? entry['title'] : 'Unknown',
        description: typeof entry['description'] === 'string' ? entry['description'] : null,
        rawPrice: typeof entry['rawPrice'] === 'string' ? entry['rawPrice'] : null,
        extractedPrice: null,
        currency: null,
        sourceUrl: typeof entry['sourceUrl'] === 'string' ? entry['sourceUrl'] : null,
        images: Array.isArray(entry['images']) ? entry['images'] as string[] : [],
        metadata: {},
        scrapedAt: new Date(),
        duplicateOf: null,
        llmAnalysis: null
      }
    })
  }

  private async callAnthropic(apiKey: string, model: string, maxTokens: number, text: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.slice(0, 12000) }]
      })
    })
    const data = await res.json() as { content?: Array<{ text: string }> }
    return data.content?.[0]?.text ?? '[]'
  }

  private async callOpenAI(apiKey: string, model: string, maxTokens: number, text: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, 12000) }
        ]
      })
    })
    const data = await res.json() as { choices?: Array<{ message: { content: string } }> }
    return data.choices?.[0]?.message?.content ?? '[]'
  }
}
