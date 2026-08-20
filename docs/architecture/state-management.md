# State Management

**Status: Current**

## Purpose

Explain what lives in `appState`, what lives outside it, and why the split matters. See [architecture-overview.md](architecture-overview.md) for the flow and [data-model.md](data-model.md) for shapes.

## appState — The Single Source of Truth

```js
const appState = {
  schemaVersion: 5,
  activeProductId: "product-1",
  products: {},
};
```



Rules:

- **Product ownership**: every product is stored by permanent ID in `appState.products`; the product owns its fields, layers, items, pins, reviewer, department sign-offs/signatures, legacy registry and timestamps. No product data lives anywhere else.
- **Active selection**: `activeProductId` selects which product the workspace renders. `switchProduct` changes only this field, resets transient UI, persists and re-renders.
- **Active layer**: each product owns `activeArtworkLayerId`. `switchArtworkLayer` changes it without touching product timestamps.
- **Immutable vs mutable**: `originalTitle` is immutable by construction (`Object.defineProperty` with `writable:false`). `currentTitle`, `status`, `comment`, `pins` are mutable through named domain functions only.
- **Timestamps**: every domain mutation calls `touchProduct`/`touchActiveProduct` which sets `updatedAt` to now.

## Domain Getters

Reads go through small helpers instead of ad-hoc traversal:

| Getter | Purpose |
| --- | --- |
| `getActiveProduct()` | Active product object |
| `getActiveArtworkLayer()` | Active layer of the active product (falls back to `artworkLayers[0]`) |
| `getItemById(itemId)` | Item by canonical ID in the active product |
| `getArtworkSession(metadata, productId, layerId)` | Session record for a (product, layer) |
| `isArtworkLoadedInSession(metadata, productId, layerId)` | Whether the session still holds the matching binary |
| `getChecklistDefinition(itemId)` | Canonical `{section, definition}` for an ID |
| `layerPinCount(productId, layerId)` | Number of pins on a layer |
| `getDepartmentSignOff(product, departmentId)` | Canonical department decision for a product |
| `computeOverallApproval(product)` | Derived overall department/final-validation state |
| `buildReportData(product)` | Detached reporting projection; does not mutate or persist the product |

## Domain Mutations (authorized writers)

| Function | Mutates |
| --- | --- |
| `setItemStatus(itemId, status)` | item.status + updatedAt |
| `setItemComment(itemId, comment)` | item.comment + updatedAt |
| `setItemCurrentTitle(itemId, title)` | item.currentTitle + updatedAt |
| `setItemPinForLayer(itemId, layerId, pin)` | item.pins (one per item+layer) + updatedAt |
| `removeItemPinFromLayer(itemId, layerId)` | item.pins |
| `createNewProduct` / `switchProduct` / `renameProduct` / `duplicateProduct` / `deleteProduct` | products / activeProductId |
| `createArtworkLayerForProduct` / `switchArtworkLayer` / `renameArtworkLayer` / `deleteArtworkLayer` | artworkLayers / activeArtworkLayerId / pins / legacy layer references |
| `applyArtworkIdentity(metadata, confirmReplacement, productId, layerId)` | layer.artwork (and clears layer pins when identity changes) |
| `adoptSessionArtwork(metadata, objectUrl, productId, layerId)` | artworkSessions only (never appState) |
| `updateActiveReviewer(field, value)` | current reviewer + updatedAt |
| `setDepartmentSignOffStatus` / `setDepartmentSignOffComment` | department decision snapshot/comment + updatedAt |
| `setActiveProductArtworkVersion(value)` | revision + resets sign-offs when changed |
| `setDepartmentSignature` / `removeDepartmentSignature` | optional department signature + updatedAt |

All of them validate input before mutating (status whitelist, non-empty names, pin bounds, artwork identity rules).

## Render Synchronization

- Domain functions mutate state first, then call renderers (`renderItemState`, `renderPins`, `renderAppState`, …) and `saveStateToStorage`.
- The DOM is rebuilt from state; event handlers read state, never the other way around.
- `renderAppState()` is the coordinator for the active product: product inputs, context header, layer tabs, artwork state, per-item render, pins, progress and sign-off summary.
- See [rendering-model.md](rendering-model.md).

## Transient State Outside appState

These are module-level variables, intentionally **not** part of `appState`:

| Variable | Type | Meaning | Why not persisted |
| --- | --- | --- | --- |
| `openCommentItemIds` | `Set` | Open comment panels | Pure UI expansion state |
| `editingTitleItemId` | `string\|null` | Item in inline title edit | Editor focus state |
| `artworkSessions` | `Map` | Session artworks `{metadata, objectUrl}` per (product, layer) | Binary + URL are runtime-only |
| `toastTimeoutId` | `number` | Toast auto-hide timer | Timing |
| `productContextMenuState` | `{productId, isOpen}` | Open product menu target | Menu lifecycle |
| `artworkLayerContextMenuState` | `{productId, layerId, isOpen}` | Open layer menu target | Menu lifecycle |
| `appDialogState` | `{isOpen, resolve, type}` | Custom dialog promise bridge | Dialog lifecycle |
| `pantoneColourEditorState` | `{isOpen, colourId, productId}` | Legacy Pantone editor (unused) | Legacy UI |
| `signOffUiState` | `{isOpen, previousFocus}` | Department modal lifecycle | UI/focus state |
| `signaturePadState` | drawing target, ink and pointer state | Signature modal/canvas draft | UI gesture state; confirmed PNG moves into `appState` |

The generated `ReportData` object and `#print-report` markup are also transient projections. They are rebuilt from the active product for printing and are deliberately excluded from `appState`, serialization and JSON review files.

`resetTransientReviewUiState()` clears comments/title editing and closes the legacy editor, sign-off panel and signature pad on product switches — but deliberately **keeps `currentZoom`** (zoom is shared across products by design).

## Why Transient State Is Not Persisted

1. **Serialization must stay a pure projection of review data.** `serializeState()` is `JSON.stringify(appState)`; UI noise would leak into review files and break round-trip stability (tests assert `serializeState → deserializeState → serializeState` stability).
2. **Rehydration restores review content, not window furniture.** Open editors and menus are meaningless after reload.
3. **Zoom is a display preference.** Persisting it would couple review files to display settings.
4. **Session resources die with the page** (`beforeunload` → `releaseAllSessionArtworks`). Persisting Object URLs would be a dangling-reference bug.

See [decisions/ADR-008-transient-ui-state.md](../decisions/ADR-008-transient-ui-state.md).

## Related Documents

- [data-model.md](data-model.md)
- [rendering-model.md](rendering-model.md)
- [reporting.md](reporting.md)
- [persistence/serialization.md](../persistence/serialization.md)
- [decisions/ADR-002-appstate-single-source-of-truth.md](../decisions/ADR-002-appstate-single-source-of-truth.md)
