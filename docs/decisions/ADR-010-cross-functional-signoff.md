# ADR-010 — Revision-Bound Cross-Functional Sign-Off

**Status: Accepted**

## Context

Layer H requires independent approval from Quality, Production and Product Development, optional visual signatures and a single overall state. Decisions must not silently carry over when the artwork revision changes. The application remains local-first, framework-free and without a historical backend audit log.

## Decision

1. Store three canonical `product.signOffs[]` entries and validate their identity/order against `SIGN_OFF_DEPARTMENTS`.
2. Use `product.reviewer` as the current decision maker form and copy `{name, role}` into each completed department decision as an immutable-by-convention snapshot.
3. Store `reviewedAt` and the exact `artworkVersion` on Approved and Rejected decisions.
4. Reset all current sign-offs and signatures when `product.artworkVersion` changes.
5. Derive overall status: rejection has precedence; Approved requires all departments Approved plus final validation; otherwise Pending.
6. Keep visual signatures optional and separate from decisions. Store a bounded PNG data URL per department and use Pointer Events for all pointing devices.
7. Treat checklist Pending as a blocker for signatures and final approval. An individual valid department may sign while other departments are still Pending.
8. Introduce schema v5. v4→v5 creates Pending sign-offs and never infers historical approval.

## Rationale

- Canonical departments prevent imported JSON from redefining required approvers.
- Reviewer snapshots preserve who made each decision even when the form is reused for the next department.
- Revision binding prevents stale approval from authorizing changed artwork.
- Derived overall state cannot drift away from its department decisions.
- Pointer Events provide one input path for mouse, pen and touch.
- Pending migration is conservative and audit-safe: absence of a v4 feature cannot be interpreted as consent.

## Alternatives Considered

### One shared approval status

Rejected because it cannot represent independent department decisions or rejection precedence.

### Persist `overallStatus`

Rejected because duplicated state can become inconsistent with sign-offs and checklist validation.

### Preserve decisions when Artwork Revision changes

Rejected because a decision must apply to a specific artwork version. A future backend can add immutable history before preserving superseded decisions.

### Make signatures mandatory

Rejected because H3 defines them as optional and separate from department decisions.

### Use separate mouse and touch handlers

Rejected in favor of Pointer Events, which reduce duplicated gesture logic.

## Consequences

### Positive

- Independent, revision-specific decisions are explicit and exportable.
- Overall approval is deterministic.
- Incomplete rejection comments survive autosave but still block approval.
- Signatures work across mouse, pen and touchscreen.

### Negative

- PNG data URLs increase localStorage/export size.
- Changing a revision discards current decisions because no history model exists yet.
- Identity is asserted by user input; there is no authentication or cryptographic signature.

## Revisit When

- user accounts and department authorization are introduced;
- immutable audit history moves to a backend;
- cryptographic/e-signature compliance is required;
- signature storage moves from embedded data URLs to object storage.

## Related Files

- `js/app.js`
- `index.html`
- `css/components/signoff.css`
- `js/tests/layers/h-cross-functional-signoff.test.js`

## Related Layers

- H1 Reviewer Identity
- H2 Department Sign-Off
- H3 Signature
- H4 Final Sign-Off Validation
- D Persistence
- G1/G3 Multiple Products / Product Information
