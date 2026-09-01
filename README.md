# Tailcat TUI, Web & Multi-Node Simulation

> **"Tailscale without Tailscale, interactive in your terminal, browser, and multi-node simulations."**

An interactive Terminal User Interface (TUI) powered by [OpenTUI](https://opentui.com), an embedded browser dashboard powered by [Cordis](https://cordis.moe) micro-kernel architecture, and an automated multi-node Docker Compose network simulation suite for all interaction modes in [tailcat](https://github.com/tailscale/tailcat).

---

## 🌟 Key Features

- **8-Tab Multi-View Dashboard**:
  1. **Pipe & Raw Stream**: Stdin/stdout streaming and raw data pipe between peers.
  2. **Ports & Tunnels**: Expose local TCP ports (`serve 8080`, `serve all`) or dial remote ports.
  3. **SSH Server & Client**: Auth-free or ACL-protected SSH without open firewall ports.
  4. **Files & SFTP**: Drop box receiver (`recv <dir>`), SFTP file server, copy (`cp`), and remote `ls`.
  5. **Network Diagnostics**: Ping DERP vs direct UDP, SOCKS5 proxy command runner, exit node, token parser & resolver.
  6. **Key Management**: Ephemeral vs saved keys (`genkey`), client identity keys, `--allow` ACL rules, custom DERP relays.
  7. **Active Sessions**: Live process supervisor, real-time stdout/stderr log inspector, kill/restart controls (`k`).
  8. **Settings & Plugin Manager**: Cordis micro-kernel dynamic plugin registry (`webServer`, `fileLogger`, `autoPortScanner`, `metricsCollector`), runtime enable/dispose lifecycles (`fork.dispose()`), port scanner (`3840+`), config persistence, and background daemon supervisor.

- **Dual UI Support**:
  - **OpenTUI Terminal Interface**: Fast, responsive ANSI terminal UI with global hotkeys.
  - **Cordis Web Dashboard**: Browser-based dashboard serving identical management endpoints.

- **Cordis Plugin Micro-Kernel**:
  - Modular plugins can be dynamically enabled or disposed at runtime without restarting.
  - State persisted to `~/.config/tailcat-tui/config.json`.

- **Multi-Node Network Simulation Suite**:
  - Containerized Docker Compose topology (`node-server`, `node-client`, `derper` relay).
  - Simulates 100% of scenarios from `tailcat/README.md` with zero host dependencies.
  - Automated step-by-step visual screenshot recording (`.webp`) and markdown docs generation.

- **Smart Binary Resolver**:
  - Automatically locates `tailcat` in system `$PATH`, local `bin/tailcat`, or compiles directly from `tailcat/` submodule.

---

## 🏗️ Architecture & Interactive Visualizers

> **Interactive Archify Visualizers**:
> * **Unified System Architecture**: [`docs/features/core/diagrams/tui-web-arch.html`](docs/features/core/diagrams/tui-web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/tui-web-arch.html)
> * **Simulation Protocol Explorer**: [`docs/features/core/diagrams/simulation-arch.html`](docs/features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)
> * **Cordis Web Architecture**: [`docs/features/core/diagrams/web-arch.html`](docs/features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

```mermaid
flowchart TD
    subgraph TIER1["1. Presentation UI"]
        OpenTUI["OpenTUI Terminal (8 Tabs)<br/>src/tui/app.ts"]
        WebUI["Browser Web Dashboard<br/>http://127.0.0.1:3840/"]
    end

    subgraph TIER2["2. Cordis Micro-Kernel"]
        Cordis["Cordis Kernel Context<br/>cordis/packages/core"]
        PluginMgr["PluginManagerService<br/>src/services/plugin-manager.service.ts"]
        TailcatSvc["TailcatService (Supervisor)<br/>src/services/tailcat.service.ts"]
    end

    subgraph TIER3["3. Dynamic Plugins (fork.dispose)"]
        PWeb["webServer"]
        PLog["fileLogger"]
        PPort["autoPortScanner"]
        PMet["metricsCollector"]
    end

    subgraph TIER4["4. Supervision & Network"]
        Processes["Tailcat Subprocesses Pool<br/>pipe · serve-port · ssh · sftp · ping"]
        SimNet["Multi-Node Simulation (Docker)<br/>node-server <--> derper <--> node-client"]
    end

    OpenTUI --> Cordis --> PluginMgr
    WebUI --> PWeb
    PluginMgr -. "fork / dispose" .-> PWeb & PLog & PPort & PMet
    Cordis --> TailcatSvc --> Processes <--> SimNet
```

---

## 📸 Visual Showcase

For complete module-by-module walkthroughs, explore our dedicated guides:
* 📖 **[Side-by-Side Visual Comparison](docs/visual-guide.md)** — OpenTUI vs Cordis Web Dashboard.
* 🐳 **[Multi-Node Simulation Visual Guide](docs/simulation/README.md)** — Step-by-step terminal walkthroughs for all 8 simulated scenarios.
* 🌐 **[Web Dashboard Guide](docs/web/README.md)** — Comprehensive walkthrough for all Web Dashboard modules.

### 1. Dual UI: OpenTUI Terminal vs Cordis Web Dashboard

#### Pipe & Stream
| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Pipe Stream](screenshots/tui/pipe/stream-server/01-view-server-form.webp) | ![Web Pipe Stream](screenshots/web/pipe/stream-server/01-web-pipe-server.webp) |

#### Ports & Tunnels
| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Port Server](screenshots/tui/ports/serve-port/01-serve-local-port.webp) | ![Web Port Server](screenshots/web/ports/serve-port/01-web-serve-port.webp) |

