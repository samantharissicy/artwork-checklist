# ADR-006 — Multi-Product Workspace

**Status: Accepted**

## Context

Real review teams handle several products at once. The original single-product model forced one review at a time and duplicated work when products shared artwork.

## Decision

Model products as a collection with an explicit active selection:

```js
appState.products = { "product-1": Product, "product-2": Product };
appState.activeProductId = "product-1";
```

- Permanent product IDs (`generateProductId` — `crypto.randomUUID` with fallback).
- Product tabs (`renderProductTabs`) switch the active product (`switchProduct`).
- Each product keeps fully independent state (metadata, layers, items, pins, timestamps, legacy registry).
- Context-menu actions target the right-clicked product, which may differ from the active one.

## Rationale

- Parallel reviews without data mixing: switching products renders that product's complete state.
- IDs decouple identity from position/name; duplication creates independent copies with fresh IDs.
- "Target vs active" menu semantics let users act on any tab without losing their place.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| One review per browser session | Forces serial review; no product comparison |
| Flat array without IDs | Fragile after reorder/rename |
| Modal product switcher | Tabs are faster for 2–5 products |

## Consequences

**Positive**

- Independent, persistent per-product state; duplication and deletion are well-defined.
- Import (Open Check) inserts reviews as new products — the workspace is never overwritten.

**Negative**

- Whole-workspace serialization grows with product count (acceptable; see [performance-considerations.md](../quality/performance-considerations.md)).
- Tab bars need horizontal overflow handling (implemented via scrollable tab row).

## Revisit When

- Product counts reach dozens and tab UI degrades (search/filter, planned N ideas).
- Multi-user shared product libraries appear (planned M).

## Related Files

- `js/app.js` — `createNewProduct`, `switchProduct`, `duplicateProduct`, `deleteProduct`, `renderProductTabs`, `productContextMenuState`
- [architecture/state-management.md](../architecture/state-management.md)
- [architecture/context-menus.md](../architecture/context-menus.md)

## Related layers

G1 (model), G2 (tabs), G3 (review context metadata), G4 (layers per product).