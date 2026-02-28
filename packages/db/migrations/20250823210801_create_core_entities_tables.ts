import type { Knex } from 'knex'

const ACCOUNTS_TABLE = 'accounts'
const BUDGETS_TABLE = 'budgets'
const PAYEES_TABLE = 'payees'
const LABELS_TABLE = 'labels'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(ACCOUNTS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.uuid('account_type_id').notNullable().references('id').inTable('account_types')
    table.string('name').notNullable()
    table.decimal('balance', 19, 4).notNullable().defaultTo(0)
    table.uuid('currency_id').notNullable().references('id').inTable('currencies')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_accounts_updated_at
    BEFORE UPDATE ON ${ACCOUNTS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(BUDGETS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.string('name').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_budgets_updated_at
    BEFORE UPDATE ON ${BUDGETS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(PAYEES_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.string('name').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_payees_updated_at
    BEFORE UPDATE ON ${PAYEES_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)

  await knex.schema.createTable(LABELS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.string('key').notNullable()
    table.string('value')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.unique(['user_id', 'key', 'value'])
  })

  await knex.raw(`
    CREATE TRIGGER tg_labels_updated_at
    BEFORE UPDATE ON ${LABELS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(LABELS_TABLE)
  await knex.schema.dropTable(PAYEES_TABLE)
  await knex.schema.dropTable(BUDGETS_TABLE)
  await knex.schema.dropTable(ACCOUNTS_TABLE)
}
