# Development Workflow

**Status: Current**

## Purpose

Document the official development workflow and Git conventions used in this repository.

## Feature Workflow

Every feature follows the specification-driven workflow defined by the project methodology:

```
AUDIT → SPEC → PLAN → TASKS → IMPLEMENT → VERIFY → REPORT
```

| Stage | Deliverable |
| --- | --- |
| **AUDIT** | Understand the current implementation, functions and elements involved; identify regression risks |
| **SPEC** | Rewrite the request as testable requirements with IDs (`REQ-XXX-001`, …) |
| **PLAN** | Business rules (`BR-XXX-001`, …), data model, design decisions, impact analysis, task breakdown (`TASK-001`, …) |
| **TASKS** | Small, individually verifiable implementation steps |
| **IMPLEMENT** | Minimal region changes; never whole-file rewrites without reason |
| **VERIFY** | Manual tests (`TEST-XXX-001` precondition/action/expected), regression battery, `node --check`, browser console check |
| **REPORT** | Implemented / not implemented / files changed / manual test instructions / known limitations / recommended next step |

During AUDIT, the relevant `docs/` files must be consulted first (architecture → domain → decisions → persistence → testing).

## Acceptance Criteria (project-wide)

1. The app opens normally.
2. No console errors.
3. Previous functionality still works.
4. Feature requirements are met.
5. Manual tests pass.
6. No future-layer features were accidentally implemented.

## Git Workflow

```text
main
 ↓
feature branch
 ↓
implementation
 ↓
tests
 ↓
commit
 ↓
Pull Request
 ↓
review
 ↓
merge
```

- `main` is the integration branch.
- Feature work happens on dedicated branches. Historical branch names in this repository: `feat/artwork-identity`, `feat/multiple-products`, `feat/normalized-pins`, `feat/persist-current-review`, `feat/review-comments`, `feat/review-progress` (remote `origin`).
- No CI/CD pipeline exists; verification is manual + test suite + review.

## Branch Conventions

| Prefix | Use |
| --- | --- |
| `feat/` | New capability |
| `fix/` | Bug fix |
| `refactor/` | Structural change without behaviour change |
| `docs/` | Documentation only |
| `test/` | Test-only changes |

## Commit Message Conventions

Conventional-commit style, as evidenced by the repository history:

| Example (from git log) | Pattern |
| --- | --- |
| `feat: implement G5 Pantone compliance workflow, upgrade to schema v4, ...` | `feat:` |
| `test: add comprehensive test suite for ...` | `test:` |
| `docs: remove internal roadmap and master prompt references ...` | `docs:` |
| `baseline: working artwork checklist prototype` (historical) | `baseline:` |

Suggested commit after a documentation task:

```text
docs: add comprehensive engineering documentation
```

## Verification Commands (no build system)

| Check | Command |
| --- | --- |
| JavaScript syntax | `node --check js/app.js` (and every `js/tests/**/*.js`) |
| Full test suite | serve repo (`python -m http.server 5500`), open `index.html`, run `await runArtworkTests()` in DevTools console |
| Manual regression | [quality/manual-regression-guide.md](../quality/manual-regression-guide.md) |
| Diff review | `git diff` before committing; ensure only intended files changed |

## Rules of Thumb

- Implement only the requested feature (principle P-001); document future needs as `FUTURE CONSIDERATION` instead of implementing them.
- Do not refactor silently: use the `ARCHITECTURAL ISSUE` block (current problem / proposed change / reason / risk / affected files / migration strategy) and only refactor when needed for the current task.
- Report bugs found out of scope with the `OBSERVED ISSUE` block (severity, location, description, recommended future action) instead of fixing them silently.
- Do not commit automatically unless explicitly requested.

## Related Documents

- [coding-standards.md](coding-standards.md)
- [testing-strategy.md](testing-strategy.md)
- [operations/local-development.md](../operations/local-development.md)
- [quality/manual-regression-guide.md](../quality/manual-regression-guide.md)