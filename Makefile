.PHONY: help install build dev lint lint-fix format format-check typecheck test check clean

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

check: install format lint typecheck test build ## Install, run all checks (format, lint, typecheck, test), and build

clean: ## Clean build artifacts
	rm -rf dist
	find examples -name dist -type d -exec rm -rf {} + 2>/dev/null || true
	find examples -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true
