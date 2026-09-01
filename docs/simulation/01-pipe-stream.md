# Simulation Scenario 01: Pipe & Raw Stream Simulation

Simulates raw bidirectional stream transmission between node-server listener and node-client payload sender over isolated WireGuard/DERP channel.

---

## Step-by-Step Visual Walkthrough

### Step 1: Server Listener Startup

![Step 1: Server Listener Startup](../../screenshots/simulation/01-pipe-stream/server-listener-start/01-server-listener-start.webp)

---

### Step 2: Client Dials & Streams Payload

![Step 2: Client Dials & Streams Payload](../../screenshots/simulation/01-pipe-stream/client-send-payload/02-client-send-payload.webp)

---

### Step 3: Server Unblocks & Outputs Data

![Step 3: Server Unblocks & Outputs Data](../../screenshots/simulation/01-pipe-stream/server-payload-received/03-server-payload-received.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 01
```
