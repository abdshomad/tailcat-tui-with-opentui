# Simulation Scenario 08: Token Parse & Address Resolution Simulation

Parses connection token contents to JSON and resolves short tokens into self-contained address tokens with embedded DERP relay node metadata.

---

## Step-by-Step Visual Walkthrough

### Step 1: Parse Token to JSON

![Step 1: Parse Token to JSON](../../screenshots/simulation/08-token-parse-resolve/parse-connection-token/01-parse-connection-token.webp)

---

### Step 2: Resolve Token with Embedded Relay Metadata

![Step 2: Resolve Token with Embedded Relay Metadata](../../screenshots/simulation/08-token-parse-resolve/resolve-embedded-relay/02-resolve-embedded-relay.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 08
```
