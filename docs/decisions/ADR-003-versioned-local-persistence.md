# ADR-003 — Versioned Local Persistence

**Status: Accepted**

## Context

Reviews must survive page reloads and be portable between machines. The MVP has no backend. Requirements: auto-save, restore on load, corrupt-data safety, and a migration path as the state shape evolves.

## Decision

Use **`localStorage` under a versioned key** for textual review state, plus **versioned JSON export** for portability:

- `STORAGE_KEY = "artworkChecklist:v4"` (derived from `CURRENT_SCHEMA_VERSION = 4`); legacy keys `artworkChecklist:v1/v2/v3` are walked and promoted.
- Every state shape carries `schemaVersion`; `serializeState`/`deserializeState`/`validateState`/`migrateState` gate all persistence paths.
- Binary artwork is excluded (see ADR-004); only text metadata is stored.

## Rationale

- `localStorage` is synchronous, origin-scoped and free — sufficient for KB-scale text state.
- Versioning + migration protects existing users across schema evolution (v1→v2 pins, v2→v3 layers, v3→v4 6I).
- Corrupt data must never crash the app: the load pipeline fails safe to the default state.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Backend persistence | No multi-user need; violates MVP constraints (see ADR-001) |
| IndexedDB | Heavier API; no benefit while state is text-only |
| Cookie storage | Tiny quota, unsuitable |
| Unversioned localStorage | Breaks existing users whenever the shape changes |

## Consequences

**Positive**

- Simple, testable persistence (tests cover corruption, migration, round-trip).
- Existing v1/v2/v3 reviews keep working through migration.

**Negative**

- ~5 MB quota (irrelevant for text, forced the session-only binary decision).
- Data is not shared across devices; no history/audit (future layers M3/M4).

## Revisit When

- Multi-user or shared persistence is required (planned M1).
- State outgrows localStorage or needs server-side validation (planned M).

## Related Files

- `js/app.js` — `STORAGE_KEY`, `LEGACY_STORAGE_KEYS`, `loadStateFromStorage`, `saveStateToStorage`, `migrateState`, `buildExportData`
- [architecture/persistence-and-schema.md](../architecture/persistence-and-schema.md)
- [persistence/migrations.md](../persistence/migrations.md)

## Related layers

D1–D4 (serialization/persistence/export/import), M1 (backend).