# Tiltfile for in-the-black


# --- Config ---
# The name of the kind cluster used for local development
KIND_CLUSTER_NAME = 'in-the-black-dev'

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
    'ghcr.io/petefromglasgow/in-the-black/api-gateway',
    'docker build -t $EXPECTED_REF -f ./packages/api-gateway/Dockerfile --target build .',
    deps=['./packages/api-gateway', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml'],
    entrypoint=['pnpm', '--filter=@in-the-black/api-gateway', 'run', 'start:dev'],
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
    'ghcr.io/petefromglasgow/in-the-black/webapp',
    'docker build -t $EXPECTED_REF -f ./packages/webapp/Dockerfile --target build .',
    deps=['./packages/webapp', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml'],
    entrypoint=['pnpm', '--filter=nuxt-app', 'run', 'dev'],
    live_update=[
        sync(
            './packages/webapp/.output',
            '/app/packages/webapp/.output'
        ),
        sync(
            './packages/webapp/app',
            '/app/packages/webapp/app',
        ),
        sync(
            './packages/webapp/public',
            '/app/packages/webapp/public',
        )
    ]
)

custom_build(
    'ghcr.io/petefromglasgow/in-the-black/db-migrations',
    'docker build -t $EXPECTED_REF -f ./packages/db/Dockerfile .',
    deps=['./packages/db', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml']
)

custom_build(
    'ghcr.io/petefromglasgow/in-the-black/api',
    'docker build -t $EXPECTED_REF -f ./packages/api/Dockerfile --target build .',
    deps=['./packages/api', './pnpm-workspace.yaml', './package.json', './pnpm-lock.yaml'],
    entrypoint=['pnpm', '--filter=@in-the-black/api', 'run', 'start:dev'],
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

# --- Default Registry ---
# Use the value of the TILT_DEFAULT_REGISTRY environment variable, if it's set.
# Otherwise, use the default value.
DEFAULT_REGISTRY = os.environ.get('TILT_DEFAULT_REGISTRY', 'localhost:5000')
default_registry(DEFAULT_REGISTRY)

# --- Port Forwards ---
# This section will be populated as we add services
# Port forwards have been replaced by Kubernetes Gateway API
k8s_resource("api-gateway", labels="application")
k8s_resource("webapp", labels="application")
k8s_resource("api", labels="application")

k8s_resource("hydra", labels="auth")
k8s_resource("keto", labels="auth")
k8s_resource("kratos", labels="auth")
k8s_resource("oathkeeper", labels="auth")

k8s_resource("postgres", labels="databases", port_forwards=["5432:5432"])
k8s_resource("db-migrations", labels="databases")

k8s_resource('mailpit', labels="tooling")
k8s_resource('kratos-admin-ui', labels="tooling")

# --- Local Resources ---
local_resource(
    'create-hydra-client',
    cmd='./infra/scripts/create-hydra-client.sh',
    deps=['./infra/scripts/create-hydra-client.sh']
)
