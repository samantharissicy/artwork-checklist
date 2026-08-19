# Artwork & Pack Copy Checklist — Engineering Documentation

**Status: Current** — this documentation describes the repository as it exists today (schema v4, 50 checklist items, 373 tests).

## Purpose

This `docs/` tree is the technical knowledge base for the **Artwork & Pack Copy Checklist** application. It exists so that:

1. a new developer can understand the project without reading all ~9,800 lines of `js/app.js` first;
2. an AI coding agent can receive `docs/` as context and correctly understand the current architecture;
3. important technical decisions do not have to be re-discussed repeatedly;
4. future changes can identify architecture, domain rules, data model, persistence, migrations, responsibilities, tests, limitations and historical decisions;
5. technical onboarding is significantly faster;
6. the root `README.md` remains the project presentation and does not carry architectural detail.

## Audience

| Audience | Primary need |
| --- | --- |
| New developers | Orientation, stack, architecture, workflow |
| AI coding agents | Grounded, code-accurate context with stable identifiers |
| Reviewers / QA | Domain workflow, test strategy, manual regression guide |
| Maintainers | Decision history (ADRs), legacy compatibility, migration policy |

## Source-of-Truth Hierarchy

When documentation conflicts with the repository, resolve in this order:

```
CODE > TESTS > ROADMAP > PROMPT-MESTRE > README > HISTORICAL BASELINE
```

`baseline.en.md` / `baseline.pt-BR.md` are **historical snapshots** (layer A0) and are never edited.

> Note: `roadmap.md` and `prompt-mestre.md` are maintained **outside** this repository since commit `48ff58c`. The historical layer plan they defined is reflected in [future/roadmap-technical-notes.md](future/roadmap-technical-notes.md); this repo documents the implemented reality.

## Current Architecture Summary

- **Status: Current.** Vanilla HTML5 + CSS + JavaScript; no framework, no npm, no build, no backend, no database, no runtime dependencies.
- `appState` is the single source of truth; the DOM is a projection (see [architecture/architecture-overview.md](architecture/architecture-overview.md)).
- Canonical schema **v4**, versioned `localStorage` key `artworkChecklist:v4` (see [architecture/persistence-and-schema.md](architecture/persistence-and-schema.md)).
- **50 checklist items** in **6 sections**; item **6I — "Pantone Colours Match Approved Pack Copy?"** is the canonical Pantone compliance item (see [domain/domain-overview.md](domain/domain-overview.md)).
- Multi-product workspace with tabs and per-product context menus; multi-layer artwork with per-layer pins and layer tabs.
- Legacy `pantoneColors` metadata is preserved for backwards compatibility only (see [persistence/legacy-compatibility.md](persistence/legacy-compatibility.md)).
- Test suite: **373 browser-based tests**, modular (see [engineering/testing-strategy.md](engineering/testing-strategy.md)).

## Current Technical Status

| Area | Value |
| --- | --- |
| Schema | v4 (`CURRENT_SCHEMA_VERSION = 4`, `js/app.js:129`) |
| Storage key | `artworkChecklist:v4` (`js/app.js:5391`) |
| Legacy keys | `artworkChecklist:v3`, `artworkChecklist:v2`, `artworkChecklist:v1` |
| Checklist items | 50 |
| Sections | 6 |
| Review statuses | `pending` / `approved` / `rejected` |
| Allowed sites | `OH1`, `OH2`, `BL` |
| Tests | 373 / 373 passing (time-sensitive metric — see [engineering/testing-strategy.md](engineering/testing-strategy.md)) |
| App source | `js/app.js` (~9,805 lines, 203 named functions) |

## Navigation Groups

| Group | Contents |
| --- | --- |
| [Overview](project-overview.md) | Business purpose, MVP scope, roadmap methodology |
| [Architecture](architecture/architecture-overview.md) | Architecture, data model, state, rendering, persistence, artwork, pins, context menus, CSS |
| [Engineering](engineering/tech-stack.md) | Stack, development workflow, coding standards, testing, error handling, browser runtime |
| [Domain](domain/domain-overview.md) | Domain concepts, review workflow, business rules, data dictionary, glossary |
| [Persistence](persistence/serialization.md) | Serialization, migrations, import/export, legacy compatibility |
| [Quality](quality/quality-strategy.md) | Quality strategy, security, accessibility, performance, manual regression |
| [Operations](operations/local-development.md) | Local development, troubleshooting, recovery and backup |
| [Architecture Decisions](decisions/README.md) | ADR-001 … ADR-009 |
| [Future Architecture](future/future-architecture.md) | **FUTURE / NOT CURRENT IMPLEMENTATION** |

## Start Here

1. [project-overview.md](project-overview.md) — what the product is and is not.
2. [engineering/tech-stack.md](engineering/tech-stack.md) — the stack in one page.
3. [architecture/architecture-overview.md](architecture/architecture-overview.md) — how the pieces fit together.
4. [architecture/data-model.md](architecture/data-model.md) — the actual persisted models.

## Recommended Reading Paths

### New Developer

1. [project-overview.md](project-overview.md)
2. [engineering/tech-stack.md](engineering/tech-stack.md)
3. [architecture/architecture-overview.md](architecture/architecture-overview.md)
4. [architecture/data-model.md](architecture/data-model.md)
5. [engineering/development-workflow.md](engineering/development-workflow.md)
6. [engineering/testing-strategy.md](engineering/testing-strategy.md)

### AI Coding Agent

1. [architecture/architecture-overview.md](architecture/architecture-overview.md)
2. [domain/business-rules.md](domain/business-rules.md)
3. [architecture/data-model.md](architecture/data-model.md)
4. [architecture/persistence-and-schema.md](architecture/persistence-and-schema.md)
5. [engineering/coding-standards.md](engineering/coding-standards.md)
6. [future/roadmap-technical-notes.md](future/roadmap-technical-notes.md)

### Reviewer / QA

1. [domain/review-workflow.md](domain/review-workflow.md)
2. [engineering/testing-strategy.md](engineering/testing-strategy.md)
3. [quality/manual-regression-guide.md](quality/manual-regression-guide.md)

## CURRENT vs FUTURE

- Documents under `docs/` describe **current, implemented** behaviour unless explicitly labelled otherwise.
- Documents under [future/](future/future-architecture.md) are labelled **Status: Future / Not Implemented** and describe possible evolution, not promises.
- The roadmap layer table lives in [future/roadmap-technical-notes.md](future/roadmap-technical-notes.md); scheduling authority is the external roadmap.
- Historical behaviour of the frozen prototype is in `baseline.en.md` / `baseline.pt-BR.md` (unchanged snapshots).

## Baseline Explanation

`baseline.en.md` and `baseline.pt-BR.md` record how the original single-file prototype behaved (layer A0). They are **historical snapshots**: they are not updated as the application evolves, and some numbers inside them (e.g. "49 items") intentionally predate the current schema. The current canonical numbers are defined in the code and verified in this documentation.

## Documentation Maintenance

| Change | Update |
| --- | --- |
| Domain model change | `architecture/data-model.md`, `domain/data-dictionary.md` |
| Schema change | `persistence/migrations.md`, `architecture/persistence-and-schema.md` |
| Major architectural decision | Create/update an ADR in `decisions/` |
| New roadmap layer implemented | Update the relevant current-architecture docs only after implementation |
| Test infrastructure change | `engineering/testing-strategy.md` |
| New CSS architectural rule | `architecture/css-architecture.md` |
| Future ideas | Stay in `future/` or the roadmap until implemented |
| Historical baseline files | Remain unchanged |