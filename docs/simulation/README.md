# Tailcat Multi-Node Network Simulation Visual Guide

This documentation provides comprehensive step-by-step visual walkthroughs for all 13 networking scenarios, simulated across isolated multi-node Docker containers.

---

## Scenario Index

| # | Scenario Name | Documentation | Description |
| :---: | :--- | :---: | :--- |
| **01** | Pipe & Raw Stream Simulation | [Pipe & Raw Stream Simulation](./01-pipe-stream.md) | Simulates raw bidirectional stream transmission between node-server listener and node-client payload sender over isolated WireGuard/DERP channel. |
| **02** | Port Forwarding (8080) Simulation | [Port Forwarding (8080) Simulation](./02-port-forward.md) | Exposes local HTTP service on port 8080 through the tunnel, dialed directly by remote client over userspace netstack. |
| **03** | Auth-Free SSH Server & Remote Exec Simulation | [Auth-Free SSH Server & Remote Exec Simulation](./03-auth-free-ssh.md) | Spawns userspace auth-free SSH daemon without inbound firewall ports and runs remote commands over WireGuard tunnel. |
| **04** | Files, Drop Box & SFTP Transfers Simulation | [Files, Drop Box & SFTP Transfers Simulation](./04-file-sftp.md) | Simulates write-only drop box receiver (`tailcat recv /inbox`) and SFTP directory server (`tailcat serve files`) with `tailcat cp` and `tailcat ls`. |
| **05** | Network Diagnostics & Ping Simulation | [Network Diagnostics & Ping Simulation](./05-ping-diagnostics.md) | Probes peer latency and validates DERP relay paths vs direct peer-to-peer UDP punch. |
| **06** | SOCKS5 Userspace Proxy Runner Simulation | [SOCKS5 Userspace Proxy Runner Simulation](./06-socks5-proxy.md) | Routes arbitrary CLI commands (like curl) through a transient userspace SOCKS5 proxy tunnel. |
| **07** | Key Management & WireGuard ACL Simulation | [Key Management & WireGuard ACL Simulation](./07-key-management-acl.md) | Restricts server access to approved client public keys (`--allow=nodekey:...`) and validates rejection of unauthorized handshakes. |
| **08** | Token Parse & Address Resolution Simulation | [Token Parse & Address Resolution Simulation](./08-token-parse-resolve.md) | Parses connection token contents to JSON and resolves short tokens into self-contained address tokens with embedded DERP relay node metadata. |
| **09** | Multi-Hop Chained Tunnels & Transit Routing Simulation | [Multi-Hop Chained Tunnels & Transit Routing Simulation](./09-multi-hop-tunnel.md) | Chains multiple WireGuard user-space tunnels across intermediate nodes (Node A -> Node B -> Node C) to traverse segmented private enclaves. |
| **10** | Daemon Lifecycle, Crash Resilience & Auto-Recovery Simulation | [Daemon Lifecycle, Crash Resilience & Auto-Recovery Simulation](./10-daemon-lifecycle-auto-reconnect.md) | Validates daemon PID tracking, unexpected SIGKILL crash detection, stale PID file cleanup, and automated state restoration. |
| **11** | ACL Tag Security & Malformed Token Denial Simulation | [ACL Tag Security & Malformed Token Denial Simulation](./11-acl-denial-security.md) | Validates that strict WireGuard ACL policies (--allow=nodekey:...) block unauthorized peers and corrupted tokens are rejected. |
| **12** | High-Concurrency Multi-Stream & Metrics Simulation | [High-Concurrency Multi-Stream & Metrics Simulation](./12-high-concurrency-stream.md) | Spawns multiple parallel worker streams over concurrent tunnels to benchmark throughput, zero packet loss, and live telemetry tracking. |
| **13** | Web Server Headless Mode & Remote API Control Simulation | [Web Server Headless Mode & Remote API Control Simulation](./13-web-server-headless-api.md) | Controls Tailcat services headlessly over HTTP REST and telemetry endpoints without requiring interactive terminal TUI. |

---

## Running All Simulations
To execute all simulation scenarios in Docker Compose:
```bash
npm run test:simulation
# Or via CLI runner:
./scripts/simulate.sh --all
```
