import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { formatDuration, formatPaymentError, getExplorerTxUrl, truncateHash } from "./utils.ts";

describe("formatPaymentError", () => {
  it("returns status code when body is empty", () => {
    assert.equal(formatPaymentError("Failed", 402, ""), "Failed: 402");
  });

  it("returns status code when body is only whitespace", () => {
    assert.equal(formatPaymentError("Failed", 500, "   \n\t  "), "Failed: 500");
  });

  it("extracts .error from JSON body", () => {
    const body = JSON.stringify({ error: "Settlement timed out" });
    assert.equal(
      formatPaymentError("Payment failed", 402, body),
      "Payment failed: Settlement timed out",
    );
  });

  it("prefers payment-required header error over body", () => {
    const header = Buffer.from(
      JSON.stringify({ error: "invalid_exact_stellar_payload_fee_exceeds_maximum" }),
    ).toString("base64");

    assert.equal(
      formatPaymentError("Payment failed", 402, JSON.stringify({ error: "fallback" }), header),
      "Payment failed: invalid_exact_stellar_payload_fee_exceeds_maximum",
    );
  });

  it("extracts .message from JSON body", () => {
    const body = JSON.stringify({ message: "Insufficient funds" });
    assert.equal(formatPaymentError("Rejected", 402, body), "Rejected: Insufficient funds");
  });

  it("extracts .detail from JSON body", () => {
    const body = JSON.stringify({ detail: "Rate limit exceeded" });
    assert.equal(formatPaymentError("Error", 429, body), "Error: Rate limit exceeded");
  });

  it("prefers .error over .message", () => {
    const body = JSON.stringify({ error: "Primary", message: "Secondary" });
    assert.equal(formatPaymentError("Err", 500, body), "Err: Primary");
  });

  it("ignores non-string error fields and falls through to raw body", () => {
    const body = JSON.stringify({ error: { nested: true } });
    const result = formatPaymentError("Err", 400, body);
    assert.equal(result, `Err: ${body}`);
  });

  it("falls through to raw text for short JSON without error fields", () => {
    const body = JSON.stringify({ code: 42 });
    assert.equal(formatPaymentError("Err", 400, body), `Err: ${body}`);
  });

  it("returns short plain text directly", () => {
    assert.equal(formatPaymentError("Err", 403, "Forbidden"), "Err: Forbidden");
  });

  it("returns trimmed plain text", () => {
    assert.equal(formatPaymentError("Err", 403, "  Forbidden  "), "Err: Forbidden");
  });

  it("uses console fallback for body longer than 200 chars", () => {
    const consoleError = mock.method(console, "error", () => {});
    try {
      const longBody = "x".repeat(201);
      assert.equal(
        formatPaymentError("Err", 500, longBody),
        "Err: 500 (see browser console for details)",
      );
      assert.equal(consoleError.mock.calls.length, 1);
    } finally {
      consoleError.mock.restore();
    }
  });

  it("shows body directly when exactly 200 chars", () => {
    const body = "y".repeat(200);
    assert.equal(formatPaymentError("Err", 500, body), `Err: ${body}`);
  });

  it("uses console fallback for HTML body starting with <", () => {
    const consoleError = mock.method(console, "error", () => {});
    try {
      assert.equal(
        formatPaymentError("Err", 502, "<html><body>Bad Gateway</body></html>"),
        "Err: 502 (see browser console for details)",
      );
      assert.equal(consoleError.mock.calls.length, 1);
    } finally {
      consoleError.mock.restore();
    }
  });

  it("uses console fallback for short HTML", () => {
    const consoleError = mock.method(console, "error", () => {});
    try {
      assert.equal(
        formatPaymentError("Err", 500, "<!DOCTYPE html>"),
        "Err: 500 (see browser console for details)",
      );
      assert.equal(consoleError.mock.calls.length, 1);
    } finally {
      consoleError.mock.restore();
    }
  });

  it("falls through gracefully on invalid JSON", () => {
    assert.equal(formatPaymentError("Err", 400, "{bad json"), "Err: {bad json");
  });

  it("handles JSON null body without crashing", () => {
    assert.equal(formatPaymentError("Err", 500, "null"), "Err: null");
  });

  it("handles JSON primitive bodies without crashing", () => {
    assert.equal(formatPaymentError("Err", 500, "true"), "Err: true");
    assert.equal(formatPaymentError("Err", 500, "42"), "Err: 42");
    assert.equal(formatPaymentError("Err", 500, '"just a string"'), 'Err: "just a string"');
  });

  it("preserves distinct prefixes for different failure paths", () => {
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
});

describe("getExplorerTxUrl", () => {
  const hash = "c1acc578032a3a06a88603f971d871703f45b1246e0f1aa8862500495edbfba6";

  it("builds a testnet explorer URL", () => {
    assert.equal(
      getExplorerTxUrl("stellar:testnet", hash),
      `https://stellar.expert/explorer/testnet/tx/${hash}`,
    );
  });

  it("maps the CAIP-2 pubnet reference onto Stellar Expert's `public`", () => {
    assert.equal(
      getExplorerTxUrl("stellar:pubnet", hash),
      `https://stellar.expert/explorer/public/tx/${hash}`,
    );
  });

  it("returns null when either input is missing", () => {
    assert.equal(getExplorerTxUrl(undefined, hash), null);
    assert.equal(getExplorerTxUrl("stellar:testnet", undefined), null);
  });

  it("returns null for a non-Stellar network", () => {
    assert.equal(getExplorerTxUrl("eip155:8453", hash), null);
  });

  it("returns null when the network has no reference", () => {
    assert.equal(getExplorerTxUrl("stellar:", hash), null);
  });

  it("escapes a hash that would otherwise alter the path", () => {
    assert.equal(
      getExplorerTxUrl("stellar:testnet", "../../evil"),
      "https://stellar.expert/explorer/testnet/tx/..%2F..%2Fevil",
    );
  });
});

describe("truncateHash", () => {
  it("keeps both ends of a long hash", () => {
    assert.equal(truncateHash("0123456789abcdef0123456789abcdef"), "01234567…89abcdef");
  });

  it("leaves a short value untouched", () => {
    assert.equal(truncateHash("abcdef"), "abcdef");
  });

  it("honours a custom edge width", () => {
    assert.equal(truncateHash("0123456789abcdef", 4), "0123…cdef");
  });
});

describe("formatDuration", () => {
  it("uses milliseconds below a second", () => {
    assert.equal(formatDuration(820.4), "820ms");
  });

  it("uses seconds at and above a second", () => {
    assert.equal(formatDuration(1000), "1.0s");
    assert.equal(formatDuration(4137), "4.1s");
  });

  it("renders a placeholder for values that are not real durations", () => {
    assert.equal(formatDuration(Number.NaN), "—");
    assert.equal(formatDuration(-1), "—");
  });
});
