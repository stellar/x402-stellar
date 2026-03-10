import dotenv from "dotenv";
dotenv.config();

import { createEd25519Signer, ExactStellarScheme } from "@x402/stellar";
import { x402Client } from "@x402/core/client";
import { encodePaymentSignatureHeader, decodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TARGET_URL = process.env.TARGET_URL;
if (!TARGET_URL) {
  console.error("Error: TARGET_URL environment variable is required.");
  process.exit(1);
}

const AGENT_STELLAR_PRIVATE_KEY = process.env.AGENT_STELLAR_PRIVATE_KEY;
if (!AGENT_STELLAR_PRIVATE_KEY) {
  console.error("Error: AGENT_STELLAR_PRIVATE_KEY environment variable is required.");
  process.exit(1);
}

const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? "3", 10);

// ---------------------------------------------------------------------------
// Payment helper
// ---------------------------------------------------------------------------

/**
 * Makes an HTTP GET request to `url`. If the server responds with HTTP 402,
 * the agent automatically constructs and signs a Stellar payment using the
 * private key supplied via the environment, then retries the request with a
 * `PAYMENT-SIGNATURE` header — all without human interaction.
 *
 * @returns The final HTTP response once payment succeeds (or throws on error).
 */
async function fetchWithPayment(url: string): Promise<Response> {
  // Create a Stellar signer backed by the agent's private key.
  const signer = createEd25519Signer(AGENT_STELLAR_PRIVATE_KEY!);
  console.log(`Agent Stellar address: ${signer.address}`);

  // Register the ExactStellarScheme for all Stellar networks ("stellar:*").
  const rpcConfig = STELLAR_RPC_URL ? { url: STELLAR_RPC_URL } : undefined;
  const client = new x402Client();
  client.register("stellar:*", new ExactStellarScheme(signer, rpcConfig));

  // --- First request (no payment header) ---
  console.log(`\nRequesting: ${url}`);
  let response = await fetch(url);

  if (response.status !== 402) {
    return response;
  }

  // --- 402 Payment Required ---
  console.log("Received 402 Payment Required.");

  const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader) {
    throw new Error("Server returned 402 but no PAYMENT-REQUIRED header was found.");
  }

  const paymentRequired: PaymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);
  const first = paymentRequired.accepts[0];
  if (first) {
    // V1 uses `maxAmountRequired`; V2 uses `amount`.
    const amount =
      "maxAmountRequired" in first ? first.maxAmountRequired : first.amount;
    console.log(
      `Payment required: scheme=${first.scheme}, network=${first.network}, ` +
        `asset=${first.asset}, amount=${amount}`,
    );
  }

  // --- Retry with payment signature (up to MAX_RETRIES attempts) ---
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\nAttempt ${attempt}/${MAX_RETRIES}: constructing and signing payment...`);

    const paymentPayload = await client.createPaymentPayload(paymentRequired);
    const paymentHeader = encodePaymentSignatureHeader(paymentPayload);

    console.log("Sending request with PAYMENT-SIGNATURE header...");
    response = await fetch(url, {
      headers: { "PAYMENT-SIGNATURE": paymentHeader },
    });

    if (response.ok) {
      console.log(`Payment accepted on attempt ${attempt}.`);
      return response;
    }

    if (response.status !== 402) {
      // An unexpected error; surface it immediately.
      const body = await response.text();
      throw new Error(`Unexpected ${response.status} response after payment: ${body.slice(0, 500)}`);
    }

    // Still 402 — the server may have rejected this attempt; try again.
    console.warn(`Attempt ${attempt} returned 402; will retry.`);
  }

  const body = await response.text();
  throw new Error(`Payment failed after ${MAX_RETRIES} attempt(s). Last body: ${body.slice(0, 500)}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    const response = await fetchWithPayment(TARGET_URL!);
    const body = await response.text();

    console.log(`\nStatus: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type") ?? "unknown"}`);
    console.log(`\n--- Response body (first 1000 chars) ---`);
    console.log(body.slice(0, 1000));
  } catch (error) {
    console.error("\nError:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
