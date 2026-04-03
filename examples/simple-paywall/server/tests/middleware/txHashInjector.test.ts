import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { injectTxLink, txHashInjector } from "../../src/middleware/txHashInjector.js";

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

  // replaceAll for multiple placeholders
  it("replaces all occurrences of {{TX_LINK}}", () => {
    const txHash = "abc123def456";
    const header = encodePaymentResponse({
      transaction: txHash,
      network: "stellar:testnet",
    });
    const body = `<html><body>${PLACEHOLDER}<br/>${PLACEHOLDER}</body></html>`;
    const result = injectTxLink(body, header);
    expect(result).not.toContain(PLACEHOLDER);
  });
});

describe("txHashInjector middleware", () => {
  // non-HTML responses should NOT be buffered — res.write passes through
  it("passes non-HTML res.write calls through to original write", async () => {
    const app = express();
    app.use(txHashInjector());
    app.get("/api", (_req, res) => {
      // res.json sets content-type to application/json before writing
      res.json({ data: "test" });
    });

    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: "test" });
  });

  it("still buffers HTML responses for {{TX_LINK}} replacement", async () => {
    const app = express();
    app.use(txHashInjector());
    app.get("/page", (_req, res) => {
      res.setHeader("content-type", "text/html");
      res.write("<html>{{TX_LINK}}");
      res.end("</html>");
    });

    const res = await request(app).get("/page");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("{{TX_LINK}}");
  });

  // HTML path should forward res.end callback
  it("forwards res.end callback on HTML path", async () => {
    let callbackCalled = false;
    const app = express();
    app.use(txHashInjector());
    app.get("/page", (_req, res) => {
      res.setHeader("content-type", "text/html");
      res.end("<html>{{TX_LINK}}</html>", () => {
        callbackCalled = true;
      });
    });

    await request(app).get("/page");
    expect(callbackCalled).toBe(true);
  });
});
