import Fastify from 'fastify'
import httpProxy from '@fastify/http-proxy'
import caching from '@fastify/caching'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { signupRoutes } from './routes/signup.js'
import { oauth2HookRoutes } from './routes/oauth2-hook.js'
import { registrationHookRoutes } from './routes/registration-hook.js'

// Export buildApp for testing
export const buildApp = async () => {
  const fastify = Fastify({
    logger: true
  })

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  // Register Swagger
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'API Gateway',
        description: 'API Gateway for the in-the-black project',
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

  // Register CORS
  await fastify.register(cors, {
    origin: '*'
  })

  // Register Rate Limiting
  await fastify.register(rateLimit, {
    max: 100, // Max requests per minute
    timeWindow: '1 minute'
  })

  await fastify.register(caching, {
    privacy: 'private',
    expiresIn: 300,
    serverExpiresIn: 300
  })

  // Create a new context for API v1 routes
  await fastify.register(async (instance) => {
    instance.get('/', async (request) => {
      const subject = request.headers['x-subject']
      return { message: 'API Gateway is running', subject }
    })

    await instance.register(signupRoutes)
    await instance.register(oauth2HookRoutes)
    await instance.register(registrationHookRoutes)
  }, { prefix: '/api/v1' })

  // Proxy registrations use the full path prefix so that rewritePrefix
  // is unambiguously different from prefix and the path replacement works correctly
  await fastify.register(httpProxy, {
    upstream: 'http://api:3000',
    prefix: '/api/v1/accounts',
    rewritePrefix: '/accounts'
  })

  await fastify.register(httpProxy, {
    upstream: 'http://api:3000',
    prefix: '/api/v1/account-types',
    rewritePrefix: '/account-types'
  })

  await fastify.register(httpProxy, {
    upstream: 'http://api:3000',
    prefix: '/api/v1/currencies',
    rewritePrefix: '/currencies'
  })

  return fastify
}

const start = async () => {
  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  try {
    const fastify = await buildApp()
    await fastify.listen({ port: Number(port), host })
    console.log(`Server listening on http://${host}:${port}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

// Check if this module is the main entry point
// In ESM, we can check if the file path matches process.argv[1]
import { fileURLToPath } from 'url'
if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  start()
}
