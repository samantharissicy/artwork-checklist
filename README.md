# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20H-success" alt="MVP H">
  <img src="https://img.shields.io/badge/checklist%20items-50-blue" alt="50 items">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 sections">
  <img src="https://img.shields.io/badge/tests-449%2F449%20passing-success" alt="449/449 tests passing">
  <img src="https://img.shields.io/badge/schema-v5-blue" alt="Schema v5">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="No dependencies">
  <img src="https://img.shields.io/badge/framework-none-green" alt="No framework">
</p>

A web tool to support the review of **artworks and pack copy for food products**, aligned with the **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned** standard.

The application combines a structured regulatory checklist with a visual artwork review workflow. Reviewers can classify requirements, add comments, propose copy corrections, attach requirements to exact locations on an artwork, persist reviews locally, export and reopen review files, and work with real artwork images.

> **Current stage:** functional MVP developed incrementally through a specification-driven development plan.  
> Layers **A0, B1, C1, C2, C3, D1, D2, D3, D4, E1, E2, F1, G1–G5 and H1–H4** are complete.
> **Layer H — Cross-Functional Sign-Off is complete.**

## Engineering Documentation

Detailed engineering documentation (architecture, domain model, persistence and migrations, ADRs, testing strategy, future architecture) lives in:

```text
docs/
```

