import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import plugin from '../src/index'

const app = Fastify()
app.register(plugin)

describe('api', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /accounts returns empty array', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/accounts'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })
})
