# Web Serving & Daemon Persistence

- **Port Scanner (`src/utils/port-scanner.ts`)**: Sequential free TCP port resolution (`3840..3940`) using `node:net` socket probing.
- **Daemon Manager (`src/utils/daemon-manager.ts`)**: Manages `~/.config/tailcat-tui/config.json` preferences, background PID tracking, and crash recovery.
- **Enhanced Web Plugin (`src/services/web-server.plugin.ts`)**: Dynamic Cordis plugin with lifecycle states (`stopped`, `online`, `daemon`) and REST API endpoints (`/api/status`, `/api/metrics`, `/api/sessions`, `/api/action`).
- **Tab 8 TUI View (`src/tui/views/web-view.ts`)**: OpenTUI dashboard for starting, stopping, auto-scanning, and configuring daemon persistence.
- **CLI Daemon Runner (`src/index.ts` & `src/daemon.ts`)**: Headless CLI flags (`--web`, `--web-port=<port>`, `--web-daemon`, `--stop-daemon`).
- **Verification (`tests/web-serving.test.mjs`)**: Verified with unit test suite and automated visual screenshots in `screenshots/web/`.
