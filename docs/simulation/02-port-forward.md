# Simulation Scenario 02: Port Forwarding (8080) Simulation

Exposes local HTTP service on port 8080 through the tunnel, dialed directly by remote client over userspace netstack.

> **UI Mapping**: OpenTUI **Tab 2: Ports / Tunnels** (`PortsView`) | Cordis Web Dashboard **`/?tab=ports`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant Server as node-server (172.28.0.2)
    participant Relay as tailcat-sim-derper (3340/3478)
    participant Client as node-client (172.28.0.3)

    Server->>Server: Start local HTTP daemon on 127.0.0.1:8080
    Server->>Server: Start 'tailcat serve-port 8080'
    Server->>Relay: Register Port Forwarder Token
    Server-->>Client: Connection Token via shared exchange
    Client->>Relay: Connect to Token
    Relay-->>Client: Establish Userspace TCP Bridge
    Client->>Server: HTTP GET / across WireGuard tunnel
    Server->>Client: HTTP 200 OK + payload
    Client->>Client: Assert HTTP payload & exit 0
```

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
