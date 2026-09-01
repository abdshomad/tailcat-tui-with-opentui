# PRD: Tailcat TUI with OpenTUI & Cordis Micro-Kernel

## 1. Goal
Provide a comprehensive, interactive Terminal User Interface (TUI) powered by OpenTUI and an embedded web dashboard orchestrated via a [Cordis](https://github.com/cordiverse/cordis) micro-kernel plugin architecture for all interaction modes in `tailcat/README.md`, verified through a 13-scenario containerized multi-node simulation suite.

## 2. Core Capabilities
- **Pipe / Stream (Tab 1)**: Listen on stdin/stdout, connect client with token, live interactive stream I/O.
- **Port Forwarding (Tab 2)**: Serve local ports (`tailcat serve 8080`, `serve all`), connect client to remote port.
- **Auth-Free SSH (Tab 3)**: Serve auth-free SSH (`tailcat serve no-auth-ssh`), client terminal session / command exec.
- **Files & SFTP (Tab 4)**: Drop box receiver (`tailcat recv <dir>`), file server (`serve files`), send (`cp`), remote directory explorer (`ls -l`).
- **Network & Diagnostics (Tab 5)**: Live ping with `--until-direct`, SOCKS5 proxy command runner, exit node server, token parser & DERP resolver.
- **Key & Relay Management (Tab 6)**: Ephemeral/saved keys (`genkey`), client identity keys, `--allow` ACL rules, custom DERP configuration.
- **Active Sessions & Process Supervisor (Tab 7)**: Background tunnel supervisor, process logs, active connection inspector, kill/restart controls (`k`).
- **Settings & Plugin Manager (Tab 8)**: Dynamic Cordis plugin registry (`webServer`, `fileLogger`, `autoPortScanner`, `metricsCollector`), runtime enable/dispose lifecycles (`fork.dispose()`), TCP port scanner (`3840+`), config persistence (`~/.config/tailcat-tui/config.json`), and background daemon supervisor.

## 3. Headless REST API & Telemetry Endpoints
- `GET /api/status`: Online/daemon state, port, binary resolver info, enabled plugin array.
- `GET /api/metrics`: Live peer metrics, ping count, average latency.
- `GET /api/sessions`: List of active supervised tunnel sessions.
- `POST /api/action`: Execute actions headlessly over HTTP.

## 4. Multi-Node Network Simulation Suite (13 Scenarios)
1. **01-pipe-stream**: Stdin/stdout raw stream pipe over DERP/WireGuard.
2. **02-port-forward**: Local TCP port 8080 forwarder and remote dialer.
3. **03-auth-free-ssh**: Userspace auth-free SSH daemon & remote command exec.
4. **04-file-sftp**: Drop box inbox upload and SFTP directory browsing (`tailcat ls`).
5. **05-ping-diagnostics**: RTT latency measurement and direct UDP path upgrade probing.
6. **06-socks5-proxy**: Transparent CLI execution over userspace SOCKS5 proxy.
7. **07-key-management-acl**: WireGuard nodekey identity generation and `--allow` ACLs.
8. **08-token-parse-resolve**: JSON token decoding and embedded DERP address resolution.
9. **09-multi-hop-tunnel**: Multi-node transit routing (Node A $\rightarrow$ Node B $\rightarrow$ Node C).
10. **10-daemon-lifecycle-auto-reconnect**: Daemon crash detection, stale PID cleanup & restoration.
11. **11-acl-denial-security**: Rejection of unauthorized rogue keys & malformed tokens.
12. **12-high-concurrency-stream**: High-concurrency parallel streams & data integrity.
13. **13-web-server-headless-api**: Headless HTTP REST control & telemetry probing.

## 5. Architecture & Quality Gates
- **Micro-Kernel**: Cordis Context hosting `TailcatService` and modular dynamic plugins.
- **UI Layer**: OpenTUI terminal interface + Cordis Web Dashboard.
- **Quality Gates**:
  - **Gate 1**: `npm run build` (0 TypeScript compiler errors).
  - **Gate 2**: `git status --porcelain submodules` (100% submodule immutability).
  - **Gate 3**: `npm test` (Unit & Docker simulation suites green).
  - **Gate 4**: `npm run test:screenshots` (Automated `.webp` visual documentation generated).
