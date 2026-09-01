# Tailcat TUI & Web Interface Visual Guide

This guide provides a comprehensive visual walkthrough comparing the **OpenTUI Terminal Interface** and the **Cordis Web Dashboard** across all Tailcat modules.

For multi-node container simulation walkthroughs, see the **[Multi-Node Simulation Visual Guide](simulation/README.md)**.  
For individual web module documentation, see the **[Web Dashboard Guide](web/README.md)**.

---

> [!NOTE]
> **Client Tools vs. Server Daemons**:
> * The **Cordis Web Dashboard** focuses on **inbound server daemon configuration** and **process supervision**.
> * The **OpenTUI Terminal Interface** and **Simulation Suites** support full **bidirectional operations**, including interactive client-side execution (e.g., *Remote Port Dialer*, *SSH Client Connect*, *Payload Streamer*, and *SOCKS5 Runner*) which require direct TTY, PTY, or local TCP socket bindings.

---

## 🏗️ Visual Asset Pipeline & Screenshot Mechanics

All visual screenshots in this repository are 100% automated and deterministic.

> **Interactive Archify Diagram**: [`docs/features/core/diagrams/tui-web-arch.html`](features/core/diagrams/tui-web-arch.html) (Live flow simulation and subsystem explorer)

```mermaid
flowchart LR
    subgraph INPUTS["Visual Inputs"]
        TUIState["OpenTUI State / Simulation<br/>(ANSI Buffer Output)"]
        WebState["Cordis Web Server Plugin<br/>(HTTP 127.0.0.1:3840/)"]
    end

    subgraph ENGINE["Visual Generation Engine"]
        ANSI["ANSI Parser<br/>(16/256 Color Tokens)"]
        HTML["HTML Dark Window Frame<br/>(Styled SVG/HTML DOM)"]
        Chrome["Headless Chrome<br/>(1280x800 Viewport)"]
        FFmpeg["ffmpeg WebP Encoder<br/>(Lossless Compression)"]
    end

    subgraph OUTPUTS["Deterministic Artifacts"]
        TUIImg["screenshots/tui/**/*.webp<br/>screenshots/simulation/**/*.webp"]
        WebImg["screenshots/web/**/*.webp"]
    end

    TUIState --> ANSI --> HTML --> FFmpeg --> TUIImg
    WebState --> Chrome --> FFmpeg --> WebImg
```

### 1. File & Directory Hierarchy
* `screenshots/tui/{module}/{feature}/{step-number}-{slug}.webp`: OpenTUI terminal interface screens.
* `screenshots/web/{module}/{feature}/01-{slug}.webp`: Cordis web dashboard views.
* `screenshots/simulation/{scenario}/{step-slug}/{step-number}-{step-slug}.webp`: Docker simulation multi-node steps.

### 2. Rendering Engines
* **TUI & Simulation**: Rendered through [`TerminalScreenshot`](../src/utils/terminal-screenshot.ts). Parses 16/256 ANSI escape codes into styled CSS spans embedded in an SVG/HTML terminal window frame.
* **Web Dashboard**: Rendered through [`WebScreenshot`](../src/utils/web-screenshot.ts). Spawns `google-chrome --headless=new --window-size=1280,800` against an active Cordis web instance and converts PNG to WebP via `ffmpeg`.

---

## 1. Pipe & Raw Stream

Create raw bidirectional data streams over Tailscale's WireGuard/DERP data plane for piping data, terminal chat, or arbitrary I/O between peers.

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Pipe Stream](../screenshots/tui/pipe/stream-server/01-view-server-form.webp) | ![Web Pipe Stream](../screenshots/web/pipe/stream-server/01-web-pipe-server.webp) |
| **Client Payload Sender** | |
| ![TUI Pipe Client](../screenshots/tui/pipe/stream-client/02-configure-client-payload.webp) | |

---

## 2. Ports & Tunnels

Expose local TCP ports (e.g., `8080`, `8443`, or `all`) to remote peers or connect to remote ports without modifying system routing tables or firewalls.

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Port Server](../screenshots/tui/ports/serve-port/01-serve-local-port.webp) | ![Web Port Server](../screenshots/web/ports/serve-port/01-web-serve-port.webp) |
| **Remote Port Dialer** | |
| ![TUI Port Dialer](../screenshots/tui/ports/dial-port/02-dial-remote-port.webp) | |

---

## 3. SSH Server & Client

Auth-free or WireGuard-ACL protected SSH access directly over userspace tunnels without open inbound firewall ports.

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI SSH Server](../screenshots/tui/ssh/serve-ssh/01-auth-free-ssh-server.webp) | ![Web SSH Server](../screenshots/web/ssh/serve-ssh/01-web-ssh-server.webp) |
| **SSH Client Connect** | |
| ![TUI SSH Client](../screenshots/tui/ssh/client-ssh/02-ssh-client-connect.webp) | |

---

## 4. Files & SFTP Transfers

