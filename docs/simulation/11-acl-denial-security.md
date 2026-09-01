# Simulation Scenario 11: ACL Tag Security & Malformed Token Denial Simulation

Validates that strict WireGuard ACL policies (--allow=nodekey:...) block unauthorized peers and corrupted tokens are rejected.

---

## Step-by-Step Visual Walkthrough

### Step 1: Strict Server ACL Configuration

![Step 1: Strict Server ACL Configuration](../../screenshots/simulation/11-acl-denial-security/server-acl-allow-key/01-server-acl-allow-key.webp)

---

### Step 2: Authorized Client Connection

![Step 2: Authorized Client Connection](../../screenshots/simulation/11-acl-denial-security/client-authorized-dial/02-client-authorized-dial.webp)

---

### Step 3: Rogue Identity & Corrupted Token Blocked

![Step 3: Rogue Identity & Corrupted Token Blocked](../../screenshots/simulation/11-acl-denial-security/rogue-client-handshake-blocked/03-rogue-client-handshake-blocked.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 11
```
