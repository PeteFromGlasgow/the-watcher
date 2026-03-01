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

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  created_at: string
}
