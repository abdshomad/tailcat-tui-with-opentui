# Simulation Scenario 02: Port Forwarding (8080) Simulation

Exposes local HTTP service on port 8080 through the tunnel, dialed directly by remote client over userspace netstack.

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Port Forwarder Daemon

![Step 1: Start Port Forwarder Daemon](../../screenshots/simulation/02-port-forward/serve-local-port/01-serve-local-port.webp)

---

### Step 2: Client Dials Remote Port

![Step 2: Client Dials Remote Port](../../screenshots/simulation/02-port-forward/dial-forwarded-port/02-dial-forwarded-port.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 02
```
