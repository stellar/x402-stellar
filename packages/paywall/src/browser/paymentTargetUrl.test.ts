import test from "node:test";
import assert from "node:assert/strict";
import { resolvePaymentTargetUrl } from "./paymentTargetUrl.ts";

test("uses browser location for ingress-prefixed protected routes", () => {
  assert.equal(
    resolvePaymentTargetUrl(
      "https://example.com/x402/api/protected/testnet",
      "https://example.com/protected/testnet",
    ),
    "https://example.com/x402/api/protected/testnet",
  );
});

test("uses browser location when currentUrl is undefined", () => {
  assert.equal(
    resolvePaymentTargetUrl("https://example.com/x402/api/protected/testnet", undefined),
    "https://example.com/x402/api/protected/testnet",
  );
});
