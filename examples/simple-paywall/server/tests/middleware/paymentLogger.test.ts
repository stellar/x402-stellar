import { EventEmitter } from "node:events";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { paymentLogger } from "../../src/middleware/paymentLogger.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { logger } from "../../src/utils/logger.js";

function normalizeHeaderValue(
  value: string | number | readonly string[],
): string | number | string[] {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return Array.from(value);
}

function createMocks(paymentHeader: boolean, statusCode: number) {
  const req = {
    header: (name: string) =>
      paymentHeader && name.toLowerCase() === "payment-signature" ? "present" : undefined,
    method: "GET",
    originalUrl: "/protected/testnet",
  } as unknown as Request;

  let capturedBody: unknown;
  const headers = new Map<string, string | number | string[]>();
  const events = new EventEmitter();
  const res = {
    statusCode,
    json: vi.fn((body: unknown) => {
      capturedBody = body;
      return res;
    }),
    setHeader: vi.fn((name: string, value: string | number | readonly string[]) => {
      headers.set(name.toLowerCase(), normalizeHeaderValue(value));
      return res;
    }),
    getHeader: vi.fn((name: string) => headers.get(name.toLowerCase())),
    writeHead: vi.fn((_statusCode: number, ...args: unknown[]) => {
      for (const arg of args) {
        if (arg && typeof arg === "object" && !Array.isArray(arg)) {
          for (const [name, value] of Object.entries(arg as Record<string, unknown>)) {
            if (typeof value === "string") {
              headers.set(name.toLowerCase(), value);
            }
          }
        }
      }
      return res;
    }),
    once: events.once.bind(events),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;
  return { req, res, next, getCaptured: () => capturedBody, finish: () => events.emit("finish") };
}

function encodeBase64Json(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

describe("paymentLogger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips requests without payment header", () => {
    const { req, res, next } = createMocks(false, 200);
    paymentLogger()(req, res, next);
    expect(next).toHaveBeenCalled();
    res.json({ ok: true });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs decoded PAYMENT-RESPONSE on failed requests", () => {
    const { req, res, next, finish } = createMocks(true, 402);
    paymentLogger()(req, res, next);

    res.setHeader(
      "PAYMENT-RESPONSE",
      encodeBase64Json({ errorReason: "invalid_exact_stellar_payload_fee_exceeds_maximum" }),
    );
    res.json({ error: "Settlement failed", details: "Unexpected token '<'" });
    finish();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 402,
        error: "Settlement failed",
        details: "Unexpected token '<'",
        paymentResponse: {
          errorReason: "invalid_exact_stellar_payload_fee_exceeds_maximum",
        },
      }),
      "Payment request failed",
    );
  });

  it("logs decoded PAYMENT-REQUIRED on failed requests", () => {
    const { req, res, next, finish } = createMocks(true, 402);
    paymentLogger()(req, res, next);

    res.setHeader(
      "payment-required",
      encodeBase64Json({ error: "invalid_exact_stellar_payload_fee_exceeds_maximum" }),
    );
    res.json({});
    finish();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 402,
        paymentRequired: {
          error: "invalid_exact_stellar_payload_fee_exceeds_maximum",
        },
      }),
      "Payment request failed",
    );
  });

  it("logs success responses when PAYMENT-RESPONSE is present", () => {
    const { req, res, next, finish } = createMocks(true, 200);
    paymentLogger()(req, res, next);

    res.setHeader("PAYMENT-RESPONSE", encodeBase64Json({ success: true, transaction: "abc123" }));
    res.json({ success: true });
    finish();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        paymentResponse: {
          success: true,
          transaction: "abc123",
        },
      }),
      "Payment response received",
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("truncates field values longer than 500 characters", () => {
    const { req, res, next, finish } = createMocks(true, 500);
    paymentLogger()(req, res, next);
    const longDetails = "x".repeat(800);
    res.json({ error: "Settlement failed", details: longDetails });
    finish();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        error: "Settlement failed",
        details: "x".repeat(500),
      }),
      "Payment request failed without payment headers",
    );
  });

  it("logs missing PAYMENT-RESPONSE on failed requests", () => {
    const { req, res, next, finish } = createMocks(true, 402);
    paymentLogger()(req, res, next);

    res.json({ error: "Settlement failed" });
    finish();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 402,
        error: "Settlement failed",
      }),
      "Payment request failed without payment headers",
    );
  });

  it("still calls original res.json", () => {
    const { req, res, next } = createMocks(true, 402);
    const originalJson = res.json;
    paymentLogger()(req, res, next);
    res.json({ error: "fail" });
    expect(originalJson).toHaveBeenCalledWith({ error: "fail" });
  });

  it("logs without error fields when response uses res.end() instead of res.json()", () => {
    const { req, res, next, finish } = createMocks(true, 500);
    paymentLogger()(req, res, next);

    finish();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        method: "GET",
        url: "/protected/testnet",
      }),
      "Payment request failed without payment headers",
    );
    const logPayload = (logger.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(logPayload).not.toHaveProperty("error");
    expect(logPayload).not.toHaveProperty("details");
  });
});
