# Backend Transition

**Status: Future / Not Implemented**

> This document maps what **would change** if a backend became a real requirement (roadmap M). It is not an implementation plan and no backend exists today.

## Motivation (when this becomes relevant)

Real needs only — per the roadmap: multiple users, multiple computers, shared history, organizational approval, audit, permissions, central artwork storage.

## Mapping: Local → Backend

| Current (local) | Future (backend) | Notes |
| --- | --- | --- |
| `localStorage` (`artworkChecklist:v4`) | Database (entities, schema, migrations) | The schema-v4 model maps cleanly to tables/documents; migration versioning should continue server-side |
| Session Object URL (artwork binary) | Object storage with access control | Requires upload/download flows, size limits, thumbnails (roadmap I1 concerns) |
| Local product identity (`product-N`) | Database entity + server-assigned IDs | ID collision strategy already exists locally (`generateProductId`); server must own uniqueness |
| Local reviewer string (future H1 field) | Authenticated user | `product.reviewer` becomes derived from the session user, not free text |
| Save Check JSON (backup/portability) | Export/backup endpoint | JSON stays as the interchange format; export becomes a server feature |
| No audit events | Immutable audit log (roadmap M4) | Who did what, on which product/revision, when |
| Versioned schema migration (v1→v4) | Server-side migration + client compatibility policy | Same non-destructive philosophy |

## Risks

| Risk | Mitigation direction |
| --- | --- |
| Breaking existing local reviews | Import path already exists (Open Check); server onboarding = upload of Save Check files |
| Client/server state divergence | Keep `appState` as the client projection; server is the store (same single-source-of-truth principle) |
| Offline use lost | Local-first sync (cache + queue) if offline matters |
| Security surface grows | Authentication, authorization, HTTPS, input validation server-side, audit ([security-considerations.md](../quality/security-considerations.md)) |
| Complexity budget | The project's simplicity principles (P-003/P-006) must be explicitly revisited when the backend layer is added |

## What the Roadmap Says

Layers M1 (backend), M2 (auth), M3 (revision history), M4 (audit trail) are all planned, conditional on real usage. Until then the local architecture stands.

## Related Documents

- [future-architecture.md](future-architecture.md)
- [roadmap-technical-notes.md](roadmap-technical-notes.md)
- [operations/recovery-and-backup.md](../operations/recovery-and-backup.md) — today's backup story.