import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('../src/db.js', () => {
  const returning = vi.fn()
  const merge = vi.fn(() => ({ returning }))
  const onConflict = vi.fn(() => ({ merge }))
  const insert = vi.fn(() => ({ onConflict }))
  const update = vi.fn()
  const whereNull = vi.fn(() => ({ update }))
  const where = vi.fn(() => ({ whereNull }))

  const db = vi.fn(() => ({ insert, where }))

  return {
    db,
    _mocks: { insert, onConflict, merge, returning, where, whereNull, update }
  }
})

import { buildApp } from '../src/index.js'
import { _mocks } from '../src/db.js'

const mocks = _mocks as Record<string, ReturnType<typeof vi.fn>>

describe('POST /signup', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    Object.values(mocks).forEach(mock => mock.mockClear())
  })

  it('returns 400 when email is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: { marketing_consent: true, consent_text: 'I agree' }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toContain('email')
  })

  it('returns 400 when email is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: { email: 'not-an-email', marketing_consent: true, consent_text: 'I agree' }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toContain('email')
  })

  it('returns 400 when marketing_consent is false', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: { email: 'test@example.com', marketing_consent: false, consent_text: 'I agree' }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.toLowerCase()).toContain('consent')
  })

  it('returns 400 when consent_text is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: { email: 'test@example.com', marketing_consent: true }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.toLowerCase()).toContain('consent')
  })

  it('returns 201 on successful signup', async () => {
    mocks.returning.mockResolvedValueOnce([{
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      created_at: new Date().toISOString()
    }])

    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: {
        email: 'test@example.com',
        marketing_consent: true,
        consent_text: 'I agree to receive emails'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.message).toContain('launch list')
    expect(body.email).toBe('test@example.com')
    expect(body.id).toBeDefined()
  })

  it('lowercases email before insert', async () => {
    mocks.returning.mockResolvedValueOnce([{
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      created_at: new Date().toISOString()
    }])

    await app.inject({
      method: 'POST',
      url: '/signup',
      payload: {
        email: 'User@Example.COM',
        marketing_consent: true,
        consent_text: 'I agree'
      }
    })

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' })
    )
  })

  it('records consent_text and marketing_consent in insert', async () => {
    mocks.returning.mockResolvedValueOnce([{
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'gdpr@example.com',
      created_at: new Date().toISOString()
    }])

    await app.inject({
      method: 'POST',
      url: '/signup',
      payload: {
        email: 'gdpr@example.com',
        marketing_consent: true,
        consent_text: 'I agree to receive product launch emails'
      }
    })

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        marketing_consent: true,
        consent_text: 'I agree to receive product launch emails'
      })
    )
  })

  it('returns 500 on database error', async () => {
    mocks.returning.mockRejectedValueOnce(new Error('DB connection failed'))

    const response = await app.inject({
      method: 'POST',
      url: '/signup',
      payload: {
        email: 'fail@example.com',
        marketing_consent: true,
        consent_text: 'I agree'
      }
    })

    expect(response.statusCode).toBe(500)
    expect(response.json().error).toContain('unexpected')
  })
})

describe('DELETE /signup', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    Object.values(mocks).forEach(mock => mock.mockClear())
  })

  it('returns 400 when email is missing', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/signup',
      payload: {}
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toContain('email')
  })

  it('returns 404 when email not found', async () => {
    mocks.update.mockResolvedValueOnce(0)

    const response = await app.inject({
      method: 'DELETE',
      url: '/signup',
      payload: { email: 'notfound@example.com' }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error).toContain('not found')
  })

  it('returns 200 on successful unsubscribe', async () => {
    mocks.update.mockResolvedValueOnce(1)

    const response = await app.inject({
      method: 'DELETE',
      url: '/signup',
      payload: { email: 'unsub@example.com' }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toContain('unsubscribed')
  })
})
