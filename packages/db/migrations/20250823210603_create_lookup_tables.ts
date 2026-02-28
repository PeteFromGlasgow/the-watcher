import type { Knex } from 'knex'

const ACCOUNT_TYPES_TABLE = 'account_types'
const CURRENCIES_TABLE = 'currencies'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(ACCOUNT_TYPES_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name').notNullable().unique()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })

  await knex.raw(`
    CREATE TRIGGER tg_account_types_updated_at
    BEFORE UPDATE ON ${ACCOUNT_TYPES_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(CURRENCIES_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('code', 3).notNullable().unique()
    table.string('name').notNullable()
    table.string('symbol', 5).notNullable()
    table.smallint('decimal_digits').notNullable().defaultTo(2)
    table.string('symbol_position').notNullable().defaultTo('before')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })

  await knex.raw(`
    CREATE TRIGGER tg_currencies_updated_at
    BEFORE UPDATE ON ${CURRENCIES_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(CURRENCIES_TABLE)
  await knex.schema.dropTable(ACCOUNT_TYPES_TABLE)
}
