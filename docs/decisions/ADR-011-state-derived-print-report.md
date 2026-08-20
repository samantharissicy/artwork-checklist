# ADR-011 — State-Derived Print-First Approval Reports

**Status: Accepted**

## Context

Layer J needs a complete approval report containing product information, checklist outcomes, comments, copy corrections, reviewer identity, department decisions, signatures and dates. The application already treats `appState` as the single source of truth, runs without dependencies or a build step and has no backend.

Generating the report from the interactive DOM would couple business data to expansion state and UI markup. Adding a PDF library before proving a native-browser limitation would increase bundle, maintenance and supply-chain cost without a demonstrated need.

## Decision

1. Introduce `buildReportData(product)` as a detached intermediate projection of product state and canonical checklist definitions.
2. Reuse the existing overall-approval and final-validation functions instead of duplicating report-specific approval rules.
3. Render a separate, screen-hidden `#print-report` document; do not repurpose or scrape the interactive workspace.
4. Apply an A4 print layout through `@page` and `@media print`, exposing only the report during printing.
5. Use `window.print()` for the first PDF workflow; the user selects Save as PDF in the browser.
6. Refresh the report on `beforeprint` so the browser keyboard print path is current.
7. Keep report data and markup transient. Do not change schema v5, localStorage or JSON export/import.

## Rationale

- Preserves ADR-002: state remains authoritative and the DOM remains a projection.
- Makes report data testable separately from presentation.
- Prevents collapsed sections, temporary editors or stale DOM from changing report content.
- Keeps the zero-dependency architecture and produces a useful PDF immediately.
- Reuses current sign-off rules, avoiding two definitions of “fully approved.”

## Alternatives Considered

| Alternative | Why not selected |
| --- | --- |
| Scrape the interactive DOM | Omits collapsed/transient content and violates the state boundary |
| Print the existing workspace | Includes controls and screen layout; poor pagination and incomplete semantic structure |
| Client PDF library | No proven native-print gap; adds dependency and custom layout complexity |
| Server-generated PDF | No backend exists; would change privacy, deployment and persistence architecture |

## Consequences

### Positive

- Reports always contain all six categories and 50 items, independent of UI expansion.
- Report consumers receive detached, non-mutating data.
- Printing and Save as PDF work without network access or third-party code.
- Future PDF tooling can consume the same `ReportData` if a real limitation is demonstrated.

### Negative

- Print-dialog UI, destination names and some paper options vary by browser and operating system.
- There is no one-click binary PDF download or server-side deterministic rendering.
- Browser headers/footers and final pagination remain partly user-controlled.

## Revisit When

- a validated business need requires automatic PDF file generation or server-side archival;
- browser print output fails an agreed cross-browser fidelity target;
- report templates or localization require a dedicated reporting module;
- cryptographic signing or authenticated audit evidence is introduced.

## Related Files

- `js/app.js`
- `index.html`
- `css/components/report.css`
- `css/components/header.css`
- `js/tests/layers/j-printable-report.test.js`

## Related Layers

- J1 — Report Model
- J2 — Print View
- J3 — Export PDF
- H1–H4 — reviewer, decisions, signatures and final validation used by the report

