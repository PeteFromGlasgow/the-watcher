import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import plugin from '../src/index'
import { db } from '../src/db'

const app = Fastify()
app.register(plugin)

describe('accounts api', () => {
  let user: { id: string }
  let accountType: { id: string }
  let currency: { id: string }

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await db.destroy()
  })

  beforeEach(async () => {
    [user] = await db('users')
      .insert({ kratos_id: 'a825923c-b7c9-4b8f-8a2d-8c8e7a4b8e8d', email: 'test@example.com' })
      .returning('id');
    [accountType] = await db('account_types')
      .insert({ name: 'Test Account Type' })
      .returning('id');
    [currency] = await db('currencies')
      .insert({
        code: 'TST',
        name: 'Test Currency'
      })
      .returning('id')
  })

  afterEach(async () => {
    await db('accounts').del()
    await db('users').del()
    await db('account_types').del()
    await db('currencies').where({ code: 'TST' }).del()
  })

  it('should create a new account', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      headers: {
        'user-id': user.id
      },
      payload: {
        account_type_id: accountType.id,
        name: 'Test Account',
        balance: 100,
        currency_id: currency.id
      }
    })

    expect(response.statusCode).toBe(200)
    const account = response.json()
    expect(account).toMatchObject({
      name: 'Test Account',
      balance: '100.0000'
    })

    const dbAccount = await db('accounts').where({ id: account.id }).first()
    expect(dbAccount).toBeDefined()
  })

  it('should get all accounts for a user', async () => {
    await db('accounts').insert({
      user_id: user.id,
      account_type_id: accountType.id,
      name: 'Test Account 2',
      balance: 200,
      currency_id: currency.id
    })

    const response = await app.inject({
      method: 'GET',
      url: '/accounts',
      headers: {
        'user-id': user.id
      }
    })

    expect(response.statusCode).toBe(200)
    const accounts = response.json()
    expect(accounts).toHaveLength(1)
    expect(accounts[0]).toMatchObject({
      name: 'Test Account 2',
      balance: '200.0000'
    })
  })

  it('should get a single account for a user', async () => {
    const [account] = await db('accounts')
      .insert({
        user_id: user.id,
        account_type_id: accountType.id,
        name: 'Test Account 3',
        balance: 300,
        currency_id: currency.id
      })
      .returning('id')

    const response = await app.inject({
      method: 'GET',
      url: `/accounts/${account.id}`,
      headers: {
        'user-id': user.id
      }
    })

    expect(response.statusCode).toBe(200)
    const result = response.json()
    expect(result).toMatchObject({
      name: 'Test Account 3',
      balance: '300.0000'
    })
  })

  it('should update an account', async () => {
    const [account] = await db('accounts')
      .insert({
        user_id: user.id,
        account_type_id: accountType.id,
        name: 'Test Account 4',
        balance: 400,
        currency_id: currency.id
      })
      .returning('id')

    const response = await app.inject({
      method: 'PUT',
      url: `/accounts/${account.id}`,
      headers: {
        'user-id': user.id
      },
      payload: {
        name: 'Updated Test Account',
        account_type_id: accountType.id
      }
    })

    expect(response.statusCode).toBe(200)
    const result = response.json()
    expect(result).toMatchObject({
      name: 'Updated Test Account',
      balance: '400.0000'
    })
  })

  it('should get all account types', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/account-types'
    })

    expect(response.statusCode).toBe(200)
    const types = response.json()
    expect(types.length).toBeGreaterThan(0)
  })

  it('should get filtered account types with query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/account-types',
      query: { query: "name eq 'Test Account Type'" }
    })

    expect(response.statusCode).toBe(200)
    const types = response.json()
    expect(types).toHaveLength(1)
    expect(types[0].name).toBe('Test Account Type')
  })

  it('should return 400 for invalid query on account types', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/account-types',
      query: { query: 'invalid @@@ query' }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should get a single account type by id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/account-types/${accountType.id}`
    })

    expect(response.statusCode).toBe(200)
    const type = response.json()
    expect(type.name).toBe('Test Account Type')
  })

  it('should return 404 for unknown account type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/account-types/00000000-0000-0000-0000-000000000000'
    })

    expect(response.statusCode).toBe(404)
  })
})
