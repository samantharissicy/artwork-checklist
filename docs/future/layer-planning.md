# Layer Planning Notes

**Status: Future / Not Implemented** (except where marked Current)

## Purpose

Technical dependencies between planned layers. The external development plan is the scheduling authority; this file notes *engineering* coupling, not dates. Implemented layers are listed for completeness.

## Layer Status Summary (current)

| Layer | Status | Notes |
| --- | --- | --- |
| A0 baseline | ✅ Current | `baseline.en.md` / `baseline.pt-BR.md` snapshots |
| B1 state foundation | ✅ Current | `appState` single source of truth |
| C1/C2/C3 review/comments/copy | ✅ Current | tri-state, comments, copy corrections |
| D1–D4 persistence/export/import | ✅ Current | schema v1–v5 chain |
| E1/E2 pins/identity | ✅ Current | normalized pins, replacement safeguards |
| F1 review metrics | ✅ Current | counters, review/approval percentages and progress bar |
| G1–G5 products/layers/Pantone | ✅ Current | multi-product, multi-layer, 6I compliance |
| H1–H4 sign-off | ✅ Current | reviewer identity, independent required departments, Pointer Event signatures, derived final validation |
| I1–I2 high-res/responsive | 📋 Planned | storage strategy, viewports/touch |
| J1–J3 report/PDF | ✅ Current | detached report model, A4 print view, native Save as PDF |
| K1–K4 UX/a11y/touch/regression | 📋 Planned | confirmation/empty states, accessibility, touch, regression hardening |
| L1 module separation | 📋 Planned | split `js/app.js` into modules |
| M1–M4 backend/auth/revisions/audit | ⏳ Future | conditional on real usage |

## Technical Dependencies Between Planned Layers

| Planned work | Depends on | Why |
| --- | --- | --- |
| **K2 accessibility** | Keyboard paths for sections, dialog focus trap, `aria-live` toast | Audit in [accessibility-status.md](../quality/accessibility-status.md) |
| **K3 touch** | Alternative to HTML drag-and-drop for pins ("Select item → click artwork") | Drag-and-drop is desktop-only |
| **L1 modules** | ES modules or classic split; `"use strict"` adoption | [coding-standards.md](../engineering/coding-standards.md) future recommendations |
| **M (backend)** | Everything above (esp. L1); persistence boundary change | [backend-transition.md](backend-transition.md) |
| **M3 revisions** | Product → Artwork → Revision hierarchy | Current model has one checklist per product |
| **M4 audit trail** | Revision + identity (H1) | Needs "who" before "who did what" |

## Sequencing Implications

1. **F1 (metrics)** is implemented; it had no dependencies and could land at any time after the progress bar existed.
2. **H (sign-off)** is implemented on schema v5 and provides revision-bound decisions for the current report and future audit layers.
3. **J (report)** is implemented against a detached state-derived model and native browser printing; it does not depend on Layer I.
4. **L1 (modules)** should precede or accompany any future large layer to keep `js/app.js` manageable.
5. **M (backend)** is conditional on real usage and depends on L1 discipline.

## Implementation Order Principle

Layers are developed sequentially with acceptance gates per layer (see [development-workflow.md](../engineering/development-workflow.md)); a layer may only begin when the previous one's acceptance criteria pass. Future features are documented as `FUTURE CONSIDERATION` until their layer is reached — never implemented early (principle P-007).

## Related Documents

- [project-overview.md](../project-overview.md) — CURRENT/PLANNED/FUTURE split.
- [future-architecture.md](future-architecture.md)
- [backend-transition.md](backend-transition.md)
- [architecture/reporting.md](../architecture/reporting.md)
- external development plan (scheduling authority; maintained outside this repository since commit `48ff58c`).
