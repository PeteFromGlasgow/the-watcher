import type { TransportChainConfig, TransportResult } from '@watcher/shared-logic'
import type { Transport, TransportContext } from './transport.js'

export class TransportResolver {
  constructor(private transports: Map<string, Transport>) {}

  async resolve(
    chain: TransportChainConfig,
    context: TransportContext
  ): Promise<TransportResult> {
    const errors: string[] = []

    for (const entry of chain.chain) {
      const transport = this.transports.get(entry.name)
      if (!transport) throw new Error(`Unknown transport: ${entry.name}`)

      try {
        const result = await transport.execute({ ...context, options: entry.options })
        return { ...result, transportUsed: transport.name }
      } catch (err) {
        errors.push(`${entry.name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    throw new Error(`All transports failed:\n${errors.join('\n')}`)
  }
}
