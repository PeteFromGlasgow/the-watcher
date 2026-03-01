import Fastify from 'fastify'
import httpProxy from '@fastify/http-proxy'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { fileURLToPath } from 'url'

export const buildApp = async () => {
  const fastify = Fastify({
    logger: true
  })

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'The Watcher API Gateway',
        description: 'API Gateway for The Watcher',
        version: '1.0.0'
      },
      host: `${host}:${port}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation'
  })

  await fastify.register(cors, {
    origin: '*'
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  await fastify.register(async (instance) => {
    instance.get('/', async (request) => {
      const subject = request.headers['x-subject']
      return { message: 'API Gateway is running', subject }
    })
  }, { prefix: '/api/v1' })

  await fastify.register(httpProxy, {
    upstream: 'http://api:3000',
    prefix: '/api/v1/watches',
    rewritePrefix: '/watches'
  })

  await fastify.register(httpProxy, {
    upstream: 'http://api:3000',
    prefix: '/api/v1/listings',
    rewritePrefix: '/listings'
  })

  return fastify
}

const start = async () => {
  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  try {
    const fastify = await buildApp()
    await fastify.listen({ port: Number(port), host })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  start()
}
