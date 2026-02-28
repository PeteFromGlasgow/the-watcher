# Testing

This project uses `vitest` for testing. Any package that is created in this project should have tests connected and the code should be written in a way which is easily testable.

## Folder structure

The structure at the root of a package will contain both `src/` and `test/` directories

This means that when a build is run (`pnpm run build`) the path under dist will be `dist/src/` and `dist/test/`

## Test Framework

- **Vitest**: Unit and integration tests
- **Playwright**: Browser/E2E tests
- **Coverage Provider**: V8

## Test File Naming

- Place tests in `packages/*/test/` directories
- Name test files `*.test.ts`
- Import from built source: `import { buildApp } from '../src/app.js'`

## Running Tests

```bash
# Run tests for most packages (excludes browser, some APIs)
pnpm test

# Run all tests except browser
pnpm test:all

# Run browser-based tests (Chromium, Firefox, WebKit)
pnpm test:browser

# Run tests for specific package
pnpm --filter <package-name> test

# Run tests with coverage
pnpm --filter <package-name> coverage
```

## Fastify Testing Pattern

For Fastify services, use the `buildApp()` function with `app.inject()`:

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

## Writing Testable Code

- Export a `buildApp()` function for Fastify services (see `api-patterns.md`)
- Keep business logic separate from framework code
- Use dependency injection where appropriate
- Mock external dependencies (databases, APIs) in tests

## CI Testing

Tests run automatically in CI on:
- Node.js 18.x, 20.x, 22.x
- Multiple browsers (Chromium, Firefox, WebKit) for browser tests

## Reference

See `CLAUDE.md` for comprehensive testing guidelines.
See `api-patterns.md` for Fastify testing patterns.