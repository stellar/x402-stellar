# Restructure Plan: x402-stellar

## Problem Analysis

The repo is named `x402-stellar` and aspires to be the **center-place for all x402-on-Stellar work**, but it's currently structured and named as a demos-only repo (`x402-stellar-demos`). There are several structural issues:

1. **Naming mismatch** -- package names, README title, git clone URL all say "demos" but the vision is broader
2. **Flat `demos/` layout** -- the facilitator sits at `demos/facilitator/` alongside the actual demo at `demos/simple-paywall/`, but both are really examples of how to use x402 on Stellar
3. **No room for non-demo work** -- there's no place for shared libraries, tools, or the Stellar mechanism package itself to evolve
4. **Vendor packages are inlined blobs** -- the `vendors/x402/` tree carries pre-built dist from a fork; as `@x402/stellar` evolves this becomes the development home, not just vendored binaries
5. **Infrastructure is example-specific** -- Dockerfiles, Heroku config, nginx, and `deploy/` are all tightly coupled to the single simple-paywall example
6. **Multiple redundant Dockerfiles** -- `Dockerfile`, `Dockerfile-3`, `Dockerfile-optimized` all exist with overlapping purposes
7. **README is outdated** -- still references submodules, old repo name, old clone URL

---

## Proposed New Structure

```
x402-stellar/
├── examples/                          # Example applications showcasing x402 on Stellar
│   ├── facilitator/                   # Example Stellar facilitator service
│   │   ├── src/
│   │   ├── package.json               # @x402-stellar/example-facilitator
│   │   └── ...
│   │
│   └── simple-paywall/                # Example paywall demo (server + client)
│       ├── server/                    # @x402-stellar/example-simple-paywall-server
│       ├── client/                    # @x402-stellar/example-simple-paywall-client
│       └── docker-compose.yml         # Example-local compose
│
├── vendors/                           # Vendored external dependencies
│   └── x402/                          # Pre-built @x402/* packages
│       └── typescript/packages/
│
├── infra/                             # All infrastructure / deployment configs
│   └── heroku/
│       ├── nginx.conf.template        # Moved from deploy/heroku/
│       └── start.sh                   # Moved from deploy/heroku/
│
├── Dockerfile                         # Multi-target Dockerfile (must be at repo root — see note below)
├── heroku.yml                         # Heroku build manifest (must be at repo root — see note below)
├── package.json                       # name: "x402-stellar"
├── pnpm-workspace.yaml                # examples/*/* + examples/* + vendors/...
├── turbo.json
├── tsconfig.base.json
├── eslint.config.mjs
├── .prettierrc.json
├── .env.example
├── Makefile
├── README.md                          # Rewritten for the broader vision
└── .gitignore
```

### Key Changes

> **Note: Heroku root constraint** — Heroku requires `heroku.yml` at the repo root and sets the Docker build context to the directory containing the Dockerfile. If the Dockerfile were at `infra/docker/Dockerfile`, the build context would be `infra/docker/`, breaking all `COPY` commands that reference workspace files (`pnpm-workspace.yaml`, `vendors/`, `examples/`, etc.). Therefore both `Dockerfile` and `heroku.yml` must live at the repo root. Supporting files (`start.sh`, `nginx.conf.template`) remain in `infra/heroku/` since the Dockerfile references them relative to the build context (repo root).

| What                  | Before                                                                 | After                                               | Why                                                            |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| **Root package name** | `x402-stellar-demos`                                                   | `x402-stellar`                                      | Reflects broader scope                                         |
| **Package scope**     | `@x402-stellar-demos/*`                                                | `@x402-stellar/*`                                   | Consistent naming                                              |
| **Top-level folder**  | `demos/`                                                               | `examples/`                                         | Both facilitator and simple-paywall are examples, not packages |
| **Facilitator**       | `demos/facilitator/`                                                   | `examples/facilitator/`                             | It's an example facilitator, not a reusable package            |
| **Simple paywall**    | `demos/simple-paywall/`                                                | `examples/simple-paywall/`                          | Consistent with examples convention                            |
| **Dockerfiles**       | 3 files at root (`Dockerfile`, `Dockerfile-3`, `Dockerfile-optimized`) | Single `Dockerfile` at repo root                    | Consolidate; one multi-target file. Must be at root for Heroku |
| **Heroku config**     | `heroku.yml` at root + `deploy/heroku/`                                | `heroku.yml` at root + `infra/heroku/`              | heroku.yml must be at root; support files in infra/heroku/     |
| **Deploy dir**        | `deploy/heroku/`                                                       | `infra/heroku/`                                     | `infra/` is more standard and allows for future platforms      |
| **docker-compose**    | `demos/simple-paywall/docker-compose.yml` (+ 2 variants)               | Single `examples/simple-paywall/docker-compose.yml` | Remove redundant variants                                      |
| **Planning docs**     | `PLAN.md`, `heroku-plan.md` at root                                    | Deleted (historical, no longer needed)              | They document the initial build, not ongoing architecture      |
| **README**            | Demos-only, references submodules                                      | Rewritten: broader vision, updated setup            | Reflects new reality                                           |

