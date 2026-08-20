# Architecture Decision Records

**Status: Current**

## Purpose

Architecture Decision Records (ADRs) capture significant technical decisions and their rationale so they do not have to be re-argued. They complement the functional documentation: docs describe *how it works*, ADRs record *why it is this way*.

## Format

Every ADR follows the same structure:

```text
ADR-XXX — Title

Status: Accepted

Context       — the situation and constraints that led to the decision
Decision      — what was decided
Rationale     — why this option was chosen
Alternatives  — options considered and why they were rejected
Consequences  — Positive / Negative
Revisit When  — conditions that would justify revisiting the decision
Related Files — source files that implement the decision
Related Layers — layers connected to the decision
```

## Index

| ADR | Decision |
| --- | --- |
| [ADR-001 — Vanilla Web Stack](ADR-001-vanilla-web-stack.md) | HTML + CSS + vanilla JavaScript; no framework, no npm, no build |
| [ADR-002 — appState Single Source of Truth](ADR-002-appstate-single-source-of-truth.md) | Domain state in `appState`; the DOM only represents it |
| [ADR-003 — Versioned Local Persistence](ADR-003-versioned-local-persistence.md) | `localStorage` + schema versions + migration chain + JSON export |
| [ADR-004 — Session-Only Artwork Binaries](ADR-004-session-only-artwork-binaries.md) | Metadata persisted; binary session-only; Object URLs runtime-only |
| [ADR-005 — Normalized Pin Coordinates](ADR-005-normalized-pin-coordinates.md) | `xRatio`/`yRatio` instead of pixels |
| [ADR-006 — Multi-Product Workspace](ADR-006-multi-product-workspace.md) | Products collection + `activeProductId` + tabs + context menus |
| [ADR-007 — Multi-Layer Artwork](ADR-007-multi-layer-artwork.md) | `artworkLayers[]` + `activeArtworkLayerId` + layer-scoped pins |
| [ADR-008 — Transient UI State Outside appState](ADR-008-transient-ui-state.md) | Zoom, editors, menu targets, Object URLs stay out of domain state |
| [ADR-009 — Pantone Pack-Copy Compliance](ADR-009-pantone-pack-copy-compliance.md) | Pantone review moved from a colour registry to checklist item 6I; legacy data preserved |
| [ADR-010 — Revision-Bound Cross-Functional Sign-Off](ADR-010-cross-functional-signoff.md) | Canonical department decisions, reviewer snapshots, derived overall status and optional Pointer Event signatures |

## When to Write an ADR

Write or update an ADR when a change:

- alters the persisted schema or storage strategy;
- changes the single-source-of-truth boundary;
- adds or removes a significant architectural pattern;
- changes the technology stack;
- reverses or extends a previous decision (update the original ADR + add a new one).

## Related Documents

- [docs/README.md](../README.md) — documentation index and maintenance policy.
- [future/layer-planning.md](../future/layer-planning.md) — layer planning.
