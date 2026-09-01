# Simulation Scenario 01: Pipe & Raw Stream Simulation

Simulates raw bidirectional stream transmission between node-server listener and node-client payload sender over isolated WireGuard/DERP channel.

> **UI Mapping**: OpenTUI **Tab 1: Pipe / Stream** (`PipeView`) | Cordis Web Dashboard **`/?tab=pipe`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant Server as node-server (172.28.0.2)
    participant Relay as tailcat-sim-derper (3340/3478)
    participant Client as node-client (172.28.0.3)

    Server->>Server: Start 'tailcat pipe' listener
    Server->>Relay: Register DiscoKey & ServerPublic
    Server-->>Client: Connection Token via shared exchange
    Client->>Relay: Connect & Request ServerPublic via Token
    Relay-->>Client: Handshake & Broker Direct/DERP channel
    Client->>Server: Stream raw payload ("hello from tailcat...")
    Server->>Server: Echo payload to stdout & exit 0
    Client->>Client: Complete stream & exit 0
```

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
