# In The Black

This is a monorepo for all of the services and tools that make up In The Black. A budgeting application that makes use of OpenBanking APIs to provide a clear, automated view of your finances.

It is an API first framework and this monorepo contains an API Gateway, backend services, and a web application. The infrastructure is designed to run natively on Kubernetes.
 

 ## Features
 
 *   🏦 **Accounts API:** Service for managing bank accounts and transactions, integrating with OpenBanking APIs.
 *   💱 **Currencies API:** Microservice handling currency conversion and exchange rates.
 *   🔍 **Query Language:** Custom, type-safe query language (`packages/query-language`) for filtering financial data, powered by grammar-based parsing.
 *   🖥️ **Web Dashboard:** Full stack Nuxt 3 application (`packages/webapp`) for visualizing your financial health.
 *   💻 **CLI Tool:** Powerful command-line interface (`packages/cli`) for interacting with the system directly from your terminal.
 *   🚪 **API Gateway:** Centralized entry point (`packages/api-gateway`) handling authentication and routing requests to appropriate services.
 *   🐳 **Kubernetes Ready:** Fully containerized microservices with Helm/manifest configurations in `infra/k8s`.
 *   🧪 **Comprehensive Testing:** Integrated unit testing with Vitest across all packages.
 *   🛡️ **Security:** Dedicated security policy and vulnerability scanning with Trivy.
 *   📖 **Documentation:** Built with VitePress for clear, accessible project docs.
 
 ## Architecture
 
 The system follows a microservices architecture, orchestrated via Kubernetes. Clients (Web and CLI) interact with the backend services through a centralized API Gateway.
 
 ```mermaid
 graph TD
     Client[Clients]
     WebApp[Web Application]
     CLI[Command Line Interface]
 
     subgraph Kubernetes Cluster
         Gateway[API Gateway]
         
         subgraph Services
             Accounts[Accounts API]
             Currencies[Currencies API]
         end
         
         DB[(Database)]
     end
     Client --> WebApp
     Client --> CLI
     WebApp --> Gateway
     CLI --> Gateway
     Gateway --> Accounts
     Gateway --> Currencies
     Accounts --> DB
     Currencies --> DB
 ```

## Usage

This project uses `pnpm` to support multiple packages in the same repository.

### Setup

```bash
# Enable Corepack
corepack enable

# Install all packages recursively
pnpm install -r
```

### Building

To build all packages (`core`, `cli`, `browser`):

```bash
pnpm build
```

This command runs the `build` script defined in the `package.json` of each individual package.

### Testing

There are separate commands for running tests:

*   **Run tests for `core` and `cli` packages:**

    ```bash
    pnpm test
    ```

*   **Run tests specifically for the `browser` package:**

    ```bash
pnpm test:browser
    ```

### Running Applications

**Web Application**

```bash
pnpm --filter nuxt-app dev
```

**API Gateway**

```bash
pnpm --filter @in-the-black/api-gateway dev
```

**Database Migrations**

```bash
pnpm --filter @in-the-black/db db:migrate
```

### Linting

To check the code style across all packages:

```bash
pnpm lint
```

To automatically fix linting issues:

```bash
pnpm lint:fix
```

### Versioning & Releasing (using Changesets)

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and generate changelogs.

1.  **Add a changeset:** When you make a change that should trigger a package release, run:

    ```bash
    pnpm changeset
    ```
    Follow the prompts to specify which packages are affected and the type of change (patch, minor, major).

2.  **Create a release pull request:** The `changeset-bot` (if configured in CI) or a manual run of `pnpm changeset version` will consume the changeset files and update package versions and changelogs.

3.  **Publish packages:** After merging the release PR, you can publish the updated packages:

    ```bash
    pnpm release
    ```
    This script typically runs `pnpm build` first, then publishes the packages using `pnpm publish -r`. *Note: The `--no-git-checks` flag is used here, be mindful of your release workflow.*

