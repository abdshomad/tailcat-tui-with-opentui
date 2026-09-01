# Simulation Scenario 03: Auth-Free SSH Server & Remote Exec Simulation

Spawns userspace auth-free SSH daemon without inbound firewall ports and runs remote commands over WireGuard tunnel.

> **UI Mapping**: OpenTUI **Tab 3: SSH** (`SSHView`) | Cordis Web Dashboard **`/?tab=ssh`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant Server as node-server (172.28.0.2)
    participant Relay as tailcat-sim-derper (3340/3478)
    participant Client as node-client (172.28.0.3)

    Server->>Server: Start userspace SSH server 'tailcat ssh'
    Server->>Relay: Register SSH Service Token
    Server-->>Client: Connection Token via shared exchange
    Client->>Relay: Connect to Token
    Relay-->>Client: Establish SSH Session Bridge
    Client->>Server: Dispatch remote command 'id'
    Server->>Client: Stream stdout 'uid=0(root) gid=0(root)'
    Client->>Client: Validate exit code 0 & output
```

---

## Step-by-Step Visual Walkthrough

### Step 1: Launch Auth-Free SSH Daemon

![Step 1: Launch Auth-Free SSH Daemon](../../screenshots/simulation/03-auth-free-ssh/start-ssh-server/01-start-ssh-server.webp)

---

### Step 2: Client Executes Remote Command

![Step 2: Client Executes Remote Command](../../screenshots/simulation/03-auth-free-ssh/client-exec-command/02-client-exec-command.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 03
```
