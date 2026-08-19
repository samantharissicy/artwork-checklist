# Glossary

**Status: Current**

## Purpose

Define the project terminology as used in code, tests and documentation. Definitions reflect what the project actually implements; planned concepts are marked.

| Term | Definition |
| --- | --- |
| **Artwork** | The visual packaging design under review (front/back/sleeve/label surfaces). In-app, represented by per-layer metadata + a session-only binary image or the built-in demo pack. |
| **Pack Copy** | The approved packaging text and colour specification the artwork must match. The application does not store pack copy as a document; the checklist drives the comparison. |
| **Review** | The act of classifying the 50 checklist items of a product against the artwork. |
| **Review Item** | One canonical checklist requirement (e.g. `1a`, `6i`), with status, comment, pins and editable copy. |
| **Pending** | Review status: not yet decided (default). |
| **Approved** | Review status: the item meets the requirement. |
| **Rejected** | Review status: the item does not meet the requirement; a non-empty comment is mandatory. |
| **Pin** | A normalized (`xRatio`, `yRatio`) annotation connecting a checklist item to a location on one artwork layer. |
| **Artwork Layer** | A surface/page of the artwork (e.g. Main Artwork, Front, Back); owns its artwork metadata, session image and pins. |
| **Production Code** | Product's production code field; intentionally independent of SKU. |
| **SKU** | Stock-keeping unit field of the product. |
| **Site** | Allowed production site of the product (`OH1`, `OH2`, `BL`). |
| **Artwork Revision** | Version label of the artwork being reviewed (textual; distinct from app version). |
| **Pantone** | Colour reference system used in the legacy registry as free text. The current compliance flow treats the approved pack copy as the Pantone authority. |
| **Compliance** | In this project: whether the artwork matches the approved pack copy, recorded via checklist item 6I. |
| **Reviewer** | Planned identity of the person deciding an item (model present, UI future — roadmap H1). |
| **Sign-Off** | Planned independent department approval (roadmap H2/H3); `product.signature` exists but is never populated. |
| **Schema** | The versioned shape of persisted state; currently **v4**. |
| **Rehydration** | Rebuilding a fresh object graph from parsed/migrated JSON, restoring canonical (immutable) fields. |
| **Migration** | Converting persisted state from an older schema to the current one (v1→v2→v3→v4) without data loss. |
| **Session Artwork** | The binary image and its Object URL, kept only for the current page session (`artworkSessions`). |
| **Object URL** | `URL.createObjectURL` handle to an in-memory binary; runtime-only, revoked on release. |
| **Baseline** | The frozen original prototype behaviour, recorded in `baseline.en.md` / `baseline.pt-BR.md` (historical snapshots, never edited). |
| **Roadmap Layer** | A unit of planned development (A0, B1, …, M4) defined in the external roadmap; see [roadmap-technical-notes.md](../future/roadmap-technical-notes.md). |
| **ADR** | Architecture Decision Record — a document in [decisions/](../decisions/README.md) capturing a significant technical decision and its rationale. |
| **appState** | The single source of truth: `{schemaVersion, activeProductId, products}`. |
| **Single Source of Truth** | Principle P-004: domain state lives in `appState`; the DOM only represents it. |
| **Checklist** | The 50 canonical items in 6 sections rendered in the left panel. |
| **Save Check** | Export of the active product's review as schema-v4 JSON (`exportReviewAsJson`). |
| **Open Check** | Import of a review JSON file as a new product (`openCheck`). |
| **Legacy `pantoneColors`** | The retired Pantone colour registry, preserved for backwards compatibility with schema-v3 review files only. |
| **Edited** | Indicator shown when `currentTitle` differs from `originalTitle`. |
| **Demo Artwork** | Built-in HTML/CSS pack mock (Front/Back) shown when no image is loaded. |
| **File Required** | Viewer state when artwork metadata exists but the session binary is missing (e.g. after reload). |
| **Toast** | Non-blocking feedback message (`#toast`, auto-hides after 2.5 s). |
| **Context Menu** | Right-click menu on product tabs or artwork layer tabs (native menus elsewhere). |
| **Transient UI State** | Non-persisted module state (zoom, open comment panels, editors, menu targets, dialog). |

## Terms Not Defined by This Project

- **BRCGS clauses** beyond the standard reference in the checklist content are **not** defined here; the checklist is the project's representation of the standard.
- **Pantone specifications** (official RGB/HEX) are **not** part of the project.
- **Company-specific policies, departments or approval chains** beyond the planned sign-off departments (Quality / Production / Product Development) are **not** defined.

## Related Documents

- [domain-overview.md](domain-overview.md)
- [data-dictionary.md](data-dictionary.md)
- [decisions/README.md](../decisions/README.md)