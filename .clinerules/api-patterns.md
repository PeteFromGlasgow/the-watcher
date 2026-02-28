# API Patterns

Fastify service patterns and conventions for this project.

## Fastify Service Structure

### Export `buildApp()` Function

**CRITICAL**: All Fastify services must export a `buildApp()` function for testability.

```typescript
import Fastify from 'fastify'

export async function buildApp() {
  const app = Fastify({ logger: true })
  
  // Register routes
  app.get('/health', async () => ({ status: 'ok' }))
  
  return app
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildApp()
  await app.listen({ port: 3000, host: '0.0.0.0' })
}
```

### Health Check Endpoint

Every service must include a health check endpoint:

```typescript
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}))
```

### User Context Headers

Use these headers for user authentication and authorization:
- `x-user-id`: Internal user UUID
- `x-subject`: Ory Kratos identity subject

```typescript
app.addHook('preHandler', async (request, reply) => {
  const userId = request.headers['x-user-id']
  const subject = request.headers['x-subject']
  
  if (!userId || !subject) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
  
  request.user = { id: userId, subject }
})
```

## RESTful Conventions

- Use standard HTTP methods: GET, POST, PUT, PATCH, DELETE
- Use appropriate status codes:
  - 200 OK - Successful GET, PUT, PATCH
  - 201 Created - Successful POST
  - 204 No Content - Successful DELETE
  - 400 Bad Request - Invalid input
  - 401 Unauthorized - Missing or invalid auth
  - 404 Not Found - Resource doesn't exist
  - 500 Internal Server Error - Server error

## Testing Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app.js'

describe('API', () => {
  let app

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should respond to health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })
    
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'ok' })
  })
})
```

## Database Connection

Use the database connection pattern from `packages/*/src/db.ts`:

```typescript
import knex from 'knex'

export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'in_the_black'
  }
})
```

## Request Validation

Use Fastify's schema validation:

```typescript
app.post('/accounts', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'currency_id'],
      properties: {
        name: { type: 'string' },
        currency_id: { type: 'string', format: 'uuid' }
      }
    }
  }
}, async (request, reply) => {
  // Handler code
})
```

## Error Handling

```typescript
app.setErrorHandler((error, request, reply) => {
  request.log.error(error)
  
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error'
  })
})
```

## Reference

See `CLAUDE.md` for complete API patterns documentation.
See existing services in `packages/api-gateway/`, `packages/accounts-api/`, etc.