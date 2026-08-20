# Accessibility Status

**Status: Current** — this is an audit of what exists. It is **not** an accessibility certification or conformance claim.

## Current Implementation (evidence-based)

### ARIA attributes present in `index.html`

| Attribute | Where |
| --- | --- |
| `aria-label` | `#header-context`, `#product-tabs`, `#artwork-layer-tabs`, both context menus, product-form inputs, `#inp-site` |
| `role="tablist"` | `#product-tabs`, `#artwork-layer-tabs` |
| `role="tab"` / `aria-selected` | tab elements (aria-selected set via JS: , 8013) |
| `role="menu"` / `role="menuitem"` / `role="separator"` | both context menus (7 menuitems, 2 separators) |
| `role="dialog"` / `aria-modal` / `aria-labelledby` / `aria-describedby` | `#app-dialog-overlay` / `.app-dialog` |
| `aria-hidden` | dialog overlay, decorative SVGs |
| `aria-pressed` | approve/reject buttons (JS: ) |
| `aria-expanded` | comment buttons (JS: ) |
| `aria-invalid` | comment textarea on invalid rejection (JS: ) |
| `aria-disabled` | disabled context-menu items (JS: , 8666) |
| `role="alert"` | checklist item markup (JS template) |

### Keyboard support currently implemented

| Feature | Behaviour |
| --- | --- |
| Inline title edit | Enter commits, Escape cancels  |
| Context menus | Escape closes; ArrowUp/ArrowDown move focus  |
| Custom dialog | Escape dismisses; Enter submits when prompt input focused  |
| Buttons | All interactive controls are real `<button>` elements (keyboard-focusable by default) |

### Focus management

- Comment textarea focused after reject.
- Title-edit input focused + selected on begin.
- Dialog focus via `requestAnimationFrame`.
- `:focus-visible` styles exist in header.css and context-menu.css.

## Status Table

| Requirement | Current Status | Evidence | Planned Layer |
| --- | --- | --- | --- |
| Real labels for inputs | Implemented | `aria-label` on all product inputs; visible labels in dialog | — |
| Status not conveyed by colour alone | Partial | Status is text (`status-label`) + colour; buttons have `aria-pressed` | K2 |
| Keyboard navigation of checklist sections | Not implemented | Sections expand via click only | K2 |
| Focus trap in dialog | Partial | Escape/Enter handled; no explicit focus trap | K2 |
| `aria-live` announcements | Not implemented | Toast is visual only | K2 |
| Full keyboard alternative for drag-and-drop | Not implemented | Pin creation is drag-only (roadmap K3 proposes "Select item → click artwork") | K3 |
| Touch targets adequate | Not assessed | No touch-specific testing | K3 |
| Responsive layout / small viewports | Not implemented | No media queries in CSS (see [css-architecture.md](../architecture/css-architecture.md)) | I2 |
| Visible focus everywhere | Partial | `:focus-visible` on header buttons and context menus only | K2 |

## Recommendations (future, roadmap K2)

- Focus trap + `aria-modal` interplay review in the dialog.
- `aria-live="polite"` region for toast feedback.
- Keyboard path for section collapse/expand and pin placement.
- Consistent `:focus-visible` across all components.

## Related Documents

- [engineering/coding-standards.md](../engineering/coding-standards.md)
- [architecture/context-menus.md](../architecture/context-menus.md)
- [future/roadmap-technical-notes.md](../future/roadmap-technical-notes.md) — layer K2/K3.