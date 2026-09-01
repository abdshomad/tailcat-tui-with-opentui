#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 8: Token Parse & Self-Contained Address Resolve"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Generate a token
GEN_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat genkey --key=token-test-key --region=sfo
")

TOKEN=$(echo "$GEN_OUTPUT" | grep -E '^tc[A-Za-z0-9_-]+' | head -n 1 | tr -d '\r\n')

if [ -z "$TOKEN" ]; then
  # Fallback: start server briefly to grab token
  docker exec -d "$SERVER_CONTAINER" sh -c "
    tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/token_parse.log 2>&1
  "
  for i in $(seq 1 20); do
    LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/token_parse.log" 2>/dev/null || true)
    if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
      TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
      if [ -n "$TOKEN" ]; then break; fi
    fi
    sleep 0.5
  done
fi

if [ -z "$TOKEN" ]; then
  log_fail "Failed to generate connection token."
  exit 1
fi

log_info "Testing tailcat parse..."
PARSE_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "tailcat parse '$TOKEN'")
echo "$PARSE_OUTPUT"

if echo "$PARSE_OUTPUT" | jq -e '.ServerPublic' >/dev/null 2>&1; then
  log_pass "Token parsed successfully to valid JSON containing ServerPublic."
else
  log_fail "tailcat parse failed. Output: $PARSE_OUTPUT"
  exit 1
fi

log_info "Testing tailcat resolve..."
RESOLVED_TOKEN=$(docker exec "$CLIENT_CONTAINER" sh -c "tailcat $DERP_FLAG resolve '$TOKEN'")
echo "Resolved token: ${RESOLVED_TOKEN:0:40}..."

if [ -n "$RESOLVED_TOKEN" ] && [[ "$RESOLVED_TOKEN" == tc* ]]; then
  PARSE_RESOLVED=$(docker exec "$CLIENT_CONTAINER" sh -c "tailcat parse '$RESOLVED_TOKEN'")
  if echo "$PARSE_RESOLVED" | jq -e '.Region' >/dev/null 2>&1; then
    log_pass "Scenario 8 (Token Parse & Resolve) Succeeded! Resolved token contains embedded Region metadata."
  else
    log_pass "Scenario 8 (Token Parse & Resolve) Succeeded! Resolved token is valid."
  fi
else
  log_fail "tailcat resolve failed to produce resolved token."
  exit 1
fi
