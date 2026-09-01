# Simulation Scenario 10: Daemon Lifecycle, Crash Resilience & Auto-Recovery Simulation

Validates daemon PID tracking, unexpected SIGKILL crash detection, stale PID file cleanup, and automated state restoration.

---

## Step-by-Step Visual Walkthrough

### Step 1: Persistent Daemon Startup

![Step 1: Persistent Daemon Startup](../../screenshots/simulation/10-daemon-lifecycle-auto-reconnect/daemon-start-persist/01-daemon-start-persist.webp)

---

### Step 2: Sudden Crash & Stale State Detection

![Step 2: Sudden Crash & Stale State Detection](../../screenshots/simulation/10-daemon-lifecycle-auto-reconnect/daemon-crash-sigkill/02-daemon-crash-sigkill.webp)

---

### Step 3: Auto-Recovery & Reconnection

![Step 3: Auto-Recovery & Reconnection](../../screenshots/simulation/10-daemon-lifecycle-auto-reconnect/daemon-stale-pid-recovery/03-daemon-stale-pid-recovery.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 10
```
