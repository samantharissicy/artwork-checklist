# COMPLETION REPORT — Layer G5: Pantone Pack-Copy Compliance Realignment

**Date:** 2026-08-19
**Status:** Complete
**Commit context:** work aligned on top of commit `48ff58c`

## 1. Requirement change

The Layer G5 deliverable changed from "Artwork Colour Specifications (Pantone)" (a standalone colour-registry UI) to a checklist-based review workflow:

- The canonical checklist item **6I — "Pantone Colours Match Approved Pack Copy?"** lives in section 6 (Packaging, Marks & Languages).
- Item 6I follows the standard review workflow: Pending / Approved / Rejected, required comment on rejection, per-layer artwork pins, Save Check / Open Check persistence.
- The canonical schema was bumped **v3 → v4** with a non-destructive migration chain.
- Legacy `pantoneColors` metadata is preserved for data compatibility but no longer drives the review.

## 2. Documentation decision (roadmap)

`roadmap.md` and `prompt-mestre.md` were removed from the repository in an earlier commit (the roadmap is maintained externally). Per the requirement, those documents were **not recreated**. The historical note is reflected in both README files and the roadmap table is maintained there.

## 3. What was implemented (js/app.js)

- `CURRENT_SCHEMA_VERSION = 4`; `STORAGE_KEY = "artworkChecklist:v4"`; `LEGACY_STORAGE_KEYS` includes v3/v2/v1.
- Canonical item 6I in `createInitialItems()` and in the section 6 definition.
- New helper `addPantoneComplianceItem(items)` — adds the canonical 6I item (Pending) to any item collection.
- `migrateStateV3ToV4` — per-product migration adding 6I, preserving `pantoneColors`, pins and all review state.
- `migrateImportData` — v3 branch uses `addPantoneComplianceItem` (import payloads have no `products` wrapper, so the state migrator cannot be applied to them); v2 branch converts to schema v3, adds 6I, then schema v4; v1 recurses v1→v2→v3→v4.
- `renderAppState` no longer calls the Pantone colour renderer; the Colour Specification editor DOM was removed from `index.html` and its CSS import removed.
- Legacy banner texts updated (DOMAIN → LEGACY) in `css/components/artwork-colours.css`.

## 4. Tests

| Suite | Before | After |
| ----- | ------ | ----- |
| Baseline / B1 / C1 / C2 / G-multi | 357 total | 357 → removed 28 G5 + 5 G4UX → 324 |
| G4A / G4B / G4UX | 357 | 324 |
| G5 (regenerated) | 357 | 47 G5 + 13 G5P + 49 G5R = 109 |
| **Total** | **357** | **373 (373/373 passing)** |

- `js/tests/layers/g5-pantone-compliance.test.js` was regenerated from the G5 source, removing 28 tests that asserted the retired colour-specification behaviour and adding 49 G5R tests for the realigned workflow.
- Removed: G5-025, G5-028, G5-032, G5-051..G5-062, G5P-006..G5P-018, G4UX-018, G4UX-042..G4UX-045.
- Count updates 49 → 50 checklist items across baseline-smoke, b1-domain, c1-review-status, c2-comments, g-multiple-products.
- Schema assertions updated to `CURRENT_SCHEMA_VERSION` (G4A layer, G4UX, G5-045).
- Fixes applied during verification: G5R-032/033 fixture (File-like metadata via `createTestArtworkMetadata`), G5R-035 (`freshWorkspace`), G5R-049 (serialize/rehydrate roundtrip instead of deleting the storage key).
- Manual driver `qa-g5r-manual.mjs` covering steps §60–§66: **18/18 checks pass**, 0 console errors.

## 5. Known non-defects

- The only console error observed during the automated suite is `Not allowed to load local resource: blob:http://localhost/g4ux-front`, an **artifact of the G4UX-028 test fixture** (fake blob URLs rendered as image sources). It is pre-existing, unrelated to the G5 realignment, and does not indicate an application defect.

## 6. Out of scope (not implemented, by requirement)

- Layer H (report/PDF), backend, automatic colour reading/detection, eyedropper, RGB/HEX/delta-E conversion, OCR, pack-copy upload, sign-off.

## 7. Acceptance gate

Per the defined gate criteria:

1. ✅ 6I exists in section 6 as a checklist item.
2. ✅ Fresh workspace: 6I Pending by default.
3. ✅ 6I supports Approve / Reject (with required comment) / Pending and pins per artwork layer.
4. ✅ Review metrics account for 6I.
5. ✅ Schema v4; `CURRENT_SCHEMA_VERSION = 4`; legacy keys migrate v1/v2/v3 → v4.
6. ✅ Migration is non-destructive: v3 state gains 6I Pending; existing reviews (statuses, comments, pins, layers, products) load unchanged.
7. ✅ `pantoneColors` survives reload, export/import and duplication; never influences 6I status; continues to serialize, validate, rehydrate and export.
8. ✅ Colour Specification UI removed; legacy banner displayed instead.
9. ✅ Save Check / Open Check work with v4 files and legacy v1/v2/v3 files.
10. ✅ Full regression: 373/373 automated tests pass; 18/18 manual checks pass; no real console errors.

**Gate: `"G5 requirement realignment complete."`**