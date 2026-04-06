/**
 * Runtime validation for facilitator request bodies.
 *
 * Each function returns an error string if validation fails, or null if valid.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePaymentPayload(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return "paymentPayload must be a non-null object";
  }

  if (typeof value.x402Version !== "number") {
    return "paymentPayload.x402Version must be a number";
  }

  if (!isPlainObject(value.payload)) {
    return "paymentPayload.payload must be an object";
  }

  if (!isPlainObject(value.accepted)) {
    return "paymentPayload.accepted must be an object";
  }

  return null;
}

export function validatePaymentRequirements(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return "paymentRequirements must be a non-null object";
  }

  if (typeof value.scheme !== "string" || value.scheme.length === 0) {
    return "paymentRequirements.scheme must be a non-empty string";
  }

  if (typeof value.network !== "string" || !/^[a-z]+:[a-z0-9]+$/.test(value.network)) {
    return "paymentRequirements.network must be a namespaced string (e.g. stellar:testnet)";
  }

  if (typeof value.payTo !== "string" || value.payTo.length === 0) {
    return "paymentRequirements.payTo must be a non-empty string";
  }

  if (typeof value.amount !== "string" || value.amount.length === 0) {
    return "paymentRequirements.amount must be a non-empty string";
  }

  if (typeof value.asset !== "string" || value.asset.length === 0) {
    return "paymentRequirements.asset must be a non-empty string";
  }

  if (typeof value.maxTimeoutSeconds !== "number" || value.maxTimeoutSeconds <= 0) {
    return "paymentRequirements.maxTimeoutSeconds must be a positive number";
  }

  if (!isPlainObject(value.extra)) {
    return "paymentRequirements.extra must be an object";
  }

  return null;
}
