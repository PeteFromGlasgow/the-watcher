import type { Knex } from 'knex'

const TRANSACTIONS_TABLE = 'transactions'
const TRANSACTION_SPLITS_TABLE = 'transaction_splits'
const TRANSACTION_LABELS_TABLE = 'transaction_labels'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TRANSACTIONS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.uuid('payee_id').references('id').inTable('payees')
    table.date('transaction_date').notNullable()
    table.text('description')
    table.string('status').notNullable().defaultTo('pending')
    table.string('source').notNullable().defaultTo('manual')
    table.decimal('exchange_rate', 19, 9).notNullable().defaultTo(1)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_transactions_updated_at
    BEFORE UPDATE ON ${TRANSACTIONS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(TRANSACTION_SPLITS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('transaction_id').notNullable().references('id').inTable(TRANSACTIONS_TABLE)
    table.uuid('account_id').notNullable().references('id').inTable('accounts')
    table.decimal('amount', 19, 4).notNullable()
    table.uuid('foreign_currency_id').references('id').inTable('currencies')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })

  await knex.raw(`
    CREATE TRIGGER tg_transaction_splits_updated_at
    BEFORE UPDATE ON ${TRANSACTION_SPLITS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(TRANSACTION_LABELS_TABLE, (table) => {
    table.uuid('transaction_id').notNullable().references('id').inTable(TRANSACTIONS_TABLE)
    table.uuid('label_id').notNullable().references('id').inTable('labels')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.primary(['transaction_id', 'label_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TRANSACTION_LABELS_TABLE)
  await knex.schema.dropTable(TRANSACTION_SPLITS_TABLE)
  await knex.schema.dropTable(TRANSACTIONS_TABLE)
}
