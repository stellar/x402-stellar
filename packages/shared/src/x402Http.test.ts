import test from "node:test";
import assert from "node:assert/strict";
import {
  getX402ErrorMessage,
  parseX402JsonHeaderValue,
  parseX402PaymentRequiredHeaderError,
  parseX402PaymentResponseHeader,
} from "./x402Http.js";

function encodeBase64Json(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

test("parseX402JsonHeaderValue returns parsed JSON", () => {
  assert.deepEqual(parseX402JsonHeaderValue(encodeBase64Json({ hello: "world" })), {
    hello: "world",
  });
});

test("parseX402JsonHeaderValue returns undefined for missing input", () => {
  assert.equal(parseX402JsonHeaderValue(undefined), undefined);
  assert.equal(parseX402JsonHeaderValue(null), undefined);
  assert.equal(parseX402JsonHeaderValue(""), undefined);
});

test("parseX402JsonHeaderValue returns undefined for invalid base64 json", () => {
  assert.equal(parseX402JsonHeaderValue("%%%"), undefined);
  assert.equal(parseX402JsonHeaderValue(Buffer.from("not-json").toString("base64")), undefined);
});

test("getX402ErrorMessage prefers x402 error fields in priority order", () => {
  assert.equal(getX402ErrorMessage({ error: "primary", message: "secondary" }), "primary");
  assert.equal(getX402ErrorMessage({ message: "secondary" }), "secondary");
  assert.equal(getX402ErrorMessage({ detail: "detail" }), "detail");
  assert.equal(getX402ErrorMessage({ details: "details" }), "details");
});

test("parseX402PaymentRequiredHeaderError decodes payment-required header", () => {
  const header = encodeBase64Json({ error: "invalid_exact_stellar_payload_fee_exceeds_maximum" });
  assert.equal(
    parseX402PaymentRequiredHeaderError(header),
    "invalid_exact_stellar_payload_fee_exceeds_maximum",
  );
});

test("parseX402PaymentResponseHeader decodes payment-response header", () => {
  const header = encodeBase64Json({ transaction: "abc123", network: "stellar:testnet" });
  assert.deepEqual(parseX402PaymentResponseHeader(header), {
    transaction: "abc123",
    network: "stellar:testnet",
  });
});
