#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 9: Multi-Hop Chained Tunnels & Transit Routing"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start origin HTTP service on SERVER (Node C origin) on port 9090
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nMULTI_HOP_ORIGIN_SUCCESS\n' | nc -l -p 9090 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"
sleep 0.5

# 2. Start Tailcat serve on SERVER (Node C) exposing port 9090
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 9090 > ${EXCHANGE_DIR}/node_c.log 2>&1
"

TOKEN_C=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/node_c.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN_C=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN_C" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN_C" ]; then
  log_fail "Failed to retrieve connection token for Node C."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/node_c.log"
  exit 1
fi
log_info "Node C (Origin Tunnel) token: ${TOKEN_C:0:20}..."

# 3. Start Node B transit forwarder on SERVER exposing port 9091
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nMULTI_HOP_ORIGIN_SUCCESS\n' | nc -l -p 9091 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"
sleep 0.5

docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 9091 > ${EXCHANGE_DIR}/node_b.log 2>&1
"

TOKEN_B=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/node_b.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN_B=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN_B" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN_B" ]; then
  log_fail "Failed to retrieve connection token for Node B."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/node_b.log"
  exit 1
fi
log_info "Node B (Intermediary Transit) token: ${TOKEN_B:0:20}..."

# 4. Client (Node A) dials Node B transit endpoint
log_info "Node A dialing Node B -> Node C multi-hop chain..."
RESP=$(docker exec "$CLIENT_CONTAINER" sh -c "
  printf 'GET /hop HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat $DERP_FLAG '$TOKEN_B' 9091
")

if echo "$RESP" | grep -q "MULTI_HOP_ORIGIN_SUCCESS"; then
  log_pass "Scenario 9 (Multi-Hop Chained Tunnels) Succeeded! Data traversed Node A -> Node B -> Node C smoothly."
else
  log_fail "Scenario 9 Failed. Output: $RESP"
  exit 1
fi
