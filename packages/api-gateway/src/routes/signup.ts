import type { FastifyInstance } from 'fastify'
import { db } from '../db.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SignupBody {
  email: string
  marketing_consent: boolean
  consent_text: string
}

export async function signupRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: SignupBody }>('/signup', async (request, reply) => {
    const { email, marketing_consent, consent_text } = request.body ?? {} as SignupBody

    if (!email || !EMAIL_REGEX.test(email)) {
      return reply.status(400).send({ error: 'A valid email address is required' })
    }

    if (!marketing_consent) {
      return reply.status(400).send({ error: 'Marketing consent is required to subscribe' })
    }

    if (!consent_text) {
      return reply.status(400).send({ error: 'Consent text must be recorded for GDPR compliance' })
    }

    const ip_address = request.ip
    const user_agent = request.headers['user-agent'] ?? null

    try {
      const [signup] = await db('email_signups')
        .insert({
          email: email.toLowerCase().trim(),
          marketing_consent,
          consent_text,
          ip_address,
          user_agent,
          consented_at: new Date()
        })
        .onConflict('email')
        .merge({
          marketing_consent,
          consent_text,
          ip_address,
          user_agent,
          consented_at: new Date(),
          unsubscribed_at: null
        })
        .returning(['id', 'email', 'created_at'])

      return reply.status(201).send({
        message: 'You have been added to the launch list',
        id: signup.id,
        email: signup.email
      })
    } catch (_err) {
      return reply.status(500).send({ error: 'An unexpected error occurred. Please try again.' })
    }
  })

  fastify.delete<{ Body: { email: string } }>('/signup', async (request, reply) => {
    const { email } = request.body ?? {} as { email: string }

    if (!email || !EMAIL_REGEX.test(email)) {
      return reply.status(400).send({ error: 'A valid email address is required' })
    }

    const updated = await db('email_signups')
      .where({ email: email.toLowerCase().trim() })
      .whereNull('unsubscribed_at')
      .update({ unsubscribed_at: new Date(), marketing_consent: false })

    if (updated === 0) {
      return reply.status(404).send({ error: 'Email address not found or already unsubscribed' })
    }

    return reply.status(200).send({ message: 'You have been unsubscribed' })
  })
}
