import { applyQuery, QueryError } from '@in-the-black/query-language-knex'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { db } from '../db'

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  fastify.get('/', async (request, reply) => {
    const { query } = request.query as { query: string }
    const qb = db('currencies')
    if (query) {
      try {
        applyQuery(qb, query)
      } catch (e: unknown) {
        if (e instanceof QueryError) {
          reply.code(400).send({
            error: 'Invalid query',
            details: {
              lexErrors: e.lexErrors,
              parseErrors: e.parseErrors
            }
          })
          return
        } else {
          throw e
        }
      }
    }
    const currencies = await qb.select()
    reply.send(currencies)
  })

  fastify.get('/:code', async (request, reply) => {
    const { code } = request.params as { code: string }
    const currency = await db('currencies').where({ code }).first()
    if (currency) {
      reply.send(currency)
    } else {
      reply.code(404).send({ error: 'Currency not found' })
    }
  })

  done()
}
