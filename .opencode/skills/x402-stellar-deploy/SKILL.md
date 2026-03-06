---
name: x402-stellar-deploy
description: Deployment procedures for the x402-stellar project. Use when deploying to Heroku, running Docker in production, or asked about deployment config vars, container setup, or release verification.
---

# x402-stellar Deploy

## Heroku (Container Stack)

Single Docker container (`heroku` target) via `heroku.yml`. Runs nginx (SPA) + Express server + facilitator through `infra/heroku/start.sh`. The start script waits for the facilitator to be healthy before launching the server. The server also validates facilitator reachability at startup via `Env.validateFacilitators()` (fetches `GET /supported` from each configured facilitator), providing defense-in-depth.

### Config Vars

**Required**:

| Var                               | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `FACILITATOR_STELLAR_PRIVATE_KEY` | Facilitator Stellar secret key                                  |
| `TESTNET_SERVER_STELLAR_ADDRESS`  | Testnet Stellar public address (enables `/protected/testnet`)   |
| `PAYMENT_PRICE`                   | Price in USDC on Stellar (SEP-41, 7 decimals, e.g. `0.0100000`) |

Note: `TESTNET_FACILITATOR_URL` and `MAINNET_FACILITATOR_URL` are auto-set to `http://localhost:4022` by `start.sh` in the Heroku all-in-one container — no need to configure them manually.

**Optional (per-network — enables `/protected/<network>` endpoints)**:

| Var                              | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `TESTNET_STELLAR_RPC_URL`        | Custom testnet Soroban RPC URL (has built-in default)         |
| `TESTNET_FACILITATOR_URL`        | Testnet facilitator URL (auto-set in Heroku all-in-one)       |
| `TESTNET_FACILITATOR_API_KEY`    | Testnet facilitator API key                                   |
| `MAINNET_SERVER_STELLAR_ADDRESS` | Mainnet Stellar public address (enables `/protected/mainnet`) |
| `MAINNET_STELLAR_RPC_URL`        | Mainnet Soroban RPC URL (required for mainnet)                |
| `MAINNET_FACILITATOR_URL`        | Mainnet facilitator URL (auto-set in Heroku all-in-one)       |
| `MAINNET_FACILITATOR_API_KEY`    | Mainnet facilitator API key                                   |

**Optional (general)**:

| Var                   | Default                          | Description                                 |
| --------------------- | -------------------------------- | ------------------------------------------- |
| `VITE_SERVER_URL`     | same origin (nginx proxy)        | Override SPA API URL                        |
| `VITE_APP_NAME`       | --                               | Display name in SPA                         |
| `VITE_PAYMENT_PRICE`  | `0.01`                           | Payment price shown in the UI               |
| `VITE_PORT`           | `5173`                           | Dev server port (local dev only)            |
| `CORS_ORIGINS`        | `*`                              | Comma-separated allowed origins             |
| `TRUST_PROXY`         | `loopback,linklocal,uniquelocal` | Proxy trust CIDRs                           |
| `LOG_LEVEL`           | `info`                           | Pino log level                              |
| `PAYMENT_DESCRIPTION` | `Access to protected content`    | Payment description in 402 response         |
| `CLIENT_HOME_URL`     | --                               | Client home page URL for paywall brand link |

### Deploy

```bash
# Option A: git push (stack must be 'container', heroku remote configured)
git push heroku master

# Option B: container CLI
heroku container:push web --app <app-name>
heroku container:release web --app <app-name>
```

### Verify

```bash
# Check logs
heroku logs --tail --app <app-name>

# Smoke test
.opencode/skills/x402-stellar-checks/scripts/smoke-test.sh https://<app-name>.herokuapp.com
```

## Docker Compose (non-Heroku)

Three-container setup: facilitator (internal), server (port 3001), client (port 8080).

```bash
# Start
docker compose -f examples/simple-paywall/docker-compose.yml up --build -d

# Verify
.opencode/skills/x402-stellar-checks/scripts/smoke-test.sh

# Tear down
docker compose -f examples/simple-paywall/docker-compose.yml down
```

Reads secrets from `../../.env` (repo root). See `examples/simple-paywall/docker-compose.yml`.

## All-in-One Docker (non-Heroku)

Uses the `heroku` target directly:

```bash
docker build --target heroku -t x402-stellar .
docker run --rm --env-file .env -p 8080:${PORT:-8080} -e PORT=8080 x402-stellar
```

## Pre-Deploy Checklist

1. `make check` passes (format, lint, typecheck, test, build)
2. Docker builds: `docker build --target heroku -t x402-heroku-test .`
3. Smoke tests pass: `.opencode/skills/x402-stellar-checks/scripts/docker-smoke-test.sh heroku`
4. Config vars are set on target environment
5. Deploy and verify: `.opencode/skills/x402-stellar-checks/scripts/smoke-test.sh https://<deployed-url>`
