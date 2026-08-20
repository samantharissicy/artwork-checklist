# Testing Strategy

**Status: Current**

## Purpose

Document the browser-based test system exactly as it exists: architecture, loader, framework, helpers, runner, coverage, and how to run it.

## System Overview

A custom, dependency-free test framework embedded in the application. No test runners, no npm, no CI.

```text
js/tests.js                       → loader entry point
js/tests/core/framework.js        → test registration + assertions
js/tests/core/helpers.js          → fixtures, snapshots, DOM lookups
js/tests/core/runner.js           → snapshot/run/restore + console reporting
js/tests/layers/*.test.js         → 14 test modules
```

## Loader (`js/tests.js`)

- Loaded from `index.html` after `js/app.js` (`<script src="js/tests.js">`).
- `loadTestScript(relativePath)` injects `<script>` tags **sequentially** (`async = false`), resolving paths against `document.currentScript.src`.
- Order (`TEST_FILES`): `core/framework.js` → `core/helpers.js` → 14 test files (B1 → C1 → C2 → C3 → D → E1 → E2 → F1 → G → G4 → G5 → H → section-summary UX → **baseline-smoke last**) → `core/runner.js`.
- Exposes `window.artworkTestsReady` (promise), `window.runArtworkTests`, `window.getArtworkTestResults`.
- `?run-tests=1` executes automatically and writes `data-test-status/total/passed/failed` on `<html>` for repeatable browser automation.

## Framework (`js/tests/core/framework.js`)

| API | Behaviour |
| --- | --- |
| `test(name, fn)` | Registers a test; `fn` may be async (awaited by the runner) |
| `assert(condition, message)` | Throws on failure |
| `assertEqual(a, b, msg)` | Strict equality (`!==`) |
| `assertNotEqual(a, b, msg)` | Negation |
| `assertDeepEqual(a, b, msg)` | Compares via `JSON.stringify` |
| `assertExists(v, msg)` | Fails on `null`/`undefined` |
| `assertClose(a, b, tolerance = 0.0001)` | Float delta |

Exported as `window.ArtworkTests` (`{ RESULTS, TESTS, test, assert, ... }`).

## Helpers (`js/tests/core/helpers.js`)

| Helper | Purpose |
| --- | --- |
| `clonePin(pin)` | Pin fixture cloning |
| `createSnapshot()` / `restoreSnapshot(snapshot)` | Capture/restore serialized state, storage, open comment ids, title-edit target, zoom and sign-off/signature modal state; restore re-renders via `renderChecklist`/`renderProductTabs`/`renderAppState` |
| `createTestArtworkMetadata(name)` | Canonical artwork metadata fixture (`image/png`, 1200×1600) |
| `resetArtworkForTest()` | Clears active layer artwork + pins |
| `resetItem1A()` | Resets item 1a to canonical state |
| `resetWorkspaceForMultiProductTest()` | Fresh single-product workspace (used by G/G4/G5) |
| DOM lookups | `getItemElement`, `getReviewButton`, `getStatusLabel`, `getCommentPanel`, `getTitleEditInput`, `getProductTab`, … |

## Runner (`js/tests/core/runner.js`)

1. Clears previous results.
2. **Snapshot before the suite** (`createSnapshot`); abort with empty summary if it throws.
3. Runs every registered test in order; awaits async tests; records `{name, passed, error}`.
4. **Restores after the suite** (`restoreSnapshot` in try/catch; restore failure is logged but does not change results).
5. Reports `PASS`/`FAIL` lines and a `passed/total` summary in the console (no DOM output).
6. Returns `{ total, passed, failed, results }`.

Note: the runner snapshots once before and restores once after the whole suite; tests reset their own state between tests.

## Layer Modules and Coverage

