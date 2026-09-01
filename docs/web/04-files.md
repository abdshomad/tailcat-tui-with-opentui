# Web Dashboard: Files & Drop Box Inbox

Secure drop box receiver (`tailcat recv /inbox`) accepting encrypted file uploads via SCP / SFTP.

> **OpenTUI Mapping**: Tab 04 | **Cordis Route**: `/?tab=files`  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/web-arch.html`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

```mermaid
flowchart LR
    Browser["Browser Client (/?tab=files)"] -->|POST /api/files/serve| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> Logger["FileLoggerPlugin"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat recv / serve files"]
    Proc -.-> Net["Drop Box / SFTP Channel"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
```

---

## Visual Walkthrough

![Files & Drop Box Inbox](../../screenshots/web/files/dropbox-recv/01-web-files-dropbox.webp)

---

## Module Controls & Details
* **Route**: `/?tab=files`
* **Purpose**: Secure drop box receiver (`tailcat recv /inbox`) accepting encrypted file uploads via SCP / SFTP.
* **Supervised Sessions**: Tunnels launched through this interface appear immediately in the Active Sessions monitor table.
