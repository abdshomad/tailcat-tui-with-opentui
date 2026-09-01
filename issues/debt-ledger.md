# Technical Debt Ledger

| Date | ID | Component | Description | Resolution / Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-09-02 | DEBT-001 | DNS Resolution | Host DNS stub `127.0.0.53` fails on public hostnames; handled via `env.aiserver/git-proxy.mjs` wrapper | Resolved via local DNS proxy helper |
