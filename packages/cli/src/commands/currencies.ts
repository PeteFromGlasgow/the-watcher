import { Command } from 'commander'
import { createApi } from '@in-the-black/shared-logic'

export function registerCurrencies(
  program: Command,
  getJwt: () => Promise<string | undefined>,
  output: (out: unknown) => void
) {
  const currenciesCmd = program.command('currencies')

  currenciesCmd
    .command('list')
    .option('-q, --query <query>', 'Query')
    .action(async (cmd) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const currencies = await api.currencies.list(cmd.query ?? undefined)
        output(currencies)
      } catch (error) {
        output(error)
      }
    })

  currenciesCmd
    .command('get <code>')
    .action(async (code) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const currency = await api.currencies.get(code)
        output(currency)
      } catch (error) {
        output(error)
      }
    })
}