#### Auth-Free SSH Server
| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI SSH Server](screenshots/tui/ssh/serve-ssh/01-auth-free-ssh-server.webp) | ![Web SSH Server](screenshots/web/ssh/serve-ssh/01-web-ssh-server.webp) |

#### Active Sessions & Process Supervisor
| OpenTUI Terminal Interface | Cordis Web Dashboard |
| :---: | :---: |
| ![TUI Supervisor Dashboard](screenshots/tui/sessions/monitor-tunnels/01-supervisor-dashboard.webp) | ![Web Supervisor Dashboard](screenshots/web/sessions/monitor-tunnels/01-web-sessions-monitor.webp) |

#### Settings & Cordis Plugin Registry
| OpenTUI Settings & Persistence Controls | OpenTUI Plugin Registry View |
| :---: | :---: |
| ![TUI Settings Controls](screenshots/tui/web/web-server-controls/01-web-serving-and-persistence.webp) | ![TUI Plugin Registry](screenshots/tui/web/plugin-registry/02-settings-and-plugin-manager.webp) |

---

### 2. Multi-Node Docker Network Simulation

Live terminal output captured directly from isolated multi-node test containers:

| Scenario 1: Raw Stream Delivery | Scenario 3: Remote SSH Command Execution |
| :---: | :---: |
| ![Simulation Pipe](screenshots/simulation/01-pipe-stream/server-payload-received/03-server-payload-received.webp) | ![Simulation SSH](screenshots/simulation/03-auth-free-ssh/client-exec-command/02-client-exec-command.webp) |

| Scenario 7: WireGuard Key ACL (Authorized) | Scenario 7: WireGuard Key ACL (Blocked) |
| :---: | :---: |
| ![Simulation ACL OK](screenshots/simulation/07-key-management-acl/authorized-connect-success/03-authorized-connect-success.webp) | ![Simulation ACL Blocked](screenshots/simulation/07-key-management-acl/unauthorized-access-blocked/04-unauthorized-access-blocked.webp) |

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules https://github.com/abdshomad/tailcat-tui-with-opentui.git
cd tailcat-tui-with-opentui

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Running the Terminal UI

```bash
# Launch interactive TUI
npm run dev

# Or run the built binary
node dist/index.js
```

### Running with Web Server

```bash
# Launch TUI with Web Server automatically started
node dist/index.js --web

# Launch Web Server on specific port
node dist/index.js --web --web-port=8080

# Launch as a persistent background daemon (runs even after closing terminal)
node dist/index.js --daemon --web-port=3840

# Stop active background daemon
node dist/index.js --stop-daemon
```

---

## 🐳 Multi-Node Simulation Suite

Simulate all networking scenarios across isolated Docker containers:

