/**
 * Extracts a string message from an unknown error value.
 *
 * Returns `error.message` when the value is an `Error` instance.
 * Falls back to `fallback` when provided, or `String(error)` otherwise.
 */
export function parseError(error: unknown, fallback?: string): string {
  if (error instanceof Error) return error.message;
  return fallback ?? String(error);
}

/**
 * Splits a comma-separated string into a trimmed, non-empty array.
 *
 * Each token is trimmed of whitespace and empty tokens are discarded,
 * so `"a, b,  , c"` yields `["a", "b", "c"]`.
 */
export function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
