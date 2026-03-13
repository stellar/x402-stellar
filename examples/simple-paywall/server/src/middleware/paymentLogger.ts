import type { Request, Response, NextFunction } from "express";
import { parseX402JsonHeaderValue } from "@x402-stellar/shared";
import { logger } from "../utils/logger.js";

const MAX_FIELD_LENGTH = 500;
const ERROR_FIELDS = ["error", "message", "detail", "details"] as const;
const PAYMENT_REQUIRED_HEADER = "payment-required";
const PAYMENT_RESPONSE_HEADER = "payment-response";

function normalizeHeaderValue(value: string | number | readonly string[]): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return value.length > 0 ? value[0] : undefined;
}

function extractErrorFields(body: unknown): Record<string, string> {
  const extracted: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return extracted;
  }

  for (const key of ERROR_FIELDS) {
    if (key in body) {
      extracted[key] = String((body as Record<string, unknown>)[key]).slice(0, MAX_FIELD_LENGTH);
    }
  }

  return extracted;
}

export function paymentLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasPayment = !!(req.header("payment-signature") || req.header("x-payment"));
    if (!hasPayment) return next();

    const originalSetHeader = res.setHeader.bind(res);
    const originalJson = res.json.bind(res);
    let paymentRequiredHeader: string | undefined;
    let paymentResponseHeader: string | undefined;
    let extractedErrorFields: Record<string, string> = {};

    // Intercepts res.setHeader to capture payment headers as they're set.
    // Express's res.set() and res.header() delegate to setHeader, so those are
    // covered. However, res.writeHead() can set headers directly — if upstream
    // middleware ever uses writeHead, those headers won't be captured here.
    res.setHeader = function (name: string, value: number | string | readonly string[]) {
      const normalizedName = name.toLowerCase();
      const normalizedValue = normalizeHeaderValue(value);

      if (normalizedName === PAYMENT_REQUIRED_HEADER) {
        paymentRequiredHeader = normalizedValue;
      }

      if (normalizedName === PAYMENT_RESPONSE_HEADER) {
        paymentResponseHeader = normalizedValue;
      }

      return originalSetHeader(name, value);
    };

    res.json = function (body: unknown) {
      if (res.statusCode >= 400) {
        extractedErrorFields = extractErrorFields(body);
      }

      return originalJson(body);
    };

    res.once("finish", () => {
      const decodedPaymentRequired = parseX402JsonHeaderValue(paymentRequiredHeader);
      const decodedPaymentResponse = parseX402JsonHeaderValue(paymentResponseHeader);

      if (res.statusCode >= 400) {
        const paymentContext =
          decodedPaymentResponse !== undefined
            ? { paymentResponse: decodedPaymentResponse }
            : decodedPaymentRequired !== undefined
              ? { paymentRequired: decodedPaymentRequired }
              : {};

        logger.error(
          {
            status: res.statusCode,
            method: req.method,
            url: req.originalUrl,
            ...extractedErrorFields,
            ...paymentContext,
          },
          decodedPaymentResponse === undefined && decodedPaymentRequired === undefined
            ? "Payment request failed without payment headers"
            : "Payment request failed",
        );
        return;
      }

      if (decodedPaymentResponse !== undefined) {
        logger.info(
          {
            status: res.statusCode,
            method: req.method,
            url: req.originalUrl,
            paymentResponse: decodedPaymentResponse,
          },
          "Payment response received",
        );
      }
    });

    next();
  };
}
