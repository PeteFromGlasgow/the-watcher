import type { FastifyInstance } from 'fastify'

const KRATOS_ADMIN_URL = process.env.KRATOS_ADMIN_URL ?? 'http://kratos:4434'

interface HookRequestBody {
  session: {
    id_token: {
      subject: string
    }
  }
  request: {
    grant_type: string
    requested_scope: string[]
    granted_scope: string[]
    client_id: string
  }
}

interface KratosIdentity {
  id: string
  traits: {
    email: string
    displayName?: string
  }
}

export async function oauth2HookRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: HookRequestBody }>('/oauth2/token-hook', async (request, reply) => {
    const subject = request.body.session.id_token.subject ?? {} as HookRequestBody

    console.log('here', subject)
    // Client credentials and similar flows may have no user subject
    if (!subject) {
      return reply.send({ session: {} })
    }

    try {
      const response = await fetch(`${KRATOS_ADMIN_URL}/admin/identities/${subject}`)

      if (!response.ok) {
        fastify.log.warn({ subject, status: response.status }, 'Kratos identity lookup failed, issuing token without traits')
        return reply.send({ session: {} })
      }

      const identity = await response.json() as KratosIdentity
      console.log(identity)
      const claims = {
        identity: {
          traits: identity.traits
        }
      }

      return reply.send({
        session: {
          access_token: claims,
          id_token: claims
        }
      })
    } catch (err) {
      fastify.log.error({ subject, err }, 'Error fetching identity traits for token hook')
      return reply.send({ session: {} })
    }
  })
}
