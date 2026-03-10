import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

vi.mock("../../src/middleware/payment.js", () => ({
  createPaymentMiddlewares: () => [],
  createApiPaymentMiddlewares: () => {
    const makeMock = (network: string, routeSuffix: string) => ({
      network,
      routePath: `/api/protected/${routeSuffix}`,
      handler: (
        req: { path: string; method: string; headers: Record<string, string> },
        res: {
          status: (code: number) => { json: (b: unknown) => void };
          json: (b: unknown) => void;
        },
        next: () => void,
      ) => {
        if (req.path === `/api/protected/${routeSuffix}` && req.method === "GET") {
          if (!req.headers["payment-signature"] && !req.headers["PAYMENT-SIGNATURE"]) {
            res.status(402).json({
              x402Version: 2,
              error: "Payment required",
              accepts: [
                {
                  scheme: "exact",
                  network,
                  asset: "USDC",
                  amount: "10000",
                  payTo: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                  maxTimeoutSeconds: 3600,
                },
              ],
            });
            return;
          }
        }
        next();
      },
    });
    return [makeMock("stellar:testnet", "testnet"), makeMock("stellar:pubnet", "mainnet")];
  },
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
  vi.stubEnv(
    "TESTNET_SERVER_STELLAR_ADDRESS",
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );
  vi.stubEnv("TESTNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv(
    "MAINNET_SERVER_STELLAR_ADDRESS",
    "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  );
  vi.stubEnv("MAINNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv("MAINNET_STELLAR_RPC_URL", "https://mainnet.sorobanrpc.com");
  const { createApp } = await import("../../src/app.js");
  app = createApp();
});

describe("GET /api/protected/testnet", () => {
  it("returns 402 with JSON when no payment signature is provided", async () => {
    const res = await request(app).get("/api/protected/testnet");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("accepts");
  });

  it("does not return an HTML paywall for API clients", async () => {
    const res = await request(app).get("/api/protected/testnet");

    expect(res.status).toBe(402);
    expect(res.type).not.toMatch(/html/);
  });

  it("returns 200 with JSON on successful payment", async () => {
    // The mock passes requests that include a payment header to the route handler.
    const res = await request(app)
      .get("/api/protected/testnet")
      .set("PAYMENT-SIGNATURE", "dummy-signature");

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty("message", "Access granted");
    expect(res.body).toHaveProperty("network", "testnet");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/api/protected/testnet");

    expect(res.status).not.toBe(500);
  });
});

describe("GET /api/protected/mainnet", () => {
  it("returns 402 with JSON when no payment signature is provided", async () => {
    const res = await request(app).get("/api/protected/mainnet");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("accepts");
  });

  it("does not return an HTML paywall for API clients", async () => {
    const res = await request(app).get("/api/protected/mainnet");

    expect(res.status).toBe(402);
    expect(res.type).not.toMatch(/html/);
  });

  it("returns 200 with JSON on successful payment", async () => {
    const res = await request(app)
      .get("/api/protected/mainnet")
      .set("PAYMENT-SIGNATURE", "dummy-signature");

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty("message", "Access granted");
    expect(res.body).toHaveProperty("network", "mainnet");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/api/protected/mainnet");

    expect(res.status).not.toBe(500);
  });
});

describe("GET /api/protected/:network with invalid network", () => {
  it("returns 404 for unrecognized network", async () => {
    const res = await request(app).get("/api/protected/fakenet");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
