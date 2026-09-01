# Web Dashboard: Active Sessions & Process Supervisor

Real-time dashboard monitoring background tunnels, connection tokens, process status, and lifecycle controls.

> **OpenTUI Mapping**: Tab 07 (`SessionsView`) | **Cordis Route**: `/?tab=sessions`  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/web-arch.html`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

```mermaid
flowchart LR
    Browser["Browser Client (/?tab=sessions)"] -->|GET /api/sessions (1s)| WebPlugin["TailcatWebPlugin (3840)"]
    Browser -->|DELETE /api/sessions/:id| WebPlugin
    WebPlugin --> TailcatSvc["TailcatService (Supervisor)"]
    TailcatSvc --> Procs["Active Process Pool (SIGTERM / SIGKILL)"]
```

---

## Visual Walkthrough

![Active Sessions & Process Supervisor](../../screenshots/web/sessions/monitor-tunnels/01-web-sessions-monitor.webp)

---

## Module Controls & Details
* **Route**: `/?tab=sessions`
* **Purpose**: Real-time dashboard monitoring background tunnels, connection tokens, process status, and lifecycle controls.
* **Supervised Sessions**: Tunnels launched through this interface appear immediately in the Active Sessions monitor table.