Start at **[docs/README.md](docs/README.md)** — the documentation hub with recommended reading paths for developers, AI coding agents and reviewers. This README remains the project presentation; `docs/` carries the technical knowledge base.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Current features](#current-features)
3. [Review workflow](#review-workflow)
4. [Comments and rejection validation](#comments-and-rejection-validation)
5. [Inline copy corrections](#inline-copy-corrections)
6. [Artwork workflow](#artwork-workflow)
7. [Pins and proportional coordinates](#pins-and-proportional-coordinates)
8. [Persistence and JSON files](#persistence-and-json-files)
9. [The 6 checklist sections](#the-6-checklist-sections)
10. [How to run](#how-to-run)
11. [How to use](#how-to-use)
12. [Project structure](#project-structure)
13. [Architecture](#architecture)
14. [Automated tests](#automated-tests)
15. [Known limitations](#known-limitations)
16. [Layer status](#layer-status)
17. [Development workflow](#development-workflow)
18. [Contributing](#contributing)

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

The application organizes this work into **50 review items across 6 sections**.

Each item has one review status:

```text
Pending
Approved
Rejected
```

A reviewer can also:

```text
add comments
record rejection reasons
suggest copy corrections
restore original copy
pin requirements to the artwork
navigate between checklist and artwork
save the review locally
export the complete review as JSON
reopen an exported review
load a real artwork image
```

The project deliberately remains lightweight during the MVP:

```text
plain HTML
plain CSS
vanilla JavaScript
no framework
no npm
no build step
no backend
no database
```

---

## Current features

| Feature                           | Description                                 |
| --------------------------------- | ------------------------------------------- |
| ✅ Interactive checklist          | 50 regulatory review items                  |
| ✅ Collapsible sections           | 6 expandable checklist categories           |
| ✅ Section status summaries       | Compact Approved / Rejected / Pending counts remain visible when collapsed |
| ✅ Product data                   | Brand, Product Name, Weight and SKU         |
| ✅ Central application state      | Domain data stored in `appState`            |
| ✅ Single source of truth         | DOM represents state instead of defining it |
| ✅ Tri-state workflow             | Pending / Approved / Rejected               |
| ✅ Status switching               | Approved ↔ Rejected ↔ Pending               |
| ✅ Review progress                | Reviewed items are Approved + Rejected      |
| ✅ Per-item comments              | Every checklist item can store a comment    |
| ✅ Rejection validation           | Rejected items require a comment            |
| ✅ Automatic comment opening      | Reject opens its comment editor             |
| ✅ Inline copy editing            | Current copy can be edited directly         |
| ✅ Immutable original copy        | `originalTitle` is preserved                |
| ✅ Edited indicator               | Modified items display `Edited`             |
| ✅ Restore original               | Restores the original checklist copy        |
| ✅ Autosave                       | Review state is persisted in `localStorage` |
| ✅ Reload restoration             | Saved state is restored on page load        |
| ✅ Corrupted-state protection     | Invalid storage does not crash the app      |
| ✅ Versioned serialization        | Canonical state uses schema version 5       |
| ✅ State migration                | Legacy schema v1/v2/v3/v4 data migrates to v5 |
| ✅ Multi-layer artwork domain     | Layers, active layer and per-layer pins in schema v5 |
| ✅ Multi-layer workspace          | Layer tabs with Add / Rename / Delete layer flows |
| ✅ Pantone pack-copy compliance   | Checklist item 6I "Pantone Colours Match Approved Pack Copy?" |
| ✅ Standard review workflow       | 6I uses Pending / Approved / Rejected + comment + pins |
| ✅ Legacy Pantone registry        | `pantoneColors` metadata preserved on v3 → v4 migration |
| ✅ Colour preservation            | Survives reload, export/import and duplication     |
| ✅ Cross-functional sign-off      | Independent Quality, Production and Product Development decisions |
| ✅ Reviewer identity snapshots    | Name, role, timestamp and artwork revision captured per decision |
| ✅ Derived overall approval       | Rejected precedence; all required approvals needed |
| ✅ Visual signatures              | Optional per-department Pointer Event canvas for mouse/pen/touch |
| ✅ Final sign-off validation      | Required data, checklist and department blockers shown explicitly |
| ✅ Versioned JSON export          | Save Check exports complete review data     |
| ✅ JSON import                    | Open Check restores compatible reviews      |
| ✅ Demo artwork                   | Built-in Front & Back HTML/CSS artwork      |
| ✅ Real artwork selection         | Local image files can be displayed          |
| ✅ Artwork metadata               | Name, type, size, width and height          |
| ✅ Artwork replacement protection | Existing pins trigger confirmation          |
| ✅ Session-only image handling    | Binary image data is not persisted          |
| ✅ Normalized pins                | Pins use proportional coordinates           |
| ✅ Zoom-safe pins                 | Pin geometry survives viewer zoom           |
| ✅ Drag-and-drop                  | Drag checklist requirements onto artwork    |
| ✅ Pin → item navigation          | Clicking a pin locates its checklist item   |
| ✅ Item → pin navigation          | Hovering a pinned item highlights its pin   |
| ✅ Pin title synchronization      | Pin tooltip uses `currentTitle`             |
| ✅ Clear Pins                     | Removes pin data from state and UI          |
| ✅ Toast notifications            | Feedback for relevant actions               |
| ✅ Automated regression suite     | 449 browser-based tests                     |
| ✅ Product tab context menu       | Right-click a tab for Rename/Duplicate/New/Delete |
| ✅ Artwork Layer context menu     | Right-click a layer tab for Rename/Add/Delete |

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

The requirement has not yet received a review decision.

### Approved

The reviewer considers the requirement compliant.

Approved items are displayed in green.

### Rejected

The reviewer identified an issue.

Rejected items are displayed in red.

### Status transitions

```text
Pending → Approved
Pending → Rejected

Approved → Rejected
Rejected → Approved

Approved → Pending
Rejected → Pending
```

Selecting the already active status returns the item to Pending.

Review progress currently follows:

```js
reviewed = status !== REVIEW_STATUSES.PENDING;
reviewProgress = reviewed / total * 100;
approvalRate = approved / total * 100;
```

Therefore both Approved and Rejected items count as reviewed, but only Approved items count toward the approval percentage.

Example:

```text
10 Approved
5 Rejected
35 Pending

= 30% reviewed
= 20% approved
```

The progress footer renders per-status counters (Approved / Rejected / Pending), the review percentage, the separate approval percentage and a progress bar whose width follows the review percentage.

---

## Comments and rejection validation

Every checklist item contains a Comment control.

The comment value belongs to the domain:

```js
item.comment;
```

Collapsing the editor does not delete the comment.

Changing status, copy or pin information does not delete it either.

### Rejection rule

```text
IF status = rejected
THEN comment.trim().length > 0
```

Therefore:

```text
Rejected + empty comment
= invalid
```

while:

```text
Rejected + valid comment
= valid
```

When Reject is selected:

1. status becomes Rejected;
2. the comment editor opens;
3. the rejection is validated;
4. an empty comment produces visible validation feedback;
5. entering a valid reason removes the invalid state.

Approved and Pending items do not require comments.

---

## Inline copy corrections

The application preserves the original requirement while allowing a proposed copy correction.

Each item contains:

```js
originalTitle;
currentTitle;
```

Example:

```text
Original:
Product Name / Legal Name

Suggested:
Tikka Masala Spices
```

### `originalTitle`

Represents the original checklist copy.

It is immutable.

### `currentTitle`

Represents the currently proposed copy.

It may be edited.

### Editing controls

```text
Enter
→ confirm

Escape
→ cancel

Blur
→ confirm a valid edit
```

Empty or whitespace-only values never replace the current title.

### Edited state

An item is considered edited when:

```js
item.currentTitle !== item.originalTitle;
```

The interface displays:

```text
Edited
Original: ...
Restore original
```

Selecting Restore original performs:

```js
currentTitle = originalTitle;
```

Copy corrections do not alter:

```text
status
comment
pin coordinates
originalTitle
```

Pin tooltips always use:

```js
item.currentTitle;
```

so editing an already pinned item immediately updates its pin tooltip.

---

## Artwork workflow

The viewer supports both the original demonstration artwork and real image files.

### Demo mode

If the active product has no artwork metadata on its active layer:

```js
getActiveArtworkMetadata(product) === null;
```

the original Front & Back demonstration artwork is displayed.

### Selecting an artwork

Use:

```text
Set Artwork
```

The browser reads the selected image and stores only its metadata in the domain:

```js
{
  (name, type, size, width, height);
}
```

Example:

```js
{
  name: "product-label.png",
  type: "image/png",
  size: 2481934,
  width: 1600,
  height: 2400
}
```

The binary image itself is not stored in `appState`, JSON or `localStorage`.

### Session-only image

The image is displayed through an Object URL during the current browser session.

This keeps persisted review data small and avoids storing large binary files in browser storage.

### Reload or imported review

After a page reload or JSON import:

```text
artwork metadata → preserved
pin coordinates → preserved
binary image → unavailable
```

The application displays:

```text
Artwork file not loaded
```

and asks the reviewer to select the same image file again.

### Selecting the same artwork

Artwork identity is determined from:

```text
name
type
size
width
height
```

Selecting the same artwork again:

```text
does not invalidate pins
does not require replacement confirmation
restores the visual artwork for the session
```

### Replacing an artwork

When a different artwork is selected while pins exist, the application asks:

```text
Replacing this artwork will invalidate existing pins.
Continue?
```

If cancelled:

```text
current artwork remains
existing pins remain
```

If confirmed:

```text
new artwork becomes active
existing pins are cleared
```

---

## Pins and proportional coordinates

Each checklist item may contain one normalized pin per artwork layer:

```js
item.pins = [
  {
    layerId: "layer-front",
    xRatio,
    yRatio
  }
];
```

Example (first layer entry):

```js
{
  layerId: "layer-front",
  xRatio: 0.438,
  yRatio: 0.286
}
```

Both values must remain between:

```text
0 and 1
```

The viewer renders them as percentages:

```text
left = xRatio × 100%
top  = yRatio × 100%
```

This allows pins to remain attached to the same relative artwork position when the viewer dimensions change.

Normalized geometry survives:

```text
50% zoom
100% zoom
200% zoom
different artwork display sizes
window resizing
serialization
localStorage
JSON export/import
```

Legacy pixel coordinates from schema v1 can be migrated to the normalized schema v2 format.

---

## Persistence and JSON files

Layer D introduced canonical persistence independent from the DOM.

### Local autosave

Relevant review mutations are persisted in browser `localStorage`.

This includes:

```text
product information
item statuses
comments
copy corrections
pins
artwork metadata
active product identifier
timestamps
```

A successful persistence operation can display:

```text
Saved locally
```

The application also protects itself against corrupted local storage.

Invalid stored JSON must never prevent the application from opening.

### Schema

Current canonical schema:

```js
const CURRENT_SCHEMA_VERSION = 5;
```

The application supports migration from compatible schema v1 pixel pins, schema v2 single-layer state, schema v3 without the Pantone compliance item and schema v4 without cross-functional sign-offs.

Schema v3 state migrates to v4 by adding the canonical checklist item 6I ("Pantone Colours Match Approved Pack Copy?") as Pending to every product. Legacy `pantoneColors` metadata is preserved unchanged and never influences the status of the migrated 6I item.

Schema v4 state migrates to v5 by adding Quality, Production and Product Development as Pending. No historical approval is inferred.

### Save Check

Use:

```text
Save Check
```

to download the current review as versioned JSON.

The exported review contains:

```text
schemaVersion
exportedAt
product
items
artworkLayers
activeArtworkLayerId
pantoneColors
reviewer
signOffs
```

The export structure mirrors the appState product review: `artworkLayers`, `activeArtworkLayerId` and `pantoneColors` are top-level siblings of the `product` object. The `pantoneColors` registry is preserved for backward compatibility with earlier schema-v3 exports; reviews created by this version review Pantone compliance through checklist item 6I.

It preserves:

```text
Pending / Approved / Rejected
comments
currentTitle
originalTitle
normalized pins
product data
artwork metadata
timestamps
department reviewer snapshots
department decisions and optional signatures
```

### Open Check

Use:

```text
Open Check
```

to select a previously exported compatible JSON file.

The application:

```text
reads the file
parses JSON
migrates compatible older data
validates its structure
rehydrates the domain model
restores the review
renders checklist state
restores pins
restores product data
restores artwork metadata
```

Incompatible or malformed files are rejected without crashing the application.

---

## The 6 checklist sections

| #   | Section                          | Items | Focus                             |
| --- | -------------------------------- | :---: | --------------------------------- |
| 1   | **Legal Core (BRCGS 5.2.1)**     |  10   | Legal product identification      |
| 2   | **Ingredients & Allergens**      |   5   | Ingredients and allergens         |
| 3   | **Nutrition & Serving**          |  10   | Nutrition and serving information |
| 4   | **Storage & Cooking**            |   4   | Storage and preparation           |
| 5   | **Claims & Certifications**      |  12   | Claims and certifications         |
| 6   | **Packaging, Marks & Languages** |   9   | Marks, languages and packaging    |

Total:

```text
50 review items
```

---

## How to run

The MVP currently requires:

```text
no npm
no framework
no build step
no backend
no database
```

Clone:

```bash
git clone https://github.com/samantharissicy/artwork-checklist.git
cd artwork-checklist
```

For development, start a simple local HTTP server.

Python:

```bash
python -m http.server 5500
```

Windows:

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
Production Code
Site
Artwork Revision
```

The values update the active product in `appState` and are automatically persisted.

### 2. Select an artwork

Click:

```text
Set Artwork
```

Choose an image file.

The artwork is loaded for the current session and its metadata is saved with the review.

Each artwork layer of the product owns an independent artwork identity: switch layers through the layer tabs above the canvas, add new layers with `+ Add Layer`, rename them and delete them with their per-layer pins.

### 3. Review checklist items

Use:

```text
✓ Approve
× Reject
```

Selecting an active status again returns the item to Pending.

### 4. Add comments

Select the Comment icon and enter the review note.

Rejecting an item automatically opens the comment editor.

### 5. Correct copy

Select the pencil/Edit control.

Use:

```text
Enter → save
Escape → cancel
click outside → save valid value
```

Edited items display:

```text
Edited
Original: ...
Restore original
```

### 6. Pin requirements

Drag a checklist item onto the artwork.

Its normalized position is stored in:

```js
item.pins; // one entry per layer, in the active layer
```

### 7. Navigate

Click a pin to locate its checklist item.

Hover a pinned checklist item to highlight its pin.

### 8. Zoom

Use the viewer controls:

```text
−
+
```

Range:

```text
50% → 200%
```

Normalized pins keep their relative artwork positions.

### 9. Clear pins

Select:

```text
Clear Pins
```

All item pin values become:

```js
null;
```

### 10. Save the review

Select:

```text
Save Check
```

A complete versioned JSON review file is downloaded.

### 11. Reopen a review

Select:

```text
Open Check
```

Choose a compatible review JSON.

The domain state is restored.

If the review has artwork metadata, select the same image file again to restore the image itself.

### 12. Review Pantone pack-copy compliance

Section 6 of the checklist contains the canonical item:

```text
6I — Pantone Colours Match Approved Pack Copy?
```

The reviewer verifies that the artwork uses the Pantone colours specified in the approved pack copy. Item 6I follows the standard review workflow: Pending / Approved / Rejected, a required comment when rejected, and per-layer artwork pins exactly like every other checklist item.

Reviews saved by earlier versions may still contain the legacy `pantoneColors` colour registry. That metadata remains fully preserved and round-trips through reload, Save/Open Check and product duplication, but it never influences the status of item 6I. The Colour Specification editor UI of the previous MVP is retired.

---

## Project structure

```text
artwork-checklist/
├── assets/
│   └── favicon.svg
│
├── css/
│   ├── base/
│   ├── layout/
│   ├── components/
│   ├── utilities/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── tests.js
│   └── tests/
│       ├── core/
│       └── layers/
│
├── docs/
│
├── baseline.en.md
├── baseline.pt-BR.md
│
├── index.html
├── README.md
└── README.pt-BR.md
```

### `index.html`

Application shell, toolbar, file inputs and artwork viewer.

The checklist itself is generated by JavaScript.

### `css/style.css`

Contains styling for:

```text
application layout
checklist
review states
comments
validation
inline copy editing
Edited state
artwork viewer
real artwork images
missing-artwork state
pins
progress
toolbar
```

### `js/app.js`

Contains:

```text
static checklist definitions
domain model
central appState
product factory
status workflow
comments
domain validation
inline copy editing
copy restoration
rendering
product input synchronization
autosave
serialization
state migration
JSON export/import
artwork metadata
artwork session handling
normalized pin geometry
zoom
drag-and-drop
pin navigation
toast feedback
```

### `js/tests.js`

Browser-based automated regression suite.

No Jest, Vitest or other testing framework is required.

### `baseline.*.md`

Historical documentation of the original prototype.

These files intentionally remain unchanged as the project evolves.

---

## Architecture

### Single source of truth

Domain data lives in:

```js
const appState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  activeProductId: "product-1",
  products: {},
};
```

Current schema:

```js
const CURRENT_SCHEMA_VERSION = 5;
```

The architecture follows:

```text
User action
    ↓
domain mutation
    ↓
appState
    ↓
persistence when relevant
    ↓
render function
    ↓
DOM
```

The DOM is not the official source of application state.

---

### Product model

Each product follows the structure:

```js
{
  id,
  brand,
  productName,
  weight,
  sku,
  productionCode,
  site,
  artworkVersion,
  artworkLayers: [...],
  activeArtworkLayerId,
  pantoneColors: [...],
  items,
  reviewer,
  signature,
  createdAt,
  updatedAt
}
```

Products are stored in a collection and managed through product tabs (Layer G).

---

### Artwork metadata

Artwork metadata belongs to each artwork layer:

```js
layer.artwork: {
  name,
  type,
  size,
  width,
  height
}
```

or:

```js
layer.artwork: null;
```

The image binary does not belong to persisted domain state.

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

  pins: []
}
```

When pinned, `item.pins` stores one normalized entry per artwork layer:

```js
pins: [
  {
    layerId: "layer-front",
    xRatio,
    yRatio
  }
]
```

---

### Domain state vs UI/session state

Persistible domain information belongs in `appState`.

Examples:

```text
product fields
status
comment
currentTitle
pins (per layer)
artwork metadata
reviewer
timestamps
```

Temporary UI state remains outside the domain.

Examples:

```text
currentZoom
openCommentItemIds
editingTitleItemId
```

Artwork binary availability is also session-only.

The current artwork Object URL is kept outside `appState`.

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

### Validation

Core rejection rule:

```text
Rejected + empty comment = invalid
```

Validation belongs to the domain instead of being inferred from CSS or DOM state.

---

### Serialization

Canonical review data is serialized independently from the rendered interface.

The state can therefore survive:

```text
page reload
JSON export
JSON import
schema migration
future interface changes
```

---

## Automated tests

The browser test suite lives in:

```text
js/tests.js
```

Open the application and run in DevTools Console:

```js
await runArtworkTests();
```

Current checkpoint:

```text
312 / 312 → 357 / 357 → 373 / 373 → 378 / 378 → 436 / 436 → 449 / 449 tests passing
```

The suite covers:

```text
Layer B
Layer C1
Layer C2
Layer C3
Layer D1
Layer D2
Layer D3
Layer D4
Layer E1
Layer E2
Layer G4A
Layer G4B
Layer G5
Layer H1–H4
```

Coverage includes:

```text
appState structure
active product
50 checklist items
6 sections

valid review statuses
Pending default
Approved / Rejected exclusivity
invalid status protection

status transitions
review progress

comments
comment persistence
rejection validation

immutable originalTitle
editable currentTitle
inline editing
Enter / Escape / Blur behavior
Edited indicator
Restore original

product field synchronization

canonical serialization
deserialization
state validation
state rehydration
schema migration

localStorage persistence
corrupted localStorage handling

versioned JSON export
JSON import
export/import roundtrip

normalized pin validation
screen → ratio conversion
percentage rendering
zoom preservation
legacy pixel migration
schema v1 → v2 migration

artwork metadata validation
artwork identity comparison
existing-pin detection
replacement cancellation
confirmed replacement
same-artwork reselection
artwork serialization
artwork export/import
missing-file UI state

multi-layer artwork
layer factories and getters
per-layer pins (item.pins[])
layer-scoped sessions
layer-scoped artwork identity
schema v2 → v3 migration
schema v1 → v2 → v3 → v4 → v5 chain
legacy storage key migration
layer-aware rendering

pantone pack-copy compliance
canonical 6I item definition
6I review workflow (Pending / Approved / Rejected)
rejected-comment requirement on 6I
6I per-layer pins
schema v3 → v4 migration
v1/v2/v3 review-file import through v4 compatibility
legacy pantoneColors preservation
legacy colour registry serialization / localStorage roundtrip
legacy colour JSON export / import roundtrip

cross-functional reviewer identity
independent required department decisions
rejected department comment validation
artwork-revision decision reset
derived overall approval and final blockers
mouse/touch Pointer Event signatures
schema v4 → v5 migration
v1/v2/v3/v4 review-file import to v5
sign-off storage/export/import/duplication roundtrips

baseline DOM regression
zoom regression
```

The runner snapshots application state before the suite and restores it afterward.

Automated tests complement manual browser testing, especially for actual file selection, drag-and-drop and visual behavior.

---

## Known limitations

### 1. Artwork binary is session-only

Artwork metadata is persisted, but the local image file itself is not.

After:

```text
page reload
browser restart
JSON import
```

the reviewer must select the same artwork file again.

Persisted metadata and normalized pin positions remain available.

### 2. No reviewer/signature workflow yet

Reviewer identity and final signature belong to Layer H.

### 3. No printable report or PDF yet

The domain already preserves the data needed for future reports:

```text
originalTitle
currentTitle
status
comment
pins
product data
artwork metadata
```

Report and PDF generation belong to Layer J.

### 4. Desktop-oriented interface

The interface is still primarily designed for desktop use.

Responsive and touch hardening belong to later layers.

### 5. No shared backend

The MVP is browser-local.

There is currently no:

```text
authentication
shared database
multi-user synchronization
server-side audit trail
revision history
```

These belong to Layer M if real usage justifies a backend.

### 6. Pantone references are textual

Legacy colour specifications stored the Pantone reference as free text. No official RGB or HEX equivalence is derived. The current Pantone compliance review is performed through checklist item 6I; the legacy `pantoneColors` registry is preserved only for data compatibility with earlier exports.

---

## Layer Status

Development is guided by a separate development planned maintained outside this repository. The historical in-repo planned document (`planning.md`) was removed in an earlier commit; the planned content relevant to this repository is reflected in this README and in the per-layer completion reports.

| Status | Layer     | Deliverable                                       |
| :----: | --------- | ------------------------------------------------- |
|   ✅   | **A0**    | Frozen baseline + documentation                   |
|   ✅   | **B1**    | Central `appState` / single source of truth       |
|   ✅   | **C1**    | Pending / Approved / Rejected workflow            |
|   ✅   | **C2**    | Per-item comments + rejection validation          |
|   ✅   | **C3**    | Inline copy corrections                           |
|   ✅   | **D1**    | Canonical serialization                           |
|   ✅   | **D2**    | `localStorage` persistence                        |
|   ✅   | **D3**    | Versioned JSON export                             |
|   ✅   | **D4**    | JSON import / Open Check                          |
|   ✅   | **E1**    | Normalized proportional pins                      |
|   ✅   | **E2**    | Artwork identity and replacement safeguards       |
|   ✅   | **F1** | Review metrics (per-status counters, review/approval %) |
|   ✅   | **G1**    | Multiple-product domain operations                |
|   ✅   | **G2**    | Product tabs                                      |
|   ✅   | **G3–G4** | Multi-layer artwork workspace                     |
|   ✅   | **G5**    | Pantone pack-copy compliance (checklist 6I) |
|   ✅   | **H1–H4** | Cross-functional sign-off + signature + final validation |
|   📋   | **I1–I2** | High-resolution artwork + responsiveness          |
|   📋   | **J1–J3** | Printable report + PDF                            |
|   📋   | **K1–K4** | UX, accessibility, touch and regression hardening |
|   📋   | **L1**    | Module separation                                 |
|   ⏳   | **M1–M4** | Backend, auth, revisions and audit trail          |

The single-product workflow is stable since Layer E; multi-product tabs, artwork layers, Pantone compliance and cross-functional sign-off are implemented through Layer H.

Layers F1, G and H were developed incrementally; remaining layers should stay isolated in dedicated branches if developed in parallel.

### UX Polish — Artwork Layer Context Menu

* [x] Custom right-click menu on artwork layer tabs.
* [x] Rename target layer.
* [x] Add Layer shortcut.
* [x] Delete target layer.
* [x] Last-layer deletion disabled.
* [x] Viewport-safe positioning.
* [x] Outside-click / Escape dismissal.
* [x] Product / layer menu mutual exclusivity.
* [x] Native browser menu preserved outside tabs.
* [x] Artwork layer tab visual refinement.

### UX Polish — Product Tab Context Menu

* [x] Custom right-click menu.
* [x] Rename target product.
* [x] Duplicate target product.
* [x] New Product shortcut.
* [x] Delete target product.
* [x] Last-product deletion disabled.
* [x] Viewport-safe positioning.
* [x] Outside-click / Escape dismissal.
* [x] Product tab visual refinement.

---

## Development workflow

The project follows:

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
2. define testable requirements;
3. define business rules;
4. confirm the data model;
5. document design decisions;
6. perform impact analysis;
7. split work into small tasks;
8. implement only the requested scope;
9. run manual tests;
10. run automated regression tests;
11. document completion;
12. create a descriptive conventional commit (e.g. `feat:`, `fix:`, `docs:`) and a Pull Request.

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

1. update local `main`;
2. create a dedicated feature branch;
3. work on one planned concern at a time;
4. keep persistent domain state in `appState`;
5. treat DOM as a representation of state;
6. keep session-only information outside the domain;
7. preserve previous behavior;
8. add or update automated tests;
9. run manual regressions;
10. inspect `git diff`;
11. use a concise conventional commit message;
12. open a Pull Request;
13. review before merging into `main`.

Example branches:

```text
feat/review-status
feat/review-comments
feat/copy-corrections
feat/state-serialization
feat/local-storage
feat/normalized-pins
feat/artwork-identity
feat/review-metrics
feat/multiple-products
```

### Global acceptance criteria

Every milestone must guarantee:

```text
application opens normally
no functional console errors
previous features remain operational
requirements are satisfied
automated tests pass
manual tests pass
future-phase functionality was not introduced accidentally
```

---

## License

Private / internal use.

This repository is an educational prototype under active development. Contact the project owners before external distribution.
