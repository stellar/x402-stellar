import test from "node:test";
import assert from "node:assert/strict";
import { formatPaymentError } from "./formatPaymentError.ts";

test("returns status code when body is empty", () => {
  assert.equal(formatPaymentError("Failed", 402, ""), "Failed: 402");
});

test("returns status code when body is only whitespace", () => {
  assert.equal(formatPaymentError("Failed", 500, "   \n\t  "), "Failed: 500");
});

test("extracts .error from JSON body", () => {
  const body = JSON.stringify({ error: "Settlement timed out" });
  assert.equal(
    formatPaymentError("Payment failed", 402, body),
    "Payment failed: Settlement timed out",
  );
});

test("extracts .message from JSON body", () => {
  const body = JSON.stringify({ message: "Insufficient funds" });
  assert.equal(formatPaymentError("Rejected", 402, body), "Rejected: Insufficient funds");
});

test("extracts .detail from JSON body", () => {
  const body = JSON.stringify({ detail: "Rate limit exceeded" });
  assert.equal(formatPaymentError("Error", 429, body), "Error: Rate limit exceeded");
});

test("prefers .error over .message", () => {
  const body = JSON.stringify({ error: "Primary", message: "Secondary" });
  assert.equal(formatPaymentError("Err", 500, body), "Err: Primary");
});

test("ignores non-string error fields and falls through to raw body", () => {
  const body = JSON.stringify({ error: { nested: true } });
  const result = formatPaymentError("Err", 400, body);
  assert.equal(result, `Err: ${body}`);
});

test("falls through to raw text for short JSON without error fields", () => {
  const body = JSON.stringify({ code: 42 });
  assert.equal(formatPaymentError("Err", 400, body), `Err: ${body}`);
});

test("returns short plain text directly", () => {
  assert.equal(formatPaymentError("Err", 403, "Forbidden"), "Err: Forbidden");
});

test("returns trimmed plain text", () => {
  assert.equal(formatPaymentError("Err", 403, "  Forbidden  "), "Err: Forbidden");
});

test("uses console fallback for body longer than 200 chars", () => {
  const longBody = "x".repeat(201);
  assert.equal(
    formatPaymentError("Err", 500, longBody),
    "Err: 500 (see browser console for details)",
  );
});

test("shows body directly when exactly 200 chars", () => {
  const body = "y".repeat(200);
  assert.equal(formatPaymentError("Err", 500, body), `Err: ${body}`);
});

test("uses console fallback for HTML body starting with <", () => {
  assert.equal(
    formatPaymentError("Err", 502, "<html><body>Bad Gateway</body></html>"),
    "Err: 502 (see browser console for details)",
  );
});

test("uses console fallback for short HTML", () => {
  assert.equal(
    formatPaymentError("Err", 500, "<!DOCTYPE html>"),
    "Err: 500 (see browser console for details)",
  );
});

test("falls through gracefully on invalid JSON", () => {
  assert.equal(formatPaymentError("Err", 400, "{bad json"), "Err: {bad json");
});

test("handles JSON null body without crashing", () => {
  assert.equal(formatPaymentError("Err", 500, "null"), "Err: null");
});

test("handles JSON primitive bodies without crashing", () => {
  assert.equal(formatPaymentError("Err", 500, "true"), "Err: true");
  assert.equal(formatPaymentError("Err", 500, "42"), "Err: 42");
  assert.equal(formatPaymentError("Err", 500, '"just a string"'), 'Err: "just a string"');
});

test("preserves distinct prefixes for different failure paths", () => {
  const body = JSON.stringify({ error: "timeout" });
  assert.equal(
    formatPaymentError("Payment retry failed", 402, body),
    "Payment retry failed: timeout",
  );
  assert.equal(
    formatPaymentError("Payment required but settlement failed", 402, body),
    "Payment required but settlement failed: timeout",
  );
  assert.equal(
    formatPaymentError("Payment request rejected", 403, body),
    "Payment request rejected: timeout",
  );
});
