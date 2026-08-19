# Context Menus

**Status: Current**

## Purpose

Document the two right-click context menus: the Product Tab Context Menu and the Artwork Layer Context Menu, including targeting, positioning, dismissal and why their state is transient.

## The Two Menus

| Menu | DOM element | Actions | Target stored in |
| --- | --- | --- | --- |
| Product tab menu | `#product-context-menu` (`role="menu"`) | rename, duplicate, new, delete | `productContextMenuState.productId` (js/app.js:8089) |
| Artwork layer menu | `#artwork-layer-context-menu` (`role="menu"`) | rename, add, delete | `artworkLayerContextMenuState.{productId, layerId}` (js/app.js:8594) |

Menu items carry `data-product-context-action` / `data-artwork-layer-context-action` attributes; destructive items use `.context-menu-danger`.

## Trigger Behaviour

- `contextmenu` event on tabs: `preventDefault()` and open the menu (`openProductContextMenu`, js/app.js:8244 / `openArtworkLayerContextMenu`, js/app.js:8699).
- Everywhere else, the native context menu is preserved.
- **Target may differ from the active product/layer**: opening a menu never switches `activeProductId` or `activeArtworkLayerId`; actions apply to the stored target.
- Menus are **mutually exclusive**: opening one closes the other (`closeAllContextMenus`, js/app.js:8305).

## Viewport-Safe Positioning

`calculateContextMenuPosition({clientX, clientY, menuWidth, menuHeight, viewportWidth, viewportHeight, margin})` (js/app.js:8119) is a pure function that:

1. positions the menu at the pointer;
2. flips it when it would overflow the bottom/right edge;
3. clamps it inside the viewport with `CONTEXT_MENU_MARGIN = 8` (js/app.js:8095).

Verified by tests (`G2UX-015`-range and `G4UX` position assertions).

## Dismissal (initializeContextMenus, js/app.js:8446)

| Trigger | Behaviour |
| --- | --- |
| Click outside the menu | Closes both menus |
| `Escape` | Closes both menus |
| `ArrowDown` / `ArrowUp` | Moves focus between menu items (`moveProductContextMenuFocus`, js/app.js:8350) |
| Window `resize` | Closes menus |
| Scroll (capture phase) | Closes menus |

## Disabled-State Safeguards

- `refreshProductContextMenuDisabledState` (js/app.js:8202): **delete** is disabled in a one-product workspace.
- `refreshArtworkLayerContextMenuDisabledState` (js/app.js:8651): **delete** is disabled when the layer is the last one.
- Disabled items get `aria-disabled="true"` and are non-actionable.

## Destructive Action Safeguards

- Delete product: `deleteProduct` rejects the last product; otherwise custom `showConfirmDialog` (via `deleteProductWithDialog`).
- Delete layer: `deleteArtworkLayerWithDialog` (js/app.js:6996) requires confirmation when the layer has pins or artwork, and **re-verifies the target after the async dialog** before acting.

## Why Context-Menu State Is NOT appState

The open menu, its target and its position are pure UI lifecycle concerns:

1. They must not appear in serialized state or review files (see [persistence/serialization.md](../persistence/serialization.md)).
2. They die with the page; restoring them after reload is meaningless.
3. Keeping them in module-level variables (`productContextMenuState`, `artworkLayerContextMenuState`) lets renderers (`renderProductTabs`, `renderArtworkLayerTabs`) close the menus whenever tabs are rebuilt.

This is part of the broader transient-UI-state decision: [decisions/ADR-008-transient-ui-state.md](../decisions/ADR-008-transient-ui-state.md).

## Related Documents

- [rendering-model.md](rendering-model.md) — menus closed by tab renderers.
- [state-management.md](state-management.md) — transient state table.
- [decisions/ADR-008-transient-ui-state.md](../decisions/ADR-008-transient-ui-state.md)
- [engineering/coding-standards.md](../engineering/coding-standards.md) — keyboard/ARIA conventions.