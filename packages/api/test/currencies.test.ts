import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import plugin from '../src/index'

interface Currency {
  code: string
  name: string
  decimal_digits: number
}

const app = Fastify()
app.register(plugin)

describe('currencies API', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /currencies returns all currencies', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/currencies'
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.length).toBeGreaterThan(0)
  })

  it('GET /currencies with query returns filtered currencies', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/currencies',
      query: {
        query: 'decimal_digits eq 2'
      }
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.length).toBeGreaterThan(0)
    expect(payload.every((c: Currency) => c.decimal_digits === 2)).toBe(true)
  })

  it('GET /currencies/:code returns a single currency', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/currencies/USD'
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.code).toBe('USD')
  })

  it('GET /currencies/:code returns 404 for unknown currency', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/currencies/ZZZ'
    })

    expect(response.statusCode).toBe(404)
  })
})
