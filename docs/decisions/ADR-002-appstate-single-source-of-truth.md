# ADR-002 — appState Single Source of Truth

**Status: Accepted**

## Context

The original prototype stored state in the DOM: checkboxes represented approval, CSS classes represented visual state, inputs held product data, and objects like `pins`/`itemTitles` duplicated data that also lived in HTML. This made state inconsistent, hard to persist, and risky to evolve (the original specification explicitly identified this as the main architectural problem).

## Decision

Domain state lives in a single object:

```js
const appState = { schemaVersion: 4, activeProductId: "product-1", products: {} };
```

(js/app.js:636). The DOM is a **projection**: renderers rebuild it from `appState`; event handlers read state and call named domain mutations; no authoritative data is read back from the DOM. Serialization is `JSON.stringify(appState)`.

## Rationale

- One mutation point per concept (`setItemStatus`, `setItemComment`, `setItemPinForLayer`, …) → validation before mutation is natural.
- Persistence becomes trivial and complete (`serializeState`).
- Rendering is deterministic: state → render → DOM.
- The DOM can be rebuilt at any time without losing data.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Keep DOM-driven state | Original problem: duplicated state diverges; persistence requires scraping the DOM |
| Two-way binding framework | Violates ADR-001 (no framework) |

## Consequences

**Positive**

- Single source of truth; tests assert state directly.
- Safe rebuilds: `renderChecklist`/`renderAppState` can be called anytime.
- Import/export and migration operate on state, not UI.

**Negative**

- Discipline required: renderers must not be used to store state; some legacy inline handlers remain (13 `onclick` in `index.html`).

## Revisit When

- The codebase grows enough to justify a state library or module boundary changes (roadmap L1).
- If two-way data binding were ever needed at scale — not currently the case.

## Related Files

- `js/app.js` — `appState`, renderers, domain mutations
- [architecture/state-management.md](../architecture/state-management.md)
- [architecture/rendering-model.md](../architecture/rendering-model.md)

## Related Roadmap Layers

B1 (domain foundation), D1 (serialization), L1 (module separation).