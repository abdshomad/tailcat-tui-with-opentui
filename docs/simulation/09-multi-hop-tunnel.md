# Simulation Scenario 09: Multi-Hop Chained Tunnels & Transit Routing Simulation

Chains multiple WireGuard user-space tunnels across intermediate nodes (Node A -> Node B -> Node C) to traverse segmented private enclaves.

---

## Step-by-Step Visual Walkthrough

### Step 1: Origin Service & Node C Listener Startup

![Step 1: Origin Service & Node C Listener Startup](../../screenshots/simulation/09-multi-hop-tunnel/server-c-listener-start/01-server-c-listener-start.webp)

---

### Step 2: Intermediary Node B Transit Bridge

![Step 2: Intermediary Node B Transit Bridge](../../screenshots/simulation/09-multi-hop-tunnel/node-b-relay-bridge/02-node-b-relay-bridge.webp)

---

### Step 3: Node A Dials Multi-Hop Path

![Step 3: Node A Dials Multi-Hop Path](../../screenshots/simulation/09-multi-hop-tunnel/client-a-multi-hop-exec/03-client-a-multi-hop-exec.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 09
```
