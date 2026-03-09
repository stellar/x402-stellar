const INVALID_BASE_ROUTE_CHARS = /[^A-Za-z0-9/_-]/g;
const MULTIPLE_SLASHES = /\/+/g;
const TRAILING_SLASHES = /\/+$/;

export function normalizeBaseRoute(rawBaseRoute?: string | null): string {
  const sanitized = (rawBaseRoute ?? "/").trim().replace(INVALID_BASE_ROUTE_CHARS, "");

  if (sanitized === "" || sanitized === "/") {
    return "/";
  }

  const withLeadingSlash = sanitized.startsWith("/") ? sanitized : `/${sanitized}`;
  const collapsedSlashes = withLeadingSlash.replace(MULTIPLE_SLASHES, "/");
  const withoutTrailingSlash = collapsedSlashes.replace(TRAILING_SLASHES, "");

  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

export function resolveBaseRoute(
  runtimeBaseRoute?: string | null,
  viteBaseRoute?: string | null,
): string {
  if (runtimeBaseRoute != null) {
    return normalizeBaseRoute(runtimeBaseRoute);
  }

  if (viteBaseRoute != null) {
    return normalizeBaseRoute(viteBaseRoute);
  }

  return "/";
}
