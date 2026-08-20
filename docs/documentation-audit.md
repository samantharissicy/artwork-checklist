# Documentation Verification Audit

**Status: Current** — this report records a deep compatibility audit of every documentation file in `docs/` against the current repository state.

## Scope

- All 49 files tracked under `docs/` (architecture, domain, engineering, persistence, decisions, quality, operations, future, baselines) plus the repository-level `README.md` and `README.pt-BR.md`.
- The codebase it must describe: `js/app.js`, `js/tests.js`, `js/tests/**`, `css/**`, `index.html`, `package.json` (none), and git history up to HEAD.

## Audit Method

- Read every doc and checked its claims against the code with targeted greps and reads (no AI agents were used; all findings verified directly against files).
- Ran `node --check` on every JavaScript file.
- Executed the 378-test browser suite in a headless Chromium via the browser-automation driver against a local static server.
- Re-verified every relative link in every doc plus the two READMEs.
- Removed stale `js/app.js:NNNN` line-number citations from the docs (144 citations in 24 files) — line numbers drift with every edit and the spec prohibits replicating volatile numbers; stable function names were kept and verified instead.
- Repaired encoding damage from an earlier bulk edit (`git checkout -- docs/` + clean UTF-8 re-strip) so no file carries BOM, mojibake, or doubled characters.

## Source-of-Truth Hierarchy (as applied)

