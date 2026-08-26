import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { x402Client } from "@x402/core/client";
import { findDefaultAsset, USDC_TESTNET_ADDRESS } from "@x402/stellar";
import type { ClientStellarSigner } from "@x402/stellar";
import type { PaymentRequired, SchemeNetworkClient } from "@x402/core/types";
import { createPaywallClient } from "./useStellarPayment.ts";

const stubSigner = {} as unknown as ClientStellarSigner;

// $1.50 USDC (7 decimals) — above @x402/core's default $1-per-payment spend cap.
const paymentRequired: PaymentRequired = {
  x402Version: 2,
  resource: { url: "https://example.com/premium" },
  accepts: [
    {
      scheme: "exact",
      network: "stellar:testnet",
      asset: USDC_TESTNET_ADDRESS,
      amount: "15000000",
      payTo: "GABC",
      maxTimeoutSeconds: 60,
      extra: {},
    },
  ],
};

// Stands in for ExactStellarScheme so no wallet or RPC is needed; spend
// controls run inside @x402/core before the scheme is ever invoked.
const fakeExactScheme: SchemeNetworkClient = {
  scheme: "exact",
  findDefaultAsset,
  createPaymentPayload: async () => ({ x402Version: 2, payload: { signed: true } }),
};

describe("createPaywallClient spend controls", () => {
  it("allows payments above the SDK's default $1 cap", async () => {
    const client = createPaywallClient(stubSigner);
    client.register("stellar:*", fakeExactScheme);

    const payload = await client.createPaymentPayload(paymentRequired);

    assert.deepEqual(payload.payload, { signed: true });
    assert.equal(payload.accepted.amount, "15000000");
  });

  it("documents the default-client behavior the paywall opts out of", async () => {
    const client = new x402Client();
    client.register("stellar:*", fakeExactScheme);

    await assert.rejects(
      () => client.createPaymentPayload(paymentRequired),
      /spendControls\.maxAmountPerPayment/,
    );
  });
});