```bash
# Run all 8 simulation scenarios in Docker Compose
npm run test:simulation

# Or run directly via CLI runner
./scripts/simulate.sh --all

# Run a specific scenario (e.g., Scenario 3: Auth-Free SSH)
./scripts/simulate.sh --scenario 03-auth-free-ssh

# Run with public Tailcat relays instead of local DERP
./scripts/simulate.sh --all --derp public
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| `[1] - [8]` | Switch directly to Tab 1 through 8 |
| `[w]` | Instant toggle Web Server (start / stop) from any tab |
| `[Tab] / [Shift+Tab]` | Cycle between input fields and action buttons |
| `[Enter]` | Execute focused action or toggle selected plugin |
| `[k]` | Kill selected process in Tab 7 (Active Sessions) |
| `[q] / [Ctrl+C]` | Cleanly exit TUI |

---

## 🏗️ Architecture

```
tailcat-tui-with-opentui/
├── src/
│   ├── services/
│   │   ├── tailcat.service.ts          # Cordis Service: Process supervisor & stream manager
│   │   ├── plugin-manager.service.ts   # Cordis Service: Plugin discovery, forking & disposal
│   │   ├── web-server.plugin.ts        # Cordis Plugin: HTTP Web dashboard & REST endpoints
│   │   ├── file-logger.plugin.ts       # Cordis Plugin: Session disk file logger
│   │   ├── auto-port-scanner.plugin.ts # Cordis Plugin: TCP port prober & allocator
│   │   ├── metrics-collector.plugin.ts # Cordis Plugin: Peer ping latency & telemetry
│   │   └── session.types.ts            # Typed session contracts and Cordis events
│   ├── tui/
│   │   ├── app.ts                      # Main OpenTUI application shell & event loop
│   │   ├── ansi.ts                     # ANSI styling, colors, and box framing
│   │   ├── state.ts                    # Application and form state store
│   │   └── views/                      # Modular view renderers for tabs 1-8
│   └── utils/
│       ├── binary-resolver.ts          # Smart PATH / bin / submodule resolver
│       ├── port-scanner.ts             # Sequential socket availability scanner
│       ├── daemon-manager.ts           # Config storage and detached daemon supervisor
│       ├── terminal-screenshot.ts      # Headless ANSI-to-WebP renderer
│       └── web-screenshot.ts           # Async headless Chrome WebP capture
├── docker/
│   ├── docker-compose.yml              # Topology with derper, node-server, node-client
│   ├── Dockerfile.node                 # Multi-stage image building tailcat + test tools
│   └── derper/
│       └── Dockerfile.derper           # Local test DERP relay & STUN server
├── scripts/
│   ├── simulate.sh                     # CLI simulation runner with exit codes & reporting
│   └── scenarios/                      # Modular shell test scripts (Scenarios 01-08)
├── tests/
│   ├── service.test.mjs                # Unit tests for Cordis TailcatService
│   ├── plugins.test.mjs                # Unit tests for Cordis Plugin Registry & lifecycles
│   ├── views.test.mjs                  # Unit tests for TUI views & action handlers
│   ├── web-serving.test.mjs            # Unit tests for port scanner, daemon & web plugin
│   ├── simulation.test.mjs             # Node.js runner integration for Docker simulations
│   └── e2e/                            # Visual screenshot automated test suite
├── screenshots/
│   ├── tui/                            # OpenTUI terminal screenshots
│   ├── web/                            # Cordis web dashboard screenshots
│   └── simulation/                     # Multi-node simulation terminal frame screenshots
└── docs/
    ├── visual-guide.md                 # TUI vs Web comparison guide
    ├── simulation/                     # Step-by-step visual guides for all 8 scenarios
    └── web/                            # Documentation for all 7 Web dashboard modules
```

---

## 🧪 Testing & Verification Architecture

Tailcat features a 3-tier automated testing and visual verification suite:

### 1. In-Process Unit & Cordis Service Tests
Validates the micro-kernel service lifecycle, dynamic plugin registration/disposal (`tests/plugins.test.mjs`), port scanning heuristics, configuration storage, view rendering, and process supervision:
```bash
npm test
```

### 2. Multi-Node Docker Network Simulations
Runs live, end-to-end integration tests for 100% of scenarios from `tailcat/README.md` across isolated Docker containers (`node-server`, `node-client`, `derper` relay):
```bash
# Run all 8 simulation scenarios
npm run test:simulation

# Run via CLI orchestrator with custom options
./scripts/simulate.sh --all
./scripts/simulate.sh --scenario 03-auth-free-ssh
./scripts/simulate.sh --all --derp public
```

### 3. Automated E2E Visual Screenshot & Docs Generator
Renders deterministic, high-resolution `.webp` screenshots across OpenTUI, Cordis Web, and Simulation terminal frames, auto-generating markdown visual guides:
```bash
npm run test:screenshots
```

| Asset Directory | Source Engine | Format |
| :--- | :--- | :--- |
| `screenshots/tui/` | `TerminalScreenshot` (ANSI to dark-mode window frame) | `.webp` |
| `screenshots/web/` | `WebScreenshot` (Headless Chrome 1280x800 + ffmpeg) | `.webp` |
| `screenshots/simulation/` | `TerminalScreenshot` (Multi-node terminal outputs) | `.webp` |

---

## 📜 License

MIT License
