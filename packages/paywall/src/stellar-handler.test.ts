import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stellarPaywall } from "./stellar-handler.js";
import { stellarPaywallProvider } from "./stellarPaywallProvider.js";
import type { PaymentRequired, PaymentRequirements } from "./types.js";

function makeRequirement(overrides: Partial<PaymentRequirements> = {}): PaymentRequirements {
  return {
    scheme: "exact",
    network: "stellar:testnet",
    asset: "USDC",
    payTo: "GABC",
    maxTimeoutSeconds: 60,
    ...overrides,
  };
}

function makePaymentRequired(req: PaymentRequirements): PaymentRequired {
  return {
    x402Version: 2,
    accepts: [req],
  };
}

function extractAmount(html: string): number {
  const match = html.match(/window\.x402\s*=\s*\{[^}]*amount:\s*([\d.eE+-]+)/);
  if (!match) throw new Error("Could not find amount in HTML");
  return parseFloat(match[1]);
}

describe("stellarPaywall.generateHtml amount conversion", () => {
  it("converts a normal amount correctly (10_000_000 stroops = 1.0 USDC)", () => {
    const req = makeRequirement({ amount: "10000000" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 1);
  });

  it("converts a small amount correctly (100_000 stroops = 0.01 USDC)", () => {
    const req = makeRequirement({ amount: "100000" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 0.01);
  });

  it("handles large amounts without precision loss via BigInt", () => {
    // 70_000_000 stroops = exactly 7.0 USDC — verifies BigInt path works
    const req = makeRequirement({ amount: "70000000" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 7);
  });

  it("handles amounts beyond safe integer range", () => {
    // 10_000_000_000_000_000 stroops = 1_000_000_000 USDC
    const req = makeRequirement({ amount: "10000000000000000" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    const amount = extractAmount(html);
    assert.equal(amount, 1000000000);
  });

  it("falls back gracefully for non-integer strings", () => {
    const req = makeRequirement({ amount: "1.5e7" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    const amount = extractAmount(html);
    assert.equal(amount, 1.5);
  });

  it("returns 0 for non-numeric input", () => {
    const req = makeRequirement({ amount: "abc" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 0);
  });

  it("uses maxAmountRequired as fallback when amount is absent", () => {
    const req = makeRequirement({ amount: undefined, maxAmountRequired: "20000000" });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 2);
  });

  it("returns 0 when both amount and maxAmountRequired are absent", () => {
    const req = makeRequirement({ amount: undefined, maxAmountRequired: undefined });
    const html = stellarPaywall.generateHtml(req, makePaymentRequired(req), {});
    assert.equal(extractAmount(html), 0);
  });
});

describe("stellarPaywallProvider (pre-built provider)", () => {
  it("converts 5_100_000 stroops to 0.51 USDC (issue #55 regression)", () => {
    const req = makeRequirement({ amount: "5100000" });
    const pr = makePaymentRequired(req);
    const html = stellarPaywallProvider.generateHtml(pr);
    assert.equal(extractAmount(html), 0.51);
  });

  it("converts 10_000_000 stroops to 1.0 USDC", () => {
    const req = makeRequirement({ amount: "10000000" });
    const pr = makePaymentRequired(req);
    const html = stellarPaywallProvider.generateHtml(pr);
    assert.equal(extractAmount(html), 1);
  });
});
