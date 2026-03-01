import type { Listing } from './listing.js'
import type { Watch } from './watch.js'
import type { TransportConfig } from './transport.js'

export interface NotificationPayload {
  watch: Watch
  newListings: Listing[]
}

export interface Notifier {
  send(payload: NotificationPayload, transport: TransportConfig): Promise<void>
}
