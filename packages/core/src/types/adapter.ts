import type { Listing } from './listing.js'
import type { Watch } from './watch.js'

export interface AdapterResult {
  listings: Omit<Listing, 'id' | 'watch_id' | 'first_seen_at' | 'last_seen_at' | 'created_at' | 'updated_at'>[]
}

export interface Adapter {
  name: string
  fetch(watch: Watch): Promise<AdapterResult>
}
