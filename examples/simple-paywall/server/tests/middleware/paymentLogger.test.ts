import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { paymentLogger } from "../../src/middleware/paymentLogger.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { logger } from "../../src/utils/logger.js";

function createMocks(paymentHeader: boolean, statusCode: number) {
  const req = {
    header: (name: string) =>
      paymentHeader && name.toLowerCase() === "payment-signature" ? "present" : undefined,
    method: "GET",
    originalUrl: "/protected/testnet",
  } as unknown as Request;

  let capturedBody: unknown;
  const res = {
    statusCode,
    json: vi.fn((body: unknown) => {
      capturedBody = body;
      return res;
    }),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;
  return { req, res, next, getCaptured: () => capturedBody };
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

  it("logs error fields on 4xx with payment header", () => {
    const { req, res, next } = createMocks(true, 402);
    paymentLogger()(req, res, next);
    res.json({ error: "Settlement failed", details: "Unexpected token '<'" });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 402,
        error: "Settlement failed",
        details: "Unexpected token '<'",
      }),
      "Payment request failed",
    );
  });

  it("does not log on success with payment header", () => {
    const { req, res, next } = createMocks(true, 200);
    paymentLogger()(req, res, next);
    res.json({ success: true });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("truncates field values longer than 500 characters", () => {
    const { req, res, next } = createMocks(true, 500);
    paymentLogger()(req, res, next);
    const longDetails = "x".repeat(800);
    res.json({ error: "Settlement failed", details: longDetails });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        error: "Settlement failed",
        details: "x".repeat(500),
      }),
      "Payment request failed",
    );
  });

  it("still calls original res.json", () => {
    const { req, res, next } = createMocks(true, 402);
    const originalJson = res.json;
    paymentLogger()(req, res, next);
    res.json({ error: "fail" });
    expect(originalJson).toHaveBeenCalledWith({ error: "fail" });
  });
});
