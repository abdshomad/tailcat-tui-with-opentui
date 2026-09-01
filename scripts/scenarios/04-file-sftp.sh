#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 4: Files, Drop Box & SFTP Transfers"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# --- Part A: Drop Box Receiver (`tailcat recv /inbox`) ---
log_info "Testing Part A: Drop Box receiver (tailcat recv)"
docker exec "$SERVER_CONTAINER" sh -c "mkdir -p /inbox && rm -rf /inbox/*"

docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json recv /inbox > ${EXCHANGE_DIR}/recv.log 2>&1
"

TOKEN_RECV=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/recv.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN_RECV=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN_RECV" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN_RECV" ]; then
  log_fail "Failed to retrieve connection token for recv drop box."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/recv.log"
  exit 1
fi

# Client sends a file into the drop box
docker exec "$CLIENT_CONTAINER" sh -c "
  echo 'Secret Drop Box Data Content 12345' > /tmp/sample_upload.txt
  tailcat $DERP_FLAG cp /tmp/sample_upload.txt '${TOKEN_RECV}:'
"

sleep 1

# Verify file exists in server /inbox
INBOX_CONTENT=$(docker exec "$SERVER_CONTAINER" cat /inbox/sample_upload.txt 2>/dev/null || true)
if [ "$INBOX_CONTENT" = "Secret Drop Box Data Content 12345" ]; then
  log_pass "Part A (Drop box upload) Verified successfully."
else
  log_fail "Part A Failed. Inbox file mismatch. Found: '$INBOX_CONTENT'"
  exit 1
fi

cleanup_exchange

# --- Part B: SFTP File Server (`tailcat serve files`) ---
log_info "Testing Part B: SFTP Directory Server (tailcat serve files)"
docker exec "$SERVER_CONTAINER" sh -c "
  mkdir -p /srv/files
  echo 'Served file via Tailcat SFTP' > /srv/files/readme_doc.txt
"

docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve --files=/srv/files:ro files > ${EXCHANGE_DIR}/files_server.log 2>&1
"

TOKEN_FILES=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/files_server.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN_FILES=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN_FILES" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN_FILES" ]; then
  log_fail "Failed to retrieve connection token for SFTP files server."
  docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/files_server.log"
  exit 1
fi

# Client lists directory with `tailcat ls`
LS_OUTPUT=$(docker exec "$CLIENT_CONTAINER" sh -c "tailcat $DERP_FLAG ls '$TOKEN_FILES'")
if echo "$LS_OUTPUT" | grep -q "readme_doc.txt"; then
  log_pass "SFTP Directory listing (tailcat ls) verified."
else
  log_fail "SFTP Directory listing failed. Output: $LS_OUTPUT"
  exit 1
fi

# Client copies file from server with `tailcat cp`
docker exec "$CLIENT_CONTAINER" sh -c "
  rm -f /tmp/downloaded_doc.txt
  tailcat $DERP_FLAG cp '${TOKEN_FILES}:readme_doc.txt' /tmp/downloaded_doc.txt
"

DOWNLOADED=$(docker exec "$CLIENT_CONTAINER" cat /tmp/downloaded_doc.txt 2>/dev/null || true)
if [ "$DOWNLOADED" = "Served file via Tailcat SFTP" ]; then
  log_pass "Scenario 4 (Files, Drop Box & SFTP) Succeeded completely!"
else
  log_fail "Scenario 4 Failed to download file. Found: '$DOWNLOADED'"
  exit 1
fi
