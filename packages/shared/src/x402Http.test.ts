import test from "node:test";
import assert from "node:assert/strict";
import {
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

test("parseX402PaymentRequiredHeaderError prefers x402 error fields in priority order", () => {
  assert.equal(
    parseX402PaymentRequiredHeaderError(
      encodeBase64Json({ error: "primary", message: "secondary" }),
    ),
    "primary",
  );
  assert.equal(
    parseX402PaymentRequiredHeaderError(encodeBase64Json({ message: "secondary" })),
    "secondary",
  );
  assert.equal(
    parseX402PaymentRequiredHeaderError(encodeBase64Json({ detail: "detail" })),
    "detail",
  );
  assert.equal(
    parseX402PaymentRequiredHeaderError(encodeBase64Json({ details: "details" })),
    "details",
  );
});

test("parseX402PaymentRequiredHeaderError returns undefined for non-object payloads", () => {
  assert.equal(parseX402PaymentRequiredHeaderError(undefined), undefined);
  assert.equal(parseX402PaymentRequiredHeaderError(null), undefined);
  assert.equal(parseX402PaymentRequiredHeaderError(encodeBase64Json({})), undefined);
});

test("parseX402PaymentRequiredHeaderError ignores empty and whitespace-only strings", () => {
  assert.equal(parseX402PaymentRequiredHeaderError(encodeBase64Json({ error: "" })), undefined);
  assert.equal(parseX402PaymentRequiredHeaderError(encodeBase64Json({ error: "   " })), undefined);
  assert.equal(
    parseX402PaymentRequiredHeaderError(encodeBase64Json({ error: "", message: "fallback" })),
    "fallback",
  );
});

test("parseX402PaymentRequiredHeaderError ignores non-string field values", () => {
  assert.equal(
    parseX402PaymentRequiredHeaderError(encodeBase64Json({ error: 123 as unknown as string })),
    undefined,
  );
  assert.equal(
    parseX402PaymentRequiredHeaderError(
      encodeBase64Json({ error: true as unknown as string, message: "fallback" }),
    ),
    "fallback",
  );
});

test("parseX402PaymentRequiredHeaderError returns undefined for array payloads", () => {
  // Arrays pass typeof === "object" but have no meaningful error fields
  const header = Buffer.from(JSON.stringify(["not", "an", "object"])).toString("base64");
  assert.equal(parseX402PaymentRequiredHeaderError(header), undefined);
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
