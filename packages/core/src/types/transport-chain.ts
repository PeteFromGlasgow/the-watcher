export interface TransportEntry {
  name: string
  secretRef?: string
  options?: Record<string, unknown>
}

export interface TransportChainConfig {
  chain: TransportEntry[]
}

export interface HtmlTransportResult {
  type: 'html'
  html: string
  transportUsed: string
  statusCode?: number
}

export interface PageTransportResult {
  type: 'page'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any
  transportUsed: string
}

export type TransportResult = HtmlTransportResult | PageTransportResult
