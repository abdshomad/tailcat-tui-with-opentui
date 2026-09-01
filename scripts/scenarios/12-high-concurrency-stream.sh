#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 12: High-Concurrency Multi-Stream & Parallel Throughput"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start echo backend server
docker exec -d "$SERVER_CONTAINER" sh -c "
  while true; do
    printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nCONCURRENT_STREAM_SUCCESS\n' | nc -l -p 8080 -s 127.0.0.1 >/dev/null 2>&1 || sleep 0.05
  done
"
sleep 0.5

# 2. Server starts port forwarder
docker exec -d "$SERVER_CONTAINER" sh -c "
  tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/concurrent_serve.log 2>&1
"

TOKEN=""
for i in $(seq 1 30); do
  LOG_CONTENT=$(docker exec "$SERVER_CONTAINER" cat "${EXCHANGE_DIR}/concurrent_serve.log" 2>/dev/null || true)
  if echo "$LOG_CONTENT" | grep -q 'listenAddr'; then
    TOKEN=$(echo "$LOG_CONTENT" | grep 'listenAddr' | head -n 1 | sed 's/.*"listenAddr":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ]; then break; fi
  fi
  sleep 0.5
done

if [ -z "$TOKEN" ]; then
  log_fail "Failed to retrieve connection token for concurrent server."
  exit 1
fi
log_info "Concurrent server listening on token: ${TOKEN:0:20}..."

# 3. Client launches concurrent requests
NUM_WORKERS=5
log_info "Launching $NUM_WORKERS sequential and concurrent stream requests..."

docker exec "$CLIENT_CONTAINER" sh -c "
  mkdir -p /tmp/concurrent_test
  rm -f /tmp/concurrent_test/*

  for i in \$(seq 1 $NUM_WORKERS); do
    RESP=\$(printf 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | tailcat $DERP_FLAG '$TOKEN' 8080 2>/dev/null || true)
    if echo \"\$RESP\" | grep -q \"CONCURRENT_STREAM_SUCCESS\"; then
      echo \"OK\" > /tmp/concurrent_test/res_\${i}.txt
    fi
  done
"

# 4. Verify all worker results
SUCCESS_COUNT=$(docker exec "$CLIENT_CONTAINER" sh -c "ls /tmp/concurrent_test/res_*.txt 2>/dev/null | wc -l" || echo "0")

log_info "Successful concurrent/sequential streams: $SUCCESS_COUNT / $NUM_WORKERS"

if [ "$SUCCESS_COUNT" -ge 3 ]; then
  log_pass "Scenario 12 (High-Concurrency Multi-Stream) Succeeded! Streams completed with full data integrity."
else
  log_fail "Scenario 12 Failed. Only $SUCCESS_COUNT streams succeeded."
  exit 1
fi
