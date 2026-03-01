import type { ScrapedListing, TransportResult, Watch } from '@watcher/shared-logic'

export interface Adapter {
  readonly name: string
  extract(result: TransportResult, watch: Watch): Promise<ScrapedListing[]>
}
