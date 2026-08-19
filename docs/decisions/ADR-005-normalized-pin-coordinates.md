# ADR-005 — Normalized Pin Coordinates

**Status: Accepted**

## Context

The baseline stored pins as absolute pixel coordinates (`{x, y}`). The viewer supports zoom (50%–200%) and arbitrary window sizes; pixel pins lose alignment when the display changes, and different reviewers' screens would produce different stored positions.

## Decision

Store pins as **normalized ratios of the artwork's natural dimensions**:

```js
{ layerId: "layer-front", xRatio: 0.42, yRatio: 0.18 }   // 0..1
```

Browser coordinates are converted with `calculatePinRatios` (clamped to `[0,1]`); rendering uses percentage CSS (`left: 42%; top: 18%`), which is independent of the zoom transform. Schema v1 pixel pins are migrated via `convertLegacyPixelPin` (v1→v2).

## Rationale

- Zoom and responsive viewers work for free: the CSS transform scales artwork and pins together.
- The same review file renders identically on different displays.
- Ratios are simple to validate (`isValidStoredLayerPin`) and to test (E1 suite: 50%/100%/200% zoom assertions).

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Absolute pixels | Breaks under zoom/resize; not portable across displays |
| Percentages strings | Equivalent mathematically; ratios are cleaner for math and storage |
| CSS anchors | Over-engineered; no framework support needed |

## Consequences

**Positive**

- Stable pin geometry across zoom levels, window sizes and export/import round-trips.
- Simple, tested conversion functions.

**Negative**

- Pins are relative to the artwork box; if the artwork aspect ratio changes on replacement, pins must be re-validated (handled by replacement confirmation + pin clearing).

## Revisit When

- Artwork cropping/panning within the viewer is introduced (would need offset model).
- Backend stores positions server-side (still fine as ratios).

## Related Files

- `js/app.js` — `calculatePinRatios`, `convertLegacyPixelPin`, `normalizedPinToPixels`, `isValidStoredLayerPin`, `renderPins`
- [architecture/pins-and-coordinate-system.md](../architecture/pins-and-coordinate-system.md)
- [persistence/migrations.md](../persistence/migrations.md)

## Related Roadmap Layers

E1 (pin normalization), E2 (artwork identity).