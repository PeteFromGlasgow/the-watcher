import type { Knex } from 'knex'

const TABLE_NAME = 'email_signups'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('email').notNullable().unique()
    table.boolean('marketing_consent').notNullable().defaultTo(false)
    table.string('consent_text').notNullable()
    table.string('ip_address')
    table.string('user_agent')
    table.timestamp('consented_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('unsubscribed_at')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })

  await knex.raw(`
    CREATE TRIGGER tg_email_signups_updated_at
    BEFORE UPDATE ON ${TABLE_NAME}
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME)
}
