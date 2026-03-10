import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

vi.mock("../../src/middleware/payment.js", () => ({
  createPaymentMiddlewares: () => [],
  createApiPaymentMiddlewares: () => [],
}));

vi.mock("../../src/utils/logger.js", () => {
  const noop = () => {};
  const noopLogger = {
    info: noop,
    error: noop,
    warn: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    flush: noop,
    child: () => noopLogger,
  };
  return {
    logger: noopLogger,
    httpLogger: (_req: unknown, _res: unknown, next: () => void) => next(),
  };
});

let app: Express;

beforeAll(async () => {
  const { Env } = await import("../../src/config/env.js");
  Env.resetCache();

  vi.stubEnv("PAYWALL_DISABLED", "true");
  delete process.env.TESTNET_SERVER_STELLAR_ADDRESS;
  delete process.env.MAINNET_SERVER_STELLAR_ADDRESS;

  const { createApp } = await import("../../src/app.js");
  app = createApp();
});

describe("paywall-disabled mode", () => {
  it("GET /protected/testnet returns 200 with HTML content", async () => {
    const res = await request(app)
      .get("/protected/testnet")
      .set("Accept", "text/html,application/xhtml+xml");

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/html/);
  });

  it("GET /protected/mainnet returns 200 with HTML content", async () => {
    const res = await request(app)
      .get("/protected/mainnet")
      .set("Accept", "text/html,application/xhtml+xml");

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/html/);
  });

  it("GET /protected/fakenet still returns 200 in free mode (no network validation)", async () => {
    const res = await request(app).get("/protected/fakenet");

    expect(res.status).toBe(200);
  });
});

describe("GET /.well-known/x402 (paywall disabled)", () => {
  it("returns empty resources array", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.resources).toEqual([]);
  });

  it("still includes a description", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(typeof res.body.description).toBe("string");
    expect(res.body.description.length).toBeGreaterThan(0);
  });
});
