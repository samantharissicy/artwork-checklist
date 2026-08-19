# Baseline — Behavior Documentation

> **Reference:** layer **A0** — baseline freeze.
> This document records, item by item, **how the prototype works today**. Any future evolution must preserve these behaviors (principle P-002).
>
> **How to verify the baseline:** open `index.html` in the browser and make sure the app opens normally with no console errors.

---

## Table of Contents

1. [Overview](#overview)
2. [Checklist: the 6 sections](#checklist-the-6-sections)
3. [Checklist: the 49 items](#checklist-the-49-items)
4. [Product data](#product-data)
5. [Collapsible sections](#collapsible-sections)
6. [Progress bar](#progress-bar)
7. [Demo artwork](#demo-artwork)
8. [Artwork upload](#artwork-upload)
9. [Zoom](#zoom)
10. [Drag-and-drop](#drag-and-drop)
11. [Pin creation](#pin-creation)
12. [Pin ↔ item navigation](#pin--item-navigation)
13. [Clear Pins](#clear-pins)
14. [JSON export (Save Check)](#json-export-save-check)
15. [Toast (visual feedback)](#toast-visual-feedback)
16. [Current state map](#current-state-map)
17. [Regression test battery](#regression-test-battery)

---

## Overview

| Property | Value |
|---|---|
| App | Artwork & Pack Copy Checklist |
| Standard | BRCGS Product Labelling 5.2.1 \| Multi-Site Aligned |
| Architecture | `index.html` + `css/style.css` + `js/app.js` (plain JavaScript) |
| External dependencies | None |
| Current frame (baseline) | Features marked with ✅ below |

---

## Checklist: the 6 sections

The checklist is **rendered by JavaScript** from the `sections` array (`js/app.js`). The HTML only holds the `#checklist` container. The first section opens expanded; the rest start collapsed.

| # | Section | Items | IDs |
|---|---------|:---:|---|
| 1 | Legal Core (BRCGS 5.2.1) | 10 | 1A–1J |
| 2 | Ingredients & Allergens | 5 | 2A–2E |
| 3 | Nutrition & Serving | 10 | 3A–3J |
| 4 | Storage & Cooking | 4 | 4A–4D |
| 5 | Claims & Certifications | 12 | 5A–5L |
| 6 | Packaging, Marks & Languages | 8 | 6A–6H |
| **Total** | | **49** | |

---

## Checklist: the 49 items

Each item has `id`, `title` and an optional `note` shown under the title. The displayed reference is the `id` in uppercase (e.g. `1A`).

### 1. Legal Core (BRCGS 5.2.1)

| ID | Item | Note |
|:--:|---|---|
| 1A | Product Name / Legal Name | Must be clear, not misleading, and reflect true nature of food |
| 1B | Net Quantity (Weight / Volume) | g or ml, with e-mark where applicable |
| 1C | e Mark Present | If pre-packed, verify e-mark is correctly placed |
| 1D | Legal Product Descriptor | Accurate description of product category |
| 1E | Business Name & Address (FBO) | Full address or code referencing pack info |
| 1F | Website | — |
| 1G | Country of Manufacture / Origin | COOL info if required (primary ingredient rule) |
| 1H | Best Before / Use By Date Format & Location | — |
| 1I | Lot / Batch Code Present | — |
| 1J | Barcode & 2D Codes | Readable, correct dimensions, front & back if applicable |

### 2. Ingredients & Allergens

| ID | Item | Note |
|:--:|---|---|
| 2A | Ingredients Declaration | Descending order by weight; bolded allergens |
| 2B | Allergy Advice Box | "For allergens, see ingredients in bold" (if contains allergens) |
| 2C | Nut Warning Statement | O/H & B/L or B/L only as applicable |
| 2D | Intolerance Info | — |
| 2E | "Some Separation is Natural" | If applicable |

### 3. Nutrition & Serving

| ID | Item | Note |
|:--:|---|---|
| 3A | Energy (kJ / kcal) | — |
| 3B | Fat & Saturates | — |
| 3C | Carbohydrates & Sugars | — |
| 3D | Protein | — |
| 3E | Salt | Or "Salt due to presence of naturally occurring sodium" |
| 3F | Optional: Fibre, Starch, Polyols, Mono/Polyunsaturates | — |
| 3G | Vitamins & Minerals | If added or claimed |
| 3H | Reference Intakes (RIs) — Front of Pack | — |
| 3I | Serving Size & Number of Servings | — |
| 3J | Guideline Daily Amounts / % RI per portion | — |

### 4. Storage & Cooking

| ID | Item | Note |
|:--:|---|---|
| 4A | Storage Instructions | — |
| 4B | Storage Instructions — Once Opened | — |
| 4C | Cooking Instructions | If applicable |
| 4D | Serving Suggestion | If image shown |

### 5. Claims & Certifications

| ID | Item | Note |
|:--:|---|---|
| 5A | Suitable for Vegetarians | — |
| 5B | Suitable for Vegans / Vegan Certified | Certified requires registration number/logo |
| 5C | Gluten Free / Wheat Free / Suitable | — |
| 5D | Free From Claims | — |
| 5E | Halal Claim | — |
| 5F | Kosher Claim | — |
| 5G | Organic Logo & Cert Body | Logo min 9mm(H) × 13.5mm(W), ratio 1:1.5 |
| 5H | No Artificial Colours, Preservatives or Flavours | — |
| 5I | No Added Fat / Low Fat / Low Sugar / Low Calorie | — |
| 5J | Provenance / Variety Claim | — |
| 5K | Chilli Pepper Heat Level | — |
| 5L | Any Other Claim | Specify in notes |

### 6. Packaging, Marks & Languages

| ID | Item | Note |
|:--:|---|---|
| 6A | Multilingual Wording | ES, FR, IT, DE etc. |
| 6B | Customer Guarantee Statement | — |
| 6C | Package Recycling Statement / Info | — |
| 6D | Dairy Health Mark | UK FR 036 EC / UK FR 048 EC |
| 6E | Label Size — Length / Width | — |
| 6F | Label Commodity Codes | — |
| 6G | Product Name on Back Label Too? | Y/N |
| 6H | Tamper Evidence | Type, Text, Size |

---

## Product data

Four text fields in the left panel (`product-bar`), in a 2×2 grid:

| Field | Input ID | Placeholder |
|---|---|---|
| Brand | `inp-brand` | Brand |
| Product Name / Legal Name | `inp-name` | Product Name / Legal Name |
| Weight | `inp-weight` | Weight (g/ml) |
| SKU | `inp-sku` | SKU / Code |

**Current behavior:** free values, no validation. They are not persisted (lost on reload). They are included in the JSON export when the user clicks `Save Check`.

---

## Collapsible sections

- Each section is a button (`section-btn`) + a container (`section-content`).
- **Initial state:** section 1 expanded; sections 2–6 collapsed.
- **Action:** clicking the title toggles the `hidden` class (content) and the `collapsed` class (button, rotating the arrow -90°).
- **Shortcut:** clicking a pin that leads to an item in a collapsed section **auto-expands the section** (via `scrollToItem`).

---

## Progress bar

| Aspect | Behavior |
|---|---|
| Position | Footer of the left panel (`progress-footer`) |
| Formula | `checked / total` — counts checkboxes in the DOM in `updateProgress()` |
| Text | `X / 49 checked` (`#progress-text` element) |
| Bar | `#progress-bar`, width = % of total, green `#10b981`, rounded |
| Transition | `width 0.3s ease` |
| Updates | On every checkbox click (`toggleCheck` → `updateProgress`) and on initial load |

> ⚠️ **Current behavior to not confuse:** the bar only measures **checked** items. It does not distinguish approved vs. rejected nor review % from approval % — that distinction is roadmap Layer F.

---

## Demo artwork

- **It is not an image:** it's a static mock built in HTML/CSS (`#artwork-wrapper > .artwork > .pack-front + .pack-back`), 480px wide, with shadow and rounded corners.
- **Front of Pack:** brand, product title, descriptor, serving image, net weight, claims and mini FOP nutrition table.
- **Back of Pack:** ingredients, allergens, BOP nutrition table, storage, cooking instructions, manufacturer, barcode and metadata.
- **Annotatable elements:** each relevant region has `data-el` (brand, product-name, descriptor, serving-image, weight, claims, nutrition-fop, ingredients, allergens, nutrition-bop, storage, cooking, address, barcode-area) and gets a dashed blue outline on hover.
- The pin layer (`#pins-layer`) overlays the wrapper (`position: absolute; inset: 0`), allowing items to be dropped anywhere on the art.

---

## Artwork upload

> ⚠️ **Faithful record of the code:** **there is no image upload in this baseline.** There is no `<input type="file">`, no `handleUpload` function, and no image data reading in `app.js`.

**Documented current behavior:**

1. The viewer displays exclusively the demo artwork (HTML/CSS);
2. There is no way to replace the image;
3. There is no real image dimension reading (the width is fixed at 480px);
4. Expected roadmap consequence (Layer E): when upload arrives, replacing the artwork should require confirmation if pins exist (`"Replacing this artwork will invalidate existing pins. Continue?"`), and the image identity (`name`, `type`, `size`, `width`, `height`) should be recorded.

---

## Zoom

| Aspect | Behavior |
|---|---|
| Function | `zoom(delta)` — `−` (`-0.1`) and `+` (`+0.1`) buttons on the viewer toolbar |
| Range | **50% to 200%** (clamp: `Math.max(0.5, Math.min(2, currentZoom + delta))`) |
| Effect | `transform: scale()` on `#artwork-wrapper` |
| Origin | `transform-origin: top center` |
| Transition | `transform 0.2s ease` |
| Label | `#zoom-level` shows the rounded percentage (e.g. `100%`) |
| Important | Pin position calculation **compensates the zoom** (divides the mouse coordinate by the current zoom) |

---

## Drag-and-drop

| Step | Behavior |
|---|---|
| `dragstart` (item) | Stores the item `id` via `dataTransfer.setData('text/plain', id)`; `effectAllowed = 'copy'`; item gets `.dragging` class (50% opacity) |
| `dragend` (item) | Removes the `.dragging` class |
| `dragover` (pins-layer) | `preventDefault()` — required to allow the drop |
| `drop` (pins-layer) | Reads the `id`; if empty, ignores; computes `x = (clientX - rect.left) / currentZoom` and `y = (clientY - rect.top) / currentZoom`; calls `addPin(id, x, y)` |

**Current rules:**

- Each item can have **only one pin** — dropping again **repositions** (removes the existing pin with the same id);
- The drop is only accepted over the artwork area (`#pins-layer`);
- No touch support (native HTML drag-and-drop) — touch alternative is Layer K3;
- Hovering the item triggers `highlightPin` (`pulse` animation on the pin) and mouseleave removes it.

---

## Pin creation

| Aspect | Behavior |
|---|---|
| Structure | `<div class="pin" data-pid="{id}">` with `.pin-marker` (blue circle with the reference) and `.pin-tooltip` (item title) |
| Position | Absolute inside `#pins-layer`, with `transform: translate(-50%, -100%)` (the marker "points" at the exact spot) |
| State | `pins[id] = { x, y }` in **pixels relative to the artwork** (already zoom-compensated at drop time) |
| Tooltip | Shows on pin hover (dark background, item title) |
| Pin hover | Marker scales 1.15 with blue shadow |
| Feedback | Toast `Pinned 1A to artwork` |
| Documented limitation | Pixel positions do **not** adapt to future dimension/zoom changes — normalization to `xRatio/yRatio` is Layer E1 |

---

## Pin ↔ item navigation

| Direction | Trigger | Behavior |
|---|---|---|
| **Pin → item** | Click on pin | `scrollToItem(id)`: expands the section if collapsed, smooth-scrolls to the item (`scrollIntoView`, `block: center`) and highlights the background in blue (`#dbeafe`) for 1.2s |
| **Item → pin** | `mouseenter` on item | `highlightPin(id)`: adds `.pulse` class (pulsing ring on the marker) |
| Hover end | `mouseleave` on item | `unhighlightPin(id)`: removes `.pulse` |

---

## Clear Pins

| Aspect | Behavior |
|---|---|
| Action | `Clear Pins` button on the toolbar (`clearPins()`) |
| Effect | Empties `#pins-layer` (innerHTML) and removes all keys from the `pins` object |
| Feedback | Toast `All pins cleared` |
| Confirmation | **None** (destructive action without dialog — improvement planned for Layer K1) |

---

## JSON export (Save Check)

| Aspect | Behavior |
|---|---|
| Action | `Save Check` button in the header (`saveCheck()`) |
| JSON structure | `{ product: {brand, name, weight, sku}, checks: {id: boolean}, pins, timestamp }` |
| File | Downloaded via blob (`application/json`), named `artwork-check-{Date.now()}.json` |
| Content | Product data read from the inputs; `checks` read from the checkboxes (each item id → true/false); `pins` copied from the object; `timestamp` ISO at click time |
| Feedback | Toast `Checklist saved! JSON file downloaded.` |
| **Does not** | Persist anything in the browser; validate the state; include a schema version |

**Example of the exported structure:**

```json
{
  "product": {
    "brand": "Paulig",
    "name": "Premium Basmati Rice",
    "weight": "250g",
    "sku": "123456"
  },
  "checks": {
    "1a": true,
    "1b": false
  },
  "pins": {
    "3a": { "x": 231, "y": 84 }
  },
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

---

## Toast (visual feedback)

| Aspect | Behavior |
|---|---|
| Element | `#toast` fixed at the bottom-right corner |
| Function | `showToast(msg)` |
| Duration | 2.5s (auto-removes the `.show` class) |
| Current triggers | Pin added, Clear Pins, Save Check |

---

## Current state map

Logical state **lives in the DOM** (source of truth). This is the central point to be fixed in Layer B1.

| State | Where it lives today | Representation |
|---|---|---|
| Checked item | checkbox | `input[type=checkbox]:checked` |
| "Done" look | CSS class | `.check-item.checked` |
| Product data | inputs | `#inp-brand`, `#inp-name`, `#inp-weight`, `#inp-sku` |
| Open/closed section | CSS classes | `.section-content.hidden`, `.section-btn.collapsed` |
| Pin positions | JS object `pins` | `pins[id] = {x, y}` (pixels) |
| Item titles | `sections` array | duplicated; refactor target (`itemTitles`) |
| Zoom | `currentZoom` variable | number (0.5–2.0) |

**Current functions in `app.js`:** `zoom()`, `toggleCheck()`, `updateProgress()`, `addPin()`, `findItemById()`, `scrollToItem()`, `highlightPin()`, `unhighlightPin()`, `clearPins()`, `saveCheck()`, `showToast()` — plus the initial checklist rendering.

---

## Regression test battery

Applicable after **any evolution** (Layer K4 criterion):

| # | Test | Expected behavior |
|---|------|-------------------|
| 1 | Open the app | App opens, no console errors, `0 / 49 checked` |
| 2 | Open/close categories | Sections toggle between expanded and collapsed; arrow rotates |
| 3 | Check/uncheck items | `.checked` class toggles; progress updates |
| 4 | Zoom | 50%–200%; label updates; smooth zoom bar |
| 5 | Drag an item onto the artwork | Pin created at the dropped position; toast shown |
| 6 | Drop the same item again | Existing pin is repositioned (not duplicated) |
| 7 | Click the pin | Scrolls to the item; collapsed section expands; temporary blue highlight |
| 8 | Hover a pinned item | Pin pulses; removing the mouse stops the pulse |
| 9 | Clear Pins | All pins disappear; toast shown |
| 10 | Check several items | `X / 49 checked` text and % bar stay consistent |
| 11 | Save Check | JSON downloaded with product, checks, pins and timestamp |
| 12 | Edit product data + save | New values reflected in the exported JSON |

---

*Baseline document generated from inspection of `index.html`, `js/app.js` and `css/style.css`. Any divergence between code and this record must be fixed in the code (preservation principle) or logged as an `OBSERVED ISSUE`.*