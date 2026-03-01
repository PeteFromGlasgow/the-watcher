export interface TransportEntry {
  name: string
  secretRef?: string
  options?: Record<string, unknown>
}

export interface TransportChainConfig {
  chain: TransportEntry[]
}

export interface TransportResult {
  html: string
  transportUsed: string
  statusCode?: number
}
