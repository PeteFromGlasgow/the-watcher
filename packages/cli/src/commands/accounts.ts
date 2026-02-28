import { Command } from 'commander'
import { createApi } from '@in-the-black/shared-logic'

export function registerAccounts(
  program: Command,
  getJwt: () => Promise<string | undefined>,
  output: (out: unknown) => void
) {
  const accountsCmd = program.command('accounts')

  accountsCmd
    .command('list')
    .option('-q, --query <query>', 'Query')
    .action(async (cmd) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const currencies = await api.accounts.list(cmd.query ?? undefined)
        output(currencies)
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
        const account = await api.accounts.get(id)
        output(account)
      } catch (error) {
        output(error)
      }
    })

  accountsCmd
    .command('create')
    .requiredOption('-n, --name <name>', 'Account name')
    .requiredOption('-t, --account-type-id <accountTypeId>', 'Account type UUID')
    .requiredOption('-b, --balance <balance>', 'Initial balance')
    .requiredOption('-c, --currency-id <currencyId>', 'Currency UUID')
    .action(async (cmd) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const account = await api.accounts.create({
          name: cmd.name,
          account_type_id: cmd.accountTypeId,
          balance: parseFloat(cmd.balance),
          currency_id: cmd.currencyId
        })
        output(account)
      } catch (error) {
        output(error)
      }
    })

  accountsCmd
    .command('update <id>')
    .option('-n, --name <name>', 'Account name')
    .option('-t, --account-type-id <accountTypeId>', 'Account type UUID')
    .action(async (id, cmd) => {
      const { apiUrl } = program.opts()
      const api = createApi(apiUrl, getJwt)
      try {
        const input: { name?: string, account_type_id?: string } = {}
        if (cmd.name) input.name = cmd.name
        if (cmd.accountTypeId) input.account_type_id = cmd.accountTypeId
        const account = await api.accounts.update(id, input)
        output(account)
      } catch (error) {
        output(error)
      }
    })
}
