export interface Listing {
  id: string
  watch_id: string
  external_id: string
  url: string
  title: string
  price: number | null
  currency: string | null
  location: string | null
  description: string | null
  attributes: Record<string, unknown>
  first_seen_at: string
  last_seen_at: string
  created_at: string
  updated_at: string
}

// ScrapedListing is the adapter output type — the raw result of a single scrape run.
// The pipeline (Epic 4) converts these into persisted Listing DB records.
export interface ScrapedListing {
  id: string
  adapterName: string
  title: string
  description: string | null
  rawPrice: string | null
  extractedPrice: number | null
  currency: string | null
  sourceUrl: string | null
  images: string[]
  metadata: Record<string, unknown>
  scrapedAt: Date
  duplicateOf: string | null
  llmAnalysis: Record<string, unknown> | null
}

// Options for the generic-html adapter, specified in Watch.adapterOptions
export interface GenericHtmlOptions {
  containerSelector: string
  titleSelector: string
  priceSelector?: string
  imageSelector?: string
  linkSelector?: string
  baseUrl?: string
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  created_at: string
}
