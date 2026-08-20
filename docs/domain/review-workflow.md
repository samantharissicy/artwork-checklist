# Review Workflow

**Status: Current**

## Purpose

Document the operational review workflow as implemented, including checklist decisions, Pantone compliance and cross-functional sign-off.

## End-to-End Flow

```mermaid
flowchart TD
  A[Create / select Product] --> B[Fill product metadata<br/>brand, name, weight, SKU, code, site, revision]
  B --> C[Select artwork<br/>upload image per layer]
  C --> D[Navigate artwork layers]
  D --> E[Review checklist<br/>50 items / 6 sections]
  E --> F[Approve / Reject items]
  F --> G[Add comments<br/>required on rejection]
  G --> H[Add pins<br/>drag item to artwork location]
  H --> I[Enter reviewer identity]
  I --> J[Quality / Production / Product Development<br/>Approve or Reject independently]
  J --> K[Optional department signatures]
  K --> L[Derived overall approval]
  L --> M[Save Check<br/>export JSON]
  M --> N[Print Report<br/>state-derived A4 view]
  N --> O[Save as PDF<br/>browser print dialog]
```

## Status Transitions

Each item has exactly one status: `pending` / `approved` / `rejected` (`REVIEW_STATUSES`).

| From | Action | To |
| --- | --- | --- |
| pending | click Approve | approved |
| pending | click Reject | rejected (comment panel opens) |
| approved | click Approve again | pending (toggle) |
| approved | click Reject | rejected |
| rejected | click Reject again | pending (toggle) |
| rejected | click Approve | approved |

Implementation: `handleReviewAction(itemId, requestedStatus)` — approve/reject toggle, opens and focuses the comment textarea on reject, re-renders, persists.

## Rejection Rule

```
IF status = rejected
THEN comment.trim().length > 0
```

- Enforced at interaction time by `validateItemState` and surfaced inline (`[data-role="comment-error"]`: "Comment required…"); typing a comment clears the error.
- `validateActiveProduct` aggregates invalid items across the active product (prefixed `ID:`).
- Rejecting without a comment is allowed to be *pending a comment* in the UI (the panel opens), but the item is flagged invalid until the comment is written.

## Review Progress

- `updateProgress`: updates the progress footer — counters (total/approved/rejected/pending) and percentages `N% reviewed` / `N% approved`; reviewed = approved + rejected, and the bar always follows reviewed / total.
- Per-status counters and the review/approval percentages are implemented (`updateProgress`).

## Comments

- `toggleCommentPanel` / `openCommentPanel` manage the open panel set (`openCommentItemIds`).
- Comments persist per item and survive reload, export/import, duplication.

## Copy Corrections

- `originalTitle` is immutable; `currentTitle` is editable via inline edit (Enter commits, Escape cancels, Blur commits/cancels per `commitTitleEdit`).
- Edited items show an `Edited` badge and `Restore original` (`restoreOriginalTitle`).
- Pin tooltips use `currentTitle`.

## Pins

- Drag a checklist item onto the artwork (`#pins-layer` drop) → normalized pin on the **active layer**.
- One pin per (item, layer); an item can be pinned on several layers.
- Click a pin → scrolls to the item; hover an item → highlights its pin.
- `Clear Pins` clears the active layer's pins.

## Pantone Compliance — Item 6I

Canonical item:

```text
6I — Pantone Colours Match Approved Pack Copy?
Note: Verify the artwork uses the Pantone colours specified in the approved pack copy
```

Operational meaning:

1. The reviewer compares the artwork's colours with the **approved pack copy** Pantone specification.
2. **The pack copy is authoritative** — the application does not define Pantone colours, does not store RGB/HEX equivalents and performs no automatic colour reading.
3. The decision is recorded exactly like any other checklist item: Pending / Approved / Rejected, mandatory comment on rejection, per-layer pins, persistence, export/import.
4. On schema migration from v3, 6I is added as **Pending** to every product; legacy `pantoneColors` never influences its status.

**Do not describe the legacy `pantoneColors` registry as part of the current business workflow** — it is preserved only for backwards compatibility with v3 review files ([legacy-compatibility.md](../persistence/legacy-compatibility.md), [decisions/ADR-009-pantone-pack-copy-compliance.md](../decisions/ADR-009-pantone-pack-copy-compliance.md)).

## Save Check / Open Check

| Step | Action | Behaviour |
| --- | --- | --- |
| Save Check | `exportReviewAsJson()` | Downloads schema-v5 JSON of the active product, including all sign-offs/signatures, via `buildExportData` |
| Open Check | `openCheck()` → `handleCheckFileChange` | Reads `.json`, `migrateImportData`, `validateImportData`, imports as a **new product**, activates it |

See [persistence/import-export.md](../persistence/import-export.md).

## Cross-Functional Sign-Off — H1–H4

After checklist review, open **Sign-Off** in the header:

1. Enter the current reviewer's Name and Role.
2. Record an independent Approve or Reject for each required department.
3. Add a mandatory comment to every rejected department.
4. Optionally add a visual signature once that department and the checklist are ready.
5. Read the derived overall status and blocker list; there is no separate stored overall-status field.

Quality, Production and Product Development are all required. Any rejection makes overall status Rejected. Overall Approved requires all three Approved plus valid product context and checklist completion. Changing Artwork Revision resets the decisions/signatures because they belong to the previous revision.

See [cross-functional-signoff.md](cross-functional-signoff.md) for the full decision, signature and persistence rules.

## Printable Approval Report — J1–J3

Use **Print Report** in the header after or during review. The application builds a fresh report from the active product state, groups all items by category and includes statuses, comments, copy corrections, reviewer data, department decisions, signatures, dates, metrics and final blockers.

The report can be printed while approval is Pending or Rejected; blockers remain visible so it is also useful as a review-progress record. Printing does not mark the review complete or change any state.

In the browser dialog, choose **Save as PDF** for a PDF copy. Ctrl/Cmd+P is also supported because the report refreshes on `beforeprint`. See [architecture/reporting.md](../architecture/reporting.md).

## Related Documents

- [domain-overview.md](domain-overview.md)
- [business-rules.md](business-rules.md)
- [cross-functional-signoff.md](cross-functional-signoff.md)
- [architecture/reporting.md](../architecture/reporting.md)
- [quality/manual-regression-guide.md](../quality/manual-regression-guide.md)
