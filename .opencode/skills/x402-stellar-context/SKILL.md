---
name: x402-stellar-context
description: Project context for the x402-stellar monorepo. Use this to understand what the project does, how it's structured, and how the pieces fit together. Load this first when working on any part of the codebase.
---

# x402-stellar Context

## What This Is

An implementation of the [x402 payment protocol](https://www.x402.org/) for the Stellar network. The x402 protocol uses HTTP status code 402 (Payment Required) to enable machine-readable paywalls — a server responds with 402 + a `PAYMENT-REQUIRED` header, the client pays via blockchain, then retries the request with a `PAYMENT-SIGNATURE` header. The facilitator verifies and settles payments on-chain.

This repo provides:

- A **Stellar facilitator** that verifies and settles x402 payments on the Stellar blockchain
- A **paywall server** example using Express + the `@x402/express` middleware
- A **React SPA client** that renders a wallet-connect paywall UI when it receives a 402
- A **paywall package** that generates the HTML paywall page with Stellar wallet integration

## How x402 Payment Flow Works

```
Client                    Server                  Facilitator         Stellar
  |                         |                         |                 |
  |-- GET /networks ------->|                         |                 |
  |<-- { networks: [...] } -|                         |                 |
  |                         |                         |                 |
  |-- GET /protected/:net ->|                         |                 |
  |<-- 402 + requirements --|                         |                 |
  |                         |                         |                 |
  | (user signs tx in wallet)                         |                 |
  |                         |                         |                 |
  |-- GET /protected/:net ->|                         |                 |
  | (PAYMENT-SIGNATURE hdr)|-- POST /verify -------->|                 |
  |                         |<-- { valid: true } -----|                 |
  |                         |                         |                 |
  |                         |-- POST /settle -------->|                 |
  |                         |                         |-- submit tx --->|
  |                         |<-- { success, txHash } -|                 |
  |<-- 200 + PAYMENT-RESPONSE + content -------------|                 |
```

1. Client fetches `GET /networks` to discover which networks are available (testnet, mainnet, or both)
2. Client requests a protected resource via `GET /protected/testnet` or `GET /protected/mainnet`
3. Server responds with `402 Payment Required` + `PAYMENT-REQUIRED` header (base64 `PaymentRequired` payload: price, network, payTo address)
4. Client renders a paywall page where the user connects a Stellar wallet and signs a transaction
5. Client retries the request with the signed payment in the `PAYMENT-SIGNATURE` header
6. Server forwards the payment to the facilitator for verification
7. Facilitator checks the transaction is valid (correct amount, recipient, not expired)
8. Server serves the content; facilitator settles (submits) the transaction on-chain
9. Server returns content with `PAYMENT-RESPONSE` header (base64 `SettlementResponse`) and injects the transaction hash link via `txHashInjector` middleware

### Header compatibility note

x402 v2 HTTP transport uses:

- `PAYMENT-REQUIRED` (server → client, 402 response)
- `PAYMENT-SIGNATURE` (client → server, retried request)
- `PAYMENT-RESPONSE` (server → client, settlement metadata)

The vendored `@x402/*` packages in this repo still include v1 fallbacks (`X-PAYMENT`, `X-PAYMENT-RESPONSE`) for backward compatibility, but v2 headers are the canonical protocol path.

## Architecture

pnpm 10.7.0 monorepo with Turborepo. All own packages are scoped `@x402-stellar/*`.

### Packages

| Package                               | Path                              | Purpose                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@x402-stellar/paywall`               | `packages/paywall/`               | Builds the paywall HTML page. Uses a builder pattern: `createPaywall().withNetwork(stellarPaywall).build()`. The `stellarPaywall` handler uses `@creit.tech/stellar-wallets-kit` for wallet connection. Bundles React + wallet UI into a single HTML string via esbuild.                                                                                                |
| `@x402-stellar/facilitator`           | `examples/facilitator/`           | Express service that wraps `x402Facilitator` from `@x402/core`. Registers the `ExactStellarScheme` with a Stellar signer derived from `FACILITATOR_STELLAR_PRIVATE_KEY`. Exposes `/verify`, `/settle`, `/supported`, `/health`.                                                                                                                                         |
| `@x402-stellar/simple-paywall-server` | `examples/simple-paywall/server/` | Express service that uses `@x402/express` `paymentMiddleware` to protect `GET /protected/:network` (testnet and/or mainnet). Configures per-network `x402ResourceServer` instances with `HTTPFacilitatorClient` pointing at each network's facilitator. Exposes `GET /networks` for network discovery. Also uses the paywall package to generate the 402 response HTML. |
| `@x402-stellar/simple-paywall-client` | `examples/simple-paywall/client/` | React/Vite SPA. Three-page demo: Home, Try It (fetches `GET /networks` and shows buttons for each available network), and the protected content page.                                                                                                                                                                                                                   |

### Vendored Packages

4 pre-built `@x402/*` packages live under `vendors/x402/typescript/packages/`. They are a git submodule from the upstream [coinbase/x402](https://github.com/coinbase/x402) repo, included as **dist-only** (never modify source, never rebuild).

| Package            | Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `@x402/core`       | Protocol types, facilitator base class, server base class, `HTTPFacilitatorClient` |
| `@x402/extensions` | Protocol extensions (not directly used)                                            |
| `@x402/express`    | `paymentMiddleware` and `x402ResourceServer` for Express                           |
| `@x402/stellar`    | `ExactStellarScheme` (facilitator + server sides), `createEd25519Signer`           |

### Build Order

Turborepo resolves `^build` dependencies. In practice: `paywall` builds first (esbuild + tsup), then `server` (imports paywall). Facilitator and client have no cross-dependencies and build in parallel.

## Key Design Decisions

**Paywall as bundled HTML**: The paywall package pre-bundles the entire React wallet UI into an HTML string at build time. When the server returns a 402, it sends this HTML directly — no client-side JS bundle loading needed. The `template.ts` file (~2.25 MB, auto-generated) contains the base64-encoded bundle.

**txHashInjector middleware**: Registered before the `@x402/express` middleware. It wraps `res.end`/`res.write` to intercept the response body after payment settlement and replaces `{{TX_LINK}}` with a Stellar Expert transaction link. This lets the protected content reference its own payment transaction.

**Facilitator is internal**: In the Heroku all-in-one deploy, nginx only proxies `/health`, `/networks`, and `/protected/` to Express. Facilitator routes (`/verify`, `/settle`, `/supported`) are NOT externally accessible — they run on `localhost:4022` inside the container. This is intentional: the facilitator is an internal service, not a public API.

**Startup validation**: Before creating the Express app, the server calls `Env.validateFacilitators()` which fetches `GET /supported` from every configured facilitator (with optional `Authorization: Bearer` header). If any facilitator is unreachable or returns a non-200 status, the server throws with aggregated diagnostics. The `start.sh` script also has a readiness loop for the facilitator, providing defense-in-depth.

**`trust proxy` via `proxy-addr`**: Both server and facilitator use the `proxy-addr` package with `TRUST_PROXY` env var (defaulting to `loopback,linklocal,uniquelocal`) instead of Express's built-in string-based trust. This matches the pattern used in Stellar's `laboratory-backend`.

## Repository Layout

```
x402-stellar/
├── packages/paywall/              # Paywall HTML builder
│   └── src/
│       ├── builder.ts             # PaywallBuilder class
│       ├── stellar-handler.ts     # Stellar wallet integration
│       ├── stellar.ts             # Re-export for paywall/stellar entry
│       ├── types.ts               # PaywallConfig, PaywallProvider types
│       └── browser/               # esbuild source for the wallet UI
│           └── build.ts           # Build script -> gen/template.ts
├── examples/
│   ├── facilitator/               # Stellar facilitator service
│   │   └── src/
│   │       ├── app.ts             # Express app: /verify, /settle, /supported, /health
│   │       ├── index.ts           # Entrypoint: listen + graceful shutdown
│   │       ├── config/env.ts      # Typed Env class (validates at startup)
│   │       └── utils/logger.ts    # Pino structured logging
│   └── simple-paywall/
│       ├── server/                # Paywall server
│       │   └── src/
│       │       ├── app.ts         # Express app: helmet, cors, trust proxy, error handler
│       │       ├── index.ts       # Entrypoint: listen + graceful shutdown
│       │       ├── config/env.ts  # Typed Env class
│       │       ├── middleware/
│       │       │   ├── payment.ts # Creates x402 paymentMiddleware
│       │       │   └── txHashInjector.ts  # Replaces {{TX_LINK}} in responses
│       │       ├── routes/
│       │       │   ├── health.ts  # GET /health
│       │       │   └── protected.ts  # GET /protected/:network (paywalled content)
│       │       └── utils/logger.ts
│       ├── client/                # React/Vite SPA
│       └── docker-compose.yml     # 3-container local setup
├── vendors/x402/                  # Git submodule (dist-only, never modify)
│   └── typescript/packages/{core,extensions,http/express,mechanisms/stellar}
├── infra/heroku/
│   ├── start.sh                   # Launches facilitator + server + nginx
│   └── nginx.conf.template        # Proxies /health, /networks, /protected/; serves SPA
├── Dockerfile                     # Multi-target: facilitator, server, client, heroku
├── heroku.yml                     # Container deploy manifest
├── Makefile                       # check = install + format + lint + typecheck + test + build
├── turbo.json                     # Task config with ^build dependency
├── pnpm-workspace.yaml            # Workspace globs
└── .env.example                   # Template for required env vars
```

## Deployment Modes

| Mode                  | Description                                                        | Config                         |
| --------------------- | ------------------------------------------------------------------ | ------------------------------ |
| **Local dev**         | 3 separate processes (facilitator, server, client)                 | `pnpm dev`                     |
| **Docker Compose**    | 3 containers, facilitator internal, server on 3001, client on 8080 | `docker-compose.yml`           |
| **Heroku**            | Single container (`heroku` target), nginx fronts everything        | `heroku.yml` + `Dockerfile`    |
| **Standalone Docker** | Any individual target (`facilitator`, `server`, `client`)          | `docker build --target <name>` |

## Environment Variables

Minimum required for the system to function:

| Variable                          | Used By           | Purpose                                      |
| --------------------------------- | ----------------- | -------------------------------------------- |
| `FACILITATOR_STELLAR_PRIVATE_KEY` | Facilitator       | Signs and submits Stellar transactions       |
| `TESTNET_SERVER_STELLAR_ADDRESS`  | Server            | Stellar public address for testnet payments  |
| `MAINNET_SERVER_STELLAR_ADDRESS`  | Server            | Stellar public address for mainnet payments  |
| `CLIENT_STELLAR_PRIVATE_KEY`      | Client (dev only) | Wallet key for testing (never in production) |

Per-network server variables use `TESTNET_` or `MAINNET_` prefixes: `<NET>_SERVER_STELLAR_ADDRESS`, `<NET>_STELLAR_RPC_URL`, `<NET>_FACILITATOR_URL`, `<NET>_FACILITATOR_API_KEY`. Provide at least one set to enable that network.

Full reference in the root `README.md` and per-service `.env.example` files.

## Test Coverage

101 tests across 6 files:

- `examples/facilitator/tests/config/env.test.ts` — 25 tests (Env class validation)
- `examples/facilitator/tests/routes/facilitator.test.ts` — 10 tests (route behavior)
- `examples/simple-paywall/server/tests/config/env.test.ts` — 41 tests (Env + dual-network config + address validation + validateFacilitators)
- `examples/simple-paywall/server/tests/middleware/txHashInjector.test.ts` — 10 tests
- `examples/simple-paywall/server/tests/routes/protected.test.ts` — 12 tests (health + networks + protected routes per network)
- `examples/simple-paywall/server/tests/routes/protected-single-network.test.ts` — 3 tests (single-network deployment behavior)

Run with `pnpm test` (Turborepo runs vitest in each package).
