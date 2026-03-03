#!/usr/bin/env bash
# docker-smoke-test.sh — Build docker compose, verify all services are healthy, run
# smoke tests, then tear down. Designed for CI or pre-deploy validation.
#
# Usage:
#   ./docker-smoke-test.sh          # default: uses docker compose
#   ./docker-smoke-test.sh heroku   # builds the heroku target instead
#
# Exit codes: 0 = all passed, 1 = failure.
set -euo pipefail

COMPOSE_FILE="examples/simple-paywall/docker-compose.yml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-compose}"

cleanup() {
  echo ""
  echo "--- Tearing down ---"
  if [[ "$MODE" == "heroku" ]]; then
    [[ -n "${HEROKU_CID:-}" ]] && docker rm -f "$HEROKU_CID" >/dev/null 2>&1 || true
  else
    docker compose -f "$COMPOSE_FILE" down --timeout 5 >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

wait_for() {
  local url="$1" label="$2" max="${3:-30}"
  printf "  waiting for %-30s " "$label"
  for i in $(seq 1 "$max"); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      echo "ready (${i}s)"
      return 0
    fi
    sleep 1
  done
  echo "TIMEOUT after ${max}s"
  return 1
}

if [[ "$MODE" == "heroku" ]]; then
  echo "=== Building heroku target ==="
  docker build --target heroku -t x402-heroku-test . --quiet

  echo ""
  echo "=== Starting heroku container ==="
  HEROKU_CID=$(docker run -d --rm --env-file .env -e PORT=8080 -p 8080:8080 x402-heroku-test)
  echo "  container: ${HEROKU_CID:0:12}"

  echo ""
  echo "=== Waiting for services ==="
  wait_for "http://localhost:8080/health" "server (via nginx)"

  echo ""
  echo "=== Running smoke tests ==="
  "$SCRIPT_DIR/smoke-test.sh" http://localhost:8080
else
  echo "=== Building docker compose ==="
  docker compose -f "$COMPOSE_FILE" build --quiet

  echo ""
  echo "=== Starting services ==="
  docker compose -f "$COMPOSE_FILE" up -d

  echo ""
  echo "=== Waiting for services ==="
  wait_for "http://localhost:3001/health" "server"
  wait_for "http://localhost:8080"        "client"

  echo ""
  echo "=== Container status ==="
  docker compose -f "$COMPOSE_FILE" ps

  echo ""
  echo "=== Running smoke tests ==="
  CLIENT=http://localhost:8080 "$SCRIPT_DIR/smoke-test.sh"
fi
