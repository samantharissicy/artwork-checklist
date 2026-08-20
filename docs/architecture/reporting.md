# Printable Approval Reporting

**Status: Current — Layer J1–J3**

## Purpose

Document the state-derived report model, the dedicated print projection and the native browser PDF workflow implemented by Layer J. Reporting is independent of the planned high-resolution artwork work in Layer I.

## Architecture

```mermaid
flowchart LR
  Product[Active Product in appState] --> Model[buildReportData]
  Definitions[Canonical sectionDefinitions] --> Model
  Model --> ReportData[Detached ReportData]
  ReportData --> Markup[buildPrintReportMarkup]
  Markup --> PrintDOM[#print-report]
  PrintDOM --> CSS[@media print + @page]
  CSS --> Dialog[window.print]
  Dialog --> PDF[Browser Save as PDF]
```

The report is a projection of `appState`. It never scrapes the interactive checklist DOM, adds persisted fields or changes schema v5. All arrays and nested report objects are detached snapshots, so consumers cannot mutate the product accidentally.

## Intermediate Model — J1

`buildReportData(product)` returns `null` for an unusable product and otherwise produces:

| Field | Content |
| --- | --- |
| `generatedAt` | ISO timestamp for report generation |
| `reviewDate` | Latest valid reviewer, department or product-update timestamp |
| `productInformation` | Product ID, seven product fields and detached artwork-layer metadata |
| `reviewMetadata` | Schema, timestamps, overall status, final blockers, review metrics and summary counts |
| `sections` | Six canonical sections, ordered metrics and all 50 detached items |
| `approvedItems` / `rejectedItems` / `pendingItems` | Status-specific item collections |
| `comments` | Non-empty comments with item/category/status context |
| `copyCorrections` | Original and current copy for edited items |
| `reviewer` | Current reviewer name, role and review timestamp |
| `signOffs` | Detached department decisions, reviewer snapshots, comments, dates and optional signatures |
| `signatures` | Signed-department summary with reviewer and signature data |

The overall status and blocker list are reused from `computeOverallApproval(product)` and `validateFinalSignOff(product)`. Reporting therefore cannot invent a different approval rule from the operational sign-off UI.

## Print Projection — J2

`#print-report` is a semantic report container placed outside the interactive `.app` shell. It is hidden during normal use. `renderPrintReport(product)` builds its markup from `ReportData` immediately before printing.

The printed document contains:

- an approval-report header and derived overall status;
- product identification, artwork layers, review date and generation date;
- total/Approved/Rejected/Pending counts and review/approval percentages;
- final-approval blockers or a ready message;
- all 50 items grouped by the six canonical categories;
- status, note, comment and original/current copy where applicable;
- reviewer identity and three department sign-offs;
- visual signatures and signature timestamps when present.

`css/components/report.css` owns the print presentation:

- screen mode keeps `.print-report` hidden;
- `@page` targets A4 portrait with explicit margins;
- `@media print` hides every direct body child except the report;
- table headers repeat when the browser paginates;
- checklist rows, callouts and sign-off cards use `break-inside: avoid` where practical;
- the sign-off section starts on a new printed page;
- interactive toolbar, modals, controls and the workspace are absent from the print tree.

All user-entered content is escaped before insertion into report markup. Signature PNG data URLs come from the bounded, validated sign-off model.

## Native PDF Workflow — J3

The header **Print Report** button calls `printApprovalReport()`:

1. build and render the active product report;
2. call native `window.print()`;
3. let the user choose **Save as PDF** in the browser print dialog.

`beforeprint` also re-renders the active product, so Ctrl/Cmd+P receives current state even when the button was not used. No PDF library, network service or binary PDF storage is introduced.

## Runtime and Persistence Boundaries

- Report markup is transient and can be rebuilt at any time.
- Report generation does not call `touchProduct`, save to `localStorage` or modify `generatedAt`/`updatedAt` in product state.
- JSON Save/Open behavior and schema v5 are unchanged.
- Browser print destinations and optional browser headers/footers remain user-controlled.

## Verification

Layer J adds 38 browser tests (`J-001`–`J-038`) covering detached report data, all required report content, escaping, print CSS, `beforeprint`, the native print boundary and non-mutation. See [testing-strategy.md](../engineering/testing-strategy.md) and [manual-regression-guide.md](../quality/manual-regression-guide.md).

## Related Documents

- [architecture-overview.md](architecture-overview.md)
- [rendering-model.md](rendering-model.md)
- [domain/review-workflow.md](../domain/review-workflow.md)
- [decisions/ADR-011-state-derived-print-report.md](../decisions/ADR-011-state-derived-print-report.md)

