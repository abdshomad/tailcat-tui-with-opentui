#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_COMPOSE_FILE="${ROOT_DIR}/docker/docker-compose.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

DERP_MODE="local"
TARGET_SCENARIO="all"
NO_BUILD=false
KEEP_RUNNING=false

usage() {
  echo -e "${BOLD}Tailcat Multi-Node Network Simulator${NC}"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --all                 Run all 8 README simulation scenarios (default)"
  echo "  --scenario <name|num> Run a specific scenario (e.g. 01, 03-auth-free-ssh)"
  echo "  --derp <local|public> Relay mode: 'local' (derper container) or 'public' (tailcat.dev)"
  echo "  --no-build            Skip docker compose rebuild"
  echo "  --keep-running        Leave containers running after tests finish"
  echo "  -h, --help            Show this help message"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      TARGET_SCENARIO="all"
      shift
      ;;
    --scenario)
      TARGET_SCENARIO="$2"
      shift 2
      ;;
    --derp)
      DERP_MODE="$2"
      shift 2
      ;;
    --no-build)
      NO_BUILD=true
      shift
      ;;
    --keep-running)
      KEEP_RUNNING=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      ;;
  esac
done

export DERP_MODE

cleanup() {
  if [ "$KEEP_RUNNING" = false ]; then
    echo -e "\n${BLUE}[TEARDOWN]${NC} Stopping simulation containers..."
    docker compose -f "$DOCKER_COMPOSE_FILE" down --volumes >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "${CYAN}${BOLD}       TAILCAT MULTI-NODE SIMULATION SUITE          ${NC}"
echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "Mode:        ${YELLOW}${DERP_MODE}${NC}"
echo -e "Scenario:    ${YELLOW}${TARGET_SCENARIO}${NC}"
echo -e "Compose:     ${DOCKER_COMPOSE_FILE}"
echo ""

# 1. Start Docker Containers
echo -e "${BLUE}[SETUP]${NC} Starting Docker Compose environment..."
if [ "$NO_BUILD" = false ]; then
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build
else
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d
fi

echo -e "${BLUE}[SETUP]${NC} Waiting for test nodes to be ready..."
sleep 2

# 2. Collect Scenarios to run
SCENARIOS=()
if [ "$TARGET_SCENARIO" = "all" ]; then
  for s in "${SCRIPT_DIR}/scenarios"/0*.sh; do
    [ -f "$s" ] && SCENARIOS+=("$s")
  done
else
  MATCH=$(find "${SCRIPT_DIR}/scenarios" -maxdepth 1 -name "*${TARGET_SCENARIO}*.sh" | head -n 1)
  if [ -z "$MATCH" ] || [ ! -f "$MATCH" ]; then
    echo -e "${RED}[ERROR] Scenario matching '${TARGET_SCENARIO}' not found.${NC}"
    exit 1
  fi
  SCENARIOS+=("$MATCH")
fi

PASSED=0
FAILED=0
FAILED_NAMES=()

# 3. Execute Scenarios
for scenario_script in "${SCENARIOS[@]}"; do
  sname=$(basename "$scenario_script")
  echo ""
  echo -e "${CYAN}----------------------------------------------------${NC}"
  echo -e "${BOLD}Running: ${sname}${NC}"
  echo -e "${CYAN}----------------------------------------------------${NC}"

  chmod +x "$scenario_script"
  if "$scenario_script"; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$sname")
  fi
done

# 4. Summary Report
echo ""
echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "${CYAN}${BOLD}                SIMULATION SUMMARY                  ${NC}"
echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "Total:  $((${PASSED} + ${FAILED}))"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"

if [ "$FAILED" -gt 0 ]; then
  echo -e "\n${RED}Failed Scenarios:${NC}"
  for f in "${FAILED_NAMES[@]}"; do
    echo -e "  • ${RED}${f}${NC}"
  done
  exit 1
else
  echo -e "\n${GREEN}${BOLD}All simulated networking scenarios passed successfully!${NC}"
  exit 0
fi