| File | Layer | Tests | Covers |
| --- | --- | --- | --- |
| `baseline-smoke.test.js` | A0 baseline | 3 | DOM smoke: 50 `.check-item`, 6 `.section-btn`, zoom wrapper |
| `b1-domain.test.js` | B1 | 27 | appState structure, schema version, item model, product model |
| `c1-review-status.test.js` | C1 | 10 | tri-state transitions, exclusivity, progress |
| `c2-comments.test.js` | C2 | 10 | comments, persistence, rejection validation |
| `c3-copy-corrections.test.js` | C3 | 10 | original/current title, edit flows, restore |
| `d-persistence.test.js` | D1–D4 | 10 | serialization, storage corruption, export, import, migration |
| `e1-pin-geometry.test.js` | E1 | 8 | normalized pins, zoom independence, legacy pixels |
| `e2-artwork-identity.test.js` | E2 | 11 | identity comparison, replacement confirmation, pin clearing |
| `f1-review-metrics.test.js` | F1 | 7 | counters (approved/rejected/pending/total), review % (approved + rejected), approval % (approved only), progress-bar width, all-pending → 0%, fully-approved → 100%, empty-checklist guard |
| `g-multiple-products.test.js` | G1–G3 + G2UX | 53 | product domain, tabs, context metadata, product context menu UX |
| `g4-multi-layer-artwork.test.js` | G4A/G4B/G4UX | 120 | layer domain, layer flows, layer tab UX, v2→v3 migration |
| `g5-pantone-compliance.test.js` | G5/G5P/G5R | 109 | legacy `pantoneColors` compatibility (G5), Pantone limits/IDs (G5P), **canonical 6I workflow + schema v4 + v3→v4 migration (G5R)** |
| `h-cross-functional-signoff.test.js` | H1–H4 | 58 | reviewer identity, independent decisions, rejection comments, revision reset, overall derivation, final blockers, Pointer Event signatures, schema v5, v4→v5, storage/export/import/duplication and UI |
| `ux-section-status-summary.test.js` | Checklist UX | 13 | per-section metrics, compact chips, zero suppression, accessible labels, live review updates, collapsed state and product switching |

**Total: 449 tests.**

Test ID conventions: `UXS-001…013` (section status summaries), `G5R-001…049` (current Pantone compliance), `G5-…` (legacy registry compatibility), `G5P-…` (Pantone limits), `G4A/G4B/G4UX-…`, `G2UX-…`, and layer prefixes (`D2 …`, `E1 …`, `B1 …`) for earlier layers. Baseline tests have no IDs.

> **Time-sensitive metric:** the exact count (449) changes as layers are implemented (history: 312 → 357 → 373 → 378 → 436 → 449). Treat it as a checkpoint, not a constant. The authoritative count at any time is the registration count in `js/tests/layers/`.

## How to Run

```text
1. Serve the repository:  python -m http.server 5500
2. Open  http://localhost:5500/index.html
3. DevTools Console:
       await runArtworkTests();
4. Read the summary line: "N/N tests passed"
```

Automation-friendly alternative: open `http://localhost:5500/?run-tests=1`; the completion toast reports `N/N automated tests passed` and the result is exposed through `<html data-test-status="passed">`.

The suite snapshots application state before running and restores it afterwards, so it is safe to run against a working session.

## Known Artifacts

- `F1` tests cover the review metrics (counters, review/approval percentages, progress bar).
- `UXS` tests cover the per-section projection of those metrics and the collapsed-header interaction.
- Tests that intentionally exercise error paths log `console.error` from application functions (e.g. corrupted-JSON tests) — expected noise.
- `G4UX-028` uses fake `blob:http://localhost/…` session URLs to assert layer-scoped session revocation; the browser logs `Not allowed to load local resource: blob:…` for these fixture URLs — a known, pre-existing fixture artifact, not an application defect.

## Related Documents

- [quality/quality-strategy.md](../quality/quality-strategy.md)
- [quality/manual-regression-guide.md](../quality/manual-regression-guide.md)
- [operations/local-development.md](../operations/local-development.md)
