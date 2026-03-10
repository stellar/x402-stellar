# CLI Client

A standalone script that demonstrates fully automated, server-to-server [x402](https://www.x402.org/) payments on Stellar — no browser or wallet UI required.

The script:

1. Sends a request to a paywalled weather API endpoint
2. Receives a `402 Payment Required` response with x402 payment requirements
3. Creates and signs a Stellar payment using a private key
4. Retries the request with the payment signature
5. Prints the weather forecast and settlement transaction hash

## Prerequisites

- A funded Stellar **testnet** account with a USDC trustline and USDC balance
  - Generate and fund at <https://lab.stellar.org/account/create>
  - Add USDC trustline at <https://lab.stellar.org/account/fund>
  - Get testnet USDC from <https://faucet.circle.com/> (select Stellar)
- The [simple-paywall server](../simple-paywall/) and [facilitator](../facilitator/) running locally

## Setup

```bash
# From the repo root
pnpm install

# Configure
cp examples/client-cli/.env.example examples/client-cli/.env
# Edit .env with your STELLAR_PRIVATE_KEY
```

## Usage

Start the facilitator and simple-paywall server first (see the [root README](../../README.md)), then:

```bash
cd examples/client-cli
pnpm dev
```

## Environment Variables

| Variable              | Default                 | Description                           |
| --------------------- | ----------------------- | ------------------------------------- |
| `STELLAR_PRIVATE_KEY` | _(required)_            | Stellar secret key (`S...`)           |
| `SERVER_URL`          | `http://localhost:3001` | Base URL of the simple-paywall server |
| `NETWORK`             | `testnet`               | `testnet` or `mainnet`                |
| `LOG_LEVEL`           | `info`                  | Pino log level                        |
