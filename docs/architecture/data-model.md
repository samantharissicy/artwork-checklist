# Data Model

**Status: Current** — schema version 4 (`CURRENT_SCHEMA_VERSION = 4`).

## Purpose

Document the actual persisted domain models. Every property below is implemented and validated by `validateState` / `validateSerializedProduct` / `validateSerializedItem` (js/app.js).

## Ownership Legend

| Category | Meaning |
| --- | --- |
| **PERSISTED** | Serialized into `localStorage` and Save Check JSON |
| **TRANSIENT** | Lives only in module variables during the session |
| **SESSION-ONLY** | Binary data kept only for the current page session |

## AppState

```js
{
  schemaVersion: 4,        // number, PERSISTED — must equal CURRENT_SCHEMA_VERSION
  activeProductId: "product-1", // string, PERSISTED — id of the active product
  products: { "product-1": Product } // Object<string, Product>, PERSISTED
}
```

- Owned by the module `const appState`.
- Validated by `validateState`: plain object, schemaVersion === 4, non-empty activeProductId, active id exists, `products` keys match `product.id`.

## Product

Factory: `createProduct(id)`.

| Property | Type | Default | Persistence | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | `"product-N"` | PERSISTED | Permanent product ID (never reused; `generateProductId`) |
| `brand` | string | `""` | PERSISTED | Brand |
| `productName` | string | `""` | PERSISTED | Product name (tab label source) |
| `weight` | string | `""` | PERSISTED | Weight |
| `sku` | string | `""` | PERSISTED | SKU |
| `productionCode` | string | `""` | PERSISTED | Production code (never auto-derived from SKU) |
| `site` | string | `""` | PERSISTED | One of `ALLOWED_SITES` (`OH1`, `OH2`, `BL`) |
| `artworkVersion` | string | `""` | PERSISTED | Artwork revision of the product |
| `artworkLayers` | ArtworkLayer[] | `[{id:"layer-main", name:"Main Artwork", artwork:null}]` | PERSISTED | Layers of this product |
| `activeArtworkLayerId` | string | `"layer-main"` | PERSISTED | Active layer |
| `pantoneColors` | PantoneColour[] | `[]` | PERSISTED | **Legacy** metadata, compatibility only (see below) |
| `items` | Object<string, ReviewItem> | 50 canonical items | PERSISTED | Checklist items by ID |
| `reviewer` | Reviewer | `{name:"", role:"", reviewedAt:null}` | PERSISTED | Never populated by current UI (future H1) |
| `signature` | object\|null | `null` | PERSISTED | Never populated by current UI (future H3) |
| `createdAt` | string (ISO) | now | PERSISTED | Creation timestamp |
| `updatedAt` | string (ISO) | now | PERSISTED | Touched on every domain mutation (`touchProduct`) |

Constraints enforced by `validateSerializedProduct`:

- All string fields are strings (site/productionCode/artworkVersion optional).
- `artworkLayers` non-empty, unique non-empty IDs, valid artwork metadata per layer, `activeArtworkLayerId` references an existing layer.
- Complete canonical items set with **exact** key count (50).
- Every pin references an existing layer.
- `reviewer` object present; timestamps optional strings.

## ArtworkLayer

Factory: `createArtworkLayer(id, name, artwork)`.

```js
{
  id: "layer-main",                    // string, PERSISTED — permanent layer ID
  name: "Main Artwork",                // string, PERSISTED — display name
  artwork: ArtworkMetadata | null      // PERSISTED metadata; binary is SESSION-ONLY
}
```

## ArtworkMetadata

Created by `createArtworkMetadata(file, width, height)`.

| Property | Type | Persistence | Meaning |
| --- | --- | --- | --- |
| `name` | string (non-empty) | PERSISTED | File name |
| `type` | string starting `"image/"` | PERSISTED | MIME type |
| `size` | number ≥ 0 | PERSISTED | File size in bytes |
| `width` | number > 0 | PERSISTED | Natural width in pixels |
| `height` | number > 0 | PERSISTED | Natural height in pixels |

Validated by `isValidArtworkMetadata`. **The binary image is never persisted**: see [artwork-workspace.md](artwork-workspace.md) and ADR-004.

## ReviewItem

