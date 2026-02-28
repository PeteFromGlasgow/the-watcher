export type TransportType = 'email' | 'webhook' | 'pushover'

export interface TransportConfig {
  type: TransportType
  config: Record<string, unknown>
}
