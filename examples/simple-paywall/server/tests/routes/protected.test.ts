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
    return [makeMock("stellar:testnet", "testnet"), makeMock("stellar:pubnet", "mainnet")];
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
  vi.stubEnv(
    "TESTNET_SERVER_STELLAR_ADDRESS",
    "GAJUGVETJ4NQIG64OQNLNL6KHXYQ46MFWBCXFIUMACK4MTOOTRYJN2KV",
  );
  vi.stubEnv("TESTNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv(
    "MAINNET_SERVER_STELLAR_ADDRESS",
    "GBZOAILBLWURMYNMVFITJJBKXSKHV4MLLZ4I57K5RY3VP3JAF7FTCGF6",
  );
  vi.stubEnv("MAINNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv("MAINNET_STELLAR_RPC_URL", "https://mainnet.sorobanrpc.com");
  const { createApp } = await import("../../src/app.js");
  app = createApp();
});

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/health");

    expect(res.status).not.toBe(500);
  });
});

describe("GET /networks", () => {
  it("returns available networks as CAIP-2 identifiers", async () => {
    const res = await request(app).get("/networks");

    expect(res.status).toBe(200);
    expect(res.body.networks).toBeInstanceOf(Array);
    expect(res.body.networks.length).toBeGreaterThan(0);
    expect(res.body.networks[0]).toMatch(/^stellar:/);
  });

  it("includes both stellar:testnet and stellar:pubnet when both are configured", async () => {
    const res = await request(app).get("/networks");

    expect(res.body.networks).toContain("stellar:testnet");
    expect(res.body.networks).toContain("stellar:pubnet");
  });
});

describe("GET /protected/testnet", () => {
  it("returns 402 without payment (JSON for API clients)", async () => {
    const res = await request(app).get("/protected/testnet").set("Accept", "application/json");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 402 with HTML paywall for browsers", async () => {
    const res = await request(app)
      .get("/protected/testnet")
      .set("Accept", "text/html,application/xhtml+xml");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain("Payment Required");
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/protected/testnet");

    expect(res.status).not.toBe(500);
  });
});

describe("GET /protected/mainnet", () => {
  it("returns 402 without payment (JSON for API clients)", async () => {
    const res = await request(app).get("/protected/mainnet").set("Accept", "application/json");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 402 with HTML paywall for browsers", async () => {
    const res = await request(app)
      .get("/protected/mainnet")
      .set("Accept", "text/html,application/xhtml+xml");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain("Payment Required");
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/protected/mainnet");

    expect(res.status).not.toBe(500);
  });
});

describe("GET /protected/:network with invalid network", () => {
  it("returns 404 for unrecognized network", async () => {
    const res = await request(app).get("/protected/fakenet");

    expect(res.status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("GET /nonexistent returns 404, not 500", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(500);
  });
});

describe("GET /.well-known/x402", () => {
  it("returns version 1 with resources array", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.resources).toBeInstanceOf(Array);
  });

  it("lists only weather API routes (not /protected)", async () => {
    const res = await request(app).get("/.well-known/x402");

    const resources: string[] = res.body.resources;
    expect(resources).toHaveLength(2);
    expect(resources.every((r: string) => r.includes("/weather/"))).toBe(true);
    expect(resources.some((r: string) => r.includes("/protected/"))).toBe(false);
  });

  it("includes both testnet and mainnet weather routes", async () => {
    const res = await request(app).get("/.well-known/x402");

    const resources: string[] = res.body.resources;
    expect(resources).toContain("GET /weather/testnet");
    expect(resources).toContain("GET /weather/mainnet");
  });

  it("uses METHOD /path format per x402scan spec", async () => {
    const res = await request(app).get("/.well-known/x402");

    const resources: string[] = res.body.resources;
    for (const entry of resources) {
      expect(entry).toMatch(/^GET \/weather\//);
    }
  });

  it("includes a description", async () => {
    const res = await request(app).get("/.well-known/x402");

    expect(typeof res.body.description).toBe("string");
    expect(res.body.description.length).toBeGreaterThan(0);
  });
});

describe("GET /openapi.json", () => {
  it("returns valid OpenAPI 3.1.0 structure", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.info.title).toBeDefined();
    expect(res.body.info.version).toBeDefined();
    expect(res.body.paths).toBeDefined();
  });

  it("includes both testnet and mainnet weather paths", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.body.paths["/weather/testnet"]).toBeDefined();
    expect(res.body.paths["/weather/mainnet"]).toBeDefined();
  });

  it("declares x-payment-info with x402 protocol on each path", async () => {
    const res = await request(app).get("/openapi.json");

    for (const path of ["/weather/testnet", "/weather/mainnet"]) {
      const op = res.body.paths[path].get;
      expect(op["x-payment-info"]).toBeDefined();
      expect(op["x-payment-info"].protocols).toContain("x402");
      expect(op["x-payment-info"].pricingMode).toBe("fixed");
      expect(op["x-payment-info"].price).toBeDefined();
    }
  });

  it("includes 402 response on each weather path", async () => {
    const res = await request(app).get("/openapi.json");

    for (const path of ["/weather/testnet", "/weather/mainnet"]) {
      expect(res.body.paths[path].get.responses["402"]).toBeDefined();
    }
  });

  it("declares required city query parameter", async () => {
    const res = await request(app).get("/openapi.json");

    const params = res.body.paths["/weather/testnet"].get.parameters;
    const cityParam = params.find((p: { name: string }) => p.name === "city");
    expect(cityParam).toBeDefined();
    expect(cityParam.in).toBe("query");
    expect(cityParam.required).toBe(true);
  });

  it("includes correct Stellar network identifiers", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.body.paths["/weather/testnet"].get["x-payment-info"].network).toBe(
      "stellar:testnet",
    );
    expect(res.body.paths["/weather/mainnet"].get["x-payment-info"].network).toBe("stellar:pubnet");
  });
});
