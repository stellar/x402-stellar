#!/bin/bash
set -e

# Generate runtime config.js for the SPA
export VITE_SERVER_URL="${VITE_SERVER_URL:-}"
export VITE_APP_NAME="${VITE_APP_NAME:-}"
export VITE_BASE_ROUTE="${VITE_BASE_ROUTE:-}"
export CONFIG_DIR=/app/client
/app/scripts/runtime-config.sh

# Generate nginx config from template (only substitute $PORT)
envsubst '$PORT' < /app/nginx.conf.template > /tmp/nginx.conf

# Start facilitator
PORT=4022 node /app/facilitator/dist/index.js &
FACILITATOR_PID=$!

# Wait for facilitator to be ready before starting the server.
# The server's payment middleware eagerly fetches /supported from the
# facilitator at startup; if the facilitator isn't listening yet the
# fetch fails and the server crashes with an unhandled rejection.
echo "Waiting for facilitator on port 4022..."
FACILITATOR_READY=false
for i in $(seq 1 30); do
    if wget -qO /dev/null http://localhost:4022/health 2>/dev/null; then
        echo "Facilitator is ready"
        FACILITATOR_READY=true
        break
    fi
    if ! kill -0 "$FACILITATOR_PID" 2>/dev/null; then
        echo "Facilitator process died before becoming ready"
        exit 1
    fi
    sleep 0.5
done

if [ "$FACILITATOR_READY" = false ]; then
    echo "Facilitator failed to become ready within 15 seconds"
    kill "$FACILITATOR_PID" 2>/dev/null
    exit 1
fi

# Start Express server
PORT=3001 TESTNET_FACILITATOR_URL=http://localhost:4022 MAINNET_FACILITATOR_URL=http://localhost:4022 node /app/server/dist/index.js &
SERVER_PID=$!

# Start nginx (foreground mode, as PID will be tracked)
nginx -c /tmp/nginx.conf -g 'daemon off;' &
NGINX_PID=$!

echo "All processes started: nginx=$NGINX_PID server=$SERVER_PID facilitator=$FACILITATOR_PID"

# Graceful shutdown on SIGTERM (Heroku sends this on dyno stop)
shutdown() {
    echo "Shutting down..."
    kill "$NGINX_PID" "$SERVER_PID" "$FACILITATOR_PID" 2>/dev/null
    wait "$NGINX_PID" "$SERVER_PID" "$FACILITATOR_PID" 2>/dev/null
    exit 0
}
trap shutdown SIGTERM SIGINT

# Wait for any process to exit — if one crashes, bring everything down
wait -n
EXIT_CODE=$?
echo "A process exited with code $EXIT_CODE — stopping all services"
kill "$NGINX_PID" "$SERVER_PID" "$FACILITATOR_PID" 2>/dev/null
wait 2>/dev/null
exit "$EXIT_CODE"
