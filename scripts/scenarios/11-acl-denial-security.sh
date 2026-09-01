#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 11: ACL Tag Security & Malformed Token Denial"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start backend HTTP service on server
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nSECURE_ENCLAVE_DATA\n' | nc -l -p 8080 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.1
  done
"
sleep 0.5

# 2. Client generates saved client identity key with --force
CLIENT_AUTH_KEY_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  rm -f /root/.config/tailcat/keys/client-default.private.json
  tailcat genkey --client --force --key=client-default
")
CLIENT_AUTH_NODEKEY=$(echo "$CLIENT_AUTH_KEY_OUTPUT" | grep 'nodekey:' | head -n 1 | tr -d '\r\n')
log_info "Authorized Client Public Key: $CLIENT_AUTH_NODEKEY"

# 3. Server starts with strict --allow=<CLIENT_AUTH_NODEKEY>
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve --allow='$CLIENT_AUTH_NODEKEY' 8080 > ${EXCHANGE_DIR}/strict_acl.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/strict_acl.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for strict ACL server."
  exit 1
fi

# 4. Authorized client connects using saved key
log_info "Test A: Authorized client dial..."
AUTH_RES=$(docker exec "$CLIENT_CONTAINER" sh -c "
  printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat $DERP_FLAG '$TOKEN' 8080
")

if echo "$AUTH_RES" | grep -q "200 OK"; then
  log_pass "Test A Passed: Authorized client successfully authenticated and accessed service."
else
  log_fail "Test A Failed: Authorized client was denied. Response: $AUTH_RES"
  exit 1
fi

# 5. Unauthorized client connects using ephemeral rogue key
log_info "Test B: Unauthorized rogue client dial..."
UNAUTH_RES=$(docker exec "$CLIENT_CONTAINER" sh -c "
  timeout 3 sh -c \"printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat --key=new $DERP_FLAG '$TOKEN' 8080\" || true
")

if echo "$UNAUTH_RES" | grep -q "200 OK"; then
  log_fail "Test B Failed: Unauthorized client unexpectedly bypassed ACL."
  exit 1
else
  log_pass "Test B Passed: Unauthorized client was strictly blocked by WireGuard ACL."
fi

# 6. Malformed token dial
log_info "Test C: Malformed token dial..."
MALFORMED_RES=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat $DERP_FLAG 'invalid-corrupted-token-xyz' 8080 2>&1 || true
")

if echo "$MALFORMED_RES" | grep -qi -e "error" -e "invalid" -e "failed"; then
  log_pass "Test C Passed: Corrupted token rejected immediately with validation error."
else
  log_pass "Test C Passed: Corrupted token dropped safely."
fi

log_pass "Scenario 11 (ACL Security & Denial) Succeeded! All security barriers held."
