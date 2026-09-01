# Simulation Scenario 13: Web Server Headless Mode & Remote API Control Simulation

Controls Tailcat services headlessly over HTTP REST and telemetry endpoints without requiring interactive terminal TUI.

---

## Step-by-Step Visual Walkthrough

### Step 1: Headless Web Server Startup

![Step 1: Headless Web Server Startup](../../screenshots/simulation/13-web-server-headless-api/headless-web-daemon-launch/01-headless-web-daemon-launch.webp)

---

### Step 2: Probe Status & Telemetry via curl

![Step 2: Probe Status & Telemetry via curl](../../screenshots/simulation/13-web-server-headless-api/rest-api-status-probe/02-rest-api-status-probe.webp)

---

### Step 3: Trigger Service Actions via POST API

![Step 3: Trigger Service Actions via POST API](../../screenshots/simulation/13-web-server-headless-api/rest-api-action-execution/03-rest-api-action-execution.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 13
```
