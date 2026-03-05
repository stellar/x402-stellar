---
name: x402-stellar-checks
description: Verification, build, test, and Docker checks for the x402-stellar monorepo. Use before committing, after rebasing, when modifying packages, or when asked to verify the project works.
---

# x402-stellar Checks

## Architecture

pnpm 10.7.0 monorepo with Turborepo. Filter: `--filter='@x402-stellar/*'`.

| Package                          | Role                                         |
| -------------------------------- | -------------------------------------------- |
| `packages/paywall`               | React paywall bundled to HTML (esbuild+tsup) |
| `examples/facilitator`           | Express: Stellar payment verify/settle       |
| `examples/simple-paywall/server` | Express: x402 payment middleware             |
| `examples/simple-paywall/client` | React/Vite SPA                               |
| `vendors/x402/typescript/`       | 4 pre-built vendor packages (never modify)   |

**Build order** (turbo handles this): `paywall` -> `server` (server imports paywall).

**Endpoints**:

| Service     | Port | Routes                                                                |
| ----------- | ---- | --------------------------------------------------------------------- |
| Facilitator | 4022 | `POST /verify`, `POST /settle`, `GET /supported`, `GET /health`       |
| Server      | 3001 | `GET /health`, `GET /networks`, `GET /protected/:network` (paywalled) |
| Client      | 5173 | SPA (dev), 8080 (docker)                                              |

## Full Check

```bash
make check   # install -> format -> lint -> typecheck -> test -> build
```

Expected: all 4 packages pass. 90 tests total (55 server + 35 facilitator), all green.

`packages/paywall/src/gen/template.ts` formatting diffs are expected (auto-generated).

After `make check` passes, also verify the Docker Compose build succeeds:

```bash
docker compose -f examples/simple-paywall/docker-compose.yml build
```

This catches issues that only surface in the container environment (e.g. missing
files in `COPY` instructions, pnpm patches not available at install time). The
Docker build must pass before considering a change fully verified.

## Scenario Checks

| Changed                   | Run                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/paywall/`       | `pnpm build && pnpm test`                                                                           |
| Facilitator routes/config | `pnpm typecheck && pnpm test --filter=@x402-stellar/facilitator`                                    |
| Server routes/middleware  | `pnpm typecheck && pnpm test --filter=@x402-stellar/simple-paywall-server`                          |
| Client SPA                | `pnpm build --filter=@x402-stellar/simple-paywall-client` + manual browser check                    |
| `package.json` / deps     | `pnpm install && make check` + `docker compose -f examples/simple-paywall/docker-compose.yml build` |
| Quick lint + types only   | `pnpm typecheck && pnpm lint`                                                                       |

## Smoke Tests

`smoke-test.sh` tests all endpoints: health, facilitator routes, 402 paywall, client SPA, security headers, and error leak prevention.

```bash
# Local (default ports)
.opencode/skills/x402-stellar-checks/scripts/smoke-test.sh

# Remote / all-in-one deploy
.opencode/skills/x402-stellar-checks/scripts/smoke-test.sh https://x402-stellar-491bf9f7e30b.herokuapp.com

# Custom ports
FACILITATOR=http://host:4022 SERVER=http://host:3001 CLIENT=http://host:8080 \
  .opencode/skills/x402-stellar-checks/scripts/smoke-test.sh
```

## Docker Verification

Multi-stage `Dockerfile` at repo root. Targets: `facilitator`, `server`, `client`, `heroku`.

### Quick build check (no run)

```bash
docker build --target heroku -t x402-heroku-test .
```

### Full docker compose test

`docker-smoke-test.sh` builds, starts, waits for healthy, runs smoke tests, then tears down.

```bash
.opencode/skills/x402-stellar-checks/scripts/docker-smoke-test.sh          # docker compose (3 containers)
.opencode/skills/x402-stellar-checks/scripts/docker-smoke-test.sh heroku   # heroku all-in-one target
```

Compose file: `examples/simple-paywall/docker-compose.yml` (reads secrets from `../../.env`).

## Environment Setup

```bash
cp .env.example .env   # then fill in secrets
```

Per-service examples: `examples/facilitator/.env.example`, `examples/simple-paywall/server/.env.example`.

Minimum required variables:

- `FACILITATOR_STELLAR_PRIVATE_KEY` -- facilitator Stellar secret key
- `TESTNET_SERVER_STELLAR_ADDRESS` -- server Stellar public address for testnet payments
- `CLIENT_STELLAR_PRIVATE_KEY` -- client Stellar secret key (payer)

Per-network server variables use `TESTNET_` or `MAINNET_` prefixes (e.g. `TESTNET_FACILITATOR_URL`, `MAINNET_SERVER_STELLAR_ADDRESS`). Provide at least one set.

Generate testnet keypairs: https://laboratory.stellar.org/#account-creator

## Local Development

```bash
pnpm install && pnpm dev
```

Facilitator: `http://localhost:4022` | Server: `http://localhost:3001` | Client: `http://localhost:5173`
