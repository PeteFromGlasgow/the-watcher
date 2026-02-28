import type { Knex } from 'knex'

const TABLE_NAME = 'users'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "moddatetime";')
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('kratos_id').notNullable().unique()
    table.string('email', 130).notNullable().unique()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })

  await knex.raw(`
    CREATE TRIGGER tg_users_updated_at
    BEFORE UPDATE ON ${TABLE_NAME}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME)
  await knex.raw('DROP EXTENSION IF EXISTS "moddatetime";')
  await knex.raw('DROP EXTENSION IF EXISTS "pgcrypto";')
}
