import { Command } from 'commander'
import { createApi } from '@in-the-black/shared-logic'

export function registerAccountTypes(
  program: Command,
  getJwt: () => Promise<string | undefined>,
  output: (out: unknown) => void
) {
  const accountsCmd = program.command('account-types')

  accountsCmd
    .command('list')
    .option('-q, --query <query>', 'Query')
    .action(async (cmd) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const accountTypes = await api.accountTypes.list(cmd.query ?? undefined)
        output(accountTypes)
      } catch (error) {
        output(error)
      }
    })

  accountsCmd
    .command('get <id>')
    .action(async (id) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const accountType = await api.accountTypes.get(id)
        output(accountType)
      } catch (error) {
        output(error)
      }
    })
}
