# x402 Agent Client

A fully automated Node.js script that acts as an x402 payment client — **no browser, no wallet extension, no human interaction required**. The agent holds a Stellar private key, detects HTTP 402 responses, constructs and signs a payment on-chain, and retries the request automatically.

This demonstrates x402's value in AI-agent and machine-to-machine (M2M) payment scenarios.

## How it works

```
Agent                                        Server
  │                                            │
  │──── GET /api/protected/testnet ────────────▶│
  │◀─── 402 Payment Required ──────────────────│
  │     (PAYMENT-REQUIRED header, JSON body)    │
  │                                            │
  │  [construct & sign Stellar tx]              │
  │                                            │
  │──── GET /api/protected/testnet ────────────▶│
  │     (PAYMENT-SIGNATURE header)              │
  │◀─── 200 OK  { message, network, timestamp } │
```

1. The agent makes a plain `GET` request.
2. The server responds with `402` and a `PAYMENT-REQUIRED` header describing the required payment.
3. The agent decodes the payment requirements and builds a signed Stellar contract auth entry using `createEd25519Signer` (backed by the agent's private key) and `ExactStellarScheme`.
4. The signed payload is base64-encoded into a `PAYMENT-SIGNATURE` header and the request is retried.
5. The server verifies the payment via the facilitator and returns the protected content (`200 OK`).

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20 and [pnpm](https://pnpm.io/)
- A funded Stellar **testnet** account with USDC.  
  Use [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) to create and fund an account, then acquire testnet USDC from the [Circle USDC Testnet Faucet](https://faucet.circle.com/).
- The [simple-paywall server](../simple-paywall/server/) (or any other x402-compatible server) running locally.

### 1. Install dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable                    | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `AGENT_STELLAR_PRIVATE_KEY` | **Required.** Stellar secret key (starts with `S`)            |
| `TARGET_URL`                | **Required.** URL of the x402-protected resource               |
| `STELLAR_RPC_URL`           | Optional. Custom Soroban RPC URL (defaults to public testnet)  |
| `MAX_RETRIES`               | Optional. Payment signing retries (default: `3`)               |

### 3. Start the paywall server

In a separate terminal, start the simple-paywall server (see its [README](../simple-paywall/server/README.md)):

```bash
cd ../simple-paywall/server
cp .env.example .env
# Fill in TESTNET_SERVER_STELLAR_ADDRESS and TESTNET_FACILITATOR_URL
pnpm dev
```

The server exposes two sets of protected endpoints:

| Path | Description |
| ---- | ----------- |
| `GET /api/protected/testnet` | **JSON API** — 402 returns JSON, 200 returns JSON (use with agent-client) |
| `GET /api/protected/mainnet` | **JSON API** — same as above on mainnet |
| `GET /protected/testnet` | **HTML paywall** — 402 renders browser wallet UI |
| `GET /protected/mainnet` | **HTML paywall** — same as above on mainnet |

### 4. Run the agent

```bash
pnpm start
```

Example output:

```
Agent Stellar address: GABCDE...

Requesting: http://localhost:3001/api/protected/testnet
Received 402 Payment Required.
Payment required: scheme=exact, network=stellar:testnet, asset=USDC, amount=10000

Attempt 1/3: constructing and signing payment...
Sending request with PAYMENT-SIGNATURE header...
Payment accepted on attempt 1.

Status: 200 OK
Content-Type: application/json; charset=utf-8

--- Response body (first 1000 chars) ---
{"message":"Access granted","network":"testnet","timestamp":"2026-..."}
```

## Configuration reference

| Variable                    | Default                                   | Description                                    |
| --------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `AGENT_STELLAR_PRIVATE_KEY` | _required_                                | Stellar secret key used to sign payments       |
| `TARGET_URL`                | _required_                                | URL of the protected resource                  |
| `STELLAR_RPC_URL`           | `https://soroban-testnet.stellar.org`     | Soroban RPC endpoint (required for mainnet)    |
| `MAX_RETRIES`               | `3`                                       | Maximum number of payment signing attempts     |

## Key APIs used

| Package         | Symbol                          | Purpose                                            |
| --------------- | ------------------------------- | -------------------------------------------------- |
| `@x402/stellar` | `createEd25519Signer`           | Creates a `ClientStellarSigner` from a private key |
| `@x402/stellar` | `ExactStellarScheme`            | Builds and signs the Stellar payment payload       |
| `@x402/core`    | `x402Client`                    | Orchestrates scheme selection and payload creation |
| `@x402/core`    | `decodePaymentRequiredHeader`   | Parses the `PAYMENT-REQUIRED` header from 402      |
| `@x402/core`    | `encodePaymentSignatureHeader`  | Encodes the signed payload as a request header     |

## Development

```bash
pnpm typecheck   # Type-check without emitting
pnpm lint        # Lint source files
```
