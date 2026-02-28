import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  // TODO: WCH-3 — Replace with Watcher domain routes
  fastify.get('/accounts', async (_request, reply) => {
    reply.send([])
  })

  done()
}
