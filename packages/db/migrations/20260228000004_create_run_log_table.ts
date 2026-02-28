import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('run_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('watch_id').notNullable().references('id').inTable('watches').onDelete('CASCADE')
    table.enum('status', ['ok', 'error', 'no_change']).notNullable()
    table.integer('new_listings_count').notNullable().defaultTo(0)
    table.text('error').nullable()
    table.integer('duration_ms').notNullable()
    table.timestamp('ran_at').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('run_log')
}
