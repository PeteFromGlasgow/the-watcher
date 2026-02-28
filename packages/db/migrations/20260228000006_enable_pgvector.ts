import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector')
  await knex.schema.alterTable('listing_images', (table) => {
    table.specificType('embedding', 'vector(512)').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('listing_images', (table) => {
    table.dropColumn('embedding')
  })
  await knex.raw('DROP EXTENSION IF EXISTS vector')
}
