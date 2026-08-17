# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20C1-success" alt="MVP C1">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 items">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 sections">
  <img src="https://img.shields.io/badge/tests-40%2F40%20passing-success" alt="40/40 tests passing">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="No dependencies">
  <img src="https://img.shields.io/badge/framework-none-green" alt="No framework">
</p>

A web tool to support the review of **artworks and pack copy for food products**, aligned with the **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned** standard.

The application combines a structured regulatory checklist with a visual artwork review workflow. Each checklist item can be classified as **Pending**, **Approved**, or **Rejected**, and can also be pinned directly onto the pack artwork to connect a requirement with the exact location where it applies.

> **Current stage:** functional MVP evolving incrementally through a specification-driven roadmap.  
> Layers **A0**, **B1**, and **C1** are complete.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Current features](#current-features)
3. [Review workflow](#review-workflow)
4. [The 6 checklist sections](#the-6-checklist-sections)
5. [The 49 review items](#the-49-review-items)
6. [How to run](#how-to-run)
7. [How to use — step by step](#how-to-use--step-by-step)
8. [Project structure](#project-structure)
9. [How it works under the hood](#how-it-works-under-the-hood)
10. [Automated tests](#automated-tests)
11. [Known limitations](#known-limitations)
12. [Roadmap](#roadmap)
13. [Development workflow](#development-workflow)
14. [Contributing](#contributing)

---

## What it does

Before food packaging goes into production, someone must verify every relevant piece of copy printed on it, including:

- legal product name;
- net quantity;
- ingredients declaration;
- allergens;
- nutritional information;
- storage instructions;
- cooking instructions;
- product claims;
- certification marks;
- barcode;
- batch or lot information;
- manufacturer details;
- recycling information;
- multilingual wording.

This application organizes that review into a **checklist of 49 items across 6 sections**.

Each checklist item can currently be:

```text
Pending
Approved
Rejected
```

Items may also be dragged onto the artwork to create visual pins that identify exactly where a requirement was checked.

The goal is to evolve the prototype into a structured artwork approval workflow without introducing unnecessary complexity before it is required.

---

## Current features

Everything below is part of the current working application and must remain operational as new layers are implemented.

| Feature | Description | How to test |
|---|---|---|
| ✅ Interactive checklist | 49 review items with explanatory notes | Browse the checklist |
| ✅ Collapsible sections | 6 categories that expand/collapse | Click a section title |
| ✅ Product data | Brand, Product Name, Weight and SKU | Type into the yellow fields |
| ✅ Tri-state review workflow | Pending / Approved / Rejected | Use the ✓ and × buttons |
| ✅ Approved visual state | Approved items become green | Click Approve |
| ✅ Rejected visual state | Rejected items become red | Click Reject |
| ✅ Pending visual state | Pending items remain neutral | Leave/reset an item |
| ✅ Status switching | Approved ↔ Rejected | Alternate between the review buttons |
| ✅ Reset to Pending | Clicking the active status again returns to Pending | Approve twice or Reject twice |
| ✅ Review progress | `X / 49 reviewed` + percentage bar | Approve or reject items |
| ✅ Central application state | Domain data lives in `appState` | Inspect `appState` in DevTools |
| ✅ Demo artwork | Front & Back pack mock built in HTML/CSS | Open the artwork viewer |
| ✅ Zoom | Scale between 50% and 200% | Use `−` and `+` |
| ✅ Drag-and-drop | Drag checklist items onto the artwork | Drag an item to the artwork |
| ✅ Pin creation | Creates a pin at the drop location | Drop an item on the artwork |
| ✅ Pin → item | Clicking a pin scrolls to the checklist item | Click a pin |
| ✅ Item → pin | Hovering an item highlights its pin | Hover a pinned item |
| ✅ Clear Pins | Removes all pins from state and UI | Click `Clear Pins` |
| ✅ Save Check | Downloads the current legacy JSON representation | Click `Save Check` |
| ✅ Toast notifications | Visual feedback for selected actions | Pin, clear or save |
| ✅ Automated browser tests | Layer B + C1 regression suite | Run `runArtworkTests()` |

---

## Review workflow

The checklist no longer uses a binary checked/unchecked model.

Every item has exactly one review status:

```text
pending
approved
rejected
```

### Pending

Default state.

The item has not yet received a review decision.

Visual state:

```text
neutral
```

### Approved

The reviewer determined that the requirement is compliant.

Visual state:

```text
green
```

### Rejected

The reviewer identified a problem with the requirement.

Visual state:

```text
red
```

### Status transitions

The current workflow supports:

```text
Pending → Approved
Pending → Rejected

Approved → Rejected
Rejected → Approved

Approved → Pending
Rejected → Pending
```

Clicking the currently active action again resets the item to `Pending`.

For example:

```text
Pending
   ↓ Approve

Approved
   ↓ Approve again

Pending
```

Comments and rejection justification belong to **Layer C2** and are not yet exposed in the interface.

---

## The 6 checklist sections

| # | Section | Items | Focus |
|---|---|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Legal identification of the product |
| 2 | **Ingredients & Allergens** | 5 | Ingredients declaration and allergens |
| 3 | **Nutrition & Serving** | 10 | Nutrition table and portions |
| 4 | **Storage & Cooking** | 4 | Storage and preparation instructions |
| 5 | **Claims & Certifications** | 12 | Claims and certifications |
| 6 | **Packaging, Marks & Languages** | 8 | Legal marks, languages and packaging |

Total:

```text
49 review items
```

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

The project currently requires:

```text
no npm
no framework
no build step
no backend
no database
```

Clone the repository:

```bash
git clone https://github.com/samantharissicy/artwork-checklist.git
cd artwork-checklist
```

The project can be opened directly in a modern browser.

For development, using a small local HTTP server is recommended.

With Python:

```bash
python -m http.server 5500
```

or on Windows:

```bash
py -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

Minimum requirement: a modern browser with JavaScript, drag-and-drop and inline SVG support.

---

## How to use — step by step

### 1. Fill in product data

Use the yellow fields in the left panel:

```text
Brand
Product Name / Legal Name
Weight
SKU / Code
```

These values are synchronized with the active product inside `appState`.

### 2. Review checklist items

Open one of the six sections.

Every item starts as:

```text
Pending
```

Use:

```text
✓ Approve
× Reject
```

to make a review decision.

Approved items become green.

Rejected items become red.

Click the active status button again to return the item to Pending.

### 3. Monitor review progress

The footer displays:

```text
X / 49 reviewed
```

Both Approved and Rejected items count as reviewed.

Pending items do not.

Example:

```text
10 Approved
5 Rejected
34 Pending
```

produces:

```text
15 / 49 reviewed
```

### 4. Pin a requirement to the artwork

Drag a checklist item and drop it on the artwork.

A pin with the checklist reference appears at the drop location.

Example:

```text
1A
3B
5G
```

### 5. Navigate between checklist and artwork

**Pin → item**

Click a pin to scroll to the corresponding checklist item.

If the section is collapsed, it is automatically expanded.

**Item → pin**

Hover a pinned checklist item to highlight its pin.

### 6. Zoom

Use:

```text
−
+
```

to change artwork zoom between approximately:

```text
50% → 200%
```

### 7. Clear pins

Click:

```text
Clear Pins
```

All pins are removed from both the interface and `appState`.

### 8. Export the current check

Click:

```text
Save Check
```

The application downloads a JSON file containing the current legacy export representation.

> The export format is intentionally still compatible with the original MVP format. Proper versioned serialization is planned for Layer D.

---

## Project structure

```text
artwork-checklist/
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   └── tests.js
│
├── roadmap.md
├── prompt-mestre.md
│
├── baseline.en.md
├── baseline.pt-BR.md
│
├── README.md
└── README.pt-BR.md
```

### `index.html`

Contains the main application layout and artwork mock.

The checklist itself is injected by JavaScript.

### `css/style.css`

Contains:

- global layout;
- checklist styling;
- Pending / Approved / Rejected visual states;
- review controls;
- artwork viewer;
- pins;
- progress bar;
- toolbar;
- responsive foundations.

### `js/app.js`

Contains the application logic:

- static checklist definitions;
- domain model;
- centralized application state;
- product factories;
- item status management;
- rendering;
- progress;
- product input synchronization;
- artwork zoom;
- drag-and-drop;
- pins;
- navigation;
- JSON export;
- toast notifications.

### `js/tests.js`

Contains the browser-based automated test suite for the current architecture.

It requires no external test framework.

### `baseline.*.md`

Historical documentation of the original prototype.

These files intentionally describe the old baseline behavior and should not be continuously rewritten as the application evolves.

### `roadmap.md`

Specification-oriented layer plan used to evolve the application incrementally.

---

## How it works under the hood

### Static definitions

The six checklist sections are defined in:

```js
sectionDefinitions
```

These definitions describe the original checklist template.

They are not the current review state.

---

### Central application state

The logical application state is stored in:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: "product-1",
  products: {}
};
```

The DOM is no longer considered the authoritative source of domain data.

The relationship is now:

```text
User action
    ↓
appState
    ↓
render functions
    ↓
DOM
```

not:

```text
DOM
 ↓
discover application state
```

---

### Product model

Each product contains approximately:

```js
{
  id,
  brand,
  productName,
  weight,
  sku,
  artwork,
  items,
  reviewer,
  signature,
  createdAt,
  updatedAt
}
```

---

### Item model

Each review item contains:

```js
{
  id: "1a",
  sectionId: "legal-core",

  originalTitle: "Product Name / Legal Name",
  currentTitle: "Product Name / Legal Name",

  note: "...",

  status: "pending",

  comment: "",

  pin: null
}
```

`originalTitle` is immutable.

`currentTitle` is designed to support future copy corrections.

---

### Review status

Review statuses are centralized:

```js
const REVIEW_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
```

A checklist item has one status value at a time.

Therefore states such as:

```js
approved: true,
rejected: true
```

do not exist.

---

### Review actions

Approve and Reject controls call a centralized review action handler.

Conceptually:

```text
click Approve / Reject
        ↓
handleReviewAction()
        ↓
setItemStatus()
        ↓
appState
        ↓
renderItemState()
        ↓
UI
```

Clicking the already active state again changes the item back to `pending`.

---

### Progress

Progress is calculated from `appState`.

An item counts as reviewed when:

```js
item.status !== REVIEW_STATUSES.PENDING
```

Therefore both:

```text
Approved
Rejected
```

count toward completion.

The UI displays:

```text
reviewed items / 49 reviewed
```

---

### Product fields

Product fields are synchronized in both directions.

```text
input event
   ↓
appState
```

and:

```text
appState
   ↓
renderProductInputs()
   ↓
input UI
```

---

### Pins

Pins belong to the checklist item itself:

```js
item.pin = {
  x,
  y
}
```

The old independent `pins` domain object is no longer the source of truth.

Pins are rendered from item state.

The tooltip uses:

```js
item.currentTitle
```

so future text corrections automatically propagate to the pin label.

Current coordinates are still stored in pixels.

Normalization to proportional coordinates is planned for Layer E.

---

### Domain validation

The domain already recognizes the rule:

```text
IF status = rejected
THEN comment must not be empty
```

A rejected item without a comment is therefore considered invalid by domain validation.

However, the comment interface and UI enforcement are intentionally deferred to **Layer C2**.

---

### Key functions

| Function | Responsibility |
|---|---|
| `createInitialItems()` | Creates the initial item state |
| `createProduct()` | Creates a product domain object |
| `getActiveProduct()` | Returns the active product |
| `getItemById()` | Retrieves an item from the active product |
| `setItemStatus()` | Safely changes review status |
| `setItemCurrentTitle()` | Changes the editable item title |
| `setItemComment()` | Updates item comment state |
| `setItemPin()` | Updates pin state |
| `validateItemState()` | Validates domain rules for one item |
| `renderChecklist()` | Creates the checklist DOM |
| `renderItemState()` | Updates one item from `appState` |
| `handleReviewAction()` | Handles Approve / Reject interaction |
| `updateProgress()` | Calculates reviewed items from state |
| `renderProductInputs()` | Reflects product state in inputs |
| `zoom()` | Controls artwork zoom |
| `addPin()` | Adds/updates a pin |
| `renderPins()` | Renders pins from state |
| `scrollToItem()` | Navigates from pin to checklist item |
| `clearPins()` | Clears pin state and UI |
| `saveCheck()` | Downloads the current JSON export |
| `renderAppState()` | Synchronizes the UI from application state |

---

## Automated tests

The project includes a lightweight browser test suite in:

```text
js/tests.js
```

It intentionally uses no:

```text
Jest
Vitest
npm package
external dependency
```

The suite currently covers **Layer B + Layer C1**.

Run it from the browser console:

```js
runArtworkTests()
```

Current checkpoint:

```text
40 / 40 tests passing
```

The suite verifies areas including:

- application state structure;
- active product;
- 49 checklist items;
- 6 sections;
- default Pending state;
- valid status values;
- Approved / Rejected exclusivity;
- invalid status rejection;
- rejection/comment domain validation;
- immutable `originalTitle`;
- editable `currentTitle`;
- state → UI rendering;
- product input synchronization;
- Pending → Approved;
- Approved → Rejected;
- Rejected → Approved;
- Approved → Pending;
- Rejected → Pending;
- review counters;
- pin state;
- pin rendering;
- pin tooltip titles;
- Clear Pins;
- drag/drop path;
- legacy JSON export;
- removal of legacy `itemTitles`;
- zoom regression.

The test runner snapshots the current application state before running and restores it afterwards.

Automated tests do not replace manual smoke testing of real mouse drag-and-drop and visual behavior.

---

## Known limitations

The following limitations are intentional at the current MVP stage.

### 1. No persistence

Reloading the browser loses the current review.

`localStorage` persistence is planned for Layer D.

### 2. No artwork file upload yet

The current artwork is an HTML/CSS Front & Back demonstration pack.

Real artwork upload and artwork identity will be introduced later.

### 3. Pin positions still use pixels

Pins currently store:

```js
{
  x,
  y
}
```

rather than proportional coordinates.

Normalized coordinates are planned for Layer E.

### 4. Legacy JSON export cannot represent the complete tri-state workflow

The current legacy export still maps item checks to booleans.

Therefore:

```text
approved → true
pending  → false
rejected → false
```

This means exported JSON does not yet preserve the difference between Pending and Rejected.

Proper versioned state serialization is planned for Layer D.

### 5. No JSON import

A saved check cannot yet be reopened inside the application.

### 6. Comment UI is not implemented yet

The domain already understands that a Rejected item requires a comment, but there is currently no textarea/comment interaction in the interface.

This is Layer C2.

### 7. No inline copy correction interface yet

`originalTitle` and `currentTitle` already exist in the domain model, but editing controls are not exposed in the UI.

This is Layer C3.

### 8. Desktop-oriented interface

The current application is primarily designed for desktop use.

Touch/tablet optimization is planned for later UX layers.

---

## Roadmap

Full implementation details are available in [`roadmap.md`](roadmap.md).

| Status | Layer | Deliverable |
|:---:|---|---|
| ✅ | **A0** | Frozen baseline + documentation |
| ✅ | **B1** | Central `appState` / single source of truth |
| ✅ | **C1** | Pending / Approved / Rejected review workflow |
| 📋 | **C2** | Per-item review comments + rejected validation |
| 📋 | **C3** | Inline copy corrections |
| 📋 | **D1–D4** | Serialization, local persistence and JSON import/export |
| 📋 | **E1–E2** | Proportional pins + artwork identity |
| 📋 | **F1** | Review metrics |
| 📋 | **G1–G2** | Multiple products and tabs |
| 📋 | **H1–H2** | Reviewer + signature |
| 📋 | **I1–I2** | High-resolution artwork + responsiveness |
| 📋 | **J1–J3** | Printable report + PDF |
| 📋 | **K1–K4** | UX, accessibility, touch and regression hardening |
| 📋 | **L1** | Structural module separation |
| ⏳ | **M1–M4** | Backend, authentication, revisions and audit trail |

Next implementation target:

```text
C2 — Comments
```

---

## Development workflow

The project follows specification-driven development:

```text
AUDIT
  ↓
SPEC
  ↓
PLAN
  ↓
TASKS
  ↓
IMPLEMENT
  ↓
VERIFY
  ↓
REPORT
```

For each feature:

1. **Current State** — understand the existing implementation;
2. **Requirements** — define testable requirements;
3. **Business Rules** — explicitly describe behavior;
4. **Data Model** — define required data first;
5. **Design Decisions** — document decisions and alternatives;
6. **Impact Analysis** — identify affected and unaffected areas;
7. **Task Breakdown** — divide work into small changes;
8. **Implementation** — change only what is necessary;
9. **Manual Tests** — verify expected behavior;
10. **Regression Tests** — ensure existing functionality still works;
11. **Completion Report** — record what was completed and what remains.

Core principles:

```text
Incrementality
Preservation
Simplicity
Single Source of Truth
Data-first design
MVP compatibility
No phase mixing
```

The project remains intentionally framework-free during the current MVP.

---

## Contributing

When contributing:

1. Work on **one roadmap feature at a time**;
2. Create a dedicated Git branch;
3. Do not implement future layers prematurely;
4. Keep domain state inside `appState`;
5. Keep the DOM as a representation of state;
6. Preserve all existing working behavior;
7. Run the automated test suite;
8. Perform manual regression tests;
9. Review the Git diff;
10. Commit using a descriptive checkpoint message;
11. Open a Pull Request for review.

Example feature branches:

```text
feat/domain-model
feat/review-status
feat/review-comments
feat/copy-corrections
feat/local-storage
```

Current completed feature checkpoint:

```text
feat: add tri-state artwork review workflow
```

### Global acceptance criteria

Every milestone must satisfy:

1. Application opens normally;
2. No application errors in the console;
3. Previous features remain operational;
4. Feature requirements are satisfied;
5. Automated tests pass;
6. Manual tests pass;
7. No future-phase functionality was accidentally implemented.

---

## License

Private / internal use.

This repository is an educational prototype under active development. Contact the project owners before external distribution.