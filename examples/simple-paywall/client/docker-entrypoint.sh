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
# VITE_BASE_PATH (e.g. "/x402/") rewrites asset paths in index.html so the
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
BASE_PATH="${VITE_BASE_PATH:-/}"
case "$BASE_PATH" in
  /*) ;; *) BASE_PATH="/$BASE_PATH" ;;
esac
case "$BASE_PATH" in
  */) ;; *) BASE_PATH="$BASE_PATH/" ;;
esac

BASE_PATH_SAFE=$(escape_js "$BASE_PATH")

cat > "${OUTPUT_DIR}/config.js" <<EOF
window.__CONFIG__ = {
  SERVER_URL: "${SERVER_URL_SAFE}",
  APP_NAME: "${APP_NAME_SAFE}",
  PAYMENT_PRICE: "${PAYMENT_PRICE_SAFE}",
  BASE_PATH: "${BASE_PATH_SAFE}",
};
EOF

if [ "$BASE_PATH" != "/" ]; then
  sed -i \
    -e "s|src=\"/assets/|src=\"${BASE_PATH}assets/|g" \
    -e "s|href=\"/assets/|href=\"${BASE_PATH}assets/|g" \
    -e "s|src=\"/config.js\"|src=\"${BASE_PATH}config.js\"|g" \
    "${OUTPUT_DIR}/index.html"

  # Symlink so nginx's default "location / { root ... }" resolves
  # /x402/assets/foo.js → OUTPUT_DIR/x402/assets/foo.js → OUTPUT_DIR/assets/foo.js
  SUBPATH="${BASE_PATH#/}"   # "x402/"
  SUBPATH="${SUBPATH%/}"     # "x402"
  ln -sfn "${OUTPUT_DIR}" "${OUTPUT_DIR}/${SUBPATH}"
fi
