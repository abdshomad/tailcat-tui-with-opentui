# Simulation Scenario 07: Key Management & WireGuard ACL Simulation

Restricts server access to approved client public keys (`--allow=nodekey:...`) and validates rejection of unauthorized handshakes.

---

## Step-by-Step Visual Walkthrough

### Step 1: Generate Client Identity Keypair

![Step 1: Generate Client Identity Keypair](../../screenshots/simulation/07-key-management-acl/generate-client-key/01-generate-client-key.webp)

---

### Step 2: Start Server with Allowed ACL

![Step 2: Start Server with Allowed ACL](../../screenshots/simulation/07-key-management-acl/acl-protected-server/02-acl-protected-server.webp)

---

### Step 3: Authorized Client Dials & Authenticates

![Step 3: Authorized Client Dials & Authenticates](../../screenshots/simulation/07-key-management-acl/authorized-connect-success/03-authorized-connect-success.webp)

---

### Step 4: Unauthorized Client Attempt Blocked

![Step 4: Unauthorized Client Attempt Blocked](../../screenshots/simulation/07-key-management-acl/unauthorized-access-blocked/04-unauthorized-access-blocked.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 07
```
