# Simulation Scenario 08: Token Parse & Address Resolution Simulation

Parses connection token contents to JSON and resolves short tokens into self-contained address tokens with embedded DERP relay node metadata.

> **UI Mapping**: OpenTUI **Tab 5: Diagnostics** (Token Parser) | Cordis Web Dashboard **`/?tab=diag`**  
> **Interactive Archify Visualizer**: [`docs/features/core/diagrams/simulation-arch.html`](../features/core/diagrams/simulation-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/simulation-arch.html)

```mermaid
sequenceDiagram
    autonumber
    participant CLI as CLI / Operator
    participant Parser as tailcat parse
    participant Resolver as tailcat resolve
    participant Token as Connection Token

    CLI->>Token: Provide raw base64 connection token
    CLI->>Parser: Execute 'tailcat parse <token>'
    Parser->>CLI: Output JSON (ServerPublic, ServerDiscoPublic, RegionID: 302)
    
    CLI->>Resolver: Execute 'tailcat resolve <token>'
    Resolver->>Resolver: Query DERP Map for Region 302 IP & Host
    Resolver->>CLI: Return self-contained Address Token with embedded DERP metadata
```

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