---

## Migration Plan

### Phase 1: Rename and Restructure (no behavior change)

1. **Rename root package** -- `package.json` name from `x402-stellar-demos` to `x402-stellar`
2. **Rename `demos/` to `examples/`** -- `git mv demos examples`
3. **Rename package scope** -- all `@x402-stellar-demos/*` packages become `@x402-stellar/*`
   - `@x402-stellar-demos/facilitator` -> `@x402-stellar/facilitator`
   - `@x402-stellar-demos/simple-paywall-server` -> `@x402-stellar/simple-paywall-server`
   - `@x402-stellar-demos/simple-paywall-client` -> `@x402-stellar/simple-paywall-client`
4. **Update `pnpm-workspace.yaml`** -- replace `demos/` globs with `examples/` globs
5. **Update all internal imports / turbo filters** -- `package.json` scripts, turbo filters that reference the old scope

### Phase 2: Consolidate Infrastructure

6. **Create `infra/` directory** -- `mkdir -p infra/docker infra/heroku`
7. **Consolidate Dockerfiles** -- delete `Dockerfile` and `Dockerfile-optimized`, and move `Dockerfile-3` to repo root as `Dockerfile`. Must remain at root for Heroku build context.
8. **Move Heroku support files** -- `deploy/heroku/*` -> `infra/heroku/` (keep `heroku.yml` at root)
9. **Update `heroku.yml`** -- adjust `dockerfile:` path to `Dockerfile`
10. **Update Dockerfile paths** -- all `COPY` instructions need to account for new build context or adjust `docker-compose.yml` accordingly
11. **Remove redundant files** -- delete `deploy/` directory
12. **Remove redundant docker-compose variants** -- move `docker-compose-3.yml` to `demos/simple-paywall/docker-compose.yml`, and delete the other docker-compose files.

### Phase 3: Clean Up

13. **Delete planning docs** -- remove `PLAN.md` and `heroku-plan.md` (they document the original build, not the ongoing project)
14. **Update `Makefile`** -- adjust clean targets, add any new convenience targets for the broader scope
15. **Update `.dockerignore` and `.gitignore`** -- adjust for new paths

### Phase 4: Rewrite README

16. **Rewrite `README.md`** with this structure:
    - **Title**: `x402 Stellar` (not "demos")
    - **Description**: Center-place for x402 protocol on Stellar -- tools, examples, and references
    - **Repository Structure**: Updated tree showing `examples/`, `vendors/`, `infra/`
    - **Quick Start**: Getting the simple-paywall example running (the primary entry point)
    - **Examples**: Table listing available examples with short descriptions
    - **Development**: Prerequisites, install, build, test, lint
    - **Deployment**: How Heroku deployment works (brief, point to `infra/heroku/`)
    - **Environment Variables**: Keep the existing table
    - **Adding a New Example**: Brief guide for contributors

### Phase 5: Verify

17. **Run `pnpm install`** -- verify workspace resolution works
18. **Run `pnpm lint`** -- verify linting works with new paths and no errors
19. **Run `pnpm typecheck`** -- verify TypeScript compiles with new structure
20. **Run `pnpm build`** -- verify turbo builds everything in order
21. **Run `pnpm test`** -- verify existing tests pass
22. **Docker build** -- verify `docker build --target heroku .` works

---

## What This Unlocks for the Future

- **New top-level directories** -- e.g. `packages/` for shared libraries when the need arises, without restructuring again
- **New examples** in `examples/` -- e.g. `examples/subscription-paywall`, `examples/api-monetization`, each self-contained
- **Moving `@x402/stellar` out of vendors** -- when the Stellar mechanism package becomes this repo's primary development artifact, it can move to a top-level `packages/` dir and the vendored copy gets removed
- **Multiple deployment targets** -- `infra/fly/`, `infra/railway/`, etc. alongside `infra/heroku/`
