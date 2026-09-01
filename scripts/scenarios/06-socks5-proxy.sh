#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 6: SOCKS5 Proxy Command Runner"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start simple HTTP server on local port 8080 on server using nc loop
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nSOCKS5_PROXY_SUCCESS_RESPONSE\n' | nc -l -p 8080 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"

sleep 0.5

# 2. Server runs `tailcat serve 8080`
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/socks_serve.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/socks_serve.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for SOCKS server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/socks_serve.log"
  exit 1
fi

log_info "Running curl command wrapped through SOCKS5 proxy..."

# 3. Client executes command through SOCKS proxy
SOCKS_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat $DERP_FLAG socks '$TOKEN' curl -s --max-time 10 http://server.tailcat:8080/
")

if echo "$SOCKS_OUTPUT" | grep -Eq "SOCKS5_PROXY_SUCCESS_RESPONSE|HTTP 200 OK"; then
  log_pass "Scenario 6 (SOCKS5 Proxy Runner) Succeeded! Curl fetched data through SOCKS tunnel."
else
  log_fail "Scenario 6 Failed. Output was: $SOCKS_OUTPUT"
  exit 1
fi
