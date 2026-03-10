import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

const MAX_FIELD_LENGTH = 500;
const ERROR_FIELDS = ["error", "message", "detail", "details"] as const;

export function paymentLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only used as a boolean gate — header value is NEVER logged.
    const hasPayment = !!(req.header("payment-signature") || req.header("x-payment"));
    if (!hasPayment) return next();

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      if (res.statusCode >= 400) {
        const extracted: Record<string, string> = {};
        if (body && typeof body === "object") {
          for (const k of ERROR_FIELDS) {
            if (k in body) {
              extracted[k] = String((body as Record<string, unknown>)[k]).slice(
                0,
                MAX_FIELD_LENGTH,
              );
            }
          }
        }
        logger.error(
          { status: res.statusCode, method: req.method, url: req.originalUrl, ...extracted },
          "Payment request failed",
        );
      }
      return originalJson(body);
    };

    next();
  };
}
