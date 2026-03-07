#!/bin/sh
# Generate runtime config from environment variables.
# This runs at container startup (via nginx's /docker-entrypoint.d/ mechanism
# in the standalone client image, or via start.sh in the heroku image)
# so the URL doesn't need to be known at build time.
#
# Values are escaped to prevent JS injection if env vars contain
# quotes, backslashes, or other special characters.
#
# CONFIG_DIR can be set to override the output directory (default: /usr/share/nginx/html).
#
# VITE_BASE_ROUTE (e.g. "/x402/") rewrites asset paths in index.html so the
# SPA works when served under a subpath via ingress rewrite.

escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e "s/'/\\\\'/g"
}

SERVER_URL_SAFE=$(escape_js "${VITE_SERVER_URL:-}")
APP_NAME_SAFE=$(escape_js "${VITE_APP_NAME:-}")
PAYMENT_PRICE_SAFE=$(escape_js "${VITE_PAYMENT_PRICE:-}")

OUTPUT_DIR="${CONFIG_DIR:-/usr/share/nginx/html}"

# ── Base path rewriting ──────────────────────────────────────────────
# Normalize: ensure leading and trailing slash (e.g. "x402" -> "/x402/")
RAW_BASE_ROUTE="${VITE_BASE_ROUTE:-/}"
BASE_ROUTE=$(printf '%s' "$RAW_BASE_ROUTE" | tr -cd 'A-Za-z0-9/_-')
if [ -z "$BASE_ROUTE" ]; then
  BASE_ROUTE="/"
fi
case "$BASE_ROUTE" in
  /*) ;; *) BASE_ROUTE="/$BASE_ROUTE" ;;
esac
case "$BASE_ROUTE" in
  */) ;; *) BASE_ROUTE="$BASE_ROUTE/" ;;
esac

cat > "${OUTPUT_DIR}/config.js" <<EOF
window.__CONFIG__ = {
  SERVER_URL: "${SERVER_URL_SAFE}",
  APP_NAME: "${APP_NAME_SAFE}",
  PAYMENT_PRICE: "${PAYMENT_PRICE_SAFE}",
};
EOF

if [ "$BASE_ROUTE" != "/" ]; then
  sed -i \
    -e "s|src=\"/assets/|src=\"${BASE_ROUTE}assets/|g" \
    -e "s|href=\"/assets/|href=\"${BASE_ROUTE}assets/|g" \
    -e "s|src=\"/config.js\"|src=\"${BASE_ROUTE}config.js\"|g" \
    "${OUTPUT_DIR}/index.html"

  # Symlink so nginx's default "location / { root ... }" resolves
  # /x402/assets/foo.js → OUTPUT_DIR/x402/assets/foo.js → OUTPUT_DIR/assets/foo.js
  SUBPATH="${BASE_ROUTE#/}"   # "x402/"
  SUBPATH="${SUBPATH%/}"     # "x402"
  TARGET="${OUTPUT_DIR}/${SUBPATH}"
  mkdir -p "$(dirname "$TARGET")"
  ln -sfn "${OUTPUT_DIR}" "$TARGET"
fi
