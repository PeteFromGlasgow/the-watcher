# CLAUDE.md - AI Assistant Guide for The Watcher

This document provides comprehensive guidance for AI assistants working with The Watcher codebase.

## Project Overview

**The Watcher** is a property listing monitor that periodically scrapes property listing sites and notifies users when new listings matching their saved searches appear. It is built as a monorepo with a microservices architecture designed to run natively on Kubernetes.

### Core Purpose
- Monitor property listing sites via pluggable adapters
- Store and deduplicate listings using PostgreSQL with pgvector support
- Notify users of new listings via configurable transports (email, webhook, pushover)
- Manage user-defined "watches" — saved searches with polling intervals

### Domain Concepts
- **Watch**: A user-defined saved search with an adapter, query parameters, polling interval, and status (`active`, `paused`, `archived`)
- **Listing**: A property listing fetched by an adapter, associated with a watch
- **Adapter**: A pluggable scraper interface for a specific listing site
- **Notifier**: Sends `NotificationPayload` (watch + new listings) via a `TransportConfig`
- **Transport**: Delivery mechanism — `email`, `webhook`, or `pushover`

## Architecture

```
Clients (CLI) → API Gateway → API → PostgreSQL Database
                    ↓
         Ory Identity Stack (Hydra, Kratos, Keto, Oathkeeper)
```

### Key Services

| Package | Name | Purpose |
|---------|------|---------|
| `packages/api` | `@watcher/api` | Main application API (listings, watches, accounts, currencies) |
| `packages/api-gateway` | `@watcher/api-gateway` | Centralized entry point with CORS, rate limiting, swagger, proxying |
| `packages/cli` | `@watcher/cli` | Commander.js CLI tool, installable as `watcher` |
| `packages/core` | `@watcher/shared-logic` | Shared TypeScript types and business logic |
| `packages/db` | `@watcher/db` | Knex migrations, seeds, database config |

### External Services in Kubernetes

| Service | Purpose |
|---------|---------|
| `hydra` | Ory Hydra — OAuth2 / OpenID Connect server |
| `kratos` | Ory Kratos — user identity and self-service |
| `keto` | Ory Keto — access control / permissions |
| `oathkeeper` | Ory Oathkeeper — identity and access proxy |
| `postgres` | PostgreSQL database with pgvector extension |
| `clip-service` | Internal clip/scraping service |
| `flaresolverr` | Cloudflare bypass for scraping |
| `mailpit` | Local email testing (development) |
| `kratos-admin-ui` | Kratos admin interface |

## Repository Structure

