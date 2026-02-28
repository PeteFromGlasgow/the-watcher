import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import knex, { Knex } from 'knex'
import { applyQuery } from '../src/index.js'

describe('applyQuery', () => {
  let db: Knex

  beforeAll(async () => {
    db = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      },
      useNullAsDefault: true
    })

    await db.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('name')
      table.integer('age')
      table.string('email')
    })

    await db('users').insert([
      { id: 1, name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com' },
      { id: 3, name: 'Charlie', age: 35, email: 'charlie@example.com' },
      { id: 4, name: 'David', age: 30, email: null }
    ])
  })

  afterAll(async () => {
    await db.destroy()
  })

  it('should handle simple equality', async () => {
    const query = 'name eq "Alice"'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('should handle and expressions', async () => {
    const query = 'age eq 30 and name eq "Alice"'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('should handle or expressions', async () => {
    const query = 'age eq 25 or name eq "Charlie"'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(2)
  })

  it('should handle not expressions', async () => {
    const query = 'not name eq "Alice"'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(3)
  })

  it('should handle in expressions', async () => {
    const query = 'name in ("Alice", "Bob")'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(2)
  })

  it('should handle like expressions', async () => {
    const query = 'email like "%@example.com"'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(3)
  })

  it('should handle is null expressions', async () => {
    const query = 'email is null'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('David')
  })

  it('should handle is not null expressions', async () => {
    const query = 'email is not null'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(3)
  })

  it('should handle queries with brackets', async () => {
    const query = '(name eq "Alice" or name eq "Bob") and age gt 20'
    const result = await applyQuery(db('users'), query)
    expect(result).toHaveLength(2)
  })

  it('should throw an error for invalid queries', async () => {
    const query = 'name eq'
    expect(() => applyQuery(db('users'), query)).toThrow()
  })
})
