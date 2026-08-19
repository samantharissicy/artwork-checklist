# ADR-008 — Transient UI State Outside appState

**Status: Accepted**

## Context

Some runtime values (zoom level, open comment panels, the item being edited, the right-clicked tab, the active dialog, session Object URLs) describe the *interface*, not the review. Persisting them would pollute serialized state, break round-trip stability, and create dangling references (e.g. Object URLs).

## Decision

Keep transient UI state in module-level variables, **outside** `appState`:

| State | Variable |
| --- | --- |
| Viewer zoom (0.5–2.0, shared across products) | `currentZoom` |
| Open comment panels | `openCommentItemIds` (Set) |
| Item in inline title edit | `editingTitleItemId` |
| Session artworks + Object URLs | `artworkSessions` (Map) |
| Toast timer | `toastTimeoutId` |
| Product context-menu target | `productContextMenuState` |
| Layer context-menu target | `artworkLayerContextMenuState` |
| Dialog promise bridge | `appDialogState` |
| Legacy Pantone editor (unused) | `pantoneColourEditorState` |

`resetTransientReviewUiState()` clears comment/editor state on product switches but deliberately keeps `currentZoom`.

## Rationale

- `serializeState()` must remain a pure projection of review data: `JSON.stringify(appState)` (tested round-trip stability).
- Rehydration restores review content, not window furniture.
- Zoom is a display preference; menus/dialogs die with the page; Object URLs are page-scoped handles (ADR-004).

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Put everything in appState | Serialization leaks UI noise; reload would try to restore meaningless state |
| localStorage for zoom/panels | Pointless persistence; violates data-first discipline |

## Consequences

**Positive**

- Stable, testable serialization; deterministic rendering.
- Simple mental model: `appState` = review data; module variables = interface.

**Negative**

- Two places hold state; renderers must read both (documented in [rendering-model.md](../architecture/rendering-model.md)).
- Some transient state is shared (zoom) by design — product switches keep it.

## Revisit When

- State libraries or a formal store pattern are introduced (roadmap L1).
- Persisting view preferences becomes a real product requirement (e.g. per-user zoom).

## Related Files

- `js/app.js` — transient variables, `resetTransientReviewUiState`
- [architecture/state-management.md](../architecture/state-management.md)
- [architecture/context-menus.md](../architecture/context-menus.md)

## Related Roadmap Layers

B1 (state foundation), L1 (module separation).