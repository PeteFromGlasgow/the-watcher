# Development Infrastructure

Local Kubernetes development setup using Tilt & Kustomize.

## Tilt Development Environment

### Starting Tilt

```bash
tilt up
```

This command:
- Starts local Kubernetes cluster
- Builds Docker images for all services
- Deploys services to Kubernetes
- Enables live reloading for code changes

### Tilt Configuration

Located in `Tiltfile` at project root.

### Services with Live Reload

The following services have live reloading enabled:
- **api-gateway**: Syncs `src/`, `test/`, and `dist/` directories
- **accounts-api**: Syncs `src/`, `test/`, and `dist/` directories
- **currencies-api**: Syncs `src/`, `test/`, and `dist/` directories
- **webapp**: Syncs `app/`, `public/`, and `.output/` directories

### Resource Labels

Services are organized by labels in Tilt UI:
- **application**: Main app services (api-gateway, webapp, currencies-api, accounts-api)
- **auth**: Authentication services (Hydra, Keto, Kratos, Oathkeeper)
- **databases**: Database services (postgres, db-migrations)
- **tooling**: Development tools (mailpit, kratos-admin-ui)

## Kubernetes Manifests

### Structure

```
infra/k8s/
├── base/                  # Base manifests for all environments
│   ├── api-gateway/
│   ├── accounts-api/
│   ├── currencies-api/
│   ├── webapp/
│   ├── db-migrations/
│   ├── postgres/
│   └── [auth services]/
└── overlays/
    ├── development/       # Dev-specific configs
    └── production/        # Production configs
```

### Using Kustomize

Tilt uses Kustomize to load manifests:
```bash
kustomize build infra/k8s/overlays/development
```

## Adding New Services

When creating a new package that should be deployed:

1. **Create Dockerfile** in the package directory
2. **Add Kubernetes manifests** in `infra/k8s/base/<service-name>/`
   - `deployment.yaml`
   - `service.yaml`
   - `kustomization.yaml`
3. **Update Tiltfile** with custom_build() configuration
4. **Add to overlay** in `infra/k8s/overlays/development/kustomization.yaml`

### Docker Image Naming

Use this format:
```
ghcr.io/petefromglasgow/in-the-black/<service-name>
```

## Port Forwarding

Managed through Kubernetes Gateway API (not Tilt port forwards).

Postgres is exposed on `localhost:5432` for local database access.

## Local Resources

The `create-hydra-client` script runs automatically to set up OAuth clients.

## Reference

See `Tiltfile` for complete Tilt configuration.
See `infra/k8s/` for Kubernetes manifests.