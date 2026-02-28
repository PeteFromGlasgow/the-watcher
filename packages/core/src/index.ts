export function getHelloWorld(output: (message: string) => void) {
  return function (name: string) {
    output(`Hello ${name}!`)
  }
}

export type {
  Listing,
  ListingImage,
  Watch,
  WatchStatus,
  TransportType,
  TransportConfig,
  Adapter,
  AdapterResult,
  Notifier,
  NotificationPayload,
  PipelineResult,
  PipelineStatus
} from './types/index.js'
