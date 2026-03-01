import type { Transport, TransportContext } from './transport.js'
import type { TransportResult } from '@watcher/shared-logic'

const FLARESOLVERR_URL = process.env['FLARESOLVERR_URL'] ?? 'http://flaresolverr:8191'

export class FlareSolverrTransport implements Transport {
  readonly name = 'flaresolverr'

  async execute(context: TransportContext): Promise<TransportResult> {
    const response = await fetch(`${FLARESOLVERR_URL}/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url: context.url,
        maxTimeout: 60000
      })
    })

    if (!response.ok) {
      throw new Error(`FlareSolverr request failed: ${response.status}`)
    }

    const data = await response.json() as {
      status: string
      solution?: { status: number, response: string }
      message?: string
    }

    if (data.status !== 'ok' || !data.solution) {
      throw new Error(`FlareSolverr error: ${data.message ?? 'unknown'}`)
    }

    if (data.solution.status >= 400) {
      throw new Error(`FlareSolverr upstream HTTP ${data.solution.status} for ${context.url}`)
    }

    return { html: data.solution.response, transportUsed: 'flaresolverr' }
  }
}
