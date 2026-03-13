import test from "node:test";
import assert from "node:assert/strict";
import {
  getX402ErrorMessage,
  parseX402Header,
  type X402PaymentResponsePayload,
} from "./x402Http.js";

function encodeBase64Json(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

test("parseX402Header returns parsed JSON", () => {
  assert.deepEqual(parseX402Header(encodeBase64Json({ hello: "world" })), {
    hello: "world",
  });
});

test("parseX402Header returns undefined for missing input", () => {
  assert.equal(parseX402Header(undefined), undefined);
  assert.equal(parseX402Header(null), undefined);
  assert.equal(parseX402Header(""), undefined);
});

test("parseX402Header returns undefined for invalid base64 json", () => {
  assert.equal(parseX402Header("%%%"), undefined);
  assert.equal(parseX402Header(Buffer.from("not-json").toString("base64")), undefined);
});

test("getX402ErrorMessage prefers x402 error fields in priority order", () => {
  assert.equal(getX402ErrorMessage({ error: "primary", message: "secondary" }), "primary");
  assert.equal(getX402ErrorMessage({ message: "secondary" }), "secondary");
  assert.equal(getX402ErrorMessage({ detail: "detail" }), "detail");
  assert.equal(getX402ErrorMessage({ details: "details" }), "details");
});

test("getX402ErrorMessage returns undefined for non-object payloads", () => {
  assert.equal(getX402ErrorMessage(undefined), undefined);
  assert.equal(getX402ErrorMessage(null), undefined);
  assert.equal(getX402ErrorMessage({}), undefined);
});

test("getX402ErrorMessage ignores empty and whitespace-only strings", () => {
  assert.equal(getX402ErrorMessage({ error: "" }), undefined);
  assert.equal(getX402ErrorMessage({ error: "   " }), undefined);
  assert.equal(getX402ErrorMessage({ error: "", message: "fallback" }), "fallback");
});

test("getX402ErrorMessage ignores non-string field values", () => {
  assert.equal(getX402ErrorMessage({ error: 123 }), undefined);
  assert.equal(getX402ErrorMessage({ error: true, message: "fallback" }), "fallback");
});

test("getX402ErrorMessage returns undefined for array payloads", () => {
  // Arrays pass typeof === "object" but have no meaningful error fields
  assert.equal(getX402ErrorMessage(["not", "an", "object"]), undefined);
});

test("parseX402Header decodes payment-required header", () => {
  const header = encodeBase64Json({ error: "invalid_exact_stellar_payload_fee_exceeds_maximum" });
  assert.equal(
    getX402ErrorMessage(parseX402Header<Record<string, unknown>>(header)),
    "invalid_exact_stellar_payload_fee_exceeds_maximum",
  );
});

test("parseX402Header decodes payment-response header", () => {
  const header = encodeBase64Json({ transaction: "abc123", network: "stellar:testnet" });
  assert.deepEqual(parseX402Header<X402PaymentResponsePayload>(header), {
    transaction: "abc123",
    network: "stellar:testnet",
  });
});
