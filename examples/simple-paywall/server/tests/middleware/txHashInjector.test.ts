import { describe, it, expect } from "vitest";
import { injectTxLink } from "../../src/middleware/txHashInjector.js";

const PLACEHOLDER = "{{TX_LINK}}";

function encodePaymentResponse(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

describe("injectTxLink", () => {
  it("replaces placeholder with empty string when header is undefined", () => {
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, undefined);
    expect(result).toBe("<html><body></body></html>");
  });

  it("replaces placeholder with empty string when header has no transaction", () => {
    const header = encodePaymentResponse({ network: "stellar:testnet" });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);
    expect(result).toBe("<html><body></body></html>");
  });

  it("replaces placeholder with empty string when header is invalid JSON", () => {
    const header = Buffer.from("not valid json").toString("base64");
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);
    expect(result).toBe("<html><body></body></html>");
  });

  it("replaces placeholder with testnet Stellar Expert link", () => {
    const txHash = "abc123def456";
    const header = encodePaymentResponse({
      transaction: txHash,
      network: "stellar:testnet",
    });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);

    expect(result).toContain("stellar.expert/explorer/testnet/tx/abc123def456");
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).not.toContain(PLACEHOLDER);
  });

  it("replaces placeholder with pubnet Stellar Expert link", () => {
    const txHash = "aabbccdd00112233";
    const header = encodePaymentResponse({
      transaction: txHash,
      network: "stellar:pubnet",
    });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);

    expect(result).toContain("stellar.expert/explorer/public/tx/aabbccdd00112233");
    expect(result).not.toContain(PLACEHOLDER);
  });

  it("falls back to testnet for unknown network segments", () => {
    const txHash = "ff00ee11dd22cc33";
    const header = encodePaymentResponse({
      transaction: txHash,
      network: "stellar:futurenet",
    });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);

    expect(result).toContain("stellar.expert/explorer/testnet/tx/ff00ee11dd22cc33");
  });

  it("falls back to testnet when network is missing", () => {
    const txHash = "aa11bb22cc33dd44";
    const header = encodePaymentResponse({ transaction: txHash });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);

    expect(result).toContain("stellar.expert/explorer/testnet/tx/aa11bb22cc33dd44");
  });

  it("replaces placeholder with empty string when transaction hash contains non-hex characters", () => {
    const header = encodePaymentResponse({
      transaction: '"><script>alert(1)</script>',
      network: "stellar:testnet",
    });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);
    expect(result).toBe("<html><body></body></html>");
  });

  it("replaces placeholder with empty string when transaction hash contains spaces", () => {
    const header = encodePaymentResponse({
      transaction: "abc 123",
      network: "stellar:testnet",
    });
    const body = `<html><body>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);
    expect(result).toBe("<html><body></body></html>");
  });

  it("returns body unchanged when placeholder is not present", () => {
    const header = encodePaymentResponse({
      transaction: "some_hash",
      network: "stellar:testnet",
    });
    const body = "<html><body>No placeholder here</body></html>";
    const result = injectTxLink(body, header);

    expect(result).toBe("<html><body>No placeholder here</body></html>");
  });
});
