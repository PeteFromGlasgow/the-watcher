import Fastify from 'fastify'
import plugin from './index'

const fastify = Fastify({
  logger: true
})

fastify.register(plugin)

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '::' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
