# Performance Considerations

**Status: Current** — no benchmarks exist; this is a qualitative analysis of observed architecture. Do not prematurely optimize.

## Current Risk Assessment

| Area | Risk | Notes |
| --- | --- | --- |
| DOM rebuild patterns | Low | Full rebuilds of `#checklist` (50 items), tabs and pins are acceptable at current scale; `renderAppState` re-renders per item |
| 50 checklist items | Low | Single-digit-ms rendering on modern hardware |
| Multi-product scale | Low–Medium | Whole-workspace serialization (`JSON.stringify(appState)`) on every mutation grows with product count |
| Multi-layer scale | Low | Layers are few (typical 1–3) |
| Artwork binary memory | Medium | Binary held in memory for the session (per product+layer); large images multiply |
| Object URL lifecycle | Managed | Every URL has a revocation path; `beforeunload` releases all |
| Large images | Medium | Full-size `Image` decode + Object URL; no downscaling |
| `localStorage` size | Low | Only textual metadata is persisted (~KB scale), well under the ~5 MB quota |
| JSON export size | Low | Text-only export |
| Render frequency | Low | Renders occur on user actions, not continuous loops |
| Context-menu overhead | Negligible | Positioning is a pure function on 4 measurements |

## Observed Architecture (why it is fine today)

- `serializeState()` is `JSON.stringify(appState)` — O(workspace), called after mutations; simple and safe.
- Rendering is imperative but deterministic: state → render → DOM, no diffing needed at this scale.
- `renderPins` rebuilds the pins layer on pin changes — O(pins on active layer).
- Zoom uses CSS `transform: scale` — GPU-friendly, no re-layout of the image.

## Possible Future Optimizations (only if needed)

| Scenario | Optimization |
| --- | --- |
| Many products / larger state | Debounced persistence; selective per-product serialization |
| Huge checklists | DOM diffing or incremental item rendering |
| Very large artwork images | Downscale for display; store dimensions; defer decode (planned I1) |
| Frequent renders | Batching renders via `requestAnimationFrame` |
| Module growth | Module split (planned L1) improves maintainability, not raw speed |

## Related Documents

- [architecture/rendering-model.md](../architecture/rendering-model.md)
- [architecture/state-management.md](../architecture/state-management.md)
- [future/layer-planning.md](../future/layer-planning.md) — layers I, K4, L1.