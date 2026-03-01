export function getHelloWorld(output: (message: string) => void) {
  return function (name: string) {
    output(`Hello ${name}!`)
  }
}

export type {
  Listing,
  ListingImage,
  ScrapedListing,
  GenericHtmlOptions,
  Watch,
  WatchStatus,
  TransportType,
  TransportConfig,
  TransportEntry,
  TransportChainConfig,
  TransportResult,
  HtmlTransportResult,
  PageTransportResult,
  Adapter,
  AdapterResult,
  Notifier,
  NotificationPayload,
  PipelineResult,
  PipelineStatus
} from './types/index.js'
