/**
 * Runtime validation for facilitator request bodies using zod.
 *
 * Each function returns an error string if validation fails, or null if valid.
 */

import { z } from "zod";

/** A plain object (not null, not an array). */
const plainObject = z
  .unknown()
  .refine(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v),
  );

const paymentPayloadSchema = z.object({
  x402Version: z.number(),
  payload: plainObject,
  accepted: plainObject,
});

/** Custom error messages keyed by "parentField.field" */
const payloadMessages: Record<string, string> = {
  x402Version: "paymentPayload.x402Version must be a number",
  payload: "paymentPayload.payload must be an object",
  accepted: "paymentPayload.accepted must be an object",
};

const paymentRequirementsSchema = z.object({
  scheme: z.string().min(1),
  network: z.string().regex(/^[a-z]+:[a-z0-9]+$/),
  payTo: z.string().min(1),
  amount: z.string().min(1),
  asset: z.string().min(1),
  maxTimeoutSeconds: z.number().positive(),
  extra: plainObject,
});

const requirementsMessages: Record<string, string> = {
  scheme: "paymentRequirements.scheme must be a non-empty string",
  network: "paymentRequirements.network must be a namespaced string (e.g. stellar:testnet)",
  payTo: "paymentRequirements.payTo must be a non-empty string",
  amount: "paymentRequirements.amount must be a non-empty string",
  asset: "paymentRequirements.asset must be a non-empty string",
  maxTimeoutSeconds: "paymentRequirements.maxTimeoutSeconds must be a positive number",
  extra: "paymentRequirements.extra must be an object",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstFieldError(
  result: { success: true } | { success: false; error: z.ZodError },
  messages: Record<string, string>,
): string | null {
  if (result.success) return null;
  const field = String(result.error.issues[0].path[0]);
  return messages[field] ?? result.error.issues[0].message;
}

export function validatePaymentPayload(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return "paymentPayload must be a non-null object";
  }
  return firstFieldError(paymentPayloadSchema.safeParse(value), payloadMessages);
}

export function validatePaymentRequirements(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return "paymentRequirements must be a non-null object";
  }
  return firstFieldError(paymentRequirementsSchema.safeParse(value), requirementsMessages);
}
