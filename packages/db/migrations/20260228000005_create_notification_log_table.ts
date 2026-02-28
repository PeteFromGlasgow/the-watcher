import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('watch_id').notNullable().references('id').inTable('watches').onDelete('CASCADE')
    table.enum('transport', ['email', 'webhook', 'pushover']).notNullable()
    table.integer('listing_count').notNullable()
    table.boolean('success').notNullable()
    table.text('error').nullable()
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notification_log')
}
