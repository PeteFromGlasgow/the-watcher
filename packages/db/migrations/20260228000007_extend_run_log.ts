import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('run_log', (table) => {
    table.jsonb('transport_chain').nullable()
    table.text('transport_used').nullable()
    table.integer('listings_found').notNullable().defaultTo(0)
    table.integer('duplicate_count').notNullable().defaultTo(0)
    table.integer('notifications_sent_count').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('run_log', (table) => {
    table.dropColumn('transport_chain')
    table.dropColumn('transport_used')
    table.dropColumn('listings_found')
    table.dropColumn('duplicate_count')
    table.dropColumn('notifications_sent_count')
  })
}
