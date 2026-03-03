import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type express from "express";

const mockVerify = vi.fn().mockResolvedValue({ isValid: true });

vi.mock("@x402/core/facilitator", () => {
  return {
    x402Facilitator: vi.fn().mockImplementation(() => {
      const instance = {
        onBeforeVerify: vi.fn().mockReturnThis(),
        onAfterVerify: vi.fn().mockReturnThis(),
        onVerifyFailure: vi.fn().mockReturnThis(),
        onBeforeSettle: vi.fn().mockReturnThis(),
        onAfterSettle: vi.fn().mockReturnThis(),
        onSettleFailure: vi.fn().mockReturnThis(),
        register: vi.fn(),
        verify: mockVerify,
        settle: vi.fn().mockResolvedValue({
          success: true,
          network: "stellar:testnet",
          transaction: "mock_tx_hash",
        }),
        getSupported: vi.fn().mockReturnValue({
          kinds: [{ scheme: "exact", network: "stellar:testnet" }],
        }),
      };
      return instance;
    }),
  };
});

vi.mock("@x402/stellar", () => ({
  createEd25519Signer: vi.fn().mockReturnValue({
    address: "GMOCKADDRESS",
    sign: vi.fn(),
  }),
}));

vi.mock("@x402/stellar/exact/facilitator", () => ({
  ExactStellarScheme: vi.fn(),
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

let app: express.Express;

beforeAll(async () => {
  const mod = await import("../../src/app.js");
  app = mod.createApp();
});

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /supported", () => {
  it("returns 200 with supported kinds", async () => {
    const res = await request(app).get("/supported");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("kinds");
    expect(res.body.kinds).toBeInstanceOf(Array);
  });
});

describe("POST /verify", () => {
  it("returns invalidReason when verification is invalid", async () => {
    mockVerify.mockResolvedValueOnce({
      isValid: false,
      invalidReason: "invalid_exact_stellar_payload_wrong_amount",
    });

    const res = await request(app)
      .post("/verify")
      .send({
        paymentPayload: { network: "stellar:testnet" },
        paymentRequirements: { scheme: "exact" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isValid: false,
      invalidReason: "invalid_exact_stellar_payload_wrong_amount",
    });
  });

  it("returns 400 when paymentPayload is missing", async () => {
    const res = await request(app).post("/verify").send({ paymentRequirements: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing");
  });

  it("returns 400 when paymentRequirements is missing", async () => {
    const res = await request(app).post("/verify").send({ paymentPayload: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing");
  });

  it("returns verify response for valid request", async () => {
    const res = await request(app)
      .post("/verify")
      .send({
        paymentPayload: { network: "stellar:testnet" },
        paymentRequirements: { scheme: "exact" },
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("isValid");
  });
});

describe("POST /settle", () => {
  it("returns 400 when paymentPayload is missing", async () => {
    const res = await request(app).post("/settle").send({ paymentRequirements: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing");
  });

  it("returns settle response for valid request", async () => {
    const res = await request(app)
      .post("/settle")
      .send({
        paymentPayload: { network: "stellar:testnet" },
        paymentRequirements: { scheme: "exact" },
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success");
  });
});

describe("Security headers", () => {
  it("includes helmet security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers).toHaveProperty("x-content-type-options", "nosniff");
    expect(res.headers).toHaveProperty("x-frame-options");
  });
});

describe("unknown routes", () => {
  it("GET /nonexistent returns 404", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
  });
});
