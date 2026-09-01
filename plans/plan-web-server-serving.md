# Formal Implementation Plan: Web Server TUI Serving & Persistence

## 1. Overview
Enhance the Tailcat TUI application with full interactive web serving capabilities, intelligent port scanning with automatic fallback, configuration persistence in `~/.config/tailcat-tui/config.json`, and detached background daemon lifecycle management.

## 2. Architecture & Modules
- **Port Scanner (`src/utils/port-scanner.ts`)**: Sequential free port finder using `node:net`.
- **Config & Daemon Manager (`src/utils/daemon-manager.ts`)**: Manages `~/.config/tailcat-tui/` JSON config and PID tracking for detached daemons.
- **Enhanced Web Plugin (`src/services/web-server.plugin.ts`)**: Integrates port scanning, lifecycle states (`stopped` | `running` | `daemon`), and Cordis event notifications.
- **TUI Web Server View (`src/tui/views/web-view.ts`)**: Tab `[8] Web Server` with status, port inputs, auto-scan toggle, Start/Stop/Daemon buttons, and persistent config saving.
- **TUI App Integration (`src/tui/app.ts`)**: Register tab `8`, add global hotkey `w` for instant web server toggling, and handle startup config loading.
- **CLI & Daemon Runner (`src/index.ts` & `src/daemon.ts`)**: CLI arguments `--web`, `--web-port=<port>`, `--web-daemon`, `--stop-daemon`.

## 3. Quality & Verification Gates
- Clean TypeScript compilation (`npm run build`).
- Unit & integration tests for port scanning, daemon management, and web server view (`npm test`).
- E2E tests generating visual screenshots for Tab 8 and daemon status (`npm run test:e2e`).
- Submodule immutability verification.
