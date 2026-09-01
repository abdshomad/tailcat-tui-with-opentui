# PRD: Tailcat TUI with OpenTUI

## 1. Goal
Provide a comprehensive, interactive Terminal User Interface (TUI) powered by OpenTUI and orchestrated via a Cordis micro-kernel plugin architecture for all interaction modes in `tailcat/README.md`.

## 2. Core Capabilities
- **Pipe / Stream (Tab 1)**: Listen on stdin/stdout, connect client with token, live interactive stream I/O.
- **Port Forwarding (Tab 2)**: Serve local ports (`tailcat serve 8080`, `serve all`), connect client to remote port.
- **Auth-Free SSH (Tab 3)**: Serve auth-free SSH (`tailcat serve no-auth-ssh`), client terminal session / command exec.
- **Files & SFTP (Tab 4)**: Drop box receiver (`tailcat recv <dir>`), file server (`serve files`), send (`cp`), remote directory explorer (`ls -l`).
- **Network & Diagnostics (Tab 5)**: Live ping with `--until-direct`, SOCKS5 proxy command runner, exit node server, token parser & DERP resolver.
- **Key & Relay Management (Tab 6)**: Ephemeral/saved keys (`genkey`), client identity keys, `--allow` ACL rules, custom DERP configuration.
- **Session & Process Manager**: Background tunnel supervisor, process logs, active connection inspector, kill/restart controls.

## 3. Architecture
- **Micro-Kernel**: Cordis Context hosting `TailcatService` (sub-process supervisor, stream multiplexer, token extractor).
- **UI Layer**: OpenTUI terminal interface plugin consuming `TailcatService`, extensible for future Web plugins.
- **Binary Resolver**: Auto-detects `tailcat` in `$PATH`, `bin/tailcat`, or automated build from `tailcat/`.
- **Submodule Isolation**: Zero modifications to `tailcat`, `opentui`, `cordis`, `autonomous-coding-agents`.
