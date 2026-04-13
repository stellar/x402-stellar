import type { Request, Response, NextFunction } from "express";
import { parseX402Header, X402_ERROR_MESSAGE_FIELDS } from "@x402-stellar/shared";
import { logger } from "../utils/logger.js";

const MAX_FIELD_LENGTH = 500;
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

  for (const key of X402_ERROR_MESSAGE_FIELDS) {
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

    // Intercept res.setHeader to capture payment headers set via Express's
    // res.set() / res.header() (which both delegate to setHeader).
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

    // Also intercept res.writeHead so that headers set directly through the
    // low-level Node.js API are captured (e.g. middleware that bypasses Express).
    const originalWriteHead = res.writeHead.bind(res) as typeof res.writeHead;
    res.writeHead = function (
      statusCode: number,
      ...args: Parameters<typeof res.writeHead> extends [number, ...infer Rest] ? Rest : never[]
    ) {
      // Headers may appear as the 1st extra arg (no reason phrase) or the 2nd
      // (when a string reason phrase is provided first).
      for (const arg of args) {
        if (arg && typeof arg === "object" && !Array.isArray(arg)) {
          const headers = arg as Record<string, string | number | string[]>;
          for (const [name, value] of Object.entries(headers)) {
            const lower = name.toLowerCase();
            if (lower === PAYMENT_REQUIRED_HEADER && typeof value === "string") {
              paymentRequiredHeader = value;
            } else if (lower === PAYMENT_RESPONSE_HEADER && typeof value === "string") {
              paymentResponseHeader = value;
            }
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalWriteHead as any)(statusCode, ...args);
    } as typeof res.writeHead;

    res.json = function (body: unknown) {
      if (res.statusCode >= 400) {
        extractedErrorFields = extractErrorFields(body);
      }

      return originalJson(body);
    };

    res.once("finish", () => {
      const onHeaderParseError = (err: unknown, raw: string) => {
        logger.warn(
          { err, rawHeader: raw.slice(0, 200) },
          "Malformed x402 header — possible tampering",
        );
      };
      const decodedPaymentRequired = parseX402Header(paymentRequiredHeader, onHeaderParseError);
      const decodedPaymentResponse = parseX402Header(paymentResponseHeader, onHeaderParseError);

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
          paymentResponseHeader === undefined && paymentRequiredHeader === undefined
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
