# Data Dictionary

**Status: Current**

## Purpose

Field-by-field reference for all persisted data. Models and factories: [data-model.md](../architecture/data-model.md). Ownership: [state-management.md](../architecture/state-management.md).

## AppState

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `schemaVersion` | workspace | number | yes | `5` | Must equal `CURRENT_SCHEMA_VERSION` |
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
| `reviewer` | product | object | yes | `{name:"",role:"",reviewedAt:null}` | Current decision-maker form for sign-off |
| `signOffs` | product | array | yes | three canonical Pending entries | Required department decisions and optional signatures |
| `signature` | product | object\|null | yes | `null` | Legacy product-level signature field |
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

## Reviewer

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `name` | product | string | no | `""` | Current reviewer name; required with role before a decision |
| `role` | product | string | no | `""` | Current reviewer role; required with name before a decision |
| `reviewedAt` | product | string\|null | no | `null` | Timestamp of the most recently recorded department decision |

## DepartmentSignOff

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `departmentId` | sign-off | string | yes | canonical | `quality`, `production`, `product-development` |
| `departmentName` | sign-off | string | yes | canonical | Display name; cannot be redefined by import |
| `reviewer` | sign-off | object | yes | blank name/role | Snapshot copied when decision is completed |
| `status` | sign-off | enum | yes | `"pending"` | Independent department decision |
| `comment` | sign-off | string | yes | `""` | Required for a valid Rejected decision |
| `reviewedAt` | sign-off | string\|null | yes | `null` | Decision timestamp |
| `artworkVersion` | sign-off | string | yes | `""` | Exact artwork revision approved/rejected |
| `signature` | sign-off | DepartmentSignature\|null | yes | `null` | Optional visual signature |

## DepartmentSignature

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `dataUrl` | signature | string | yes | — | PNG data URL, maximum 250,000 characters |
| `signedAt` | signature | string | yes | — | ISO signature timestamp |
| `width` | signature | number | yes | `900` | Positive intrinsic canvas width |
| `height` | signature | number | yes | `260` | Positive intrinsic canvas height |

## ReportData (derived, not persisted)

`buildReportData(product)` creates this detached projection only when a report is requested. It is not part of schema v5, `appState`, localStorage or Save Check JSON.

| Field | Type | Meaning |
| --- | --- | --- |
| `generatedAt` | string | ISO report-generation timestamp |
| `reviewDate` | string\|null | Latest valid reviewer/sign-off/product-update timestamp |
| `productInformation` | object | Detached product fields and artwork-layer metadata |
| `reviewMetadata` | object | Schema/timestamps, derived overall/final status, blockers, metrics and summary counts |
| `sections` | array | Six canonical categories with metrics and detached review items |
| `approvedItems` | array | Items whose status is `approved` |
| `rejectedItems` | array | Items whose status is `rejected` |
| `pendingItems` | array | Items whose status is `pending` |
| `comments` | array | Non-empty item comments with item/category context |
| `copyCorrections` | array | Edited items with original and current copy |
| `reviewer` | object | Current reviewer snapshot |
| `signOffs` | array | Detached department decisions and optional signatures |
| `signatures` | array | Signed-department summary |

## Legacy PantoneColour (backwards compatibility only)

| Field | Owner | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | colour | string | yes | — | Permanent colour ID |
| `name` | colour | string | yes | — | Colour name (≤ `PANTONE_LIMITS.NAME` = 120) |
| `pantoneCode` | colour | string | yes | — | Free text, e.g. `"PANTONE 186 C"` (≤ 120); no RGB/HEX |
| `notes` | colour | string | no | `""` | Notes (≤ 500) |
| `layerIds` | colour | array | yes | `[]` | Associated layer IDs |

Limits: `PANTONE_LIMITS = { CODE: 120, NAME: 120, NOTES: 500 }`.

## Enums

| Enum | Values |
| --- | --- |
| `REVIEW_STATUSES` | `pending` / `approved` / `rejected` |
| `REVIEW_STATUS_LABELS` | `Pending` / `Approved` / `Rejected` |
| `ALLOWED_SITES` | `OH1` / `OH2` / `BL` |
| Schema versions | `1` / `2` / `3` / `4` / `5` |

## Related Documents

- [data-model.md](../architecture/data-model.md)
- [business-rules.md](business-rules.md)
- [glossary.md](glossary.md)
- [persistence/serialization.md](../persistence/serialization.md)
- [cross-functional-signoff.md](cross-functional-signoff.md)
- [architecture/reporting.md](../architecture/reporting.md)
