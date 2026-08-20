# Quality Strategy

**Status: Current**

## Purpose

Explain the project's quality philosophy and the verification practices in place. This is **not** a certification claim — no formal quality certification exists for this project.

## Quality Philosophy

- **Incremental, specification-driven development**: each layer must leave the system functional and pass its acceptance criteria ([development-workflow.md](../engineering/development-workflow.md)).
- **Preservation over rewrite** (principle P-002): features once shipped keep working; regression tests grow with each layer and UX checkpoint (312 → 357 → 373 → 378 → 436 → 449).
- **Data integrity**: validation and migration before any mutation; corrupt data never crashes the app.

## Verification Practices

| Practice | Where | Details |
| --- | --- | --- |
| Automated browser tests | `js/tests/**` — 449 tests | Snapshot/run/restore; run via `await runArtworkTests()` or `?run-tests=1` ([testing-strategy.md](../engineering/testing-strategy.md)) |
| Manual regression | [manual-regression-guide.md](manual-regression-guide.md) | Pre-PR checklist |
| Static syntax checks | `node --check` | Applied to `js/app.js` and test files |
| Browser console checks | DevTools | Suite must produce zero real console errors (one known fixture artifact: `blob:` warning from `G4UX-028` fake URLs) |
| Schema validation | `validateState` / `validateSerializedProduct` | Structural checks before use and import |
| Migration tests | `D`, `G4`, `G5R` layers | v1→v4 storage and file migration |
| Incremental changes | Git workflow | Feature branches, conventional commits, PR review |
| Git diff inspection | before merge | Confirm only intended files changed; no behaviour drift |
| Acceptance criteria | per layer | Project-wide criteria: app opens, no console errors, no regressions, requirements met, tests pass, no future features leaked |

## Defect Handling

- Bugs found out of scope are logged as `OBSERVED ISSUE` (severity/location/description/recommended action), not silently fixed ([development-workflow.md](../engineering/development-workflow.md)).
- Known technical debt is documented in [performance-considerations.md](performance-considerations.md), [accessibility-status.md](accessibility-status.md) and [legacy-compatibility.md](../persistence/legacy-compatibility.md).

## Known Non-Certifications

- No accessibility certification (see [accessibility-status.md](accessibility-status.md)).
- No security certification (see [security-considerations.md](security-considerations.md)).
- No performance benchmarks (see [performance-considerations.md](performance-considerations.md)).
- No CI/CD pipeline exists; verification is manual + test suite + review.

## Related Documents

- [engineering/testing-strategy.md](../engineering/testing-strategy.md)
- [engineering/development-workflow.md](../engineering/development-workflow.md)
- [quality/manual-regression-guide.md](manual-regression-guide.md)
