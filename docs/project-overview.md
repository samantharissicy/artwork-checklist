# Project Overview

**Status: Current**

## Business Purpose

The **Artwork & Pack Copy Checklist** is a browser-based **review-support tool** for food-product artwork and packaging copy. It is aligned with the **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned** standard (as configured in the checklist content) and supports the operational workflow of reviewing artworks against approved pack copy.

The application is **not** a certification system: it does not guarantee legal or regulatory compliance. It supports human reviewers by structuring the review, recording decisions and comments, attaching observations to exact artwork locations, and persisting portable review files.

## Problem Being Solved

Reviewing packaging artwork is a multi-step process involving:

- a regulatory checklist (legal core, ingredients/allergens, nutrition, storage/cooking, claims, packaging);
- the artwork itself (front/back/sleeve/label surfaces);
- multiple products and artwork revisions;
- per-item decisions (Pending / Approved / Rejected) with mandatory comments on rejection;
- corrections to packaging copy (original vs. suggested text);
- spatial annotations (pins) that tie a checklist item to a location on the artwork;
- persistence across sessions and portable export/import of a review.

Before this application, these steps lived in scattered spreadsheets, emails and manual printouts. The tool centralizes them locally in the browser.

## Intended Users

| User | Role in the workflow |
| --- | --- |
| Reviewer | Classifies items, comments, pins, edits copy, saves/opens checks |
| QA / compliance specialist | Verifies rejected items have reasons and the review is complete |
| Product developer / owner | Uses the review output to request artwork changes |

There is no authentication and no multi-user model in the current MVP: the tool is a local single-user workspace.

## Current MVP Scope (implemented)

- Structured checklist: **50 items in 6 sections** (canonical content in `js/app.js` — `sectionDefinitions`).
- Tri-state review: `pending` / `approved` / `rejected` per item; rejection requires a non-empty comment.
- Per-item comments and inline copy corrections (`originalTitle` immutable, `currentTitle` editable, Edited indicator, Restore original).
- Product workspace: multiple products, tabs, rename/duplicate/delete (with confirmation), permanent product IDs.
- Product review context: Brand, Product Name, Weight, SKU, Production Code, Site (`OH1`/`OH2`/`BL`), Artwork Revision.
- Multi-layer artwork workspace: layer tabs, add/rename/delete layers, per-layer artwork metadata and session images, per-layer pins.
- **Pantone pack-copy compliance** via canonical checklist item **6I — "Pantone Colours Match Approved Pack Copy?"**, which follows the standard review workflow (see [domain/review-workflow.md](domain/review-workflow.md)).
- Normalized pins (`xRatio`/`yRatio` in 0..1) with zoom independence, drag-and-drop from checklist, pin↔item navigation, Clear Pins.
- Persistence: schema-v4 versioned `localStorage`, legacy key migration (v1/v2/v3), Save Check JSON export, Open Check import with validation.
- Legacy `pantoneColors` metadata preserved read-only for backwards compatibility (see [persistence/legacy-compatibility.md](persistence/legacy-compatibility.md)).

## Explicitly Excluded Scope (current MVP)

| Excluded | Reason / status |
| --- | --- |
| Backend, database, authentication, multi-user | No real multi-user need yet; future layer M |
| Report generation / PDF | Future layer J |
| Per-status counters and approval percentage | Roadmap layer F1 (only "X / Y reviewed" is implemented) |
| Reviewer identity / signature / department sign-off | Future layers H1–H4; fields exist in the data model but are never populated |
| High-resolution artwork strategies | Future layer I |
| Responsive/touch alternatives to HTML drag-and-drop | Future layer K3 |
| Automatic colour reading, RGB/HEX conversion, eyedropper, OCR, pack-copy upload | Explicitly not part of the Pantone compliance workflow |
| Module separation (ES modules) | Future layer L1 |

## Current Capabilities (summary)

See [README.md](../README.md) (project presentation) and [architecture/architecture-overview.md](architecture/architecture-overview.md) (technical detail).

## Development Philosophy

The project follows a specification-driven methodology: incremental, specification-driven evolution with mandatory principles:

- **P-001 Incrementality** — implement only the requested feature;
- **P-002 Preservation** — never break existing functionality;
- **P-003 Simplicity** — small explicit functions, educational codebase;
- **P-004 Single Source of Truth** — `appState` owns domain state, the DOM only represents it;
- **P-005 Data-first** — data model before UI;
- **P-006 Compatibility** — no framework/npm/build/backend in the MVP;
- **P-007 Phase separation** — future features are documented, not implemented early.

## Roadmap Methodology

Development is guided by an external roadmap (previously `roadmap.md`, removed from this repository in commit `48ff58c`). Layers are developed in sequence (A0 baseline → B state → C workflow → D persistence → E geometry → F metrics → G multi-product/multi-layer/Pantone → H sign-off → I high-res → J report → K quality → L refactor → M backend). Each completed layer must leave the system functional and pass its acceptance criteria.

Implemented layers as of today: **A0, B1, C1, C2, C3, D1–D4, E1, E2, G1–G5** (F1 partially: only the basic progress bar exists). See [future/roadmap-technical-notes.md](future/roadmap-technical-notes.md).

## CURRENT vs PLANNED vs FUTURE

| Category | Meaning | Where documented |
| --- | --- | --- |
| CURRENT | Implemented and tested in this repository | All `docs/` files except `future/` |
| PLANNED | On the roadmap, not yet implemented | [future/roadmap-technical-notes.md](future/roadmap-technical-notes.md) |
| FUTURE | Conditional evolution if real needs appear | [future/future-architecture.md](future/future-architecture.md), [future/backend-transition.md](future/backend-transition.md) |