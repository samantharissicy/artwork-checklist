# Cross-Functional Sign-Off

**Status: Current** — Layer H (H1–H4), schema v5.

## Purpose

Layer H records independent decisions from Quality, Production and Product Development for the current artwork revision. Checklist review and department approval remain separate concerns: completing the checklist does not approve a department, and one department cannot approve another.

## Required Departments

`SIGN_OFF_DEPARTMENTS` is the application-owned canonical list:

| ID | Display name | Required |
| --- | --- | --- |
| `quality` | Quality | Yes |
| `production` | Production | Yes |
| `product-development` | Product Development | Yes |

Every new or migrated product contains the three entries in this order. Persisted/imported data cannot rename, reorder, add or omit departments.

## Reviewer Identity and Decision Snapshot

The reviewer form edits `product.reviewer` (`name`, `role`). Both fields are required before Approve or Reject. When a decision is recorded, the current identity is copied into the sign-off:

```js
{
  departmentId: "quality",
  departmentName: "Quality",
  reviewer: { name: "Alex Morgan", role: "QA Lead" },
  status: "approved",
  comment: "",
  reviewedAt: "2026-08-20T12:00:00.000Z",
  artworkVersion: "REV-7",
  signature: null
}
```

The snapshot does not change when the current reviewer form is edited later. Returning a department to Pending clears its reviewer snapshot, `reviewedAt`, artwork revision and signature. Its comment is retained as draft context.

## Artwork Revision Ownership

Every completed sign-off stores the exact `product.artworkVersion` it approved or rejected. Changing Artwork Revision through the product form resets all department decisions and signatures. Re-entering the same revision does not reset them.

This prevents a decision for revision A from being treated as approval of revision B. Layer H deliberately does not add a historical audit trail; superseded decisions are reset rather than archived.

## Rejection and Restorability

A rejected department requires a non-empty comment for business validity. The UI permits the brief intermediate state immediately after clicking Reject so it can focus the comment field. That incomplete state is structurally valid for autosave/reload, but `validateDepartmentSignOff` and final approval continue to reject it until a comment is supplied.

## Overall Approval

`computeOverallApproval(product)` derives, rather than stores, the overall state:

```text
if any required department is Rejected → Rejected
else if all required departments are Approved
        and final validation passes       → Approved
else                                      → Pending
```

`validateFinalSignOff` blocks final approval when any of these conditions exists:

- Product Name, Production Code, Site or Artwork Revision is empty;
- any checklist item is Pending;
- any rejected checklist item has no comment;
- any required department is Pending or Rejected;
- a completed department decision has invalid reviewer, timestamp or artwork-revision metadata.

The implementation decision for the roadmap's Pending question is: **Pending checklist items block signatures and final approval**.

## Visual Signature

Each completed department decision may optionally own a visual signature. Signatures are separate from the decision: an approved or validly rejected sign-off can be complete without one.

The signature pad uses Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) for mouse, pen and touchscreen. Confirm stores a bounded PNG data URL with `signedAt`, canvas width and height. Clear affects only the current canvas draft; Remove deletes the persisted signature. Changing the department decision clears its previous signature.

Signature readiness requires:

- all required product context fields;
- no Pending checklist items;
- no rejected checklist item without a comment;
- a completed, valid decision for that department.

Other departments may still be Pending when an individual department signs. They continue to block the derived overall approval.

## Persistence and Migration

- Workspace state: `product.signOffs[]` under schema v5 / `artworkChecklist:v5`.
- Save Check: all sign-offs and embedded signatures are included.
- Open Check: sign-offs are validated and rehydrated into independent objects.
- Duplication: decisions/signatures are deep-cloned; the duplicate retains the same artwork revision.
- v4→v5: adds the three required departments as Pending. Existing reviewer and legacy `product.signature` fields are preserved; no old data is interpreted as an approval.

## UI Entry Points

| Function | Responsibility |
| --- | --- |
| `openSignOffPanel` / `closeSignOffPanel` | Modal lifecycle and focus return |
| `renderSignOffState` | Header status + open-panel state synchronization |
| `handleDepartmentDecision` | Decision toggle, persistence and focus on rejection comment |
| `openSignaturePad` / `confirmDepartmentSignature` | Signature workflow |
| `bindSignOffUi` | Reviewer, department and Pointer Event handlers |

## Related Documents

- [review-workflow.md](review-workflow.md)
- [business-rules.md](business-rules.md)
- [architecture/data-model.md](../architecture/data-model.md)
- [persistence/migrations.md](../persistence/migrations.md)
- [decisions/ADR-010-cross-functional-signoff.md](../decisions/ADR-010-cross-functional-signoff.md)
