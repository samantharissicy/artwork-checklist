# CSS Architecture

**Status: Current**

## Purpose

Document the actual, modular CSS architecture of the project.

## Entry Point

`css/style.css` is the **single stylesheet entry point** — the only `<link rel="stylesheet">` in `index.html`. It contains **no rules**; it is an ordered list of `@import` statements:

```css
/* order: Base → Layout → Components → Utilities */
@import url("./base/reset.css");
@import url("./base/globals.css");
@import url("./layout/app-shell.css");
@import url("./components/header.css");
@import url("./components/product-tabs.css");
@import url("./components/context-menu.css");
@import url("./components/product-form.css");
@import url("./components/checklist.css");
@import url("./components/review-controls.css");
@import url("./components/progress.css");
@import url("./components/viewer.css");
@import url("./components/artwork-layers.css");
@import url("./components/demo-artwork.css");
@import url("./components/pins.css");
@import url("./components/feedback.css");
@import url("./components/signoff.css");
@import url("./components/dialog.css");
@import url("./utilities/scrollbar.css");
@import url("./utilities/visibility.css");
```

(19 imports; dependency order is documented in the file header.)

## Current CSS Tree

```text
css/
├── style.css                      → single entry point (19 @imports, no rules)
├── style.legacy.css               → orphaned historical stylesheet (not linked/imported)
├── base/
│   ├── reset.css                  → box-sizing + margin/padding zeroing
│   └── globals.css                → body defaults (font stack, bg, 100vh, overflow)
├── layout/
│   └── app-shell.css              → .app, .main, .left-panel (420px), .right-panel
├── components/
│   ├── header.css                 → header identity, context strip, badges, Open/Save
│   ├── product-tabs.css           → product tab bar + actions
│   ├── context-menu.css           → shared right-click menus (z-index 1200)
│   ├── product-form.css           → product metadata grid inputs
│   ├── checklist.css              → sections, items, status styling
│   ├── review-controls.css        → approve/reject buttons, comments, copy editing
│   ├── progress.css               → progress bar footer
│   ├── viewer.css                 → toolbar, canvas area, zoom wrapper
│   ├── artwork-layers.css         → artwork layer tabs + actions
│   ├── demo-artwork.css           → built-in pack mock (front/back)
│   ├── pins.css                   → pins layer, pins, tooltips, pulse animation
│   ├── feedback.css               → hint bar + toast
│   ├── signoff.css                → Layer H panel, department cards, signature pad, responsive breakpoints
│   ├── dialog.css                 → custom modal dialog (tones, prompt)
│   └── artwork-colours.css        → LEGACY (Pantone UI, not imported)
└── utilities/
    ├── scrollbar.css              → WebKit scrollbar styling
    └── visibility.css             → .hidden { display:none !important }
```

## Rules (as implemented)

| Rule | Evidence |
| --- | --- |
| Component files do not import one another | No `@import` outside `style.css` |
| Dependency order centralized in the entry point | 19 ordered `@import`s in `style.css` |
| Component responsibility | One file per UI component |
| No CSS framework | Vanilla CSS only |
| No inline `style=""` in HTML | Zero matches in `index.html` |
| Utility styles for generic concerns | `.hidden`, scrollbar styling |
| Imported nowhere / retained: legacy files | `style.legacy.css` (1454 lines, orphaned); `artwork-colours.css` (LEGACY banner, not imported) |

## Notable Facts

- **No CSS custom properties** (`:root` variables): colors are flat hex values.
- Layer H adds targeted `@media (max-width: 980px)` / `680px` rules for the sign-off/signature modals. The main application workspace remains desktop-first, and there is still no `@media print` (I2/J2 remain broader future work).
- `!important` appears exactly once in the active tree: `.hidden { display: none !important; }` in `utilities/visibility.css` — intentionally loaded last so it overrides component display rules.
- Status colors are driven by `[data-status]` attributes on `.check-item` (pending/approved/rejected), set by JS from state.

## Legacy Files

### `css/style.legacy.css`

The pre-modularization monolithic stylesheet (1454 lines). It duplicates current modular rules (reset, header, tabs, checklist, review controls, comments, progress, viewer, demo artwork, pins, toast, dialog, scrollbar). It is **not** linked or imported anywhere — it is a historical artifact retained for reference and potential diffing.

### `css/components/artwork-colours.css`

Carries a LEGACY banner: "LEGACY PANTONE SPECIFICATION METADATA — CSS / Backward compatibility only". It contains the retired Colour Specification UI rules (`.colour-specification`, `.pantone-colour-*`, …) and is **no longer imported by style.css**. It is retained untouched for historical reference; the G5 test suite asserts the component element does not exist.

## Related Documents

- [engineering/tech-stack.md](../engineering/tech-stack.md) — styling section.
- [engineering/coding-standards.md](../engineering/coding-standards.md) — CSS conventions.
- [future/layer-planning.md](../future/layer-planning.md) — K2 (accessibility) and I2 (responsive) impact CSS.
