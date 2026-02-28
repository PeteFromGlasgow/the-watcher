import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('watch_id').notNullable().references('id').inTable('watches').onDelete('CASCADE')
    table.string('external_id').notNullable()
    table.string('url').notNullable()
    table.string('title').notNullable()
    table.decimal('price', 14, 2).nullable()
    table.string('currency').nullable()
    table.string('location').nullable()
    table.text('description').nullable()
    table.jsonb('attributes').notNullable().defaultTo('{}')
    table.timestamp('first_seen_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('last_seen_at').notNullable().defaultTo(knex.fn.now())
    table.timestamps(true, true)
    table.unique(['watch_id', 'external_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('listings')
}