```
the-watcher/
├── packages/
│   ├── api/                  # Main API service (Fastify + Knex + PostgreSQL)
│   ├── api-gateway/          # API Gateway (Fastify + http-proxy + swagger)
│   ├── cli/                  # Commander.js CLI tool
│   ├── core/                 # Shared types and logic (@watcher/shared-logic)
│   └── db/                   # Knex migrations, seeds, knexfile
├── infra/
│   └── k8s/
│       ├── base/             # Base Kubernetes manifests (12 services)
│       └── overlays/
│           ├── development/  # Dev-specific configs, secrets, namespace
│           └── production/   # Production configs, namespace
├── .github/workflows/        # CI/CD pipelines
├── .husky/                   # Git hooks (pre-commit: lint + test)
├── .changeset/               # Changesets config for versioning
├── Tiltfile                  # Local Kubernetes development with Tilt
└── [Config Files]            # eslint.config.js, pnpm-workspace.yaml, etc.
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22.x / 23.x |
| Package Manager | pnpm 10.15.1 |
| Language | TypeScript 5.9 (strict mode) |
| Backend Framework | Fastify 5.x |
| Database | PostgreSQL (with pgvector) via Knex.js 3.x |
| Testing | Vitest 4.x (V8 coverage) |
| Containerization | Docker + Kubernetes (Kustomize) |
| Identity | Ory ecosystem (Hydra, Kratos, Keto, Oathkeeper) |
| CLI | Commander.js 14.x |
| Linting | ESLint 9 + typescript-eslint + @stylistic/eslint-plugin |

## Development Commands

### Setup
```bash
corepack enable              # Enable pnpm
pnpm install                 # Install all dependencies
pnpm build                   # Build all packages recursively
```

### Running Services
```bash
pnpm --filter @watcher/api-gateway start:dev   # API Gateway (with nodemon)
pnpm --filter @watcher/api start:dev           # Main API (with nodemon)
pnpm --filter @watcher/db db:migrate           # Run database migrations
pnpm --filter @watcher/db db:seed             # Run database seeds
```

### Testing
```bash
pnpm test       # Run tests for all packages (vitest --run)
```

### Code Quality
```bash
pnpm lint       # Check code style (ESLint)
pnpm lint:fix   # Auto-fix linting issues
```

### Local Kubernetes Development
```bash
tilt up         # Start all services in local Kind cluster (watcher-dev)
```

### Release Management
```bash
pnpm changeset          # Add a changeset for your changes
pnpm changeset version  # Update versions (usually automated)
pnpm release            # Build and publish packages
```

## Code Style & Conventions

### ESLint Configuration (`eslint.config.js`)
- **Indent**: 2 spaces
- **Semicolons**: None (omitted)
- **Quotes**: Single quotes (with `avoidEscape: true`)
- **Trailing commas**: Never (`commaDangle: 'never'`)
- **Line endings**: LF only (enforced via `.editorconfig`)
- **Brace style**: `1tbs` (one true brace style)
- **Unused variables**: Prefix with `_` to indicate intentional non-use (applies to args, caught errors, destructured variables, and regular vars)

### TypeScript Configuration

There are two tsconfig variants in use:

**CommonJS packages** (e.g. `packages/api`):
```json
{ "target": "es2017", "module": "commonjs", "strict": true, "esModuleInterop": true }
```

**ESM packages** (e.g. `packages/api-gateway`, `packages/core`, `packages/cli`):
```json
{ "target": "esnext", "module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "declaration": true, "declarationMap": true, "sourceMap": true }
```

### Module System
- Most packages use ES modules (`"type": "module"`) with NodeNext resolution
- `packages/api` uses CommonJS (`"module": "commonjs"`) — no `"type": "module"` in its package.json
- ESM imports must include `.js` extension even for `.ts` source files

### Naming Conventions
- Files: kebab-case (`api-gateway.ts`, `hello-world.test.ts`)
- Classes: PascalCase
- Functions/variables: camelCase
- Database columns: snake_case (`created_at`, `watch_id`)
- Constants: UPPER_SNAKE_CASE

### Editor Config (`.editorconfig`)
- Indent: 2 spaces
- Line ending: LF
- Charset: UTF-8
- Trim trailing whitespace: true
- Insert final newline: true

## Database Conventions

### Configuration (`packages/db/knexfile.ts`)
- Client: `postgresql`
- Connection: via `DATABASE_URL` environment variable
- Pool: min 2, max 10
- Migrations table: `knex_migrations`
- Environments: `development`, `test`, `production`

### Schema Overview

| Table | Purpose |
|-------|---------|
| `watches` | User-defined saved searches with adapter, query params, interval |
| `listings` | Property listings fetched by adapters, deduplicated by `external_id` |
| `listing_images` | Images associated with a listing |
| `run_log` | Log of each polling run for a watch |
| `notification_log` | Log of notifications sent to users |

pgvector extension is enabled (migration `20260228000006_enable_pgvector.ts`).

### Key Principles
- **Primary keys**: UUID (`id` column)
- **Timestamps**: All tables have `created_at` and `updated_at`
- **Monetary values**: DECIMAL type for precision

## Core Type Definitions (`packages/core/src/types/`)

```typescript
// Watch — a user's saved search
interface Watch {
  id: string; user_id: string; name: string
  adapter: string; query_params: Record<string, unknown>
  check_interval_minutes: number; status: 'active' | 'paused' | 'archived'
}

// Listing — a property listing
interface Listing {
  id: string; watch_id: string; external_id: string
  url: string; title: string; price: number | null
  currency: string | null; location: string | null
  description: string | null; attributes: Record<string, unknown>
}

// Adapter — pluggable scraper for a listing site
interface Adapter {
  name: string
  fetch(watch: Watch): Promise<AdapterResult>
}

// Notifier — sends notifications
interface Notifier {
  send(payload: NotificationPayload, transport: TransportConfig): Promise<void>
}

// Transport types: 'email' | 'webhook' | 'pushover'
```

## API Patterns

### Fastify Services
- Export a `buildApp()` function for testability
- Include a health check or root route
- Use request headers for user context where needed

### API Gateway (`packages/api-gateway`)
Features: CORS (`@fastify/cors`), rate limiting (`@fastify/rate-limit`), HTTP proxying (`@fastify/http-proxy`, `@fastify/reply-from`), Swagger UI (`@fastify/swagger`, `@fastify/swagger-ui`)

### Main API (`packages/api`)
Routes: `packages/api/src/routes/accounts.ts`, `packages/api/src/routes/currencies.ts`
Database access: via Knex, configured in `packages/api/src/db.ts`

### RESTful Conventions
- Standard CRUD operations
- Proper HTTP status codes
- JSON request/response bodies

## Testing Guidelines

### Test File Location
- Place tests in `packages/*/test/` directories
- Name test files `*.test.ts`

### Test Framework
- Vitest 4.x with V8 coverage provider
- Run with `vitest --run` (non-interactive, single pass)

### Fastify Testing Pattern
```typescript
import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/index.js'

describe('API Gateway', () => {
  it('GET /api/v1 returns 200', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/api/v1' })
    expect(response.statusCode).toBe(200)
    await app.close()
  })
})
```

### Coverage
```bash
pnpm --filter @watcher/shared-logic coverage   # V8 coverage for core package
```

## Git Workflow

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New features
- `fix:` — Bug fixes
- `docs:` — Documentation changes
- `style:` — Code style (formatting, no logic change)
- `refactor:` — Code refactoring
- `test:` — Test updates
- `chore:` — Build/dependency updates

### Pre-commit Hooks (`.husky/pre-commit`)
Husky runs automatically before each commit:
```bash
pnpm run lint
pnpm t
```

Both must pass before a commit is accepted. Set `HUSKY=0` to skip in CI.

### Changesets
For version management across packages:
```bash
pnpm changeset          # Add a changeset describing your change
pnpm changeset version  # Bump versions (usually done by CI)
pnpm release            # pnpm build && pnpm changeset publish
```

## Docker & Kubernetes

### Dockerfile Best Practices (from `CONVENTIONS.md`)
- Multi-stage builds for minimal production images (`base` → `build` → production stage)
- Use `dumb-init` for proper signal handling
- Run as non-root user (`node`, uid 1001)
- Cache pnpm store with `--mount=type=cache` during build
- Use `pnpm install --frozen-lockfile` for reproducible installs
- Copy `package.json`/lockfile before source for layer caching

### Dockerfiles

| Service | Base Image | Entry |
|---------|-----------|-------|
| `api-gateway` | `node:24-debian:bookworm-slim` | `dumb-init node dist/index.js` |
| `db-migrations` | `node:24-debian:bookworm` | `dumb-init node_modules/.bin/knex migrate:latest` |
| `cli` | `node:24-alpine3.21` | `dumb-init node dist/src/app.js` |

### Local Kubernetes Development
```bash
tilt up    # Starts Kind cluster 'watcher-dev' and all services
```

**Tilt configuration:**
- Kind cluster: `watcher-dev`
- Manifests: `./infra/k8s/overlays/development`
- Live update: enabled for `api-gateway` and `api` (syncs `src/`, `dist/`, `test/`)
- Port forwards: PostgreSQL on `5432`
- Labels: `application` (api-gateway, api), `auth` (hydra, keto, kratos, oathkeeper), `databases` (postgres, db-migrations), `tooling` (mailpit, kratos-admin-ui, flaresolverr, clip-service)

### Infrastructure Layout
- `infra/k8s/base/` — Base manifests for all services (deployment, service, optional PVC/configmap)
- `infra/k8s/overlays/development/` — Dev-specific configs and secrets
- `infra/k8s/overlays/production/` — Production configs

Each service directory contains a `kustomization.yaml`.

## CI/CD Pipelines (`.github/workflows/`)

### `node.yml` — Build, Lint, Test
**Triggers:** Push to any branch

**Matrix:** Node.js 22.x, 23.x

**Services:** PostgreSQL with pgvector (`pgvector/pgvector:pg17`)
- Database: `watcher_test` at `postgresql://watcher:testpassword@localhost:5432/watcher_test`

**Steps:**
1. Checkout → setup pnpm (v4) → setup Node.js
2. `pnpm install`
3. `pnpm build`
4. `pnpm --filter @watcher/db db:migrate`
5. `pnpm lint`
6. `pnpm test`

**Trivy scan job:** Filesystem vulnerability scan for CRITICAL/HIGH severity.

### `pnpm-release.yml` — Release to GitHub Packages
**Triggers:** Push to `main`

Uses Changesets action to create version PRs or publish packages.
- Publish command: `pnpm run release`
- Publishes to: `https://npm.pkg.github.com/`
- `HUSKY=0` set during CI to skip pre-commit hooks

### `cli-docker-build.yml` — Docker Build & Push
**Triggers:** Changes to `packages/cli/` or `.github/workflows/`, or version tags

- On `main`/`master`: builds, Trivy scan, pushes `latest` to `ghcr.io/petefromglasgow/the-watcher/`
- On version tags: pushes semver tags (`{{major}}`, `{{major}}.{{minor}}`, `{{version}}`)

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `packages/api`, `packages/db` | PostgreSQL connection string |

## Important Files

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo config, scripts, dev dependencies |
| `pnpm-workspace.yaml` | Workspace: `packages/*`; injectWorkspacePackages enabled |
| `eslint.config.js` | ESLint flat config (stylistic + typescript-eslint) |
| `Tiltfile` | Local Kubernetes dev with Tilt |
| `packages/db/knexfile.ts` | Knex database configuration |
| `.changeset/config.json` | Release management config |
| `.husky/pre-commit` | Pre-commit lint + test hook |
| `.editorconfig` | Editor formatting rules |
| `CONVENTIONS.md` | Docker and Node.js patterns |
| `CONTRIBUTING.md` | Contribution guidelines |

## Security Considerations

- Vulnerability scanning with Trivy in CI (CRITICAL/HIGH)
- Identity management via Ory ecosystem (Hydra, Kratos, Keto, Oathkeeper)
- Never commit secrets or credentials — use environment variables
- Report vulnerabilities per `SECURITY.md`

## Quick Reference

```bash
# Install and build
pnpm install && pnpm build

# Run database migrations
pnpm --filter @watcher/db db:migrate

# Start services (after build)
pnpm --filter @watcher/api-gateway start:dev
pnpm --filter @watcher/api start:dev

# Test and lint
pnpm test
pnpm lint

# Local Kubernetes
tilt up

# Release
pnpm changeset
```

## Getting Help

- Review `CONTRIBUTING.md` for contribution guidelines
- Consult `CONVENTIONS.md` for Docker and Node.js patterns
- See `packages/db/` for database schema and migrations
- See `packages/core/src/types/` for core domain type definitions
