# CLAUDE.md - AI Assistant Guide for In The Black

This document provides comprehensive guidance for AI assistants working with the In The Black codebase.

## Project Overview

**In The Black** is a personal finance and budgeting application that integrates with OpenBanking APIs. It is built as a monorepo with a microservices architecture designed to run natively on Kubernetes.

### Core Purpose
- Automated financial tracking via OpenBanking API integration
- Double-entry bookkeeping for accurate financial records
- Budget management with hierarchical "pots" for categorization
- Multi-currency support with exchange rate handling

## Architecture

```
Clients (Web/CLI) → API Gateway → Microservices → PostgreSQL Database
                         ↓
              Ory Identity Stack (Hydra, Kratos, Oathkeeper)
```

### Key Services
- **API Gateway** (`packages/api-gateway`): Centralized entry point handling auth and routing
- **Accounts API** (`packages/accounts-api`): Bank accounts and transaction management
- **Currencies API** (`packages/currencies-api`): Currency conversion and exchange rates
- **Web Application** (`packages/webapp`): Nuxt 3 dashboard
- **CLI** (`packages/cli`): Command-line interface tool

## Repository Structure

```
in-the-black/
├── packages/
│   ├── api-gateway/          # Fastify-based API Gateway
│   ├── accounts-api/         # Accounts microservice
│   ├── currencies-api/       # Currency conversion service
│   ├── cli/                  # Commander.js CLI tool
│   ├── webapp/               # Nuxt 3 web application
│   ├── core/                 # Shared business logic (@in-the-black/shared-logic)
│   ├── browser/              # Browser-compatible library build
│   ├── db/                   # Knex migrations and seeds
│   ├── query-language/       # Custom Chevrotain-based query parser
│   └── query-language-knex/  # Query language Knex adapter
├── infra/
│   └── k8s/
│       ├── base/             # Base Kubernetes manifests
│       └── overlays/         # Environment-specific configs (dev/prod)
├── docs/                     # VitePress documentation site
└── .github/workflows/        # CI/CD pipelines
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22.x (tested on 18.x, 20.x, 22.x) |
| Package Manager | pnpm 10.15.1 |
| Language | TypeScript 5.9 (strict mode) |
| Backend Framework | Fastify 5.5 |
| Frontend Framework | Nuxt 3 / Vue 3 |
| CSS | Tailwind CSS 4.x |
| Database | PostgreSQL with Knex.js |
| Testing | Vitest + Playwright |
| Containerization | Docker + Kubernetes |
| Identity | Ory ecosystem (Hydra, Kratos, Oathkeeper) |

## Development Commands

### Setup
```bash
corepack enable              # Enable pnpm
pnpm install                 # Install all dependencies
pnpm build                   # Build all packages
```

### Running Services
```bash
pnpm --filter nuxt-app dev                    # Web application
pnpm --filter @in-the-black/api-gateway dev   # API Gateway
pnpm --filter @in-the-black/db db:migrate     # Database migrations
```

### Testing
```bash
pnpm test           # Run tests for core and CLI packages
pnpm test:browser   # Run browser-based tests (Chromium, Firefox, WebKit)
```

### Code Quality
```bash
pnpm lint           # Check code style
pnpm lint:fix       # Auto-fix linting issues
```

### Documentation
```bash
pnpm docs:dev       # Local docs server
pnpm docs:build     # Build documentation
```

## Code Style & Conventions

### ESLint Configuration
- **Indent**: 2 spaces
- **Semicolons**: None (omitted)
- **Quotes**: Single quotes (with `avoidEscape: true`)
- **Trailing commas**: Never (`commaDangle: 'never'`)
- **Line endings**: LF only
- **Unused variables**: Prefixed with `_` to indicate intentional non-use

### TypeScript Configuration
- **Strict mode**: Enabled with all strict options
- **Module**: ESNext with NodeNext resolution
- **Target**: ESNext
- **Declaration files**: Generated with source maps

### Module System
- All packages use ES modules (`"type": "module"`)
- Use proper ESM import/export syntax

### Naming Conventions
- Files: kebab-case (`api-gateway.ts`)
- Classes: PascalCase
- Functions/variables: camelCase
- Database columns: snake_case (`created_at`, `user_id`)
- Constants: UPPER_SNAKE_CASE

## Database Conventions

Refer to `packages/db/DB_DESIGN.md` for complete schema documentation.

### Key Principles
- **Primary keys**: UUID for all user-modifiable data
- **Timestamps**: All tables have `created_at` and `updated_at`
- **Soft deletes**: Use `deleted_at` field where appropriate
- **Monetary values**: DECIMAL type for precision (not MONEY)
- **Foreign keys**: Enforced for data integrity

### Double-Entry Accounting
Transactions use a split model where debits and credits must balance to zero:
- `transactions` table: Parent record with date, payee, status
- `transaction_splits` table: Individual debit/credit entries
- Sum of all splits for a transaction must equal zero

## API Patterns

### Fastify Services
- Export a `buildApp()` function for testability
- Include health check endpoint (`GET /health`)
- Use request headers for user context (`x-user-id`, `x-subject`)

### RESTful Conventions
- Standard CRUD operations
- Proper HTTP status codes
- JSON request/response bodies

## Git Workflow

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build/dependency updates

### Pre-commit Hooks
Husky runs before each commit:
```bash
pnpm run lint
pnpm t
```

### Changesets
For version management:
```bash
pnpm changeset          # Add a changeset for your changes
pnpm changeset version  # Update versions (usually automated)
pnpm release            # Build and publish
```

## Testing Guidelines

### Test File Location
- Place tests in `packages/*/test/` directories
- Name test files `*.test.ts`

### Test Framework
- Use Vitest for unit and integration tests
- Use Playwright for browser/E2E tests
- Coverage provider: V8

### Fastify Testing Pattern
```typescript
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
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
  })
})
```

## Docker & Kubernetes

### Dockerfile Best Practices
- Multi-stage builds for minimal production images
- Use `dumb-init` for proper signal handling
- Run as non-root user
- Cache pnpm store with `--mount=type=cache`

### Local Kubernetes Development
Use Tilt for live reloading:
```bash
tilt up
```

### Infrastructure Layout
- `infra/k8s/base/`: Base manifests for all services
- `infra/k8s/overlays/development/`: Dev-specific configs
- `infra/k8s/overlays/production/`: Production configs

## CI/CD Pipelines

### Main Workflows
1. **node.yml**: Runs on every push
   - Linting
   - Tests on Node 18.x, 20.x, 22.x
   - Browser tests (Chromium, Firefox, WebKit)
   - Trivy security scanning

2. **pnpm-release.yml**: Runs on main branch
   - Changesets version management
   - Package publishing to GitHub Packages

3. **docs-deploy.yml**: Deploys docs to GitHub Pages

## Important Files

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo config and scripts |
| `pnpm-workspace.yaml` | Workspace package definitions |
| `eslint.config.js` | ESLint flat config |
| `Tiltfile` | Local Kubernetes development |
| `packages/db/knexfile.ts` | Database configuration |
| `.changeset/config.json` | Release management |

## Security Considerations

- Vulnerability scanning with Trivy in CI
- Identity management via Ory ecosystem
- Never commit secrets or credentials
- Use environment variables for configuration
- Report vulnerabilities per SECURITY.md

## Query Language

The project includes a custom type-safe query language for filtering financial data:
- Built with Chevrotain parser generator
- Located in `packages/query-language/`
- Knex adapter in `packages/query-language-knex/`

## Quick Reference

```bash
# Common development tasks
pnpm install              # Install dependencies
pnpm build                # Build all packages
pnpm test                 # Run tests
pnpm lint                 # Check code style
pnpm changeset            # Create changeset for release

# Run specific packages
pnpm --filter <package-name> <command>

# Database operations
pnpm --filter @in-the-black/db db:migrate

# Documentation
pnpm docs:dev
```

## Getting Help

- Check existing documentation in `docs/` directory
- Review `CONTRIBUTING.md` for contribution guidelines
- Consult `CONVENTIONS.md` for Docker and Node.js patterns
- See `packages/db/DB_DESIGN.md` for database schema details
