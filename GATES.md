# Quality Gates

## Gate 1: Typecheck & Build
- CHECK: `npm run build`
- EXPECT: 0 TypeScript errors, clean compilation.

## Gate 2: Submodule Immutability
- CHECK: `git status --porcelain tailcat opentui cordis autonomous-coding-agents`
- EXPECT: Empty output (submodules 100% clean and unmodified).

## Gate 3: Unit & Service Tests
- CHECK: `npm test`
- EXPECT: All unit, view, port-scanner, and daemon-manager tests pass green.

## Gate 4: E2E Visual Screenshot Suite
- CHECK: `npm run test:e2e`
- EXPECT: All TUI & Web module steps execute and save valid `.webp` images to `screenshots/{tui,web}/{module}/{feature}/{step-number}-{slug}.webp`.
