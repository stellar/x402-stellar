/// <reference lib="dom" />

/**
 * Header field names checked when extracting an error message from an x402
 * JSON payload. Shared so callers (e.g. logging middleware) can inspect the
 * same fields without re-declaring the list.
 */
export const X402_ERROR_MESSAGE_FIELDS = ["error", "message", "detail", "details"] as const;

type BufferLike = {
  from(
    input: string,
    encoding: "base64",
  ): {
    toString(encoding: "utf8"): string;
  };
};

export type X402PaymentResponsePayload = {
  transaction?: string;
  network?: string;
} & Record<string, unknown>;

/**
 * Returns the Node.js `Buffer` constructor when available, or `undefined` in
 * browser / edge runtimes where `Buffer` may be absent or partially polyfilled.
 */
function getNodeBuffer(): BufferLike | undefined {
  return (globalThis as typeof globalThis & { Buffer?: BufferLike }).Buffer;
}

/**
 * Decodes a base64-encoded x402 header value to a UTF-8 string.
 *
 * Uses `Buffer` in Node.js and falls back to `atob` + `TextDecoder` in
 * browser and edge runtimes (Cloudflare Workers, Deno).
 */
function decodeX402HeaderBase64Value(base64HeaderValue: string): string {
  const nodeBuffer = getNodeBuffer();
  if (nodeBuffer) {
    return nodeBuffer.from(base64HeaderValue, "base64").toString("utf8");
  }

  const binary = globalThis.atob(base64HeaderValue);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Parses a base64-encoded JSON x402 header value into a typed payload.
 *
 * Returns `undefined` when the value is absent, empty, or not valid JSON.
 * Pass `onParseError` to surface malformed/tampered headers to callers
 * (e.g. for logging or alerting) without interrupting the request flow.
 */
export function parseX402Header<T = unknown>(
  x402HeaderValue: string | null | undefined,
  onParseError?: (err: unknown, raw: string) => void,
): T | undefined {
  if (!x402HeaderValue) {
    return undefined;
  }

  try {
    return JSON.parse(decodeX402HeaderBase64Value(x402HeaderValue)) as T;
  } catch (err) {
    onParseError?.(err, x402HeaderValue);
    return undefined;
  }
}

/**
 * Extracts a human-readable error message from an x402 JSON payload object.
 *
 * Checks the fields listed in `X402_ERROR_MESSAGE_FIELDS` in order and returns
 * the first non-empty string value found, or `undefined` when none is present.
 */
export function getX402ErrorMessage(x402Payload: unknown): string | undefined {
  if (!x402Payload || typeof x402Payload !== "object") {
    return undefined;
  }

  const x402PayloadRecord = x402Payload as Record<string, unknown>;
  for (const field of X402_ERROR_MESSAGE_FIELDS) {
    const candidate = x402PayloadRecord[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
}
