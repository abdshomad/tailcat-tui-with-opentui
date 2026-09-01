# Simulation Scenario 06: SOCKS5 Userspace Proxy Runner Simulation

Routes arbitrary CLI commands (like curl) through a transient userspace SOCKS5 proxy tunnel.

> **UI Mapping**: OpenTUI **Tab 5: Diagnostics** (Proxy Runner) | Cordis Web Dashboard **`/?tab=diag`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant Server as node-server (172.28.0.2)
    participant Relay as tailcat-sim-derper (3340/3478)
    participant Proxy as Userspace SOCKS5 (127.0.0.1:1080)
    participant Curl as curl / CLI process

    Server->>Server: Run internal HTTP test service
    Server->>Relay: Register tunnel token
    Server-->>Proxy: Pass token
    Curl->>Proxy: Initiate request via 'tailcat run --socks5 curl ...'
    Proxy->>Relay: Encrypted SOCKS5 TCP stream
    Relay->>Server: Deliver HTTP GET
    Server-->>Relay: Return HTTP 200 payload
    Relay-->>Proxy: Forward stream
    Proxy-->>Curl: Deliver clean stdout response
```

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Target HTTP Endpoint

![Step 1: Start Target HTTP Endpoint](../../screenshots/simulation/06-socks5-proxy/socks-service-listen/01-socks-service-listen.webp)

---

### Step 2: Route Curl through SOCKS5 Proxy

![Step 2: Route Curl through SOCKS5 Proxy](../../screenshots/simulation/06-socks5-proxy/socks-curl-request/02-socks-curl-request.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 06
```
