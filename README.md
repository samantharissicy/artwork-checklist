# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20C3-success" alt="MVP C3">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 items">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 sections">
  <img src="https://img.shields.io/badge/tests-60%2F60%20passing-success" alt="60/60 tests passing">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="No dependencies">
  <img src="https://img.shields.io/badge/framework-none-green" alt="No framework">
</p>

A web tool to support the review of **artworks and pack copy for food products**, aligned with the **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned** standard.

The application combines a structured regulatory checklist with a visual artwork review workflow. Each checklist item can be classified as **Pending**, **Approved**, or **Rejected**, can receive review comments, can record proposed copy corrections, and can be pinned directly onto the artwork.

> **Current stage:** functional MVP evolving incrementally through a specification-driven roadmap.  
> Layers **A0**, **B1**, **C1**, **C2**, and **C3** are complete.  
> The complete **Layer C — Review Workflow** is now implemented.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Current features](#current-features)
3. [Review workflow](#review-workflow)
4. [Comments and rejection validation](#comments-and-rejection-validation)
5. [Inline copy corrections](#inline-copy-corrections)
6. [The 6 checklist sections](#the-6-checklist-sections)
7. [How to run](#how-to-run)
8. [How to use](#how-to-use)
9. [Project structure](#project-structure)
10. [Architecture](#architecture)
11. [Automated tests](#automated-tests)
12. [Known limitations](#known-limitations)
13. [Roadmap](#roadmap)
14. [Development workflow](#development-workflow)
15. [Contributing](#contributing)

---

## What it does

Before food packaging goes into production, relevant copy and regulatory information must be reviewed, including:

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

The application organizes this work into **49 review items across 6 sections**.

Each item has its own review state and supporting information:

```text
Pending
Approved
Rejected
```

A reviewer can also:

```text
add comments
suggest copy corrections
restore the original copy
pin requirements to the artwork
navigate between checklist and artwork
```

The project is being developed incrementally, without introducing a framework, backend or database before they are necessary.

---

## Current features

| Feature | Description |
|---|---|
| ✅ Interactive checklist | 49 regulatory review items |
| ✅ Collapsible sections | 6 expandable checklist categories |
| ✅ Product data | Brand, Product Name, Weight and SKU |
| ✅ Central application state | Domain data stored in `appState` |
| ✅ Tri-state review workflow | Pending / Approved / Rejected |
| ✅ Approved visual state | Approved items become green |
| ✅ Rejected visual state | Rejected items become red |
| ✅ Pending visual state | Pending items remain neutral |
| ✅ Status switching | Approved ↔ Rejected |
| ✅ Reset to Pending | Selecting the active status again resets it |
| ✅ Review progress | `X / 49 reviewed` |
| ✅ Per-item comments | Every item has its own review comment |
| ✅ Comment collapse/expand | Comments can be opened and collapsed |
| ✅ Rejection validation | Rejected items require a comment |
| ✅ Validation feedback | Invalid rejected items display a clear message |
| ✅ Automatic comment opening | Rejecting an item opens its comment editor |
| ✅ Inline copy editing | Checklist copy can be edited directly |
| ✅ Enter to confirm | Confirms copy correction |
| ✅ Escape to cancel | Cancels copy correction |
| ✅ Blur to confirm | Clicking away confirms a valid correction |
| ✅ Empty-title protection | Empty copy does not replace current text |
| ✅ Edited indicator | Modified items display `Edited` |
| ✅ Original copy display | Original title remains visible after editing |
| ✅ Restore original | Restores `currentTitle` to `originalTitle` |
| ✅ Demo artwork | Front & Back HTML/CSS packaging mock |
| ✅ Zoom | Artwork zoom between 50% and 200% |
| ✅ Drag-and-drop | Drag checklist requirements onto artwork |
| ✅ Pin creation | Creates a pin at the drop location |
| ✅ Pin → item navigation | Clicking a pin scrolls to the checklist item |
| ✅ Item → pin navigation | Hovering an item highlights its pin |
| ✅ Pin title synchronization | Pin tooltip uses `currentTitle` |
| ✅ Clear Pins | Removes pins from state and UI |
| ✅ Save Check | Downloads the current legacy JSON |
| ✅ Toast notifications | Feedback for selected actions |
| ✅ Automated tests | Browser-based B + C1 + C2 + C3 suite |

---

## Review workflow

Each checklist item has exactly one status:

```text
pending
approved
rejected
```

### Pending

Default state.

The item has not yet received a review decision.

### Approved

The reviewer considers the requirement compliant.

Approved items are displayed in green.

### Rejected

The reviewer identified a problem.

Rejected items are displayed in red.

### Available transitions

```text
Pending → Approved
Pending → Rejected

Approved → Rejected
Rejected → Approved

Approved → Pending
Rejected → Pending
```

Selecting the currently active status again returns the item to Pending.

Example:

```text
Pending
   ↓ Approve

Approved
   ↓ Approve again

Pending
```

Review progress counts both Approved and Rejected items:

```text
reviewed = status !== pending
```

Example:

```text
10 Approved
5 Rejected
34 Pending
```

results in:

```text
15 / 49 reviewed
```

---

## Comments and rejection validation

Every checklist item contains a Comment control.

Selecting it expands a textarea associated with that item.

Comment text is stored directly in:

```js
item.comment
```

Collapsing the editor does not delete the comment.

Changing status, title or pin data also does not delete the comment.

### Rejection rule

The domain rule is:

```text
IF status = rejected
THEN comment.trim().length > 0
```

Therefore:

```text
Rejected + empty comment
=
invalid
```

and:

```text
Rejected + valid comment
=
valid
```

When Reject is selected:

1. the item becomes Rejected;
2. the comment editor opens automatically;
3. an empty comment marks the item as invalid;
4. a clear validation message is displayed;
5. entering a valid explanation removes the invalid state.

Approved and Pending items do not require comments.

Example:

```text
Status:
Rejected

Comment:
"Declared net quantity does not match the approved specification."
```

---

## Inline copy corrections

Layer C3 introduces inline copy correction without overwriting the original checklist text.

Each item stores:

```js
originalTitle
currentTitle
```

Example:

```text
Original:
Product Name / Legal Name

Suggested:
Tikka Masala Spices
```

### Original title

`originalTitle` represents the original checklist copy.

It is immutable.

### Current title

`currentTitle` represents the current proposed copy.

It can be edited.

### Editing workflow

Select the pencil/Edit action.

The current title becomes an input.

Available controls:

```text
Enter
→ confirm

Escape
→ cancel

Blur
→ confirm a valid edit
```

Whitespace-only or empty values do not replace the current title.

### Edited indicator

When:

```js
item.currentTitle !== item.originalTitle
```

the item is considered edited.

The interface displays:

```text
Edited
```

and also shows the original value.

### Restore original

Edited items expose:

```text
Restore original
```

Selecting it restores:

```js
currentTitle = originalTitle
```

and removes the Edited state.

### Pins and corrected copy

Pin tooltips use:

```js
item.currentTitle
```

Therefore editing an already pinned item immediately updates the text displayed by the pin.

Copy correction does not modify:

```text
review status
comment
pin coordinates
originalTitle
```

The preserved `originalTitle` / `currentTitle` pair will later be used by the reporting layer to display Original vs Suggested copy.

---

## The 6 checklist sections

| # | Section | Items | Focus |
|---|---|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Legal product identification |
| 2 | **Ingredients & Allergens** | 5 | Ingredients and allergens |
| 3 | **Nutrition & Serving** | 10 | Nutrition and serving information |
| 4 | **Storage & Cooking** | 4 | Storage and preparation |
| 5 | **Claims & Certifications** | 12 | Claims and certifications |
| 6 | **Packaging, Marks & Languages** | 8 | Marks, languages and packaging |

Total:

```text
49 review items
```

---

## How to run

The current MVP requires:

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

For development, a simple local HTTP server is recommended.

With Python:

```bash
python -m http.server 5500
```

or on Windows:

```bash
py -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

---

## How to use

### 1. Enter product information

Fill in:

```text
Brand
Product Name / Legal Name
Weight
SKU / Code
```

The inputs update the active product in `appState`.

### 2. Review an item

Every item starts as:

```text
Pending
```

Use:

```text
✓ Approve
× Reject
```

### 3. Add a comment

Select the Comment icon.

The textarea opens.

Type a comment and it is immediately stored in:

```js
item.comment
```

Selecting Comment again collapses the editor without deleting its value.

### 4. Reject an item

Select Reject.

The application:

```text
changes status to Rejected
opens the comment editor
validates the rejection
shows an error while the comment is empty
```

Enter a valid justification to resolve the validation error.

### 5. Correct copy

Select the pencil icon.

Edit the title.

Use:

```text
Enter → save
Escape → cancel
click outside → save valid value
```

After a correction, the application displays:

```text
Edited
Original: ...
Restore original
```

### 6. Pin an item to the artwork

Drag the checklist item body onto the artwork.

The pin position is stored in:

```js
item.pin
```

### 7. Navigate

Click a pin to locate the corresponding checklist item.

Hover a pinned checklist item to highlight its pin.

### 8. Zoom

Use:

```text
−
+
```

The current range is approximately:

```text
50% → 200%
```

### 9. Clear pins

Select:

```text
Clear Pins
```

All item pin values return to:

```js
null
```

### 10. Save the current check

Select:

```text
Save Check
```

The application downloads the current legacy JSON representation.

Proper versioned serialization belongs to Layer D.

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

Application shell and artwork demonstration.

The checklist is generated by JavaScript.

### `css/style.css`

Contains:

- application layout;
- checklist styling;
- Pending / Approved / Rejected states;
- review controls;
- comment interface;
- validation styling;
- inline copy editing;
- Edited indicator;
- artwork viewer;
- pins;
- progress bar;
- toolbar.

### `js/app.js`

Contains:

- checklist definitions;
- domain model;
- centralized `appState`;
- product factories;
- status workflow;
- comments;
- domain validation;
- inline copy editing;
- copy restoration;
- rendering;
- progress calculation;
- product input synchronization;
- artwork zoom;
- drag-and-drop;
- pins;
- navigation;
- JSON export;
- toast notifications.

### `js/tests.js`

Browser-based automated test suite.

No external testing framework is required.

### `baseline.*.md`

Historical documentation of the original prototype.

These files intentionally remain unchanged as the application evolves.

### `roadmap.md`

Incremental specification-oriented development roadmap.

---

## Architecture

### Single source of truth

Domain data lives in:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: "product-1",
  products: {}
};
```

The architecture follows:

```text
User action
    ↓
domain mutation
    ↓
appState
    ↓
render function
    ↓
DOM
```

The DOM is not the official source of application state.

---

### Product model

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

---

### Domain state vs UI state

Domain state belongs in `appState`.

Examples:

```text
status
comment
currentTitle
pin
product data
```

Temporary interface state remains outside the domain.

Examples:

```text
currentZoom
openCommentItemIds
editingTitleItemId
```

This distinction prevents UI details from contaminating the product/review model.

---

### Review status

```js
const REVIEW_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
```

Only one status exists at a time.

---

### Comment validation

```text
Rejected
+
empty comment
=
invalid
```

Validation is handled by the domain rather than inferred from the DOM.

---

### Copy corrections

`originalTitle` is never replaced.

`currentTitle` contains the active proposed text.

This allows future reporting to distinguish:

```text
Original
Suggested
```

without losing history.

---

### Pins

Pins belong to individual items:

```js
item.pin = {
  x,
  y
};
```

Pin tooltips use:

```js
item.currentTitle
```

Current coordinates are still pixel-based.

Proportional coordinates are planned for Layer E.

---

## Automated tests

The application contains a browser test suite in:

```text
js/tests.js
```

Run:

```js
runArtworkTests()
```

Current checkpoint:

```text
60 / 60 tests passing
```

The suite covers **Layer B + C1 + C2 + C3**.

Coverage includes:

```text
appState structure
active product
49 checklist items
6 sections

valid review statuses
Pending initial state
Approved / Rejected exclusivity
invalid status protection

Pending → Approved
Approved → Rejected
Rejected → Approved
Approved → Pending
Rejected → Pending

review progress

comments
comment collapse / reopen
comment → appState synchronization
automatic comment opening on Reject
Rejected without comment validation
Rejected with comment validation
Approved without comment

immutable originalTitle
editable currentTitle

Edit control
inline input
Enter confirm
Escape cancel
Blur confirm
empty-title protection
Edited indicator
original-title display
Restore original

copy edit preservation of:
status
comment
pin

pin state
pin rendering
pin tooltip update after copy correction
Clear Pins
drag/drop path

product input synchronization
legacy JSON export
zoom regression
```

The runner snapshots application state before the suite and restores it afterward.

Automated tests complement, but do not replace, manual browser smoke tests.

---

## Known limitations

### 1. No persistence

Reloading the page loses the current review.

Layer D will introduce serialization and local persistence.

### 2. Legacy JSON export

The current export still represents checklist checks using the legacy boolean model.

Therefore it cannot yet completely represent:

```text
Pending vs Rejected
comments
copy corrections
complete product state
```

Proper versioned serialization is planned for Layer D.

### 3. No JSON import

A previously exported review cannot yet be reopened.

### 4. No real artwork upload

The current viewer uses a Front & Back HTML/CSS demonstration artwork.

Artwork file identity is planned for later layers.

### 5. Pins use pixel coordinates

Current format:

```js
{
  x,
  y
}
```

Proportional coordinates are planned for Layer E.

### 6. No report yet

The domain already preserves:

```text
originalTitle
currentTitle
comments
status
pins
```

but reporting is not implemented yet.

The future reporting layer will use these values to show Original / Suggested copy and review decisions.

### 7. Desktop-oriented interface

The current UI is primarily optimized for desktop.

Touch/tablet improvements belong to later UX milestones.

---

## Roadmap

| Status | Layer | Deliverable |
|:---:|---|---|
| ✅ | **A0** | Frozen baseline + documentation |
| ✅ | **B1** | Central `appState` / single source of truth |
| ✅ | **C1** | Pending / Approved / Rejected workflow |
| ✅ | **C2** | Per-item comments + rejection validation |
| ✅ | **C3** | Inline copy corrections |
| 📋 | **D1** | Canonical serialization |
| 📋 | **D2** | `localStorage` persistence |
| 📋 | **D3** | Versioned JSON export |
| 📋 | **D4** | JSON import / Open Check |
| 📋 | **E1** | Proportional pin coordinates |
| 📋 | **E2** | Artwork identity |
| 📋 | **F1** | Review metrics |
| 📋 | **G1–G2** | Multiple products + tabs |
| 📋 | **H1–H2** | Reviewer + signature |
| 📋 | **I1–I2** | High-resolution artwork + responsiveness |
| 📋 | **J1–J3** | Printable report + PDF |
| 📋 | **K1–K4** | UX, accessibility, touch and regression hardening |
| 📋 | **L1** | Module separation |
| ⏳ | **M1–M4** | Backend, auth, revisions and audit trail |

Next implementation target:

```text
D1 — Canonical serialization
```

---

## Development workflow

The project follows a specification-driven process:

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

1. understand the current state;
2. define requirements;
3. define business rules;
4. confirm the data model;
5. document design decisions;
6. perform impact analysis;
7. break work into tasks;
8. implement only the required scope;
9. run manual tests;
10. run automated regressions;
11. document completion.

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

---

## Contributing

When contributing:

1. work on one roadmap feature at a time;
2. create a dedicated branch;
3. do not prematurely implement future layers;
4. keep domain state inside `appState`;
5. treat the DOM as a representation of state;
6. preserve existing behavior;
7. add or update automated tests;
8. perform manual regression testing;
9. inspect `git diff`;
10. commit with a descriptive checkpoint;
11. open a Pull Request for review.

Feature branch examples:

```text
feat/domain-model
feat/review-status
feat/review-comments
feat/copy-corrections
feat/state-serialization
feat/local-storage
```

Completed Layer C checkpoints:

```text
feat: add tri-state artwork review workflow
feat: add per-item review comments
feat: support inline copy corrections
```

### Global acceptance criteria

Every milestone must satisfy:

1. application opens normally;
2. no functional console errors;
3. previous features remain operational;
4. requirements are satisfied;
5. automated tests pass;
6. manual tests pass;
7. future-phase functionality was not accidentally introduced.

---

## License

Private / internal use.

This repository is an educational prototype under active development. Contact the project owners before external distribution.