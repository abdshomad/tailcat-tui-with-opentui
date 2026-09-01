# Simulation Scenario 05: Network Diagnostics & Ping Simulation

Probes peer latency and validates DERP relay paths vs direct peer-to-peer UDP punch.

> **UI Mapping**: OpenTUI **Tab 5: Diagnostics** (`DiagnosticsView`) | Cordis Web Dashboard **`/?tab=diag`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant Server as node-server (172.28.0.2)
    participant Relay as tailcat-sim-derper (3340/3478)
    participant Client as node-client (172.28.0.3)

    Server->>Server: Start ping listener target
    Server->>Relay: Register DERP relay session
    Server-->>Client: Connection Token via shared exchange
    Client->>Relay: Send STUN probe & DERP ping
    Relay->>Server: Forward ping probe
    Server-->>Relay: Echo pong probe
    Relay-->>Client: 'pong in 360µs via DERP(local)'
    Client->>Server: Attempt direct UDP hole-punch upgrade
    Server-->>Client: Direct UDP path verified
```

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Diagnostics Target Listener

![Step 1: Start Diagnostics Target Listener](../../screenshots/simulation/05-ping-diagnostics/ping-target-listen/01-ping-target-listen.webp)

---

### Step 2: Client Measures Ping Latency

![Step 2: Client Measures Ping Latency](../../screenshots/simulation/05-ping-diagnostics/ping-latency-pong/02-ping-latency-pong.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 05
```
