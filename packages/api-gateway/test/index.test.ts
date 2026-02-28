import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/index.js'

describe('API Gateway', () => {
  it('GET / returns 200 and message', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: 'API Gateway is running' })
  })
})
