# Pins and Coordinate System

**Status: Current**

## Purpose

Document why pins are normalized, the coordinate model, conversion math, zoom independence, layer ownership, and legacy migration.

## Why Pins Are Normalized

Pixel coordinates are meaningless when the artwork viewer can be zoomed (50%–200%) or the window resized. Pins are stored as **ratios of the artwork's natural dimensions**, so the same stored review renders correctly at any viewport size and zoom level. See [decisions/ADR-005-normalized-pin-coordinates.md](../decisions/ADR-005-normalized-pin-coordinates.md).

## Model

```js
{
  layerId: "layer-front",  // owning artwork layer
  xRatio: 0.42,            // 0..1 proportion of artwork width
  yRatio: 0.18             // 0..1 proportion of artwork height
}
```

- Stored in `item.pins[]`; **one pin per (item, layer)** — an item may be pinned on multiple layers.
- Validated by `isValidStoredLayerPin` (js/app.js:5534): non-empty string `layerId`, finite ratios in `[0, 1]`.
- `validateItemPins` (js/app.js:5562) additionally rejects duplicate (item, layer) pairs.

## Coordinate Space

| Space | Representation | Notes |
| --- | --- | --- |
| Browser pixels | `clientX`, `clientY` relative to `#artwork-wrapper` bounds | Used only transiently at interaction time |
| Normalized | `xRatio = (clientX - left) / width`, clamped 0..1 | What is stored |
| CSS rendering | `left: <xRatio*100>%`, `top: <yRatio*100>%` | What the DOM shows |

### Browser → Normalized

`calculatePinRatios(clientX, clientY, rect)` (js/app.js:4226): subtracts the artwork wrapper's bounding rect origin, divides by width/height, clamps to `[0, 1]`.

### Normalized → CSS Percentage

`createPinElement`/`renderPins` position each `.pin` with percentage `left`/`top` derived from `xRatio`/`yRatio` — independent of the zoom transform applied to `#artwork-wrapper`.

## Zoom Independence

- `zoom(delta)` (js/app.js:2782) scales `#artwork-wrapper` via `transform: scale(N)`, range `0.5..2.0`.
- Pins render in the **unscaled coordinate system** of the wrapper; the transform scales both artwork and pins together, so ratios stay correct at any zoom.
- Tests assert: `E1 zoom does not mutate normalized pin state` and pins render at correct ratios at 50%/100%/200% (`e1-pin-geometry.test.js`).

## Multi-Layer Pin Ownership

- `item.pins[]` holds pins for **all** layers; each pin records `layerId`.
- `renderPins()` (js/app.js:4452) renders only pins whose `layerId` equals the **active layer** (pins of other layers stay hidden until their layer is active).
- `setItemPinForLayer(itemId, layerId, pin)` (js/app.js:1810) assigns/replaces/removes the pin for one (item, layer).
- `addPin(itemId, pin)` (js/app.js:4496) uses the active layer, renders immediately, persists and toasts.
- `removeItemPinFromLayer(itemId, layerId)` (js/app.js:1861) removes one layer pin.

## Interaction Flows

### Drag-and-drop (checklist → artwork)

1. Checklist item `dragstart` (js/app.js:2629): `dataTransfer.setData("text/plain", item.id)`, `effectAllowed = "copy"`, `.dragging` class.
2. `#pins-layer` `dragover` (4296): `preventDefault()` (allow drop).
3. `drop` (4300): reads item id, `calculatePinRatios`, `addPin`.

### Pin → item / item → pin navigation

- Click a pin: `scrollToItem` (js/app.js:4560) scrolls the checklist to the item and highlights it.
- Hover an item (mouseenter/mouseleave, js/app.js:2647/2651): highlights its pin.

### Clear Pins

`clearPins()` (js/app.js:5360) clears pins of the **active layer only** (`clearLayerPins`), touches timestamp, persists, re-renders, toasts.

## Artwork Replacement Consequences

- Replacing the artwork of a layer with a **different identity** and existing pins requires confirmation; confirmed replacement **clears the layer's pins** (`applyArtworkIdentity`, js/app.js:4662).
- The same-file reselection keeps pins (identity unchanged).
- Deleting a layer clears its pins; deleting a product clears all its pins.

## Migration from Legacy Absolute Pixels (v1 → v2)

- Legacy v1 pin shape: `{x, y}` pixels (`isLegacyPixelPin`, js/app.js:4201).
- `convertLegacyPixelPin(pin, width, height)` (js/app.js:4283) → `{xRatio: x/width, yRatio: y/height}` using the artwork base dimensions.
- `migrateItemsPinsToV2(items, dimensions)` (js/app.js:6056) applies it per item during `migrateStateV1ToV2`.
- `normalizedPinToPixels(pin)` (js/app.js:6628) converts back — used only by the **legacy baseline export** (`buildLegacyCheckData`, js/app.js:6669) which still writes pixel pins and boolean checks for old consumers.

## Example

```js
// Drop at browser point (clientX=516, clientY=240) on a 480x300 artwork box:
const pin = { layerId: "layer-main", xRatio: 0.52, yRatio: 0.33 };
// Rendered as: left: 52%; top: 33%;
// Survives zoom 50%, 100%, 200% and window resizes.
```

## Related Documents

- [data-model.md](data-model.md) — StoredLayerPin model.
- [artwork-workspace.md](artwork-workspace.md) — session artwork.
- [decisions/ADR-005-normalized-pin-coordinates.md](../decisions/ADR-005-normalized-pin-coordinates.md)
- [persistence/migrations.md](../persistence/migrations.md) — v1→v2 pin migration.