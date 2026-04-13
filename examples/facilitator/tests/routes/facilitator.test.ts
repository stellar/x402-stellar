import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import type express from "express";

const mockVerify = vi.fn().mockResolvedValue({ isValid: true });
const mockSettle = vi.fn().mockResolvedValue({
  success: true,
  network: "stellar:testnet",
  transaction: "mock_tx_hash",
});

vi.mock("@x402/core/facilitator", () => {
  return {
    x402Facilitator: vi.fn().mockImplementation(function () {
      const instance = {
        onBeforeVerify: vi.fn().mockReturnThis(),
        onAfterVerify: vi.fn().mockReturnThis(),
        onVerifyFailure: vi.fn().mockReturnThis(),
        onBeforeSettle: vi.fn().mockReturnThis(),
        onAfterSettle: vi.fn().mockReturnThis(),
        onSettleFailure: vi.fn().mockReturnThis(),
        register: vi.fn(),
        verify: mockVerify,
        settle: mockSettle,
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

const validPaymentRequirements = {
  scheme: "exact",
  network: "stellar:testnet",
  asset: "native",
  amount: "100",
  payTo: "GABCDEF",
  maxTimeoutSeconds: 60,
  extra: {},
};

const validPaymentPayload = {
  x402Version: 1,
  accepted: validPaymentRequirements,
  payload: { signature: "mock" },
};

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

    const res = await request(app).post("/verify").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isValid: false,
      invalidReason: "invalid_exact_stellar_payload_wrong_amount",
    });
  });

  it("returns 400 when paymentPayload is missing", async () => {
    const res = await request(app)
      .post("/verify")
      .send({ paymentRequirements: validPaymentRequirements });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("paymentPayload");
  });

  it("returns 400 when paymentRequirements is missing", async () => {
    const res = await request(app).post("/verify").send({ paymentPayload: validPaymentPayload });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("paymentRequirements");
  });

  it("returns verify response for valid request", async () => {
    const res = await request(app).post("/verify").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("isValid");
  });
});

describe("POST /settle", () => {
  it("returns 400 when paymentPayload is missing", async () => {
    const res = await request(app)
      .post("/settle")
      .send({ paymentRequirements: validPaymentRequirements });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("paymentPayload");
  });

  it("returns settle response for valid request", async () => {
    const res = await request(app).post("/settle").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success");
  });

  // settle abort response must include `transaction` field
  it("includes transaction field in settlement-aborted error response", async () => {
    mockSettle.mockRejectedValueOnce(new Error("Settlement aborted: insufficient balance"));

    const res = await request(app).post("/settle").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });

    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty("transaction");
    expect(res.body.success).toBe(false);
  });

  it("uses network from validated paymentRequirements in settlement-aborted response", async () => {
    mockSettle.mockRejectedValueOnce(new Error("Settlement aborted: insufficient balance"));

    const res = await request(app)
      .post("/settle")
      .send({
        paymentPayload: validPaymentPayload,
        paymentRequirements: { ...validPaymentRequirements, network: "stellar:pubnet" },
      });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.network).toBe("stellar:pubnet");
  });

  // body shape validation — truthy non-object values must be rejected
  it("returns 400 when paymentPayload is a string (truthy but wrong shape)", async () => {
    const res = await request(app)
      .post("/settle")
      .send({ paymentPayload: "not-an-object", paymentRequirements: validPaymentRequirements });
    expect(res.status).toBe(400);
  });

  it("returns 400 when paymentPayload is an array", async () => {
    const res = await request(app)
      .post("/settle")
      .send({ paymentPayload: [1, 2], paymentRequirements: validPaymentRequirements });
    expect(res.status).toBe(400);
  });

  it("returns 400 when paymentRequirements is a number", async () => {
    const res = await request(app)
      .post("/settle")
      .send({ paymentPayload: validPaymentPayload, paymentRequirements: 42 });
    expect(res.status).toBe(400);
  });

  // settle error should not leak internal error details
  it("does not leak internal error details in settlement-aborted response", async () => {
    mockSettle.mockRejectedValueOnce(
      new Error(
        "Settlement aborted: account GABC123 sequence 99 RPC timeout at soroban-rpc.stellar.org",
      ),
    );

    const res = await request(app).post("/settle").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.errorReason).not.toContain("GABC123");
    expect(res.body.errorReason).not.toContain("soroban-rpc");
  });
});

describe("POST /verify — body shape validation", () => {
  // same validation on /verify
  it("returns 400 when paymentPayload is a string", async () => {
    const res = await request(app)
      .post("/verify")
      .send({ paymentPayload: "not-an-object", paymentRequirements: validPaymentRequirements });
    expect(res.status).toBe(400);
  });

  it("returns 400 when paymentRequirements is an array", async () => {
    const res = await request(app)
      .post("/verify")
      .send({ paymentPayload: validPaymentPayload, paymentRequirements: [1] });
    expect(res.status).toBe(400);
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

describe("API key authentication", () => {
  const TEST_API_KEY = "test-secret-key-12345";
  let authApp: express.Express;

  beforeAll(async () => {
    // Set env var before calling createApp() — Env.apiKey is a getter that reads
    // process.env at call time, so createApp() will capture the key correctly.
    process.env.FACILITATOR_API_KEY = TEST_API_KEY;
    const mod = await import("../../src/app.js");
    authApp = mod.createApp();
    delete process.env.FACILITATOR_API_KEY;
  });

  it("returns 401 on /verify when no Authorization header is provided", async () => {
    const res = await request(authApp).post("/verify").send({
      paymentPayload: validPaymentPayload,
      paymentRequirements: validPaymentRequirements,
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 on /settle when Authorization header has wrong key", async () => {
    const res = await request(authApp)
      .post("/settle")
      .set("Authorization", "Bearer wrong-key")
      .send({
        paymentPayload: validPaymentPayload,
        paymentRequirements: validPaymentRequirements,
      });
    expect(res.status).toBe(401);
  });

  it("returns 401 on /supported when Authorization header is missing", async () => {
    const res = await request(authApp).get("/supported");
    expect(res.status).toBe(401);
  });

  it("allows /verify with correct Bearer token", async () => {
    const res = await request(authApp)
      .post("/verify")
      .set("Authorization", `Bearer ${TEST_API_KEY}`)
      .send({
        paymentPayload: validPaymentPayload,
        paymentRequirements: validPaymentRequirements,
      });
    expect(res.status).toBe(200);
  });

  it("allows /settle with correct Bearer token", async () => {
    const res = await request(authApp)
      .post("/settle")
      .set("Authorization", `Bearer ${TEST_API_KEY}`)
      .send({
        paymentPayload: validPaymentPayload,
        paymentRequirements: validPaymentRequirements,
      });
    expect(res.status).toBe(200);
  });

  it("allows /supported with correct Bearer token", async () => {
    const res = await request(authApp)
      .get("/supported")
      .set("Authorization", `Bearer ${TEST_API_KEY}`);
    expect(res.status).toBe(200);
  });

  it("rejects token with wrong casing of key value (case-sensitive comparison)", async () => {
    const res = await request(authApp)
      .post("/verify")
      .set("Authorization", `Bearer ${TEST_API_KEY.toUpperCase()}`)
      .send({
        paymentPayload: validPaymentPayload,
        paymentRequirements: validPaymentRequirements,
      });
    expect(res.status).toBe(401);
  });

  it("does not protect /health (always open)", async () => {
    const res = await request(authApp).get("/health");
    expect(res.status).toBe(200);
  });
});
