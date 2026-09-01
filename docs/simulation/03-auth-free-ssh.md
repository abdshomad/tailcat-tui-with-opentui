# Simulation Scenario 03: Auth-Free SSH Server & Remote Exec Simulation

Spawns userspace auth-free SSH daemon without inbound firewall ports and runs remote commands over WireGuard tunnel.

---

## Step-by-Step Visual Walkthrough

### Step 1: Launch Auth-Free SSH Daemon

![Step 1: Launch Auth-Free SSH Daemon](../../screenshots/simulation/03-auth-free-ssh/start-ssh-server/01-start-ssh-server.webp)

---

### Step 2: Client Executes Remote Command

![Step 2: Client Executes Remote Command](../../screenshots/simulation/03-auth-free-ssh/client-exec-command/02-client-exec-command.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 03
```
