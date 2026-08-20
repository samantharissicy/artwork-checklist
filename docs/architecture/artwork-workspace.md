# Artwork Workspace

**Status: Current**

## Purpose

Document the multi-layer artwork workspace: the product → layers relationship, layer lifecycle, artwork metadata, session binaries, demo artwork and the tri-state viewer.

## Product → Artwork Layers Relationship

```mermaid
flowchart TD
  Product --> Layers[artworkLayers[]]
  Product --> Active[activeArtworkLayerId]
  Layers --> L1[Layer: Front]
  Layers --> L2[Layer: Back]
  L1 --> A1[artwork metadata]
  L2 --> A2[artwork metadata]
  Product --> Pins[item.pins[] per layer]
```

- A product owns one or more layers; every layer has a permanent ID and a display name.
- Each layer carries its **own artwork metadata** (name/type/size/width/height) and its **own session image**.
- Pins carry `layerId` and belong to exactly one layer.
- Switching layers never changes the active product; switching products resets transient UI but layers persist in the product.

## ArtworkLayer Lifecycle

| Operation | Function | Behaviour |
| --- | --- | --- |
| Add | `addArtworkLayer()` → `createArtworkLayerForProduct` | Prompt for name; new layer becomes active; persisted; toast |
| Rename | `renameActiveArtworkLayer()` → `renameArtworkLayer` | Trims name; ID/artwork/pins/sessions untouched |
| Delete | `deleteActiveArtworkLayer()` → `deleteArtworkLayerWithDialog` → `deleteArtworkLayer` | Rejects deleting the **last** layer; dialog when layer has pins or artwork; clears layer pins, `clearPantoneLayerReferences`, releases session artwork, deterministic new active layer |
| Switch | `switchArtworkLayer(layerId)` | Sets active layer; persists; renders; scrolls tab; no timestamp touch |

## Artwork Metadata vs Binary vs Object URL

| Data | Persistence | Where |
| --- | --- | --- |
| `layer.artwork` metadata `{name,type,size,width,height}` | PERSISTED | inside `appState` |
| Binary image | SESSION-ONLY | `artworkSessions` Map |
| Object URL | RUNTIME-ONLY | inside session record `{metadata, objectUrl}` |

**Explicit rule:** metadata is persistent; the binary is session-only; the Object URL is runtime-only. Reload restores metadata (and the "File required" state) but never the image.

## Artwork Session Model

```mermaid
flowchart TD
  S[artworkSessions Map] --> P1[productId]
  S --> P2[other products]
  P1 --> L1[layerId -> {metadata, objectUrl}]
  P1 --> L2[other layers]
```

| Function | Purpose |
| --- | --- |
| `inspectArtworkFile(file)` | `URL.createObjectURL` + `new Image()`; loads natural dimensions; revokes URL on failure |
| `createArtworkMetadata(file, width, height)` | Canonical metadata factory |
| `adoptSessionArtwork(metadata, objectUrl, productId, layerId)` | Stores session; revokes previous URL for that (product, layer) |
| `releaseLayerSessionArtwork`, `releaseProductSessionArtworks`, `releaseSessionArtwork` | Revoke + remove |
| `releaseAllSessionArtworks()` | Bound to `beforeunload` |
| `isArtworkLoadedInSession(metadata, productId, layerId)` | Whether the session still holds the matching binary |
| `handleArtworkFileChange(event)` | Upload entry: validates `image/*`, inspects, re-verifies target (product, layer) after async read, applies identity rules, adopts session |

## File Selection and Replacement

1. `selectArtwork()` opens `#artwork-file-input` (`accept="image/*"`, hidden).
2. `handleArtworkFileChange` captures `targetProductId` + `targetLayerId` **at event start** (async-safety), validates type, inspects the file.
3. Identity comparison: `isSameArtworkIdentity`. If the identity differs and the layer has pins, `applyArtworkIdentity` requests confirmation — message: `"Replacing this artwork will invalidate existing pins.\nContinue?"` (`ARTWORK_REPLACEMENT_MESSAGE`).
4. Confirmed replacement clears the layer's pins and adopts the new metadata + session image.

## Viewer Tri-State (renderArtworkState)

| State | DOM |
| --- | --- |
| Demo artwork | `#demo-artwork` visible; `#artwork-image`/`#artwork-missing` hidden; badge "Demo Artwork" |
| Loaded image | `#artwork-image` visible (src = session Object URL); `#artwork-meta` shows name + dimensions |
| File required (metadata without session) | `#artwork-missing` visible; badge "File Required"; user re-selects the same file to restore the image |

Demo artwork is a built-in HTML/CSS pack mock (front + back, `data-el` elements) — it has no metadata and no session.

## Behaviour Notes (verified by tests)

- Replacing the image of one layer does not affect other layers' sessions.
- Deleting a layer releases **only that layer's** session (asserted by `G4UX-028`).
- Duplicating a product copies metadata but **not** session binaries (fresh session on reload).
- `data-pid` attributes on pins are retained for backward compatibility alongside `data-item-id`/`data-layer-id`.

## Related Documents

- [data-model.md](data-model.md) — ArtworkMetadata shape.
- [pins-and-coordinate-system.md](pins-and-coordinate-system.md)
- [persistence/serialization.md](../persistence/serialization.md) — what is/isn't serialized.
- [decisions/ADR-004-session-only-artwork-binaries.md](../decisions/ADR-004-session-only-artwork-binaries.md)
- [operations/recovery-and-backup.md](../operations/recovery-and-backup.md)