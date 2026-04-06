#!/usr/bin/env bash
# smoke-test.sh — Verify x402-stellar endpoints are responding correctly.
#
# Usage:
#   ./smoke-test.sh                        # local defaults (3 separate services)
#   ./smoke-test.sh https://my-app.com     # all-in-one deploy
#   FACILITATOR=http://host:4022 SERVER=http://host:3001 CLIENT=http://host:8080 ./smoke-test.sh
#
# In all-in-one mode (single base URL argument), only externally-proxied routes
# are tested. Facilitator-internal routes (/supported, /verify, /settle) are NOT
# accessible through nginx — they are skipped automatically.
#
# Exit codes: 0 = all passed, 1 = one or more failures.
set -euo pipefail

FACILITATOR="${FACILITATOR:-http://localhost:4022}"
SERVER="${SERVER:-http://localhost:3001}"
CLIENT="${CLIENT:-http://localhost:5173}"
ALL_IN_ONE=false

# If a base URL is passed, treat it as an all-in-one deploy
# where nginx only proxies /health and /protected. Facilitator routes are
# internal-only and not reachable from outside.
if [[ $# -ge 1 ]]; then
  BASE="$1"
  SERVER="$BASE"
  CLIENT="$BASE"
  ALL_IN_ONE=true
fi

PASS=0
FAIL=0

check() {
  local label="$1" url="$2" expect="$3"
  local code
  code=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null) || code="000"
  if [[ "$code" == "$expect" ]]; then
    printf "  PASS  %-40s %s\n" "$label" "$code"
    ((PASS++))
  else
    printf "  FAIL  %-40s got %s, expected %s\n" "$label" "$code" "$expect"
    ((FAIL++))
  fi
}

check_contains() {
  local label="$1" url="$2" pattern="$3"
  local body
  body=$(curl -sf "$url" 2>/dev/null) || body=""
  if echo "$body" | grep -q "$pattern"; then
    printf "  PASS  %-40s contains '%s'\n" "$label" "$pattern"
    ((PASS++))
  else
    printf "  FAIL  %-40s missing '%s'\n" "$label" "$pattern"
    ((FAIL++))
  fi
}

check_header() {
  local label="$1" url="$2" header="$3"
  local headers
  headers=$(curl -sf -D - -o /dev/null "$url" 2>/dev/null) || headers=""
  if echo "$headers" | grep -qi "$header"; then
    printf "  PASS  %-40s header '%s' present\n" "$label" "$header"
    ((PASS++))
  else
    printf "  FAIL  %-40s header '%s' missing\n" "$label" "$header"
    ((FAIL++))
  fi
}

echo "=== Health checks ==="
if [[ "$ALL_IN_ONE" == "false" ]]; then
  check "facilitator /health"   "$FACILITATOR/health"   "200"
fi
check "server /health"          "$SERVER/health"        "200"

echo ""
if [[ "$ALL_IN_ONE" == "false" ]]; then
  echo "=== Facilitator routes ==="
  check_contains "GET /supported" "$FACILITATOR/supported" "kinds"
  echo ""
else
  echo "(skipping facilitator-internal routes — not proxied in all-in-one mode)"
  echo ""
fi

echo "=== Paywalled route ==="
# /protected without payment should return 402
code=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER/protected" 2>/dev/null) || code="000"
if [[ "$code" == "402" ]]; then
  printf "  PASS  %-40s %s\n" "GET /protected (no payment)" "$code"
  ((PASS++))
else
  printf "  FAIL  %-40s got %s, expected 402\n" "GET /protected (no payment)" "$code"
  ((FAIL++))
fi

echo ""
echo "=== Client SPA ==="
check "client index"            "$CLIENT/"              "200"

echo ""
echo "=== Security headers ==="
check_header "server helmet"      "$SERVER/health"       "x-content-type-options"
if [[ "$ALL_IN_ONE" == "false" ]]; then
  check_header "facilitator helmet" "$FACILITATOR/health"  "x-content-type-options"
fi

echo ""
echo "=== Error handling ==="
if [[ "$ALL_IN_ONE" == "false" ]]; then
  # Malformed JSON should not leak stack traces
  body=$(curl -s -X POST "$FACILITATOR/verify" -H "Content-Type: application/json" -d 'bad' 2>/dev/null) || body=""
  if echo "$body" | grep -q "stack\|Error:"; then
    printf "  FAIL  %-40s leaks error details\n" "malformed POST /verify"
    ((FAIL++))
  else
    printf "  PASS  %-40s no leaked details\n" "malformed POST /verify"
    ((PASS++))
  fi
else
  echo "(skipping /verify error leak check — not proxied in all-in-one mode)"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ $FAIL -eq 0 ]]
