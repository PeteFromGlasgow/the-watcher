import type { Watch } from '@watcher/shared-logic'
import type { Notifier } from './notifier.js'
import { NtfyNotifier } from './ntfy.js'
import { TelegramNotifier } from './telegram.js'
import { SlackNotifier } from './slack.js'

export function createNotifiers(watch: Watch): Notifier[] {
  if (!watch.notifiers?.length) return []
  return watch.notifiers.map((config) => {
    switch (config.type) {
      case 'ntfy': return new NtfyNotifier(config)
      case 'telegram': return new TelegramNotifier(config)
      case 'slack': return new SlackNotifier(config)
      default: throw new Error(`Unknown notifier type: ${(config as { type: string }).type}`)
    }
  })
}

export type { Notifier, NotificationPayload } from './notifier.js'
export { buildPayload, resolveSecret } from './notifier.js'
export { isAlreadyNotified, recordNotification } from './deduplication.js'
export { NtfyNotifier } from './ntfy.js'
export { TelegramNotifier } from './telegram.js'
export { SlackNotifier } from './slack.js'
