#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 2: Expose local TCP port (8080) through tunnel"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start a persistent HTTP responder loop on 127.0.0.1:8080
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nHTTP 200 OK from Tailcat Local Port\n' | nc -l -p 8080 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"

sleep 0.5

# 2. Start tailcat serve 8080
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/serve_port.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/serve_port.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for port server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/serve_port.log"
  exit 1
fi

log_info "Port server listening on token: ${TOKEN:0:20}..."

# 3. Client connects to remote port 8080 through the tunnel
RESPONSE=$(docker exec "$CLIENT_CONTAINER" sh -c "
  printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat $DERP_FLAG '$TOKEN' 8080
")

if echo "$RESPONSE" | grep -q "HTTP 200 OK from Tailcat Local Port"; then
  log_pass "Scenario 2 (Port Forwarding) Succeeded! HTTP payload received across port tunnel."
else
  log_fail "Scenario 2 Failed. Unexpected response from forwarded port."
  echo "Response was: $RESPONSE"
  exit 1
fi
