import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

// Mock the x402 payment middleware to simulate 402 behavior without a facilitator
vi.mock("../../src/middleware/payment.js", () => ({
  createPaymentMiddleware: () => {
    return (
      req: { path: string; method: string; headers: Record<string, string> },
      res: {
        status: (code: number) => {
          type: (t: string) => { send: (b: string) => void };
          json: (b: unknown) => void;
        };
      },
      next: () => void,
    ) => {
      if (req.path === "/protected" && req.method === "GET") {
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
    };
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

describe("GET /protected", () => {
  it("returns 402 without payment (JSON for API clients)", async () => {
    const res = await request(app).get("/protected").set("Accept", "application/json");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 402 with HTML paywall for browsers", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Accept", "text/html,application/xhtml+xml");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain("Payment Required");
  });

  it("does not return 500", async () => {
    const res = await request(app).get("/protected");

    expect(res.status).not.toBe(500);
  });
});

describe("unknown routes", () => {
  it("GET /nonexistent returns 404, not 500", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(500);
  });
});
