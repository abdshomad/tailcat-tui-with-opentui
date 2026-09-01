# Web Dashboard: Pipe & Raw Stream

Create raw bidirectional data streams over Tailscale WireGuard/DERP data plane for streaming payloads or terminal pipes between peers.

> **OpenTUI Mapping**: Tab 01 (`PipeView`) | **Cordis Route**: `/?tab=pipe`  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/web-arch.html`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

```mermaid
flowchart LR
    Browser["Browser Client (/?tab=pipe)"] -->|POST /api/pipe/start| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat pipe"]
    Proc -.-> Net["WireGuard / DERP Stream"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
```

---

## Visual Walkthrough

![Pipe & Raw Stream](../../screenshots/web/pipe/stream-server/01-web-pipe-server.webp)

---

## Module Controls & Details
* **Route**: `/?tab=pipe`
* **Purpose**: Create raw bidirectional data streams over Tailscale WireGuard/DERP data plane for streaming payloads or terminal pipes between peers.
* **Supervised Sessions**: Tunnels launched through this interface appear immediately in the Active Sessions monitor table.
