import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import accountsRoutes from './routes/accounts'
import currenciesRoutes from './routes/currencies'

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok' }
  })

  fastify.register(accountsRoutes)
  fastify.register(currenciesRoutes, { prefix: '/currencies' })

  done()
}
