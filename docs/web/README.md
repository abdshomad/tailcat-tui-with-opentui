# Tailcat Web Dashboard Visual Documentation

Comprehensive visual guide for all 7 modules in the **[Cordis](https://github.com/cordiverse/cordis)-powered Tailcat Web Dashboard**.

---

## 🏗️ Web Dashboard & Cordis Plugin Architecture

> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/web-arch.html`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)  
> **Unified System Architecture**: [`docs/features/core/diagrams/tui-web-arch.html`](../features/core/diagrams/tui-web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/tui-web-arch.html)

```mermaid
flowchart TD
    subgraph KERNEL["Tailcat Core Kernel (Cordis Micro-Kernel)"]
        PluginMgr["PluginManagerService<br/>(Dynamic Fork / Dispose)"]
        WebPlugin["TailcatWebPlugin<br/>(HTTP / Web Dashboard)"]
        TailcatSvc["TailcatService<br/>(Process Supervisor)"]
        
        PluginMgr -. "fork / dispose" .-> WebPlugin
        WebPlugin --> TailcatSvc
    end

    HTTP["http://127.0.0.1:3840/<br/>(REST API + Static SPA)"]
    BrowserUI["Browser Dashboard UI<br/>(Interactive Tunnel Management)"]
    ChromeProof["Headless Chrome + ffmpeg<br/>(Visual Screenshot Generation)"]

    WebPlugin --> HTTP
    HTTP --> BrowserUI
    HTTP --> ChromeProof
```

### 1. HTTP Server & Endpoints
* **Dashboard Interface**: Served as responsive HTML with dark-mode styling and tab navigation for modules `pipe`, `ports`, `ssh`, `files`, `diag`, `keys`, and `sessions`.
* **REST API (`/api/sessions`)**: Returns live JSON serialization of all background tunnel sessions supervised by `TailcatService`.
* **Dynamic Plugin Lifecycle**: Can be dynamically enabled or disposed from OpenTUI Tab 8 ("Settings & Plugin Manager") via `ctx.pluginManager.togglePlugin('webServer')`.
* **Port Allocation**: Automatic sequential scanning (`PortScanner.resolvePort(3840, true)`) finding available ports starting from `3840`.

---

## 📋 Modules Overview

| Module # | Module Name | Route | Documentation | Screenshot |
| :---: | :--- | :---: | :--- | :---: |
| **01** | Pipe & Raw Stream | `/?tab=pipe` | [Pipe & Raw Stream](./01-pipe.md) | ![Pipe & Raw Stream](../../screenshots/web/pipe/stream-server/01-web-pipe-server.webp) |
| **02** | Ports & Tunnels | `/?tab=ports` | [Ports & Tunnels](./02-ports.md) | ![Ports & Tunnels](../../screenshots/web/ports/serve-port/01-web-serve-port.webp) |
| **03** | Auth-Free SSH Server | `/?tab=ssh` | [Auth-Free SSH Server](./03-ssh.md) | ![Auth-Free SSH Server](../../screenshots/web/ssh/serve-ssh/01-web-ssh-server.webp) |
| **04** | Files & Drop Box Inbox | `/?tab=files` | [Files & Drop Box Inbox](./04-files.md) | ![Files & Drop Box Inbox](../../screenshots/web/files/dropbox-recv/01-web-files-dropbox.webp) |
| **05** | Network Diagnostics & Ping | `/?tab=diag` | [Network Diagnostics & Ping](./05-diagnostics.md) | ![Network Diagnostics & Ping](../../screenshots/web/diagnostics/ping/01-web-diagnostics-ping.webp) |
| **06** | Key Management & Identities | `/?tab=keys` | [Key Management & Identities](./06-keys.md) | ![Key Management & Identities](../../screenshots/web/keys/genkey-default/01-web-keys-genkey.webp) |
| **07** | Active Sessions & Process Supervisor | `/?tab=sessions` | [Active Sessions & Process Supervisor](./07-sessions.md) | ![Active Sessions & Process Supervisor](../../screenshots/web/sessions/monitor-tunnels/01-web-sessions-monitor.webp) |

---

## 🧪 Testing & Execution

```bash
# Run Web Plugin and Plugin Manager unit tests
npm test -- tests/web-serving.test.mjs tests/plugins.test.mjs

# Re-generate all Web Dashboard screenshots and Markdown pages
npm run test:screenshots
```
