# Project Brief: In the Black

## 1. Core Idea

An opinionated, zero-sum budgeting application for power-users, individuals, and professionals. It enables proactive financial planning and retrospective analysis through a robust feature set. The core philosophy is to empower users by helping them assign every dollar a job.

## 2. Key Features & Differentiators

- **Zero-Sum Methodology**: The application's workflow is designed around this core principle.
- **Advanced Categorization**:
  - **Nested Pots**: Unlimited depth for categories (e.g., `Expenses > Food > Groceries`).
  - **`key:value` Labels**: Flexible tagging for cross-category reporting (e.g., `trip:paris-2025`).
- **Project & Shared Budgeting**: Isolate budgets for specific goals (Projects) or share pots with others (Couples, Housemates).
- **Clearing House**: A system to match pending bank transactions with receipts and notes before they are finalized, ensuring perfect reconciliation.
- **Power-User UI**: A spreadsheet-style web interface for speed and data density.
- **Open Source & Self-Hostable**: The core application will be open-source.

## 3. Monetization Strategy

- **Model**: Open Core / Freemium.
- **Cloud Version**: Standard freemium SaaS with a subscription to unlock premium features.
- **Self-Hosted Version**: Core is free. A paid license key is required to activate premium features.
- **Premium Features**:
  - Direct Bank Integration (via 3rd party APIs).
  - AI-Powered Features (Receipt Parsing, Auto-Clearing).

## 4. Phased Rollout Plan

- **Phase 1 (MVP)**:
  - Nuxt Web Application (PWA, mobile-responsive).
  - All core budgeting features with manual transaction entry.
  - Basic PWA offline support (app shell caching), but requires an online connection for data modification.
- **Phase 2 (Post-MVP)**:
  - Implement Premium Features (Bank Sync, AI).
  - Develop and release the robust, bi-directional offline synchronization engine.
- **Future**:
  - Dedicated native mobile applications using Flutter.

## 5. Architecture & Design Principles

- **API-First**: The backend API is the core product, serving all clients.
- **Microservices**: Services are broken down by business domain.
- **Strong Contracts**: Inter-service communication and data structures are strictly defined.
- **Future-Proof Data Model**: All user-modifiable data will use:
  - `UUID` primary keys.
  - `createdAt`, `updatedAt` timestamps.
  - Soft deletes (`deletedAt` field).

## 6. Technology Stack

### Backend
- **Language**: Node.js with TypeScript
- **Framework**: Fastify (for API Gateway and services)
- **Database**: PostgreSQL
- **Query Builder**: Knex.js
- **Messaging Queue**: NATS/Jetstream
- **Deployment**: Kubernetes (managed via Helm/Kustomize)

### Frontend (Web)
- **Framework**: Nuxt 3 (Vue.js)

### Cross-Cutting & Tooling
- **Monorepo Manager**: pnpm workspaces
- **API Specification**: OpenAPI 3.0
- **Data Contracts**: Protocol Buffers (Protobufs)
- **TS Proto Generator**: `ts-proto`
- **Testing**: Vitest
- **Linting**: ESLint + Stylistic
- **Local K8s Development**: Tilt

