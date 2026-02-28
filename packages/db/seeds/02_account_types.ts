import type { Knex } from 'knex'

const ACCOUNT_TYPE_TABLE = 'account_types'

interface AccountType {
  name: string
}

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex(ACCOUNT_TYPE_TABLE).del()

  // Inserts seed entries
  await knex(ACCOUNT_TYPE_TABLE).insert<AccountType>([
    { name: 'Current Account' },
    { name: 'Savings Account' },
    { name: 'Credit Card' }
  ])
}
