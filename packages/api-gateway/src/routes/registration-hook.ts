import type { FastifyInstance } from 'fastify'
import { db } from '../db.js'

interface RegistrationHookBody {
  identity_id: string
  email: string
}

export async function registrationHookRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegistrationHookBody }>('/registration-hook', async (request, reply) => {
    const { identity_id, email } = request.body ?? {} as RegistrationHookBody

    if (!identity_id) {
      return reply.status(400).send({ error: 'identity_id is required' })
    }

    await db('users')
      .insert({ kratos_id: identity_id, email })
      .onConflict('kratos_id')
      .merge({ email })

    return reply.status(200).send({ status: 'ok' })
  })
}
