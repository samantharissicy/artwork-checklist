# Roadmap Technical Notes

**Status: Future / Not Implemented** (except where marked Current)

## Purpose

Technical dependencies between planned roadmap layers. The external roadmap is the scheduling authority; this file notes *engineering* coupling, not dates. Implemented layers are listed for completeness.

## Layer Status Summary (current)

| Layer | Status | Notes |
| --- | --- | --- |
| A0 baseline | ✅ Current | `baseline.en.md` / `baseline.pt-BR.md` snapshots |
| B1 state foundation | ✅ Current | `appState` single source of truth |
| C1/C2/C3 review/comments/copy | ✅ Current | tri-state, comments, copy corrections |
| D1–D4 persistence/export/import | ✅ Current | schema v1–v4 chain |
| E1/E2 pins/identity | ✅ Current | normalized pins, replacement safeguards |
| F1 review metrics | 📋 Partial | progress bar only; per-status counters + approval % pending |
| G1–G5 products/layers/Pantone | ✅ Current | multi-product, multi-layer, 6I compliance |
| H1–H4 sign-off | 📋 Planned | reviewer identity, department sign-off, signature, final validation |
| I1–I2 high-res/responsive | 📋 Planned | storage strategy, viewports/touch |
| J1–J3 report/PDF | 📋 Planned | report model, print view, PDF |
| K1–K4 UX/a11y/touch/regression | 📋 Planned | confirmation/empty states, accessibility, touch, regression hardening |
| L1 module separation | 📋 Planned | split `js/app.js` into modules |
| M1–M4 backend/auth/revisions/audit | ⏳ Future | conditional on real usage |

## Technical Dependencies Between Planned Layers

| Planned work | Depends on | Why |
| --- | --- | --- |
| **H (sign-off)** | Current domain validation (`validateItemState`, `validateActiveProduct`), current `reviewer`/`signature` fields in the model | Sign-off gates on item validity; fields already round-trip |
| **J1 report model** | A report must consume **state**, not the DOM (`buildReportData(product)`) | Rendering model is projection-based ([rendering-model.md](../architecture/rendering-model.md)); scraping the DOM would violate ADR-002 |
| **J2 print view** | CSS `@media print` (none exists today — [css-architecture.md](../architecture/css-architecture.md)) | New print stylesheet layer |
| **J3 PDF** | J1/J2 | Print-first, libraries only if proven necessary |
| **K2 accessibility** | Keyboard paths for sections, dialog focus trap, `aria-live` toast | Audit in [accessibility-status.md](../quality/accessibility-status.md) |
| **K3 touch** | Alternative to HTML drag-and-drop for pins ("Select item → click artwork") | Drag-and-drop is desktop-only |
| **L1 modules** | ES modules or classic split; `"use strict"` adoption | [coding-standards.md](../engineering/coding-standards.md) future recommendations |
| **M (backend)** | Everything above (esp. L1); persistence boundary change | [backend-transition.md](backend-transition.md) |
| **M3 revisions** | Product → Artwork → Revision hierarchy | Current model has one checklist per product |
| **M4 audit trail** | Revision + identity (H1) | Needs "who" before "who did what" |

## Sequencing Implications

1. **F1 (metrics)** is the smallest pending item and has no dependencies — it can land any time (the progress bar already exists).
2. **H (sign-off)** benefits from stable validation; the fields it needs already exist in the schema.
3. **J (report)** should be built against a report model, never the DOM.
4. **L1 (modules)** should precede or accompany any large layer (H/J) to keep `js/app.js` manageable.
5. **M (backend)** is conditional on real usage and depends on L1 discipline.

## Implementation Order Principle

Layers are developed sequentially with acceptance gates per layer (see [development-workflow.md](../engineering/development-workflow.md)); a layer may only begin when the previous one's acceptance criteria pass. Future features are documented as `FUTURE CONSIDERATION` until their layer is reached — never implemented early (principle P-007).

## Related Documents

- [project-overview.md](../project-overview.md) — CURRENT/PLANNED/FUTURE split.
- [future-architecture.md](future-architecture.md)
- [backend-transition.md](backend-transition.md)
- External roadmap (scheduling authority; maintained outside this repository since commit `48ff58c`).