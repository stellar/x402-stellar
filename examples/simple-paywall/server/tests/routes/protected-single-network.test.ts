import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

vi.mock("../../src/middleware/payment.js", () => ({
  createPaymentMiddlewares: () => {
    const makeMock = (network: string, routeSuffix: string) => ({
      network,
      routePath: `/protected/${routeSuffix}`,
      handler: (
        req: { path: string; method: string; headers: Record<string, string> },
        res: {
          status: (code: number) => {
            type: (t: string) => { send: (b: string) => void };
            json: (b: unknown) => void;
          };
        },
        next: () => void,
      ) => {
        if (req.path === `/protected/${routeSuffix}` && req.method === "GET") {
          const accept = req.headers["accept"] ?? "";
          if (accept.includes("text/html")) {
            res.status(402).type("html").send("<html><body>Payment Required</body></html>");
          } else {
            res.status(402).json({
              x402Version: 2,
              error: "Payment required",
              accepts: [],
            });
          }
          return;
        }
        next();
      },
    });
    return [makeMock("stellar:testnet", "testnet")];
  },
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

  vi.stubEnv(
    "TESTNET_SERVER_STELLAR_ADDRESS",
    "GAJUGVETJ4NQIG64OQNLNL6KHXYQ46MFWBCXFIUMACK4MTOOTRYJN2KV",
  );
  vi.stubEnv("TESTNET_FACILITATOR_URL", "http://localhost:4022");
  delete process.env.MAINNET_SERVER_STELLAR_ADDRESS;

  const { createApp } = await import("../../src/app.js");
  app = createApp();
});

describe("single-network deployment (testnet only)", () => {
  it("GET /networks returns only stellar:testnet", async () => {
    const res = await request(app).get("/networks");

    expect(res.status).toBe(200);
    expect(res.body.networks).toEqual(["stellar:testnet"]);
  });

  it("GET /protected/testnet returns 402", async () => {
    const res = await request(app).get("/protected/testnet").set("Accept", "application/json");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /protected/mainnet returns 404 when mainnet is not configured", async () => {
    const res = await request(app).get("/protected/mainnet");

    expect(res.status).toBe(404);
  });
});

describe("GET /.well-known/x402 (single-network)", () => {
  it("lists only testnet weather route", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.resources).toHaveLength(1);
    expect(res.body.resources[0]).toBe("GET /weather/testnet");
  });

  it("does not include mainnet weather route", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(res.body.resources.some((r: string) => r.includes("mainnet"))).toBe(false);
  });
});

describe("GET /openapi.json (single-network)", () => {
  it("includes only testnet weather path", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.paths["/weather/testnet"]).toBeDefined();
    expect(res.body.paths["/weather/mainnet"]).toBeUndefined();
  });

  it("declares x-payment-info for testnet path", async () => {
    const res = await request(app).get("/openapi.json");

    const op = res.body.paths["/weather/testnet"].get;
    expect(op["x-payment-info"].protocols).toContain("x402");
    expect(op["x-payment-info"].network).toBe("stellar:testnet");
  });
});
