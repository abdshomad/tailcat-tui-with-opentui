# Simulation Scenario 06: SOCKS5 Userspace Proxy Runner Simulation

Routes arbitrary CLI commands (like curl) through a transient userspace SOCKS5 proxy tunnel.

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Target HTTP Endpoint

![Step 1: Start Target HTTP Endpoint](../../screenshots/simulation/06-socks5-proxy/socks-service-listen/01-socks-service-listen.webp)

---

### Step 2: Route Curl through SOCKS5 Proxy

![Step 2: Route Curl through SOCKS5 Proxy](../../screenshots/simulation/06-socks5-proxy/socks-curl-request/02-socks-curl-request.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 06
```
