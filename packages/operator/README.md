# Watcher Operator

A Kubernetes operator (Kubebuilder/Go) that manages `Watch` Custom Resources.
Each Watch CR maps to a CronJob that runs the watcher pipeline on a schedule.

**Linear issues:** WCH-34, WCH-35, WCH-36, WCH-37, WCH-38, WCH-39

## Go + pnpm coexistence

This package is a Go module — it is **not** a pnpm workspace package and has no `package.json`.

- Go commands are run from `packages/operator/`: `make build`, `make manifests`, `make install`
- `pnpm build` at the repo root skips this directory (no `package.json` present)
- The Go module (`go.mod`) is independent of the pnpm workspace

## Commands

```bash
# Build the operator binary
make build

# Run tests (requires envtest)
make test

# Generate CRD + RBAC YAML from Go marker comments
make manifests

# Regenerate zz_generated.deepcopy.go
make generate

# Install CRDs into the current cluster
make install

# Build the Docker image
make docker-build IMG=ghcr.io/petefromglasgow/the-watcher/operator:latest
```

## Local Development

Run `tilt up` from the repo root. Tilt will:
1. Build the operator image from `packages/operator/`
2. Apply CRDs and RBAC to the local KIND cluster
3. Deploy the operator
4. Watch for Go source changes and rebuild/restart automatically

To test reconciliation manually:

```bash
kubectl apply -f packages/operator/examples/watch-example.yaml
kubectl get watches
kubectl describe watch vw-crafter-gumtree
```

## Watch CR Annotation

Each Watch CR requires a `watcher.io/db-id` annotation containing the PostgreSQL UUID of the
corresponding row in the `watches` table. The CLI `watch:run` command uses this ID:

```bash
node dist/index.js watch:run <db-id>
```

Future work: a validating admission webhook to enforce this annotation on creation.

## Architecture

```
Watch CR created/updated
        │
        ▼
WatchReconciler.Reconcile()
        │
        ├─► reconcileCronJob()   — create/patch CronJob (WCH-36)
        │       └── CronJob runs: node dist/index.js watch:run <db-id>
        │
        └─► reconcileStatus()    — query run_log, write Watch.Status (WCH-37)
                └── Requeue after 2 minutes
```