Secure drop box inbox (`tailcat recv`), SFTP directory serving (`tailcat serve files`), remote file copy (`tailcat cp`), and directory listing (`tailcat ls`).

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Drop Box](../screenshots/tui/files/dropbox-recv/01-dropbox-inbox-receiver.webp) | ![Web Drop Box](../screenshots/web/files/dropbox-recv/01-web-files-dropbox.webp) |
| **SFTP Directory Server** | |
| ![TUI SFTP Server](../screenshots/tui/files/sftp-serve/02-serve-directory-sftp.webp) | |

---

## 5. Network Diagnostics & Tunnels

Ping peers via DERP relay vs direct UDP paths, route arbitrary commands through a userspace SOCKS5 proxy, or parse/resolve address tokens.

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Ping Diagnostics](../screenshots/tui/diagnostics/ping/01-ping-derp-direct.webp) | ![Web Ping Diagnostics](../screenshots/web/diagnostics/ping/01-web-diagnostics-ping.webp) |
| **SOCKS5 Proxy Command Runner** | |
| ![TUI SOCKS Proxy](../screenshots/tui/diagnostics/socks-proxy/02-socks5-proxy-runner.webp) | |
| **Token Parser & Resolver** | |
| ![TUI Token Parser](../screenshots/tui/diagnostics/token-parser/03-token-parser-resolver.webp) | |

---

## 6. Key Management & Relays

Generate WireGuard keypairs, manage saved identity profiles (`default`, custom), issue client authentication keys, and configure custom DERP relay regions.

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI GenKey Default](../screenshots/tui/keys/genkey-default/01-generate-saved-key.webp) | ![Web GenKey Default](../screenshots/web/keys/genkey-default/01-web-keys-genkey.webp) |
| **Client Identity Keys** | |
| ![TUI Client Key](../screenshots/tui/keys/genkey-client/02-client-identity-key.webp) | |

---

## 7. Active Sessions & Process Supervisor

Live process supervisor monitoring background tunnels, streaming real-time stdout/stderr logs, and providing one-key termination (`k`).

| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Supervisor Dashboard](../screenshots/tui/sessions/monitor-tunnels/01-supervisor-dashboard.webp) | ![Web Supervisor Dashboard](../screenshots/web/sessions/monitor-tunnels/01-web-sessions-monitor.webp) |

---

## 8. Settings & Cordis Plugin Manager

Manage the Cordis micro-kernel dynamic plugin registry (`webServer`, `fileLogger`, `autoPortScanner`, `metricsCollector`), toggle runtime lifecycles with immediate disposal (`fork.dispose()`), auto-scan available TCP ports, save startup preferences to `~/.config/tailcat-tui/config.json`, or detach as a background daemon.

| OpenTUI Settings Controls | OpenTUI Plugin Registry View |
| :---: | :---: |
| ![TUI Settings Controls](../screenshots/tui/web/web-server-controls/01-web-serving-and-persistence.webp) | ![TUI Plugin Registry](../screenshots/tui/web/plugin-registry/02-settings-and-plugin-manager.webp) |

---

## 9. Multi-Node Simulation Network Scenarios (13 Scenarios)

All 13 networking scenarios from basic pipe streaming to multi-hop transit routing, daemon auto-recovery, and high-concurrency tunnels are simulated across isolated multi-node Docker containers:

| Scenario 9: Multi-Hop Transit Bridge | Scenario 10: Daemon Crash Recovery |
| :---: | :---: |
| ![Multi-Hop Bridge](../screenshots/simulation/09-multi-hop-tunnel/node-b-relay-bridge/02-node-b-relay-bridge.webp) | ![Daemon Recovery](../screenshots/simulation/10-daemon-lifecycle-auto-reconnect/daemon-stale-pid-recovery/03-daemon-stale-pid-recovery.webp) |

| Scenario 11: ACL Security Enforcement | Scenario 12: High-Concurrency Multiplex |
| :---: | :---: |
| ![ACL Denial](../screenshots/simulation/11-acl-denial-security/rogue-client-handshake-blocked/03-rogue-client-handshake-blocked.webp) | ![Concurrent Streams](../screenshots/simulation/12-high-concurrency-stream/parallel-workers-stream/02-parallel-workers-stream.webp) |

* Detailed individual scenario guides: **[docs/simulation/README.md](simulation/README.md)**.

---

## 10. Headless REST API & Telemetry Endpoints

The web server plugin exposes JSON REST endpoints for headless remote monitoring and control:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Remote Client / curl
    participant Web as Cordis Web Plugin (:3840)
    participant Core as TailcatService / Kernel
    participant Metric as MetricsCollector

    Client->>Web: GET /api/status
    Web->>Core: Query binary info & daemon PID
    Web-->>Client: 200 OK (status, port, plugins)

    Client->>Web: GET /api/metrics
    Web->>Metric: Query aggregated latency & pings
    Web-->>Client: 200 OK (trackedPeers, avgLatencyMs)

    Client->>Web: POST /api/action {"action":"ping","target":"tcToken..."}
    Web->>Core: Execute headless action
    Web-->>Client: 200 OK {"success":true}
```

---

## 🧪 Re-generating All Visuals

To regenerate all screenshots and markdown guides:
```bash
npm run test:screenshots
```
