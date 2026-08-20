# Coding Standards

**Status: Current**

## Purpose

Document the conventions actually used in the codebase. These describe the current state; future recommendations are clearly marked as such.

## JavaScript (current conventions)

| Convention | Evidence |
| --- | --- |
| Module-level functions, no classes, no ES modules | `js/app.js` — 203 top-level named functions |
| `const` by default; `let` for mutable module state | `currentZoom`, `editingTitleItemId` are `let`; most declarations `const` |
| Descriptive function names | `setItemStatus`, `renderArtworkState`, `migrateStateV3ToV4`, `isValidArtworkMetadata` |
| Small, single-purpose functions | see [architecture-overview.md](../architecture/architecture-overview.md) |
| JSDoc-style comments in English for domain types | typedefs at –129 (`PantoneColour`, `ArtworkMetadata`, `StoredLayerPin`, `ReviewItem`, …) |
| Explicit domain functions instead of inline mutations | `setItemStatus`, `setItemComment`, `setItemPinForLayer`, `touchProduct` |
| No hidden DOM state | DOM is rebuilt from `appState`; event handlers read state, not DOM values |
| User content via `textContent` | titles, comments and notes are rendered as text, not injected HTML |
| Async target capture | `handleArtworkFileChange` captures `targetProductId`/`targetLayerId` before `await` |
| Validation before mutation | `validateItemState`, status whitelists, non-empty name checks, `isValidArtworkMetadata` |
| Constants frozen | `REVIEW_STATUSES`, `REVIEW_STATUS_LABELS`, `ALLOWED_SITES`, `PANTONE_LIMITS` are `Object.freeze`d |
| No `window.*` exports from app.js | Tests reach functions through the shared global scope of classic scripts |
| `"use strict"` | **Not present in `js/app.js`**; present in `js/tests.js` and all `js/tests/**` files |

## HTML (current conventions)

| Convention | Evidence |
| --- | --- |
| `type="button"` on interactive buttons | viewer toolbar, tabs actions, etc. |
| Stable IDs for stateful elements | `#product-tabs`, `#artwork-layer-tabs`, `#checklist`, `#pins-layer`, `#app-dialog-overlay`, `#toast`, file inputs |
| Minimal inline handlers remain as legacy | 13 `onclick="…"` attributes in `index.html` (Open Check, Save, product actions, zoom, Clear Pins, layer actions) |
| ARIA attributes used | `aria-label`, `role="tablist"/"tab"/"menu"/"menuitem"/"dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `aria-hidden`; JS-driven `aria-selected`, `aria-pressed`, `aria-expanded`, `aria-invalid`, `aria-disabled` |
| `data-*` attributes for state hooks | `.check-item[data-id]`, `[data-action]`, `[data-role]`, `[data-status]`, `[data-product-id]`, `[data-layer-id]`, `[data-pid]` |

## CSS (current conventions)

| Convention | Evidence |
| --- | --- |
| Modular responsibilities, one file per component | 14 component files under `css/components/` |
| Dependency order centralized in `style.css` | 18 ordered `@import`s (base → layout → components → utilities) |
| Component isolation: no cross-imports between components | only `style.css` imports |
| No framework | vanilla CSS |
| No unnecessary `!important` | exactly one in the active tree (`.hidden`, utilities/visibility.css) |
| No CSS custom properties, no preprocessors | flat hex values |

See [css-architecture.md](../architecture/css-architecture.md).

## Testing (current conventions)

| Convention | Evidence |
| --- | --- |
| Test names identify roadmap layer | `G5R-001 …` (Pantone compliance), `G4A-…`, `G4UX-…`, `E1 …`, `D2 …`, `B1 …` |
| Regression tests preserved across features | suite grows: 312 → 357 → 373 |
| Tests self-reset their own state | `resetItem1A()`, `resetWorkspaceForMultiProductTest()`, `resetArtworkForTest()` |
| Test files are IIFEs over `window.ArtworkTests` | destructure `test`, `assertEqual`, helpers at load time |

See [testing-strategy.md](testing-strategy.md).

## Future Recommendations (not yet applied)

| Area | Recommendation | Planned layer |
| --- | --- | --- |
| JavaScript | Add `"use strict"` to `js/app.js` (currently only tests use it) | K4 / L1 |
| JavaScript | Migrate inline `onclick` attributes to `addEventListener` bindings | L1 |
| JavaScript | Split `js/app.js` into modules (`state.js`, `storage.js`, `checklist.js`, `artwork.js`, `pins.js`, `products.js`, …) | L1 |
| HTML/CSS | Media queries, `@media print`, responsive layout | I2 / J2 |
| HTML | Full keyboard navigation review and focus-visible polish | K2 |
| CSS | Introduce CSS custom properties for colors | K1 |

These are documented as planned directions, not current requirements.