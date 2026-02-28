import { applyQuery, QueryError } from '@in-the-black/query-language-knex'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { db } from '../db'

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  fastify.post('/accounts', async (request, _reply) => {
    const { account_type_id, name, balance, currency_id }
      = request.body as {
        account_type_id: string
        name: string
        balance: number
        currency_id: string
      }
    const user_id = request.headers['user-id'] as string

    const [account] = await db('accounts')
      .insert({
        user_id,
        account_type_id,
        name,
        balance,
        currency_id
      })
      .returning('*')

    return account
  })

  fastify.get('/accounts', async (request, _reply) => {
    const user_id = request.headers['user-id'] as string
    const accounts = await db('accounts').where({ user_id })
    return accounts
  })

  fastify.get('/account-types', async (request, reply) => {
    const { query } = request.query as { query: string }
    const qb = db('account_types')
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
    const accountTypes = await qb.select()
    reply.send(accountTypes)
  })

  fastify.get('/account-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const accountType = await db('account_types').where({ id }).first()
    if (accountType) {
      reply.send(accountType)
    } else {
      reply.code(404).send({ error: 'Account type not found' })
    }
  })

  fastify.get('/accounts/:id', async (request, _reply) => {
    const { id } = request.params as { id: string }
    const user_id = request.headers['user-id'] as string
    const account = await db('accounts').where({ id, user_id }).first()
    return account
  })

  fastify.put('/accounts/:id', async (request, _reply) => {
    const { id } = request.params as { id: string }
    const user_id = request.headers['user-id'] as string
    const { name, account_type_id } = request.body as {
      name: string
      account_type_id: string
    }

    const [account] = await db('accounts')
      .where({ id, user_id })
      .update({
        name,
        account_type_id
      })
      .returning('*')

    return account
  })

  done()
}
