import OpenAI from 'openai'
import type { ScrapedListing } from '@watcher/shared-logic'

const PRICE_PATTERNS = [
  /£\s*([\d,]+(?:\.\d{2})?)/,
  /\$\s*([\d,]+(?:\.\d{2})?)/,
  /€\s*([\d,]+(?:\.\d{2})?)/,
  /([\d,]+(?:\.\d{2}?))\s*(?:gbp|usd|eur)/i,
  /(\d[\d,]*)\s*(?:ono|o\.n\.o|or nearest offer)/i
]

function detectCurrency(text: string): string {
  if (text.includes('$')) return 'USD'
  if (text.includes('€')) return 'EUR'
  return 'GBP'
}

export function extractPrice(rawPrice: string | null, description: string | null): {
  extractedPrice: number | null
  currency: string | null
} {
  const candidates = [rawPrice, description].filter(Boolean).join(' ')
  if (!candidates) return { extractedPrice: null, currency: null }

  for (const pattern of PRICE_PATTERNS) {
    const match = candidates.match(pattern)
    if (match) {
      const numeric = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(numeric) && numeric > 0) {
        return { extractedPrice: numeric, currency: detectCurrency(candidates) }
      }
    }
  }

  return { extractedPrice: null, currency: null }
}

async function extractPriceWithLlm(rawPrice: string | null, description: string | null): Promise<number | null> {
  const text = [rawPrice, description].filter(Boolean).join('\n')
  if (!text) return null

  const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Extract the asking price as a plain number (no currency symbol, no commas) from this listing text. Reply with ONLY the number or "null" if no price is found.\n\n${text}`
    }],
    max_tokens: 20
  })

  const raw = response.choices[0]?.message?.content?.trim()
  if (!raw || raw === 'null') return null
  const parsed = parseFloat(raw)
  return isNaN(parsed) ? null : parsed
}

export async function enrichPricing(listing: ScrapedListing): Promise<ScrapedListing> {
  const { extractedPrice, currency } = extractPrice(listing.rawPrice, listing.description)

  if (extractedPrice !== null) {
    return { ...listing, extractedPrice, currency }
  }

  if (!process.env['OPENAI_API_KEY']) {
    return listing
  }

  const llmPrice = await extractPriceWithLlm(listing.rawPrice, listing.description)
  return { ...listing, extractedPrice: llmPrice, currency: llmPrice ? 'GBP' : null }
}
