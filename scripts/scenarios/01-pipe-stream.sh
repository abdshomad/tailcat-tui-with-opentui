#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 1: Pipe stdin/stdout between two machines"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# Start server in background waiting for stdin/stdout stream
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json > ${EXCHANGE_DIR}/server_stream.log 2>&1
"

# Wait for token in server_stream.log
TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/server_stream.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token from server log."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/server_stream.log"
  exit 1
fi

log_info "Server token obtained: ${TOKEN:0:20}..."

# Client sends payload through the tunnel
TEST_PAYLOAD="Hello Tailcat Pipe Stream $(date +%s)"
docker exec "$CLIENT_CONTAINER" sh -c "echo '$TEST_PAYLOAD' | tailcat $DERP_FLAG '$TOKEN'"

sleep 1

# Verify server unblocked and printed the payload
RECEIVED=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/server_stream.log" 2>/dev/null || true)
if echo "$RECEIVED" | grep -q "$TEST_PAYLOAD"; then
  log_pass "Scenario 1 (Pipe & Stream) Succeeded! Payload delivered end-to-end."
else
  log_fail "Scenario 1 Failed. Expected '$TEST_PAYLOAD' in server output."
  echo "Server log:"
  echo "$RECEIVED"
  exit 1
fi
