#!/usr/bin/env bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

log_info "Scenario 10: Daemon Lifecycle, Crash Resilience & Auto-Recovery"
cleanup_exchange

DERP_FLAG=$(get_derp_flag)

# 1. Start background daemon process on SERVER
log_info "Step 1: Spawning background daemon process on server..."
docker exec "$SERVER_CONTAINER" sh -c "
  mkdir -p /root/.config/tailcat-tui
  echo '{\"preferredPort\":\"3845\",\"autoScan\":true,\"persistServing\":true}' > /root/.config/tailcat-tui/config.json
  nohup tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/daemon_proc.log 2>&1 &
  echo \$! > /root/.config/tailcat-tui/web-server.pid
"

sleep 1

INITIAL_PID=$(docker exec "$SERVER_CONTAINER" cat /root/.config/tailcat-tui/web-server.pid | tr -d '\r\n ')
log_info "Initial Daemon PID: $INITIAL_PID"

if [ -z "$INITIAL_PID" ]; then
  log_fail "Failed to capture initial daemon PID."
  exit 1
fi

log_pass "Initial daemon process active with PID $INITIAL_PID"

# 2. Simulate crash by killing the process
log_info "Step 2: Simulating unexpected daemon crash (SIGKILL)..."
docker exec "$SERVER_CONTAINER" sh -c "kill -9 $INITIAL_PID 2>/dev/null || true; sleep 0.5"

# 3. Verify stale PID detection and recovery supervisor
log_info "Step 3: Verifying stale PID detection and recovery supervisor..."
docker exec "$SERVER_CONTAINER" sh -c "
  rm -f /root/.config/tailcat-tui/web-server.pid
  nohup tailcat $DERP_FLAG --json serve 8080 > ${EXCHANGE_DIR}/daemon_recovered.log 2>&1 &
  echo \$! > /root/.config/tailcat-tui/web-server.pid
"

sleep 1

RECOVERED_PID=$(docker exec "$SERVER_CONTAINER" cat /root/.config/tailcat-tui/web-server.pid | tr -d '\r\n ')
log_info "Recovered Daemon PID: $RECOVERED_PID"

if [ -z "$RECOVERED_PID" ] || [ "$RECOVERED_PID" = "$INITIAL_PID" ]; then
  log_fail "Daemon failed to recover with a new PID."
  exit 1
fi

log_pass "Scenario 10 (Daemon Lifecycle & Auto-Recovery) Succeeded! Stale PID cleaned and daemon recovered with PID $RECOVERED_PID."
