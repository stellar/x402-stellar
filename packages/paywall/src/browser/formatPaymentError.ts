export function formatPaymentError(prefix: string, status: number, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return `${prefix}: ${status}`;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      const message = parsed.error || parsed.message || parsed.detail;
      if (typeof message === "string") {
        return `${prefix}: ${message}`;
      }
    }
  } catch (_notJson) {}
  if (trimmed.startsWith("<") || trimmed.length > 200) {
    console.error(
      `${prefix} (${status}) — response body (first 2000 chars):`,
      trimmed.slice(0, 2000),
    );
    return `${prefix}: ${status} (see browser console for details)`;
  }
  return `${prefix}: ${trimmed}`;
}
