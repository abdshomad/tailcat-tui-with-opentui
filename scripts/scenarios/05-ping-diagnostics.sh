#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 5: Network Diagnostics & Ping"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start a server
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/ping_server.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/ping_server.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for ping server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/ping_server.log"
  exit 1
fi

log_info "Pinging server on token: ${TOKEN:0:20}..."

# 2. Client runs ping
PING_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat $DERP_FLAG ping --timeout=10s '$TOKEN'
")

echo "$PING_OUTPUT"

if echo "$PING_OUTPUT" | grep -iq "pong"; then
  log_pass "Scenario 5 (Ping Diagnostics) Succeeded! Pong response verified."
else
  log_fail "Scenario 5 Failed. No pong received."
  exit 1
fi
