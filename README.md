# The Watcher

A sophisticated property listing monitor that automates the process of watching, filtering, and analyzing property listings across various platforms.

## Overview

The Watcher is a monorepo containing services and tools designed to track property listings (e.g., from Gumtree, Facebook Marketplace) and provide intelligent insights. It uses LLMs for content analysis and CLIP embeddings for visual deduplication to ensure you only see unique, relevant listings.

## Key Features

*   🔍 **Automated Scraping:** Site-specific adapters for platforms like Gumtree and Facebook Marketplace, using Playwright and Cheerio.
*   🧠 **LLM-Powered Analysis:** Automatically analyzes listing descriptions and images using OpenAI or Google Gemini.
*   🖼️ **Visual Deduplication:** Uses CLIP (Contrastive Language-Image Pre-training) embeddings to identify and skip duplicate listings based on images.
*   🛡️ **Multi-Transport Support:** Flexible transport layer (Http, Playwright, BrightData, FlareSolverr) to avoid anti-bot measures.
*   💻 **CLI Tool:** Powerful command-line interface (`@watcher/cli`) to trigger runs and manage watches.
*   🚪 **API Gateway:** Centralized entry point (`@watcher/api-gateway`) for external requests with rate limiting and Swagger documentation.
*   🏗️ **Kubernetes Native:** Designed to run on K8s with a robust auth stack (Ory Kratos, Hydra, Keto, Oathkeeper) and infrastructure management using Kustomize.

## Architecture

The system follows a microservices architecture coordinated via a centralized API and a processing pipeline.

```mermaid
graph TD
    CLI[Watcher CLI]
    Gateway[API Gateway]
    API[Watcher API]
    Pipeline[Processing Pipeline]
    Scraper[Scraper/Adapters]
    CLIP[CLIP Embedding Service]
    DB[(PostgreSQL)]
    LLM[LLMs (OpenAI/Gemini)]
    Sources[Property Sites]

    CLI --> API
    CLI --> Pipeline
    Gateway --> API
    Pipeline --> API
    Pipeline --> Scraper
    Pipeline --> CLIP
    Pipeline --> LLM
    Scraper --> Sources
    API --> DB
    Pipeline --> DB
```

## Packages

| Package | Description |
| :--- | :--- |
| [`@watcher/api`](./packages/api) | Backend API service for managing watches and listings. |
| [`@watcher/api-gateway`](./packages/api-gateway) | Fastify-based gateway for routing and security. |
| [`@watcher/cli`](./packages/cli) | CLI tool to interact with the system. |
| [`@watcher/pipeline`](./packages/pipeline) | Core logic for scraping, filtering, and analysis. |
| [`@watcher/scraper`](./packages/scraper) | Orchestration for site-specific scraping. |
| [`@watcher/adapters`](./packages/adapters) | Site-specific scrapers (Gumtree, Facebook, etc.). |
| [`@watcher/transports`](./packages/transports) | Network transport layer (HTTP, Playwright, FlareSolverr). |
| [`@watcher/shared-logic`](./packages/core) | Shared logic and data models. |
| [`@watcher/db`](./packages/db) | Database migrations and seeds. |
| [`@watcher/embedding-client`](./packages/embedding-client) | Client for the CLIP embedding service. |
| `clip-service` | Python FastAPI service for CLIP embeddings. |

## Usage

This project uses `pnpm` for monorepo management.

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

To run a specific service in development mode:

```bash
pnpm --filter @watcher/api-gateway dev
pnpm --filter @watcher/api start:dev
```

### Testing

Run tests across all packages:

```bash
pnpm test
```

### CLI Tool

The `@watcher/cli` provides the `watcher` command. You can use it to trigger a watch run:

```bash
# Run a specific watch by ID
pnpm --filter @watcher/cli watch-run <watch-id>
```

## Infrastructure

The infrastructure is managed using Kustomize and can be found in `infra/k8s`. It includes:
- **PostgreSQL**: Primary data store.
- **Ory Stack**: Kratos, Hydra, Keto, Oathkeeper for identity and access management.
- **FlareSolverr**: Proxy service to bypass anti-bot protections.
- **Mailpit**: SMTP server for testing email notifications.

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs.

1.  Add a changeset: `pnpm changeset`
2.  Follow the prompts to specify package changes.
3.  Commit the generated changeset file.
4.  Releases are handled automatically via CI.

## License

ISC
