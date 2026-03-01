import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('listing_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('listing_id').notNullable().references('id').inTable('listings').onDelete('CASCADE')
    table.string('url').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('listing_images')
}
