# ADR-001 — Vanilla Web Stack

**Status: Accepted**

## Context

The project began as a single-file prototype and grew into a structured review tool. Requirements for the MVP: local, single-user, browser-only, zero-install, educational codebase (principles P-003/P-006). No multi-user, collaboration, auth or hosting requirements existed.

## Decision

Use **HTML5 + CSS + vanilla JavaScript** with:

- no framework (no React/Vue/Angular/Next.js);
- no package manager (no `package.json`, no `npm install`);
- no build tool;
- no backend;
- no database;
- no third-party runtime libraries.

Implementation: `index.html`, modular CSS under `css/`, classic scripts `js/app.js` + `js/tests.js`.

## Rationale

- The feature set fits a static page; a framework adds abstraction without adding capability.
- Zero dependencies means zero supply-chain and build risk; the repo runs as-is from any static server.
- The project is explicitly educational: small explicit functions teach architecture better than framework boilerplate.
- Storage and rendering needs (localStorage, imperative DOM rebuild) are natively covered.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Framework SPA (React/Vue) | Unnecessary complexity for 50-item checklist + viewer; violates P-006 |
| TypeScript | Adds a build step; no runtime benefit at this scale (documented as future consideration only) |
| ES modules | Not used: classic scripts keep zero-build serving; module split is planned L1 |
| Backend (Supabase/Express/Firebase) | No multi-user/remote needs in the MVP; revisit at layer M |

## Consequences

**Positive**

- Instant local development; no install; easy onboarding.
- Full control over code; easy debugging.
- No dependency vulnerabilities.

**Negative**

- Architecture is enforced by convention (e.g. state discipline), not by framework.
- Any future module split or backend requires deliberate work (layers L1, M).

## Revisit When

- Multi-user reviews, shared persistence, auth or audit trail become real requirements (planned M).
- The single file `js/app.js` (~12,160 lines) makes maintenance impractical (planned L1).

## Related Files

- `index.html`, `css/style.css`, `js/app.js`, `js/tests.js`
- [engineering/tech-stack.md](../engineering/tech-stack.md)

## Related layers

A0 (baseline), L1 (module separation), M1–M4 (backend/auth/revisions/audit).
