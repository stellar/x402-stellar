/// <reference lib="dom" />
const X402_ERROR_MESSAGE_FIELDS = ["error", "message", "detail", "details"] as const;

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

// Detect Node.js Buffer for base64 decoding. Falls back to atob + TextDecoder
// in browsers and edge runtimes (Cloudflare Workers, Deno) where Buffer may
// be absent or only partially polyfilled by bundlers.
function getNodeBuffer(): BufferLike | undefined {
  return (globalThis as typeof globalThis & { Buffer?: BufferLike }).Buffer;
}

function decodeX402HeaderBase64Value(base64HeaderValue: string): string {
  const nodeBuffer = getNodeBuffer();
  if (nodeBuffer) {
    return nodeBuffer.from(base64HeaderValue, "base64").toString("utf8");
  }

  const binary = globalThis.atob(base64HeaderValue);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function parseX402JsonHeaderValue<T = unknown>(
  x402HeaderValue: string | null | undefined,
): T | undefined {
  if (!x402HeaderValue) {
    return undefined;
  }

  try {
    return JSON.parse(decodeX402HeaderBase64Value(x402HeaderValue)) as T;
  } catch {
    return undefined;
  }
}

function getX402ErrorMessage(x402Payload: unknown): string | undefined {
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

export function parseX402PaymentRequiredHeaderError(
  paymentRequiredHeaderValue: string | null | undefined,
): string | undefined {
  return getX402ErrorMessage(
    parseX402JsonHeaderValue<Record<string, unknown>>(paymentRequiredHeaderValue),
  );
}

export function parseX402PaymentResponseHeader(
  paymentResponseHeaderValue: string | null | undefined,
): X402PaymentResponsePayload | undefined {
  return parseX402JsonHeaderValue<X402PaymentResponsePayload>(paymentResponseHeaderValue);
}
