import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('watches', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.string('user_id').notNullable()
    table.string('name').notNullable()
    table.string('adapter').notNullable()
    table.jsonb('query_params').notNullable().defaultTo('{}')
    table.integer('check_interval_minutes').notNullable().defaultTo(60)
    table.enum('status', ['active', 'paused', 'archived']).notNullable().defaultTo('active')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('watches')
}
