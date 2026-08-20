# Manual Regression Guide

**Status: Current**

## Purpose

A practical pre-merge regression checklist, organized by functional area. Use it before every Pull Request and after any significant change.

## Preparation

```text
1. Serve the repo:  python -m http.server 5500
2. Open http://localhost:5500/index.html
3. Open DevTools → Console (must show no errors after load)
4. Clear the app origin's localStorage for a clean slate (optional)
```

## Application Startup

- [ ] App opens with one product tab (`product-1`), demo artwork visible, checklist rendered with 6 sections and 50 items.
- [ ] Console has no errors.
- [ ] Header shows Product / Production Code / Site / Artwork Revision context.

## Product Workspace

- [ ] `+ New Product` creates a new tab and activates it.
- [ ] Switching tabs renders the correct product data and checklist state.
- [ ] Rename updates the tab label.
- [ ] Duplicate creates an independent copy ("Copy" suffix) — editing the copy does not affect the original.
- [ ] Delete asks for confirmation and works (delete is disabled in a one-product workspace).
- [ ] Reload restores products, active product and all data.

## Product Context Menu

- [ ] Right-click a tab opens the menu at the pointer, positioned inside the viewport.
- [ ] Opening the product menu does **not** switch the active product; actions apply to the right-clicked product.
- [ ] Rename / Duplicate / Delete work from the menu.
- [ ] Escape, outside click, resize and scroll close the menu.
- [ ] Delete is disabled (greyed) in a one-product workspace.
- [ ] The native context menu still works everywhere else (e.g. checklist).

## Product Metadata

- [ ] Brand / Product Name / Weight / SKU / Production Code / Site / Artwork Revision save and restore after reload.
- [ ] Site select only offers OH1 / OH2 / BL.
- [ ] Product Name change updates the tab label.

## Checklist

- [ ] 6 sections, 50 items; sections expand/collapse.
- [ ] Notes and reference tags visible.

## Review Status

- [ ] Approve marks item green; Reject marks it red; clicking the active status toggles back to Pending.
- [ ] Progress footer updates correctly: counters (total/approved/rejected/pending), `N% reviewed` / `N% approved`, and the bar (approved + rejected count as reviewed).

## Comments

- [ ] Comment button opens/closes the panel; text persists after closing and reload.
- [ ] Rejecting opens the comment panel and shows the "Comment required" error until text is entered; error clears on typing.
- [ ] Approve does not require a comment.

## Copy Editing

- [ ] Edit turns the title into an input; Enter commits, Escape cancels.
- [ ] Edited items show the `Edited` badge and `Restore original` works.
- [ ] Pin tooltip shows `currentTitle`.

## Artwork Upload

- [ ] Set Artwork loads the image; metadata (name, dimensions) appears; badge changes.
- [ ] Reload: metadata persists, image is gone, "File Required" state shown; re-selecting the same file restores the image and keeps pins.
- [ ] Selecting a different image with pins asks for confirmation; confirmed replacement clears the layer's pins.

## Artwork Layer Workspace

- [ ] Add / Rename / Delete layer flows work; deleting the last layer is rejected.
- [ ] Each layer has its own image and pins; switching layers shows the correct pins.
- [ ] Deleting a layer with pins/artwork requires confirmation.

## Artwork Layer Context Menu

- [ ] Right-click a layer tab opens its menu; target layer ≠ active layer is respected.
- [ ] Rename / Add / Delete from the menu work; Escape/outside click/resize/scroll close it.
- [ ] Delete disabled for the last layer.

## Pins

- [ ] Drag a checklist item onto the artwork creates a pin at the drop point.
- [ ] Clicking a pin scrolls to its item; hovering an item highlights its pin.
- [ ] One pin per item per layer; same item can be pinned on multiple layers.
- [ ] Clear Pins clears the active layer's pins only.

## Zoom

- [ ] Zoom in/out works between 50% and 200%; `#zoom-level` label updates.
- [ ] Pins stay aligned at 50%, 100% and 200%.
- [ ] Zoom survives product switches (shared zoom) but not reload.

## Pantone Compliance (item 6I)

- [ ] Item 6I "Pantone Colours Match Approved Pack Copy?" exists in section 6 of every product.
- [ ] 6I supports Approve/Reject (+ comment) and pins like any item.
- [ ] The Colour Specification UI does not exist anywhere in the DOM.
- [ ] No RGB/HEX or automatic colour features are present.

## Save Check

- [ ] Save Check downloads a `.json` file with `schemaVersion: 4`, product, items (50), layers and pins.
- [ ] Saved file opens without errors.

## Open Check

- [ ] Open Check imports a valid v4 file as a **new** product and activates it.
- [ ] Importing a v1/v2/v3 file succeeds and the product gains 6I as Pending (legacy `pantoneColors` preserved).
- [ ] Importing a malformed/non-JSON/incompatible file is rejected with a toast and changes nothing.

## localStorage

- [ ] After reload, products, statuses, comments, edits, pins metadata and 6I state are restored.
- [ ] Zoom and open editors are not restored (expected).
- [ ] Setting `localStorage["artworkChecklist:v4"]` to garbage and reloading does not crash the app.

## Migration

- [ ] With only `artworkChecklist:v3` in storage, reload promotes state to v4: 6I appears Pending, existing data intact, old key removed.
- [ ] v2/v1 keys behave the same way.

## Destructive Actions

- [ ] Deleting a product releases its session artwork (no leaked Object URLs — check DevTools).
- [ ] Deleting a layer releases only that layer's session.
- [ ] All destructive flows require confirmation and are cancellable.

## Final

- [ ] Full test suite: `await runArtworkTests()` → `378/378 tests passed` (expected count is time-sensitive).
- [ ] No application-generated console errors (except the known `blob:` fixture warning from `G4UX-028`).
- [ ] `git diff` shows only intended files.

## Related Documents

- [engineering/testing-strategy.md](../engineering/testing-strategy.md)
- [operations/troubleshooting.md](../operations/troubleshooting.md)
- [domain/review-workflow.md](../domain/review-workflow.md)