import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import plugin from '../src/index'

const app = Fastify()
app.register(plugin)

describe('currencies api', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /currencies returns empty array', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/currencies'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })
})
