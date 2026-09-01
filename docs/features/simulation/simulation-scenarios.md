# Multi-Node Network Simulation Suite

- **13 Network Scenarios**: Complete test coverage across isolated Docker containers (`tailcat-sim-server`, `tailcat-sim-client`, `tailcat-sim-derper`).
- **Transit Routing (`scripts/scenarios/09-multi-hop-tunnel.sh`)**: Multi-hop chained tunnels traversing Node A $\rightarrow$ Node B $\rightarrow$ Node C.
- **Daemon Lifecycle (`scripts/scenarios/10-daemon-lifecycle-auto-reconnect.sh`)**: Stale PID detection, SIGKILL crash resilience, and supervisor restoration.
- **Security & ACL (`scripts/scenarios/11-acl-denial-security.sh`)**: Unauthorized rogue identity rejection and malformed base32 token denial.
- **High Concurrency (`scripts/scenarios/12-high-concurrency-stream.sh`)**: Multiplexed stream transfers with 0 packet loss and data integrity.
- **Headless REST API (`scripts/scenarios/13-web-server-headless-api.sh`)**: Remote status, metrics, and session inspection via HTTP JSON endpoints.
- **CLI Runner & E2E Proofs**: Orchestrated via `scripts/simulate.sh` and documented with terminal frames in `docs/simulation/` and `screenshots/simulation/`.
