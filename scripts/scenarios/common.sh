#!/usr/bin/env bash
set -eo pipefail

SERVER_CONTAINER="tailcat-sim-server"
CLIENT_CONTAINER="tailcat-sim-client"
EXCHANGE_DIR="/var/run/tailcat-exchange"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

get_derp_flag() {
  if [ "${DERP_MODE:-local}" = "public" ]; then
    echo ""
  else
    echo "--derpmap-url=http://derper:3341/derpmap.json"
  fi
}

cleanup_exchange() {
  docker exec "$SERVER_CONTAINER" sh -c "
    kill \$(pgrep -f 'while true') 2>/dev/null || true
    pkill -9 -f nc 2>/dev/null || true
    pkill -9 -f tailcat 2>/dev/null || true
    pkill -9 -f socat 2>/dev/null || true
    rm -rf ${EXCHANGE_DIR}/* /root/.config/tailcat/keys/*
  " >/dev/null 2>&1 || true

  docker exec "$CLIENT_CONTAINER" sh -c "
    kill \$(pgrep -f 'while true') 2>/dev/null || true
    pkill -9 -f nc 2>/dev/null || true
    pkill -9 -f tailcat 2>/dev/null || true
    pkill -9 -f socat 2>/dev/null || true
    rm -rf /root/.config/tailcat/keys/*
  " >/dev/null 2>&1 || true
}

wait_for_token() {
  local token_file="${1:-${EXCHANGE_DIR}/token.txt}"
  local timeout="${2:-15}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout" ]; do
    local token
    token=$(docker exec "$SERVER_CONTAINER" sh -c "[ -s '$token_file' ] && cat '$token_file' || true")
    if [ -n "$token" ] && [[ "$token" == tc* ]]; then
      echo "$token"
      return 0
    fi
    sleep 0.5
    elapsed=$((elapsed + 1))
  done

  log_fail "Timeout waiting for token in $token_file" >&2
  return 1
}
