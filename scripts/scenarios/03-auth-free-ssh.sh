#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 3: Auth-free SSH server & client execution"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start auth-free SSH server
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve no-auth-ssh > ${EXCHANGE_DIR}/serve_ssh.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/serve_ssh.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for SSH server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/serve_ssh.log"
  exit 1
fi

log_info "SSH server listening on token: ${TOKEN:0:20}..."

# 2. Client executes remote command via tailcat ssh
SSH_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "
  tailcat $DERP_FLAG ssh '$TOKEN' 'echo AUTH_FREE_SSH_OK; whoami; hostname'
")

if echo "$SSH_OUTPUT" | grep -q "AUTH_FREE_SSH_OK"; then
  log_pass "Scenario 3 (Auth-Free SSH) Succeeded! Remote shell command executed cleanly."
else
  log_fail "Scenario 3 Failed. Output was: $SSH_OUTPUT"
  exit 1
fi
