.PHONY: help install build dev lint lint-fix format format-check typecheck test audit check clean \
       docker-build-facilitator docker-build-server docker-build-client docker-build-all docker-push-all

# ── Docker image tags (overridable by CI) ──────────────────────
SUDO := $(shell docker version >/dev/null 2>&1 || echo "sudo")
LABEL ?= $(shell git rev-parse --short HEAD)$(and $(shell git status -s),-dirty-$(shell id -u -n))
BUILD_DATE := $(shell date -u +%FT%TZ)

FACILITATOR_TAG ?= x402-stellar-facilitator:$(LABEL)
SERVER_TAG      ?= x402-stellar-server:$(LABEL)
CLIENT_TAG      ?= x402-stellar-client:$(LABEL)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

build: ## Build the project
	pnpm build

dev: ## Start dev servers
	pnpm dev

lint: ## Run linter
	pnpm lint

lint-fix: ## Run linter with auto-fix
	pnpm lint:fix

format: ## Format code
	pnpm format

format-check: ## Check code formatting
	pnpm format:check

typecheck: ## Type check the project
	pnpm typecheck

test: ## Run tests
	pnpm test

audit: ## Check dependencies for high/critical vulnerabilities
	pnpm audit --audit-level high

check: install format lint typecheck test audit build ## Install, run all checks (format, lint, typecheck, test, audit), and build

clean: ## Clean build artifacts
	rm -rf dist
	find examples -name dist -type d -exec rm -rf {} + 2>/dev/null || true
	find examples -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true

# ── Docker targets (used by CI/CD pipelines) ───────────────────

docker-build-facilitator: ## Build facilitator Docker image
	$(SUDO) docker build --pull \
		--label org.opencontainers.image.created="$(BUILD_DATE)" \
		--target facilitator -t $(FACILITATOR_TAG) .

docker-build-server: ## Build server Docker image
	$(SUDO) docker build --pull \
		--label org.opencontainers.image.created="$(BUILD_DATE)" \
		--target server -t $(SERVER_TAG) .

docker-build-client: ## Build client Docker image
	$(SUDO) docker build --pull \
		--label org.opencontainers.image.created="$(BUILD_DATE)" \
		--target client -t $(CLIENT_TAG) .

docker-build-all: docker-build-facilitator docker-build-server docker-build-client ## Build all Docker images

docker-push-all: ## Push all Docker images
	$(SUDO) docker push $(FACILITATOR_TAG)
	$(SUDO) docker push $(SERVER_TAG)
	$(SUDO) docker push $(CLIENT_TAG)