1. **Code** (`js/app.js`, `js/tests/**`)
2. **Tests** (`js/tests/**` — 12 layer files, 378 tests)
5. **README.md / README.pt-BR.md**
6. **docs/** tree
7. **baseline.en.md / baseline.pt-BR.md** — historical snapshots of the frozen prototype; never edited

## Verified Current Facts

### Schema and model

| Fact | Value | Verified in |
| --- | --- | --- |
| Current schema version | `4` | `CURRENT_SCHEMA_VERSION = 4` in `js/app.js` |
| Storage key | `artworkChecklist:v${CURRENT_SCHEMA_VERSION}` (template literal) | `js/app.js` `STORAGE_KEY` |
| Legacy storage keys | `["artworkChecklist:v3", "artworkChecklist:v2", "artworkChecklist:v1"]` | `js/app.js` `LEGACY_STORAGE_KEYS` |
| Review statuses | `pending` / `approved` / `rejected` | `REVIEW_STATUSES` in `js/app.js` |
| Sections | 6 (`legal-core`, `ingredients-allergens`, `nutrition-serving`, `storage-cooking`, `claims-certifications`, `packaging-marks-languages`) | `sectionDefinitions` in `js/app.js` |
| Checklist items | 50 (`1a`–`1j`, `2a`–`2e`, `3a`–`3j`, `4a`–`4d`, `5a`–`5l`, `6a`–`6i`) | `sectionDefinitions` in `js/app.js` |
| Item 6I title | "Pantone Colours Match Approved Pack Copy?" | `sectionDefinitions` in `js/app.js` |

### Codebase

| Fact | Value | Verified by |
| --- | --- | --- |
| `js/app.js` size | 9,860 lines | line count |
| Function declarations | 205 `function` declarations (plus ~50 `const` arrow functions) | regex count |
| Random UUID fallback | present (crypto.randomUUID with Date.now()/Math.random fallback) | `js/app.js` |
| `"use strict"` | absent from `js/app.js`; present in `js/tests.js` and all test files | grep |
| Inline `onclick` handlers in `index.html` | 13 | regex count |
| CSS entry point | `css/style.css` with exactly 18 ordered `@import`s; no `@import` anywhere else | grep |
| CSS component files | 14 under `css/components/` | directory listing |
| `!important` in the active CSS tree | exactly one (`.hidden` in `css/utilities/visibility.css`) | regex count |
| Orphan CSS files | 2 (`css/style.legacy.css`, `css/components/artwork-colours.css` — legacy banners) | import graph |
| Browser APIs not used | `FileReader` (only a stale comment), `canvas` (only a DOM id), `ResizeObserver`, `IntersectionObserver`, `CustomEvent`, IndexedDB, fetch, XHR, WebSocket, Web Workers | grep |
| Object URL revocation | on session release, replacement, product/layer deletion, and `beforeunload` → `releaseAllSessionArtworks` | `js/app.js` |

### Tests

| Fact | Value | Verified by |
| --- | --- | --- |
| Registered tests | 378 | runner run |
| Per-file counts | baseline-smoke 3, B1 27, C1 10, C2 10, C3 10, D 10, E1 8, E2 11, F1 7, G 53, G4 120, G5 109 | regex count + runner output |
| Syntax check | all JS files pass `node --check` | node |
| Execution result | **378 passed, 0 failed** | headless Chromium run |

## Issues Found and Corrections Made

### Removed stale line-number citations (24 files, 144 citations)

Every `js/app.js:NNNN` reference was removed across `docs/README.md`, all architecture docs, all persistence docs, domain, engineering, decisions, quality and operations docs. Line numbers in the docs had drifted systematically (~+50 lines; `releaseAllSessionArtworks` moved from ~9740 to ~4997). Function names were kept and verified to exist. Cosmetic artifacts left by the removal (trailing commas, stray periods, double spaces, empty table cells, dangling em-dashes) were repaired file by file.

### Factual corrections applied to docs

| Doc | Correction |
| --- | --- |
| `docs/engineering/tech-stack.md` | App size/function count corrected to ~9,860 lines / 205 `function` declarations |
| `docs/architecture/architecture-overview.md` | Same count correction (was 203) |
| `docs/domain/domain-overview.md` | Review Progress description corrected to the implemented footer (counters + `N% reviewed` / `N% approved`); approval percentage is already shown, not future F1 |
| `docs/domain/review-workflow.md` | `updateProgress` description corrected to the implemented footer format |
| `docs/architecture/rendering-model.md` | `updateProgress` writes corrected to `#progress-total` / `#progress-approved` / `#progress-rejected` / `#progress-pending` / `#progress-review-pct` / `#progress-approval-pct` / `#progress-bar` |
| `docs/quality/manual-regression-guide.md` | Progress check updated to the implemented footer format |
| `docs/engineering/coding-standards.md` | Removed `freshWorkspace()` from the shared self-reset helper list (it is local to `g5-pantone-compliance.test.js`); replaced with `resetArtworkForTest()` |
| `docs/architecture/persistence-and-schema.md` | Removed the stale numeric "Line" column from the migration chain table |
| `docs/persistence/serialization.md` | Removed the empty "Location" column from the function table |

## Test Suite Execution

Run in headless Chromium (patchright driver) against `http://localhost:5500/` (local static server, no file://):

- **Total:** 378 registered tests
- **Passed:** 378
- **Failed:** 0

During the audit, 3 tests failed because they read a `#progress-text` element that no longer exists in the application. The application's current progress UI writes `#progress-total`, `#progress-approved`, `#progress-rejected`, `#progress-pending`, `#progress-review-pct`, `#progress-approval-pct` and `#progress-bar` (`updateProgress` in `js/app.js`). The failing tests were updated to assert the implemented progress footer, and the two F1 (review metrics) placeholders in `js/tests/layers/f1-review-metrics.test.js` were replaced with real metric tests (counters, review % = approved + rejected, approval % = approved only, progress-bar width, all-pending → 0%, fully-approved → 100%, empty checklist guard). The suite now passes 378/378. The one console error during the run is the known, pre-existing G4UX-028 blob: fixture artifact, documented in `docs/quality/manual-regression-guide.md` and `docs/engineering/testing-strategy.md`.

## Links Verified

- 293 relative links checked across all 49 docs plus `README.md` and `README.pt-BR.md` — all resolve. This includes every `docs/README.md` listing.

## Legacy and Future Clarifications

- `baseline.en.md` / `baseline.pt-BR.md` intentionally contain pre-schema-v4 numbers (e.g. "49 items", `#progress-text`, `toggleCheck`) — they are frozen snapshots of the A0 prototype and are not updated by this audit.
- `pantoneColors`, `style.legacy.css`, `artwork-colours.css`, `renderPantoneColours` and the legacy Pantone domain functions are retained compatibility code; docs consistently mark them as legacy and point to `docs/persistence/legacy-compatibility.md` and ADR-009.

## Remaining Uncertainties

- The exact wording of future-layer plans (H1–H3, I1, J1–J3, K3–K4, L1, M) is defined by the external development plan and could not be cross-checked against a repository copy. Docs that reference future layers state them as plans, not commitments.
- Browser compatibility is documented as assumptions verified by usage in code, not by a formal matrix.

## Final Compatibility Assessment

- **Documentation is compatible with the current codebase** on every claim that this audit could verify statically: schema, sections/items, storage keys, function names, CSS architecture, API usage, and all 293 links.
- The documentation corrections made in this audit remove the last known inaccuracies (stale line numbers, progress-format descriptions, helper list, function counts).
- The automated suite passes in full: **378/378** in headless Chromium. The three progress tests that targeted the removed `#progress-text` element were updated to assert the implemented progress footer, and the F1 (review metrics) layer now has real tests instead of placeholders.

**Gate: PASSED** — documentation is accurate, cross-linked (293/293), free of stale references, and the automated suite is fully green (378/378).

## Related Documents

- [docs/README.md](README.md) — documentation index and source-of-truth hierarchy.
- [docs/engineering/testing-strategy.md](engineering/testing-strategy.md) — how the suite is built and run.
- [docs/domain/review-workflow.md](domain/review-workflow.md) — review progress behaviour (corrected).
- [docs/architecture/rendering-model.md](architecture/rendering-model.md) — renderer/`updateProgress` responsibilities (corrected).