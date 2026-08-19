# Technology Stack

**Status: Current**

## Runtime

| Item | Value |
| --- | --- |
| Runtime | Browser (client-side only) |
| Framework | None |
| Package manager | None |
| Build tool | None |
| Backend | None |
| Database | None |
| External runtime dependencies | None |

## Languages

| Language | Usage |
| --- | --- |
| HTML5 | `index.html` — single-page markup |
| CSS | Modular stylesheets under `css/` (see [css-architecture.md](../architecture/css-architecture.md)) |
| JavaScript | Vanilla ES2020+ classless script style; `js/app.js` (~9,805 lines, 203 named functions), `js/tests.js` + `js/tests/**` |

## Persistence

| Mechanism | Use |
| --- | --- |
| `localStorage` | Versioned review state (`artworkChecklist:v4`); see [persistence-and-schema.md](../architecture/persistence-and-schema.md) |
| JSON files | Save Check export / Open Check import (portable review files) |

## File Handling

| Mechanism | Use |
| --- | --- |
| File API (`file.text()`) | Reading imported review JSON (`handleCheckFileChange`, js/app.js:9692) |
| `File` + `Image` | Artwork upload inspection (`inspectArtworkFile`, js/app.js:5052) |
| `Blob` + Object URL | JSON download (`downloadJsonFile`, js/app.js:6745) |
| `URL.createObjectURL` / `URL.revokeObjectURL` | Session artwork and download lifecycle |

## Browser APIs Used (verified)

| API | Where |
| --- | --- |
| `localStorage` | `saveStateToStorage` / `loadStateFromStorage` (js/app.js:6484/6408) |
| `crypto.randomUUID` | ID generation (with `Date.now()`/`Math.random()` fallback, js/app.js:735) |
| Drag and Drop API | Checklist → artwork pinning (js/app.js:2629, 4296, 4300) |
| Pointer/mouse events | `pointerdown` stopPropagation, `mouseenter`/`mouseleave` pin highlight |
| DOM events | `click`, `input`, `change`, `contextmenu`, `blur`, `keydown` |
| `JSON` / `Date` | Serialization, timestamps |
| `requestAnimationFrame` | Dialog focus (js/app.js:9082) |
| `scrollIntoView` | Tab and item scrolling |
| `window.confirm` | Only as a default dependency-injection parameter (`deleteProduct`, `applyArtworkIdentity`) — the UI uses the custom dialog |

**Not used** (do not document as part of the stack): `FileReader`, `canvas`, `ResizeObserver`, `IntersectionObserver`, `CustomEvent`, Web Workers, IndexedDB.

## Styling

Modular CSS with a single entry point (`css/style.css`, 18 `@import`s): base → layout → components → utilities. No CSS framework, no preprocessor, no CSS custom properties. See [css-architecture.md](../architecture/css-architecture.md).

## Testing

Custom, dependency-free browser test framework built into the app:

| Component | Purpose |
| --- | --- |
| `js/tests/core/framework.js` | `test(name, fn)` + assertions (`assert`, `assertEqual`, `assertDeepEqual`, `assertClose`, …) |
| `js/tests/core/helpers.js` | Fixtures (`createTestArtworkMetadata`), snapshot/restore, DOM lookup helpers |
| `js/tests/core/runner.js` | Snapshot → run 373 tests → restore, console reporting |
| `js/tests/layers/*.test.js` | 12 layer test modules (baseline, B1–G5) |

Entry point: `runArtworkTests()` from DevTools. See [testing-strategy.md](testing-strategy.md).

## Development Server

Any static HTTP server. The README documents:

```text
python -m http.server 5500
```

No `npm install` is necessary. See [operations/local-development.md](../operations/local-development.md).

## Why This Stack

Intentional simplicity (project principles P-003, P-006):

- The app is a **local, single-user review tool**; a backend would add no value for the current scope.
- Zero dependencies means zero supply-chain and build risk; the repo runs as-is from a static server.
- The educational nature of the project favors small explicit functions over framework abstractions.
- The architecture keeps state, rendering and persistence separated *by convention* (see [architecture-overview.md](../architecture/architecture-overview.md)) so a future module split is feasible.

## Constraints

| Constraint | Consequence |
| --- | --- |
| No dependency manager | No third-party code; everything is first-party |
| No build | Source files are served directly; ES modules not used (classic scripts) |
| No backend | Data never leaves the browser; no multi-user collaboration |
| Local browser runtime | Requires a static server for full File API behavior (see [browser-runtime.md](browser-runtime.md)) |

## When This Stack Should Change

Only if real needs appear (documented as future layers, not commitments):

- Multi-user / shared reviews / audit trail / auth → backend (layer M; [backend-transition.md](../future/backend-transition.md)).
- Module separation → ES modules (layer L1).
- High-resolution artwork persistence → IndexedDB or object storage (layer I1).
- Print/PDF report → `window.print()` first, libraries only if proven necessary (layer J3).

See [future/roadmap-technical-notes.md](../future/roadmap-technical-notes.md) and [decisions/ADR-001-vanilla-web-stack.md](../decisions/ADR-001-vanilla-web-stack.md).