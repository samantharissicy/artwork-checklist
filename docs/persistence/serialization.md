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
| Reviewer / signature / timestamps | `product.{reviewer, signature, createdAt, updatedAt}` |
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
| Demo artwork | Static markup, not state |
| Toast timer | Runtime only |

See [state-management.md](../architecture/state-management.md) for the full transient-state table.

## The Functions

| Function | Purpose | Location |
| --- | --- | --- |
| `serializeState()` | `JSON.stringify(appState)` — whole workspace | js/app.js:5442 |
| `deserializeState(serialized)` | `JSON.parse` with try/catch → `null` on failure | js/app.js:5468 |
| `validateState(state)` | Workspace structural validation (schema 4, products, active id) | js/app.js:5851 |
| `rehydrateState(savedState)` | Fresh object graph rebuild from validated state | js/app.js:6020 |
| `buildExportData()` | Single-product export payload (active product) | js/app.js:6531 |
| `saveStateToStorage()` | Serialize + write `localStorage` | js/app.js:6484 |
| `loadStateFromStorage()` | Read → migrate → validate → rehydrate → replace | js/app.js:6408 |

## Round-Trip Guarantee

`serializeState → deserializeState → rehydrateState → serializeState` is stable: rehydration rebuilds canonical item shapes (`originalTitle` non-writable, exact 50-item key set), so a second serialization equals the first (asserted by tests, e.g. `G5R-049` serialize/rehydrate roundtrip and B1 suite).

## Rehydration Details

- `rehydrateItems` (js/app.js:5914) starts from `createInitialItems()` and copies only `currentTitle`, `status`, `comment`, `pins` (cloned) — discarded unknown fields are ignored, missing canonical fields are restored.
- `rehydrateProduct` (js/app.js:5959) builds a brand-new product object graph, clones `pantoneColors` and pins, merges `reviewer`, restores `signature`/timestamps.
- No references into the parsed JSON survive rehydration — mutation of the DOM can never corrupt serialized data structure.

## Related Documents

- [architecture/persistence-and-schema.md](../architecture/persistence-and-schema.md)
- [persistence/migrations.md](migrations.md)
- [persistence/import-export.md](import-export.md)
- [domain/data-dictionary.md](../domain/data-dictionary.md)