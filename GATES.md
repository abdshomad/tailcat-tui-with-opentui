# Quality Gates

> Complete test cases and verification specifications: **[docs/testing.md](docs/testing.md)**.

## Gate 1: Typecheck & Build
- CHECK: `npm run build`
- EXPECT: 0 TypeScript compilation errors.

## Gate 2: Submodule Immutability
- CHECK: `git status --porcelain tailcat opentui cordis autonomous-coding-agents`
- EXPECT: Empty output (submodules 100% clean and unmodified).

## Gate 3: Unit, Service & Multi-Node Simulation Tests
- CHECK: `npm test` (or `npm run test:simulation`)
- EXPECT: All 22 in-process unit/service tests and all 13 multi-node Docker simulation scenarios pass green with 0 failures.

## Gate 4: E2E Visual Screenshot Suite & Docs Generator
- CHECK: `npm run test:screenshots`
- EXPECT: All TUI, Web, and Simulation scenario steps execute cleanly and save valid `.webp` images to `screenshots/{tui,web,simulation}/` with auto-synced markdown visual guides.
