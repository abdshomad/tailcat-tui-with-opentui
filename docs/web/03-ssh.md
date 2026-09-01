# Web Dashboard: Auth-Free SSH Server

Userspace SSH daemon providing auth-free or WireGuard-ACL protected remote terminal access without inbound firewall holes.

> **OpenTUI Mapping**: Tab 03 (`SSHView`) | **Cordis Route**: `/?tab=ssh`  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/web-arch.html`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

```mermaid
flowchart LR
    Browser["Browser Client (/?tab=ssh)"] -->|POST /api/ssh/start| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat ssh (daemon)"]
    Proc -.-> Net["WireGuard Authenticated SSH"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
```

---

## Visual Walkthrough

![Auth-Free SSH Server](../../screenshots/web/ssh/serve-ssh/01-web-ssh-server.webp)

---

## Module Controls & Details
* **Route**: `/?tab=ssh`
* **Purpose**: Userspace SSH daemon providing auth-free or WireGuard-ACL protected remote terminal access without inbound firewall holes.
* **Supervised Sessions**: Tunnels launched through this interface appear immediately in the Active Sessions monitor table.
