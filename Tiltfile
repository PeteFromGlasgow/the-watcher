# Tiltfile for the-watcher


# --- Config ---
# The name of the kind cluster used for local development
KIND_CLUSTER_NAME = 'watcher-dev'

# The path to the k8s manifests
K8S_MANIFESTS_PATH = './infra/k8s/overlays/development'

# --- Setup ---
# Allow Tilt to run against the default Kubernetes context for local development
allow_k8s_contexts('default')

# Ensure the user has the necessary tools installed
local('tilt doctor')

# --- Kubernetes ---
# Load the k8s resources from our development overlay
k8s_yaml(kustomize(K8S_MANIFESTS_PATH))

# --- Docker Builds ---
custom_build(
    'ghcr.io/petefromglasgow/the-watcher/api-gateway',
    'docker build -t $EXPECTED_REF -f ./packages/api-gateway/Dockerfile --target build .',
    deps=['./packages/api-gateway', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml'],
    entrypoint=['pnpm', '--filter=@watcher/api-gateway', 'run', 'start:dev'],
    live_update=[
        sync(
            './packages/api-gateway/dist',
            '/app/packages/api-gateway/dist'
        ),
        sync(
            './packages/api-gateway/src',
            '/app/packages/api-gateway/src'
        ),
        sync(
            './packages/api-gateway/test',
            '/app/packages/api-gateway/test'
        )
    ]
)

custom_build(
    'ghcr.io/petefromglasgow/the-watcher/db-migrations',
    'docker build -t $EXPECTED_REF -f ./packages/db/Dockerfile .',
    deps=['./packages/db', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml']
)

custom_build(
    'ghcr.io/petefromglasgow/the-watcher/api',
    'docker build -t $EXPECTED_REF -f ./packages/api/Dockerfile --target build .',
    deps=['./packages/api', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml'],
    entrypoint=['pnpm', '--filter=@watcher/api', 'run', 'start:dev'],
    live_update=[
        sync(
            './packages/api/dist',
            '/app/packages/api/dist'
        ),
        sync(
            './packages/api/src',
            '/app/packages/api/src'
        ),
        sync(
            './packages/api/test',
            '/app/packages/api/test'
        )
    ]
)

docker_build(
    'ghcr.io/petefromglasgow/the-watcher/clip-service',
    './packages/clip-service',
    dockerfile='./packages/clip-service/Dockerfile'
)

# Operator: rebuild on any Go source change, live-reload inside the pod
docker_build(
    'ghcr.io/petefromglasgow/the-watcher/operator',
    context='./packages/operator',
    dockerfile='./packages/operator/Dockerfile',
    live_update=[
        sync('./packages/operator', '/app'),
        run(
            'cd /app && CGO_ENABLED=0 go build -o /manager ./cmd/main.go',
            trigger=['./packages/operator/**/*.go']
        )
    ]
)

# --- Default Registry ---
# Use the value of the TILT_DEFAULT_REGISTRY environment variable, if it's set.
# Otherwise, use the default value.
DEFAULT_REGISTRY = os.environ.get('TILT_DEFAULT_REGISTRY', 'localhost:5000')
default_registry(DEFAULT_REGISTRY)

# --- Port Forwards ---
k8s_resource("api-gateway", labels="application")
k8s_resource("api", labels="application")

k8s_resource("hydra", labels="auth")
k8s_resource("keto", labels="auth")
k8s_resource("kratos", labels="auth")
k8s_resource("oathkeeper", labels="auth")

k8s_resource("postgres", labels="databases", port_forwards=["5432:5432"])
k8s_resource("db-migrations", labels="databases")

k8s_resource('mailpit', labels="tooling")
k8s_resource('kratos-admin-ui', labels="tooling")
k8s_resource('flaresolverr', labels="tooling")
k8s_resource('clip-service', labels="tooling")

k8s_resource('watcher-operator', port_forwards='8081:8081', labels="operator")

# --- Local Resources ---
local_resource(
    'create-hydra-client',
    cmd='./infra/scripts/create-hydra-client.sh',
    deps=['./infra/scripts/create-hydra-client.sh']
)
