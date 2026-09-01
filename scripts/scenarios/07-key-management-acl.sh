#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 7: Key Management & WireGuard ACL Protection"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start backend HTTP service on server using nc loop
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nACL_PROTECTED_OK\n' | nc -l -p 8080 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"

sleep 0.5

# 2. Client generates saved client identity key
CLIENT_KEY_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat genkey --client --key=client-default
")

CLIENT_NODEKEY=$(echo "$CLIENT_KEY_OUTPUT" | grep 'nodekey:' | head -n 1 | tr -d '\r\n')

if [ -z "$CLIENT_NODEKEY" ]; then
  log_fail "Failed to generate client nodekey. Output: $CLIENT_KEY_OUTPUT"
  exit 1
fi

log_info "Client identity public key: $CLIENT_NODEKEY"

# 3. Server starts with --allow=<CLIENT_NODEKEY>
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve --allow='$CLIENT_NODEKEY' 8080 > ${EXCHANGE_DIR}/acl_serve.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/acl_serve.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for ACL-protected server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/acl_serve.log"
  exit 1
fi

log_info "Testing authorized connection with saved client key..."
AUTH_RES=$(docker exec "$CLIENT_CONTAINER" sh -c "
  printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat $DERP_FLAG '$TOKEN' 8080
")

if echo "$AUTH_RES" | grep -q "200 OK"; then
  log_pass "Authorized client connected and authenticated successfully!"
else
  log_fail "Authorized client failed to connect. Response: $AUTH_RES"
  exit 1
fi

log_info "Testing unauthorized client (forcing new ephemeral key)..."
UNAUTH_RES=$(docker exec "$CLIENT_CONTAINER" sh -c "
  timeout 3 sh -c \"printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat --key=new $DERP_FLAG '$TOKEN' 8080\" || true
")

if echo "$UNAUTH_RES" | grep -q "200 OK"; then
  log_fail "Unauthorized client unexpectedly received response! ACL failed."
  exit 1
else
  log_pass "Scenario 7 (Keys & ACL Protection) Succeeded! Unauthorized access correctly blocked."
fi
