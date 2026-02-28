import type { Knex } from 'knex'

const CURRENCIES_TABLE = 'currencies'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(CURRENCIES_TABLE, (table) => {
    table.dropColumn('symbol')
    table.dropColumn('symbol_position')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(CURRENCIES_TABLE, (table) => {
    table.string('symbol', 5).notNullable().defaultTo('$')
    table.string('symbol_position').notNullable().defaultTo('before')
  })
}
