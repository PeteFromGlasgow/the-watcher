# Monorepo Structure

Information about the pnpm workspace and package organization.

## Workspace Configuration

- **Package Manager**: pnpm 10.15.1 (use `corepack enable` to activate)
- **Workspace Pattern**: `packages/*`
- **Package Naming**: `@in-the-black/<package-name>` (scoped packages)

## Package Organization

```
packages/
├── api-gateway/          # Fastify-based API Gateway
├── accounts-api/         # Accounts microservice
├── currencies-api/       # Currency conversion service
├── webapp/               # Nuxt 3 web application
├── cli/                  # Commander.js CLI tool
├── core/                 # Shared business logic (@in-the-black/shared-logic)
├── browser/              # Browser-compatible library build
├── db/                   # Knex migrations and seeds
├── query-language/       # Custom Chevrotain-based query parser
└── query-language-knex/  # Query language Knex adapter
```

## Running Commands

### Root Level Commands
```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm test                 # Run tests (excludes browser, some APIs)
pnpm test:all             # Run all tests except browser
pnpm test:browser         # Run browser-based tests
pnpm lint                 # Check code style
pnpm lint:fix             # Auto-fix linting issues
```

### Package-Specific Commands
```bash
# Use --filter to target specific packages
pnpm --filter <package-name> <command>

# Examples:
pnpm --filter @in-the-black/api-gateway dev
pnpm --filter nuxt-app dev
pnpm --filter @in-the-black/db db:migrate
pnpm --filter @in-the-black/shared-logic test
```

## Inter-Package Dependencies

- Workspace packages can depend on each other
- Use `workspace:*` protocol in package.json for local dependencies
- `pnpm-workspace.yaml` has `injectWorkspacePackages: true` enabled
- After build scripts, dependencies are synced via `syncInjectedDepsAfterScripts`

## Build Output Structure

All packages build to `dist/` directory:
```
dist/
├── src/     # Compiled source files
└── test/    # Compiled test files
```

This means:
- Import paths in tests: `import { buildApp } from '../src/app.js'`
- Built artifacts reference: `dist/src/index.js`
- Type definitions: `dist/src/index.d.ts`

## Package.json Required Fields

Every package should have:
```json
{
  "name": "@in-the-black/<package-name>",
  "type": "module",
  "main": "dist/src/index.js",
  "types": "dist/src/index.d.ts",
  "scripts": {
    "build": "tsc -p .",
    "test": "vitest --run"
  }
}
```

## Reference

See `CLAUDE.md` for complete monorepo documentation.
See `pnpm-workspace.yaml` for workspace configuration.