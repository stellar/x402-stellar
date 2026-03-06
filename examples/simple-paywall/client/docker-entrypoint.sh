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

escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e "s/'/\\\\'/g"
}

SERVER_URL_SAFE=$(escape_js "${VITE_SERVER_URL:-}")
APP_NAME_SAFE=$(escape_js "${VITE_APP_NAME:-}")
PAYMENT_PRICE_SAFE=$(escape_js "${VITE_PAYMENT_PRICE:-}")

OUTPUT_DIR="${CONFIG_DIR:-/usr/share/nginx/html}"

cat > "${OUTPUT_DIR}/config.js" <<EOF
window.__CONFIG__ = {
  SERVER_URL: "${SERVER_URL_SAFE}",
  APP_NAME: "${APP_NAME_SAFE}",
  PAYMENT_PRICE: "${PAYMENT_PRICE_SAFE}",
};
EOF
