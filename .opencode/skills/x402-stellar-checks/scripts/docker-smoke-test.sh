#!/usr/bin/env bash
# docker-smoke-test.sh — Build docker compose, verify all services are healthy, run
# smoke tests, then tear down. Designed for CI or pre-deploy validation.
#
# Usage:
#   ./docker-smoke-test.sh          # default: uses docker compose
#
# Exit codes: 0 = all passed, 1 = failure.
set -euo pipefail

if [ "$#" -ne 0 ]; then
  echo "Usage: $0" >&2
  echo "Error: unexpected argument(s): $*" >&2
  exit 1
fi

COMPOSE_FILE="examples/simple-paywall/docker-compose.yml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "--- Tearing down ---"
  docker compose -f "$COMPOSE_FILE" down --timeout 5 >/dev/null 2>&1 || true
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
