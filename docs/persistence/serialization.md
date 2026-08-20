# Serialization

**Status: Current**

## Purpose

Document the exact serialized-state boundary: what is persisted and what is not, and the guarantees of the round-trip.

## What Is Serialized

| Data | Where in state |
| --- | --- |
| Product metadata (brand, name, weight, SKU, code, site, revision) | `product.*` |
| Review status, comments, pins, copy corrections | `product.items[].{status, comment, pins, currentTitle}` |
| Artwork layers + metadata | `product.artworkLayers[]` (+ `activeArtworkLayerId`) |
| Legacy Pantone registry | `product.pantoneColors[]` |
| Current reviewer, department decisions/signatures, timestamps | `product.{reviewer, signOffs, signature, createdAt, updatedAt}` (`product.signature` is legacy) |
| Workspace selection | `schemaVersion`, `activeProductId` |

## What Is NOT Serialized

| Data | Reason |
| --- | --- |
| File objects / binary artwork | Session-only by design (ADR-004) |
| Object URLs | Runtime handles; revoked on release |
| Open comment panels (`openCommentItemIds`) | Transient UI |
| Title-edit target (`editingTitleItemId`) | Transient UI |
| Zoom (`currentZoom`) | Display preference |
| Context-menu targets / dialog state | Transient UI |
| Sign-off modal and signature canvas draft | Transient UI; only Confirm moves a PNG into `product.signOffs[]` |
| Demo artwork | Static markup, not state |
| Toast timer | Runtime only |

See [state-management.md](../architecture/state-management.md) for the full transient-state table.

## The Functions

| Function | Purpose |
| --- | --- |
| `serializeState()` | `JSON.stringify(appState)` — whole workspace |
| `deserializeState(serialized)` | `JSON.parse` with try/catch → `null` on failure |
| `validateState(state)` | Workspace structural validation (schema 5, products, active id, canonical sign-offs) |
| `rehydrateState(savedState)` | Fresh object graph rebuild from validated state |
| `buildExportData()` | Single-product export payload (active product) |
| `saveStateToStorage()` | Serialize + write `localStorage` |
| `loadStateFromStorage()` | Read → migrate → validate → rehydrate → replace |

## Round-Trip Guarantee

`serializeState → deserializeState → rehydrateState → serializeState` is stable: rehydration rebuilds canonical item and department shapes, so a second serialization equals the first (asserted by B1/G5/H round-trip tests).

## Rehydration Details

- `rehydrateItems` starts from `createInitialItems()` and copies only `currentTitle`, `status`, `comment`, `pins` (cloned) — discarded unknown fields are ignored, missing canonical fields are restored.
- `rehydrateProduct` builds a brand-new product object graph, clones `pantoneColors` and pins, merges the current reviewer, delegates department cloning to `rehydrateSignOffs`, and restores legacy signature/timestamps.
- No references into the parsed JSON survive rehydration — mutation of the DOM can never corrupt serialized data structure.

## Related Documents

- [architecture/persistence-and-schema.md](../architecture/persistence-and-schema.md)
- [persistence/migrations.md](migrations.md)
- [persistence/import-export.md](import-export.md)
- [domain/data-dictionary.md](../domain/data-dictionary.md)
