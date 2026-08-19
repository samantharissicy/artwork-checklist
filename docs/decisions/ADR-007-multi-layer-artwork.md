# ADR-007 — Multi-Layer Artwork

**Status: Accepted**

## Context

Packaging often has multiple surfaces (Front, Back, Sleeve, Label, Lid, Tray). The pre-G4 model supported a single artwork per product; pins were product-level. Reviews of multi-surface packaging could not be represented.

## Decision

Give every product a layer collection and an active layer:

```js
product.artworkLayers = [ { id, name, artwork: ArtworkMetadata|null } ];
product.activeArtworkLayerId = "layer-main";
```

- Layer IDs are permanent; names are display-only and renameable.
- Each layer owns its artwork metadata, session image and pins (`item.pins[]` entries carry `layerId`).
- Layer tabs (`renderArtworkLayerTabs`) switch layers without touching the active product.
- Schema v2 state migrates to v3 by wrapping the single artwork into `layer-main` and moving `item.pin` into `item.pins[0]`.

## Rationale

- Matches the physical artifact (surfaces) and the review mental model.
- Session isolation: replacing one layer's image never affects another (tested, e.g. `G4UX-028`).
- Zoom is viewer-global, not per layer — consistent with the single viewer canvas.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Product per surface | Falsely multiplies products; breaks review-of-one-packaging context |
| Pins without layer id | Cannot distinguish surfaces |
| Multiple viewers side-by-side | UI complexity; not required |

## Consequences

**Positive**

- One product = one review, N surfaces.
- Layer-aware pins with clean validation (`isValidStoredLayerPin`, `validateProductLayers`).
- Schema evolution handled centrally (v2→v3 migration chain).

**Negative**

- Pins render only for the active layer (hidden pins can surprise until the layer is switched — documented in the manual regression guide).
- Layer management adds UI surface (tabs, menus, dialogs).

## Revisit When

- Multiple simultaneous surfaces per view become a requirement (compare/merge UX).
- Backend revisioning per layer (roadmap M3).

## Related Files

- `js/app.js` — `createArtworkLayer`, `createArtworkLayerForProduct`, `switchArtworkLayer`, `deleteArtworkLayer`, `renderArtworkLayerTabs`, `renderPins`, `migrateStateV2ToV3`
- [architecture/artwork-workspace.md](../architecture/artwork-workspace.md)
- [architecture/pins-and-coordinate-system.md](../architecture/pins-and-coordinate-system.md)

## Related Roadmap Layers

G4 (multi-layer workspace), M3 (revisioning).