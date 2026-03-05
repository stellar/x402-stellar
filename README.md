# x402 Stellar

Tools, examples, and references for the [x402 protocol](https://www.x402.org/) on the Stellar network.

## Repository Structure

```
x402-stellar/
├── examples/                     # Example applications
│   ├── facilitator/              # Stellar facilitator service
│   └── simple-paywall/           # Paywall demo (server + client)
│       └── docker-compose.yml
├── vendors/x402/                 # Vendored @x402/* packages (pre-built)
├── infra/
│   └── heroku/                   # Heroku support files (start.sh, nginx.conf.template)
├── Dockerfile                    # Multi-target Dockerfile (must be at root for Heroku)
├── heroku.yml                    # Heroku build manifest (must be at root)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── Makefile
```

## Prerequisites

- Node.js 22+
- pnpm 10+

## Quick Start

```bash
# Clone the repo
git clone https://github.com/ArkaDevelopment/x402-stellar.git
cd x402-stellar

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Copy env template and fill in your values
cp .env.example examples/simple-paywall/server/.env
```

### Running the Simple Paywall Example

You need three terminals:

**Terminal 1 -- Facilitator** (from the x402 submodule):

```bash
cd vendors/x402/examples/typescript/facilitator/advanced
FACILITATOR_STELLAR_PRIVATE_KEY=<your-key> pnpm dev:all-networks
```

**Terminal 2 -- Server:**

```bash
cd examples/simple-paywall/server
pnpm dev
```

**Terminal 3 -- Client:**

```bash
cd examples/simple-paywall/client
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and navigate through Home, Try It, then access the protected content.

## Examples

| Example            | Path                       | Description                                              |
| ------------------ | -------------------------- | -------------------------------------------------------- |
| **Facilitator**    | `examples/facilitator/`    | Stellar facilitator service that processes x402 payments |
| **Simple Paywall** | `examples/simple-paywall/` | Express API with x402 middleware + React/Vite frontend   |

## Development

```bash
make install      # pnpm install
make build        # pnpm build (turbo)
make dev          # pnpm dev
make lint         # pnpm lint
make typecheck    # pnpm typecheck
make test         # pnpm test
make check        # format + lint + typecheck + test
make clean        # remove dist/ and node_modules/ from examples
```

## Deployment

Heroku deployment uses `heroku.yml` and `Dockerfile` at the repo root (required by Heroku — both the build manifest and Dockerfile must be at root level so the Docker build context includes the full workspace). Supporting files (`start.sh`, `nginx.conf.template`) live in `infra/heroku/`.

The Dockerfile is a multi-target build with targets for `facilitator`, `server`, `client`, and `heroku` (all-in-one). See `heroku.yml` for the build configuration.

## Environment Variables

| Variable                              | Default                 | Description                                  |
| ------------------------------------- | ----------------------- | -------------------------------------------- |
| `PORT`                                | `3001`                  | Server port                                  |
| `NODE_ENV`                            | `development`           | Environment                                  |
| `LOG_LEVEL`                           | `info`                  | Pino log level                               |
| `CORS_ORIGINS`                        | `http://localhost:5173` | Allowed CORS origins (comma-separated)       |
| `PAYWALL_DISABLED`                    | —                       | Set to `true` to disable the paywall         |
| `SERVER_STELLAR_ADDRESS`              | _required_              | Stellar address to receive payments          |
| `STELLAR_NETWORK`                     | `stellar:testnet`       | CAIP-2 network identifier                    |
| `STELLAR_RPC_URL`                     | testnet RPC             | Custom Soroban RPC URL (required for pubnet) |
| `PAYMENT_PRICE`                       | `0.01`                  | Price for protected content                  |
| `FACILITATOR_URL`                     | `http://localhost:4022` | x402 facilitator URL                         |
| `FACILITATOR_STELLAR_PRIVATE_KEY`     | —                       | Facilitator wallet private key               |
| `FACILITATOR_STELLAR_FEE_BUMP_SECRET` | —                       | Fee-bump signer secret (high-throughput)     |
| `FACILITATOR_STELLAR_CHANNEL_SECRETS` | —                       | Channel account secrets, comma-separated     |
| `CLIENT_HOME_URL`                     | —                       | Client home page URL for paywall brand link  |
| `VITE_SERVER_URL`                     | `http://localhost:3001` | Server URL for the client SPA (build time)   |
| `VITE_APP_NAME`                       | `x402 on Stellar`       | App name for the client SPA (build time)     |

## High-Throughput Facilitator Setup (Recommended)

For production or high-volume scenarios, the facilitator supports **channel accounts** with a **fee-bump signer**. This is the recommended setup because it allows parallel transaction submission — each channel account maintains its own sequence number, and a dedicated fee-bump signer pays all fees.

### How It Works

On Stellar, a single account can only submit one transaction at a time because each transaction increments the account's sequence number. With 19 channel accounts + 1 fee-bump signer, the facilitator can submit up to 19 transactions in parallel:

- **Channel accounts** (inner-tx signers): Each holds its own sequence number. The facilitator uses round-robin selection to distribute transactions across them. Created with zero balance via sponsored reserves.
- **Fee-bump signer**: A separate funded account that wraps each inner transaction in a fee-bump transaction. It pays the network fees but does not manage sequence numbers.

### Setup

1. Generate and fund the accounts on testnet:

```bash
cd examples/facilitator
pnpm generate-channels
```

This will:

- Create a fee-payer keypair and fund it via Friendbot
- Generate 19 channel account keypairs
- Create all channel accounts on-chain with zero balance (using sponsored reserves)
- Save all keys to a timestamped JSON file under `scripts/output/`
- Print the environment variables to add to your `.env`

2. Copy the output into your `.env`:

```bash
# examples/facilitator/.env
FACILITATOR_STELLAR_PRIVATE_KEY=S_YOUR_EXISTING_KEY
FACILITATOR_STELLAR_FEE_BUMP_SECRET=S_FEE_BUMP_SECRET_FROM_SCRIPT
FACILITATOR_STELLAR_CHANNEL_SECRETS=S_CH1,S_CH2,...,S_CH19
```

3. Start the facilitator — it auto-detects high-throughput mode:

```bash
pnpm dev
```

You should see a log line: `High-throughput mode: fee-bump signer + channel accounts`.

When the channel account variables are not set, the facilitator falls back to single-signer mode using `FACILITATOR_STELLAR_PRIVATE_KEY`.

## Adding a New Example

1. Create a directory under `examples/` (e.g. `examples/my-example/`)
2. Add a `package.json` with name `@x402-stellar/my-example`
3. The workspace globs in `pnpm-workspace.yaml` will pick it up automatically
4. Run `pnpm install` from the root to link it
