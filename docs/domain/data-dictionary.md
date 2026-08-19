# Data Dictionary

**Status: Current**

## Purpose

Field-by-field reference for all persisted data. Models and factories: [data-model.md](../architecture/data-model.md). Ownership: [state-management.md](../architecture/state-management.md).

## AppState

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `schemaVersion` | workspace | number | yes | `4` | Must equal `CURRENT_SCHEMA_VERSION` |
| `activeProductId` | workspace | string | yes | `"product-1"` | Active product selection |
| `products` | workspace | object | yes | `{}` | Products keyed by permanent ID |

## Product

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | product | string | yes | `"product-1"` | Permanent ID, never reused |
| `brand` | product | string | no | `""` | Brand |
| `productName` | product | string | no | `""` | Product name; tab label source |
| `weight` | product | string | no | `""` | Weight |
| `sku` | product | string | no | `""` | SKU |
| `productionCode` | product | string | no | `""` | Production code (independent of SKU) |
| `site` | product | string | no | `""` | Allowed site (`OH1`/`OH2`/`BL`) |
| `artworkVersion` | product | string | no | `""` | Artwork revision label |
| `artworkLayers` | product | array | yes | `[layer-main]` | ArtworkLayer[] |
| `activeArtworkLayerId` | product | string | yes | `"layer-main"` | Active layer selection |
| `pantoneColors` | product | array | yes | `[]` | **Legacy** PantoneColour[] (compat only) |
| `items` | product | object | yes | 50 canonical items | ReviewItem[] by ID |
| `reviewer` | product | object | yes | `{name:"",role:"",reviewedAt:null}` | Future H1; never populated by current UI |
| `signature` | product | object\|null | yes | `null` | Future H3; never populated |
| `createdAt` | product | string | no | ISO now | Creation timestamp |
| `updatedAt` | product | string | no | ISO now | Touched by every mutation |

## ArtworkLayer

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | layer | string | yes | `"layer-main"` | Permanent layer ID |
| `name` | layer | string | yes | `"Main Artwork"` | Display name (non-empty) |
| `artwork` | layer | ArtworkMetadata\|null | no | `null` | Persistent metadata; binary is session-only |

## ArtworkMetadata

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `name` | layer | string | yes | — | File name |
| `type` | layer | string | yes | — | MIME type, must start `image/` |
| `size` | layer | number | yes | — | Bytes, ≥ 0 |
| `width` | layer | number | yes | — | Natural width, > 0 |
| `height` | layer | number | yes | — | Natural height, > 0 |

## ReviewItem

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | item | string | yes | canonical | e.g. `1a` … `6i` |
| `sectionId` | item | string | yes | canonical | e.g. `legal-core` |
| `originalTitle` | item | string | yes | canonical | Immutable (non-writable) |
| `currentTitle` | item | string | yes | canonical | Editable copy text |
| `note` | item | string | yes | canonical | Guidance text |
| `status` | item | enum | yes | `"pending"` | `pending`/`approved`/`rejected` |
| `comment` | item | string | yes | `""` | Review comment; required when rejected |
| `pins` | item | array | yes | `[]` | StoredLayerPin[] |

## StoredLayerPin

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `layerId` | pin | string | yes | — | Owning layer; must exist |
| `xRatio` | pin | number | yes | — | `0..1` proportion of artwork width |
| `yRatio` | pin | number | yes | — | `0..1` proportion of artwork height |

## Reviewer (model present, UI future)

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `name` | product | string | no | `""` | Reviewer name (future H1) |
| `role` | product | string | no | `""` | Reviewer role (future H1) |
| `reviewedAt` | product | string\|null | no | `null` | Review timestamp (future H1) |

## Legacy PantoneColour (backwards compatibility only)

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | colour | string | yes | — | Permanent colour ID |
| `name` | colour | string | yes | — | Colour name (≤ `PANTONE_LIMITS.NAME` = 120) |
| `pantoneCode` | colour | string | yes | — | Free text, e.g. `"PANTONE 186 C"` (≤ 120); no RGB/HEX |
| `notes` | colour | string | no | `""` | Notes (≤ 500) |
| `layerIds` | colour | array | yes | `[]` | Associated layer IDs |

Limits: `PANTONE_LIMITS = { CODE: 120, NAME: 120, NOTES: 500 }` (js/app.js:1101).

## Enums

| Enum | Values | Where |
| --- | --- | --- |
| `REVIEW_STATUSES` | `pending` / `approved` / `rejected` | js/app.js:134 |
| `REVIEW_STATUS_LABELS` | `Pending` / `Approved` / `Rejected` | js/app.js:140 |
| `ALLOWED_SITES` | `OH1` / `OH2` / `BL` | js/app.js:162 |
| Schema versions | `1` / `2` / `3` / `4` | migration chain |

## Related Documents

- [data-model.md](../architecture/data-model.md)
- [business-rules.md](business-rules.md)
- [glossary.md](glossary.md)
- [persistence/serialization.md](../persistence/serialization.md)