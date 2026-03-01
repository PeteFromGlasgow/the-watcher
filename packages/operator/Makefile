# Kubebuilder-style Makefile for the watcher operator.
# Run commands from this directory: cd packages/operator && make <target>

# Tool versions
CONTROLLER_GEN_VERSION ?= v0.15.0
ENVTEST_VERSION ?= release-0.18

# Build settings
BINARY ?= bin/manager
IMG ?= ghcr.io/petefromglasgow/the-watcher/operator:latest

# CRD output path (relative to repo root via symlink or direct path)
CRD_OUTPUT ?= ../../infra/k8s/base/operator/crds

# Detect OS
UNAME_S := $(shell uname -s)

##@ General

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: fmt
fmt: ## Run go fmt on all Go source files.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet on all Go source files.
	go vet ./...

.PHONY: test
test: fmt vet envtest ## Run tests using envtest.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) --bin-path $(LOCALBIN)/k8s -p path)" \
		go test ./... -coverprofile cover.out

##@ Build

.PHONY: build
build: fmt vet ## Build the operator binary.
	go build -o $(BINARY) ./cmd/main.go

.PHONY: run
run: fmt vet ## Run the operator locally against the configured Kubernetes cluster.
	go run ./cmd/main.go

.PHONY: docker-build
docker-build: ## Build the operator Docker image.
	docker build -t $(IMG) .

.PHONY: docker-push
docker-push: ## Push the operator Docker image.
	docker push $(IMG)

##@ Deployment

.PHONY: manifests
manifests: controller-gen ## Generate CRD and RBAC YAML from Go struct markers.
	$(CONTROLLER_GEN) rbac:roleName=watcher-operator-role crd webhook paths="./..." \
		output:crd:artifacts:config=$(CRD_OUTPUT) \
		output:rbac:artifacts:config=../../infra/k8s/base/operator

.PHONY: generate
generate: controller-gen ## Run controller-gen to regenerate zz_generated.deepcopy.go.
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

.PHONY: install
install: manifests ## Install CRDs into the cluster.
	kubectl apply -f $(CRD_OUTPUT)

.PHONY: uninstall
uninstall: ## Remove CRDs from the cluster.
	kubectl delete --ignore-not-found -f $(CRD_OUTPUT)

.PHONY: deploy
deploy: manifests ## Deploy the operator to the cluster.
	kubectl apply -k ../../infra/k8s/base/operator

##@ Tools

LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

CONTROLLER_GEN ?= $(LOCALBIN)/controller-gen
ENVTEST ?= $(LOCALBIN)/setup-envtest

.PHONY: controller-gen
controller-gen: $(CONTROLLER_GEN) ## Download controller-gen locally.
$(CONTROLLER_GEN): $(LOCALBIN)
	GOBIN=$(LOCALBIN) go install sigs.k8s.io/controller-tools/cmd/controller-gen@$(CONTROLLER_GEN_VERSION)

.PHONY: envtest
envtest: $(ENVTEST) ## Download setup-envtest locally.
$(ENVTEST): $(LOCALBIN)
	GOBIN=$(LOCALBIN) go install sigs.k8s.io/controller-runtime/tools/setup-envtest@$(ENVTEST_VERSION)