Factory: `createInitialItems()` driven by `sectionDefinitions`.

```js
{
  id: "1a",                            // string, PERSISTED — canonical ID
  sectionId: "legal-core",             // string, PERSISTED — canonical section ID
  originalTitle: "Product Name / Legal Name", // string, PERSISTED — immutable
  currentTitle: "Product Name / Legal Name",  // string, PERSISTED — editable copy
  note: "Must be clear, not misleading...",   // string, PERSISTED — guidance text
  status: "pending",                   // string, PERSISTED — review status enum
  comment: "",                         // string, PERSISTED — review comment
  pins: []                             // StoredLayerPin[], PERSISTED — per-layer pins
}
```

- `originalTitle` is defined with `Object.defineProperty(item, "originalTitle", { writable: false })` — it cannot be mutated.
- `rehydrateItems` rebuilds items from the canonical definitions and copies only `currentTitle`, `status`, `comment`, `pins`, guaranteeing the shape and the immutable title even for imported files.
- Status values: `pending` / `approved` / `rejected` (`REVIEW_STATUSES`).

## StoredLayerPin

```js
{
  layerId: "layer-front",  // string, PERSISTED — owning layer
  xRatio: 0.42,            // number, PERSISTED — 0..1
  yRatio: 0.18             // number, PERSISTED — 0..1
}
```

- Validated by `isValidStoredLayerPin` and `validateItemPins` (no duplicate item+layer pairs).
- One pin per (item, layer); an item can be pinned on several layers.
- See [pins-and-coordinate-system.md](pins-and-coordinate-system.md).

## Reviewer

```js
{ name: "", role: "", reviewedAt: null }
```

Persisted and round-tripped, but **no current UI writes it**. Planned for roadmap layers H1/H2.

## Signature

`null` by default; persisted as `product.signature` (rehydrated as-is). Never populated — planned for layer H3.

## Legacy PantoneColour (backwards compatibility only)

Factory: `createPantoneColour(...)`. Typedef `PantoneColour`.

```js
{
  id: "colour-1",          // string — permanent colour ID
  name: "Primary Brand Red",
  pantoneCode: "PANTONE 186 C",  // free text, no RGB/HEX derivation
  notes: "",
  layerIds: ["layer-front", "layer-back"]
}
```

| Function | Purpose |
| --- | --- |
| `validateSerializedPantoneColours` | Import validation |
| `validateSerializedProduct` | Structural validation |
| `rehydrateProduct` | Cloned on rehydration |
| `buildExportData` | Cloned into JSON export |
| `buildImportedProduct` | Cloned on import |
| `duplicateProduct` | Cloned on duplication |
| `migrateStateV3ToV4` | Preserved untouched on migration |

The legacy editor UI functions (`renderPantoneColours`, `openAddPantoneColourEditor`, …) are retained but **never called** by the current interface. The canonical Pantone review is checklist item **6I**. See [legacy-compatibility.md](../persistence/legacy-compatibility.md) and ADR-009.

## Persisted vs Transient vs Session-Only

| Data | Category |
| --- | --- |
| Product metadata, layers, items, statuses, comments, pins, reviewer, signature, timestamps | PERSISTED |
| `pantoneColors` legacy registry | PERSISTED |
| Open comment panels, title-edit target, zoom, context-menu targets, dialog state | TRANSIENT (module variables) |
| Artwork binary, Object URLs | SESSION-ONLY (`artworkSessions` Map) |

## Data Ownership Diagram

```mermaid
flowchart TD
  AppState --> Products
  AppState --> ActiveProductId
  Products --> Product
  Product --> ProductFields[brand, name, weight, sku, code, site, version]
  Product --> Layers[artworkLayers[]]
  Product --> ActiveLayerId
  Product --> Items[items{}]
  Product --> Legacy[legacy pantoneColors]
  Layers --> Layer
  Layer --> ArtworkMetadata[artwork metadata]
  Items --> Item
  Item --> Pins[pins[] layerId+xRatio+yRatio]
```

## Related Documents

- [data-dictionary.md](../domain/data-dictionary.md) — field-by-field reference.
- [state-management.md](state-management.md) — ownership rules.
- [persistence/serialization.md](../persistence/serialization.md) — what crosses the wire.