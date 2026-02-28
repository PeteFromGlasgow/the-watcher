import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/index.js'

describe('API Gateway', () => {
  it('GET /api/v1 returns 200 and message', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ message: 'API Gateway is running' })
    await app.close()
  })
})
