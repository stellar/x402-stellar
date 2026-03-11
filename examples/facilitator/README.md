# Stellar Facilitator

Express service that verifies and settles [x402](https://www.x402.org/) payments on the Stellar network. A paywall server forwards payment headers here; the facilitator checks the transaction is valid and submits it on-chain.

## Endpoints

| Method | Path         | Description                           |
| ------ | ------------ | ------------------------------------- |
| POST   | `/verify`    | Validate a payment payload            |
| POST   | `/settle`    | Submit the transaction to the network |
| GET    | `/supported` | List supported scheme/network pairs   |
| GET    | `/health`    | Health check                          |

## Quick Start

```bash
cp .env.example .env
# Edit .env with your Stellar secret key
pnpm dev
```

The facilitator listens on port 4022 by default.

## Configuration

| Variable                              | Default                          | Description                                  |
| ------------------------------------- | -------------------------------- | -------------------------------------------- |
| `FACILITATOR_STELLAR_PRIVATE_KEY`     | _required_                       | Stellar secret key for single-signer mode    |
| `PORT`                                | `4022`                           | Listen port                                  |
| `STELLAR_NETWORK`                     | `stellar:testnet`                | CAIP-2 network identifier                    |
| `STELLAR_RPC_URL`                     | testnet RPC                      | Custom Soroban RPC URL (required for pubnet) |
| `LOG_LEVEL`                           | `info`                           | Pino log level                               |
| `CORS_ORIGINS`                        | `*`                              | Comma-separated allowed origins              |
| `TRUST_PROXY`                         | `loopback,linklocal,uniquelocal` | Trusted proxy ranges                         |
| `MAX_TRANSACTION_FEE_STROOPS`         | `50000` (library default)        | Max fee in stroops accepted from clients     |
| `FACILITATOR_STELLAR_FEE_BUMP_SECRET` | --                               | Fee-bump signer secret (high-throughput)     |
| `FACILITATOR_STELLAR_CHANNEL_SECRETS` | --                               | Channel account secrets, comma-separated     |

## Operating Modes

### Single-signer (default)

Set `FACILITATOR_STELLAR_PRIVATE_KEY` and nothing else. The facilitator uses one account for both sequence numbers and fee payment. Simple, but limited to one in-flight transaction at a time.

### High-throughput with channel accounts (recommended)

On Stellar, each transaction increments the source account's sequence number, so a single account can only have one transaction in-flight at a time. Channel accounts solve this: each one manages its own sequence number, and a separate fee-bump signer pays all fees. With _N_ channel accounts the facilitator can submit up to _N_ transactions in parallel.

When both `FACILITATOR_STELLAR_FEE_BUMP_SECRET` and `FACILITATOR_STELLAR_CHANNEL_SECRETS` are set, the facilitator automatically switches to this mode. The `ExactStellarScheme` uses round-robin to select which channel account signs each inner transaction, then wraps it in a fee-bump transaction signed by the fee-bump account.

#### Generating channel accounts

A bundled script creates 1 fee-payer account + 19 channel accounts on testnet in a single transaction:

```bash
pnpm generate-channel-accounts
```

This will:

1. Create a fee-payer keypair and fund it via Friendbot
2. Generate 19 channel account keypairs
3. Create all 19 accounts on-chain with **zero balance** using sponsored reserves (`BeginSponsoringFutureReserves` + `CreateAccount` + `EndSponsoringFutureReserves`)
4. Submit the transaction and wait for confirmation
5. Save all keys to a timestamped `.env` file in `scripts/output/`
6. Print the two environment variables to add to `.env`

Example output:

```
=== Environment Variables ===

FACILITATOR_STELLAR_FEE_BUMP_SECRET=SABC...
FACILITATOR_STELLAR_CHANNEL_SECRETS=S1...,S2...,S3...,...,S19...

Copy these into your .env file.
```

Paste those lines into your `.env` and restart:

```bash
pnpm dev
```

You should see:

```
INFO: High-throughput mode: fee-bump signer + channel accounts
  feeBumpAddress: "G..."
  channelCount: 19
```

When the channel account variables are absent or empty, the facilitator falls back to single-signer mode -- no changes needed.

## Utility Scripts

| Script                             | Description                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm generate-channel-accounts`   | Create 1 fee-payer + 19 channel accounts on testnet (saves keys to `scripts/output/`) |
| `pnpm refund-accounts-from-env`    | Re-fund facilitator accounts from `.env` secrets after a testnet reset                |
| `pnpm refund-accounts-from-remote` | Fund signer addresses fetched from a remote facilitator's `/supported` endpoint       |

After a testnet reset all accounts are wiped. The refund scripts call Friendbot to re-activate existing accounts — they do **not** re-create sponsored-reserve relationships. Each account receives 10,000 XLM independently.

## Development

```bash
pnpm dev          # Run with tsx (auto-reload not included, restart manually)
pnpm test         # Run tests
pnpm typecheck    # Type-check without emitting
pnpm lint         # Lint src/
```
