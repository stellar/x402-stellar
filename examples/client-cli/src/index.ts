import "dotenv/config";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { logger } from "./utils/logger.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isInsufficientBalanceSimulationError(error: unknown): boolean {
  return getErrorMessage(error).includes("resulting balance is not within the allowed range");
}

const STELLAR_PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY;
if (!STELLAR_PRIVATE_KEY) {
  logger.fatal("STELLAR_PRIVATE_KEY is required. See .env.example");
  process.exit(1);
}

const SERVER_URL = (process.env.SERVER_URL ?? "http://localhost:3001").replace(/\/+$/, "");

const NETWORK_MAP: Record<string, `stellar:${string}`> = {
  testnet: "stellar:testnet",
  mainnet: "stellar:pubnet",
};

const STELLAR_EXPERT_BASE: Record<string, string> = {
  testnet: "https://stellar.expert/explorer/testnet/tx",
  mainnet: "https://stellar.expert/explorer/public/tx",
};

const networkKey = process.env.NETWORK ?? "testnet";
const stellarNetwork = NETWORK_MAP[networkKey];
if (!stellarNetwork) {
  logger.fatal(`Invalid NETWORK "${networkKey}". Must be "testnet" or "mainnet".`);
  process.exit(1);
}

const signer = createEd25519Signer(STELLAR_PRIVATE_KEY, stellarNetwork);
const coreClient = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
const client = new x402HTTPClient(coreClient);

async function main(): Promise<void> {
  const url = `${SERVER_URL}/weather/${networkKey}?city=San+Francisco`;

  logger.info("--- x402 CLI Client ---");
  logger.debug({ network: stellarNetwork, server: SERVER_URL, endpoint: url }, "Configuration");

  logger.debug("Requesting weather data...");
  const initialResponse = await fetch(url);

  if (initialResponse.status !== 402) {
    logger.debug({ status: initialResponse.status }, "No payment required");

    const contentType = initialResponse.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await initialResponse.json();
      logger.info({ weatherData: body }, "Weather data received");
    } else {
      const body = await initialResponse.text();
      logger.warn({ status: initialResponse.status, body }, "Non-JSON response");
    }
    return;
  }

  logger.debug("Received 402 Payment Required");

  logger.debug("Parsing payment requirements...");
  const paymentRequired = client.getPaymentRequiredResponse(
    (name: string) => initialResponse.headers.get(name),
    await initialResponse.json(),
  );

  const accepted = paymentRequired.accepts[0];
  if (!accepted) {
    logger.fatal("Server returned 402 with no acceptable payment options");
    process.exit(1);
  }
  logger.debug(
    {
      scheme: accepted.scheme,
      network: accepted.network,
      amount: accepted.amount,
      asset: accepted.asset,
      payTo: accepted.payTo,
    },
    "Payment details",
  );

  logger.debug("Creating and signing payment...");
  let paymentPayload;
  try {
    paymentPayload = await client.createPaymentPayload(paymentRequired);
  } catch (error) {
    if (isInsufficientBalanceSimulationError(error)) {
      logger.fatal(
        {
          network: accepted.network,
          amount: accepted.amount,
          asset: accepted.asset,
          payTo: accepted.payTo,
          accountHint:
            "Check that your payer account has enough balance for this asset and network.",
        },
        "Payment simulation failed due to insufficient balance",
      );

      if (networkKey === "testnet") {
        logger.fatal(
          "For testnet USDC, fund your account and retry (e.g. https://faucet.circle.com/).",
        );
      }

      process.exit(1);
    }

    throw error;
  }
  logger.debug("Payment payload created");

  const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);
  logger.debug("Payment headers encoded");

  logger.debug("Retrying request with payment...");
  const paidResponse = await fetch(url, { headers: paymentHeaders });

  if (!paidResponse.ok) {
    const errorBody = await paidResponse.text();
    logger.error({ status: paidResponse.status, body: errorBody }, "Payment failed");
    process.exit(1);
  }

  logger.info({ status: paidResponse.status }, "Payment accepted");

  const settlement = client.getPaymentSettleResponse((name: string) =>
    paidResponse.headers.get(name),
  );
  const txHash = settlement.transaction;
  const txUrl = txHash ? `${STELLAR_EXPERT_BASE[networkKey]}/${txHash}` : undefined;
  logger.info({ transaction: txHash ?? "(pending)", url: txUrl }, "Settlement");

  const weatherData = await paidResponse.json();
  logger.info({ weatherData }, "Weather data received");
}

main().catch((err) => {
  logger.fatal(err, "Fatal error");
  process.exit(1);
});
