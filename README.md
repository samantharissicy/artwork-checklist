# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20baseline-yellow" alt="Status">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 items">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 sections">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="No dependencies">
  <img src="https://img.shields.io/badge/framework-none-green" alt="No framework">
</p>

A web tool to support the review of **artworks and pack copy for food products**, aligned with the **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned** standard.

The project follows a visual review workflow: each checklist item can be **pinned** directly onto the pack artwork, bridging the regulatory requirement and the exact spot on the artwork where it applies.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Current features](#current-features)
3. [The 6 checklist sections](#the-6-checklist-sections)
4. [The 49 review items](#the-49-review-items)
5. [How to run](#how-to-run)
6. [How to use — step by step](#how-to-use--step-by-step)
7. [Project structure](#project-structure)
8. [How it works under the hood](#how-it-works-under-the-hood)
9. [Known limitations](#known-limitations)
10. [Roadmap](#roadmap)
11. [Development workflow](#development-workflow)
12. [Contributing](#contributing)

---

## What it does

Before a pack goes into production, someone has to check every piece of copy printed on it:

- the legal product name;
- the ingredients declaration in descending order of weight;
- the nutrition table;
- the claims (gluten free, vegan, organic);
- the barcode, the lot, the net weight…

This app organizes that review into a **checklist of 49 items across 6 sections** and lets you visually mark exactly where each point was verified on the artwork.

> **Note:** the current build is a *working prototype* — no backend, no database, no framework. It evolves incrementally according to the layer-based plan in [`roadmap.md`](roadmap.md).

---

## Current features

Everything below is part of the **working baseline** — nothing may break between one evolution and the next.

| Feature | Description | How to test |
|---|---|---|
| ✅ Interactive checklist | 49 items with explanatory notes | Check/uncheck checkboxes |
| ✅ Collapsible sections | The 6 categories open/close | Click a section title |
| ✅ Product data | Brand, Product Name, Weight, SKU | Type in the yellow fields |
| ✅ Progress bar | `X / 49 checked` + % bar | Check/uncheck items |
| ✅ Demo artwork | Front & Back of Pack built in plain HTML/CSS | Open the right panel |
| ✅ Zoom | Scale from 50% to 200% | `−` and `+` buttons on the toolbar |
| ✅ Drag-and-drop | Drag a checklist item onto the artwork | `dragstart` on item → `drop` on artwork |
| ✅ Pin creation | Pin placed where dropped, with tooltip | Drop an item on the art |
| ✅ Pin → item | Clicking a pin scrolls the checklist to the item (auto-expanding the section) | Click any pin |
| ✅ Item → pin | Hovering an item makes its pin "pulse" | Hover a pinned item |
| ✅ Clear Pins | Removes all pins | `Clear Pins` button in the toolbar |
| ✅ Save Check | Exports the full state as a JSON file (download) | `Save Check` button in the header |
| ✅ Toast | Visual feedback on actions (pin, clear, save) | Perform the actions above |

### What is **not** in this baseline (yet)

- Real image upload (the current artwork is a demo embedded in HTML);
- `localStorage` persistence (reloading the page loses state);
- JSON import (`Open Check`);
- `approved` / `rejected` states (currently just checked/unchecked);
- Comments, signature and report.

This is intentional: those features are the next layers in the roadmap.

---

## The 6 checklist sections

| # | Section | Items | Focus |
|---|---------|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Legal identification of the product |
| 2 | **Ingredients & Allergens** | 5 | Ingredients declaration and allergens |
| 3 | **Nutrition & Serving** | 10 | Nutrition table and portions |
| 4 | **Storage & Cooking** | 4 | Storage and preparation instructions |
| 5 | **Claims & Certifications** | 12 | Claims and certifications |
| 6 | **Packaging, Marks & Languages** | 8 | Legal marks, languages and packaging |

---

## The 49 review items

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

## How to run

The project requires **no installation, npm, build or server**.

```text
1. Download or clone the repository
2. Open the index.html file in any modern browser
```

Or from the terminal:

```bash
git clone https://github.com/toled/artwork-checklist.git
cd artwork-checklist
start index.html
```

> Minimum requirement: a browser with drag-and-drop and inline SVG support (Chrome, Edge, Firefox, Safari).

---

## How to use — step by step

1. **Fill in the product data** (left panel, yellow fields):
   Brand, Product Name / Legal Name, Weight and SKU.

2. **Review each section**:
   - Click a section title to expand/collapse it;
   - Each item shows a **note** with the criterion to verify;
   - Tick the checkbox when the requirement is compliant.

3. **Pin items onto the artwork**:
   - Drag a checklist item and drop it onto the pack (front or back);
   - A **pin** with the item reference (e.g. `3A`) appears at the exact spot.

4. **Navigate between pin ↔ item**:
   - **Pin → item:** click the pin and the checklist scrolls to the item (collapsed sections expand on their own);
   - **Item → pin:** hover an item to make its pin "pulse".

5. **Use the zoom** (`−` / `+` buttons on the viewer toolbar) to inspect details.

6. **Clear the pins** whenever you want a fresh start (`Clear Pins`).

7. **Export the result** (`Save Check`): a `.json` file with product data, checks and pins is downloaded automatically.

---

## Project structure

```text
artwork-checklist/
├── index.html          # Full UI (HTML + references to CSS/JS)
├── css/
│   └── style.css       # Visual styles (299 lines)
├── js/
│   └── app.js          # All application logic in plain JavaScript (279 lines)
├── roadmap.md          # Layer-based development plan (A0 → N)
├── baseline.pt-BR.md   # Baseline behavior record (pt-BR)
├── baseline.en.md      # Baseline behavior record (EN)
├── README.md           # This document (EN)
└── README.pt-BR.md     # This document (pt-BR)
```

The current state still uses the "single files" architecture: `index.html` + `app.js` + `style.css`, without module splitting. The progressive split into files (state, storage, checklist, artwork, pins, products…) is planned for the final layers of the roadmap.

---

## How it works under the hood

Understanding the prototype helps you follow the upcoming evolutions.

### Data source

The **6 sections and 49 items** live in a single `sections` array (`js/app.js`), each with `id`, `title` and `note`. The checklist is **rendered by JavaScript** — the HTML only holds the empty `#checklist` container.

### Current state: the DOM is the source of truth

In the baseline, logical state is spread across the DOM itself:

| State | Where it lives | Example |
|---|---|---|
| Checked item | `input[type=checkbox].checked` | checkbox |
| "Done" look | `.checked` CSS class | item background |
| Product data | inputs `#inp-brand`, `#inp-name`… | field values |
| Pin positions | `pins[id] = {x, y}` object | `{x: 723, y: 281}` |
| Item titles | duplicated in the `sections` array | `itemTitles` |

This works in the prototype, but it is **not the target model**. The first major evolution (roadmap Layer B) is a single central state:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: null,
  products: {}
};
```

With each item converging to:

```js
{
  id: "1a",
  sectionId: "legal-core",
  originalTitle: "Product Name / Legal Name",
  currentTitle: "Product Name / Legal Name",
  note: "...",
  status: "pending",        // pending | approved | rejected
  comment: "",
  pin: null                 // future: { xRatio: 0.42, yRatio: 0.18 }
}
```

### How pins work today

- On drop, the mouse point is converted into **pixels relative to the artwork** (`wrapper.getBoundingClientRect()`), compensating for the current zoom;
- Each pin is a `<div>` with `data-pid` = item id, tooltip and marker;
- `pins[id]` stores `{x, y}` in pixels — known limitation: fixed positions don't adapt to other viewing dimensions (normalization to **ratios** via `xRatio/yRatio` is Layer E).

### Key functions in the code

| Function | Responsibility |
|---|---|
| `toggleCheck(cb)` | Toggles `.checked` and recalculates progress |
| `updateProgress()` | Counts checked boxes → text + bar width |
| `zoom(delta)` | Scales 0.5–2.0 on the wrapper and updates the label |
| `addPin(id, x, y)` | Creates the pin and records it in `pins` |
| `scrollToItem(id)` | Expands a collapsed section and scrolls to the item |
| `clearPins()` | Empties the pin layer and the `pins` object |
| `saveCheck()` | **Exports JSON** (product + checks + pins + timestamp) |
| `showToast(msg)` | Temporary visual feedback |

---

## Known limitations

Documented so they cause no surprises during use and development:

1. **No persistence** — reloading the page loses checks, pins and product data;
2. **No real upload** — the artwork shown is an HTML/CSS mock (front and back);
3. **Pins in pixels** — positions don't adapt to resizing/future zoom;
4. **State in the DOM** — the DOM is the source of truth, which hampers validation and restoration;
5. **No import** — the exported JSON cannot be reopened in the app;
6. **Binary checking** — no distinction between approved and rejected, no comments;
7. **Desktop-only** — no touch/tablet optimization.

Each limitation maps to a roadmap layer — removing them all at once would violate the project's incremental-evolution principle.

---

## Roadmap

Full plans in [`roadmap.md`](roadmap.md); summary:

| Phase | Layer | Deliverable |
|:---:|------|-------------|
| ✅ | **A0** | Frozen baseline + documentation (this README) |
| 📋 | **B1** | Central `appState` (single source of truth) |
| 📋 | **C1–C3** | Tri-state status, comments, copy corrections |
| 📋 | **D1–D4** | Local persistence, versioned import/export |
| 📋 | **E1–E2** | Proportional pins, artwork identity |
| 📋 | **F1** | Review metrics (approved / rejected / pending) |
| 📋 | **G1–G2** | Multiple products with tabs |
| 📋 | **H1–H2** | Reviewer + signature |
| 📋 | **I1–I2** | High resolution + responsiveness |
| 📋 | **J1–J3** | Printable report and PDF |
| 📋 | **K1–K4** | UX, accessibility, touch, regressions |
| 📋 | **L1** | Structural module split |
| ⏳ | **M1–M4** | Backend, auth, revisions, audit trail (only with real usage) |

**Golden rule:** implement one layer at a time, test, review, commit, then move on.

---

## Development workflow

The project uses **specification-driven development**:

```text
AUDIT → SPEC → PLAN → TASKS → IMPLEMENT → VERIFY → REPORT
```

For each new feature, the cycle is:

1. **Current State** — how it works today, functions/HTML involved, risks;
2. **Requirements** — testable requirements (`REQ-XXX-001…`);
3. **Business Rules** — explicit `IF … THEN …` rules;
4. **Data Model** — data needed before writing code;
5. **Design Decisions** — decisions with alternatives considered;
6. **Impact Analysis** — what will be affected;
7. **Task Breakdown** — small verifiable tasks;
8. **Implementation** — surgical changes, never a full rewrite;
9. **Manual Tests** — `Precondition / Action / Expected` cases;
10. **Regression Tests** — the baseline must stay 100% functional;
11. **Completion Report** — what was/wasn't done, limitations, next step.

Non-negotiable principles: **incrementality** (one feature at a time), **preservation** (nothing may break), **simplicity** (readable, commented code), **compatibility** (no framework, npm, build or backend while in MVP) and **no phase mixing** (each layer is a dedicated commit).

---

## Contributing

1. Work **one layer at a time**, following the workflow above;
2. Never ask for "implement all phases" — ask for something like *"implement only C1. Do not touch features from C2 or later"*;
3. Run, test, review, verify the acceptance criteria, fix and commit (checkpoint with a descriptive message);
4. At the end of every milestone: app opens, console is clean, previous features still work, manual tests pass.

**Global acceptance criteria** (every milestone):

1. The app opens normally;
2. No console errors;
3. Previous features remain operational;
4. Feature requirements are met;
5. Manual tests pass;
6. No later-phase feature was implemented by accident.

---

## License

Private / internal use. This repository is an educational prototype in evolution — contact the owners before distributing.