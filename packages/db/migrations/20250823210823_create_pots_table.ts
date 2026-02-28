import type { Knex } from 'knex'

const POTS_TABLE = 'pots'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(POTS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('budget_id').notNullable().references('id').inTable('budgets')
    table.uuid('parent_id').references('id').inTable(POTS_TABLE)
    table.string('name').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_pots_updated_at
    BEFORE UPDATE ON ${POTS_TABLE}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(POTS_TABLE)
}
