# ADR-004 — Session-Only Artwork Binaries

**Status: Accepted**

## Context

Users upload artwork images that can be large (multi-MB). `localStorage` has a ~5 MB quota and is text-oriented; persisting binaries would risk quota failures, slow serialization, and bloat review files. But reviewers need the image during a session and expect metadata to survive reload.

## Decision

Split artwork data into three layers:

| Data | Persistence |
| --- | --- |
| Metadata `{name, type, size, width, height}` | **Persisted** in `layer.artwork` |
| Binary image | **Session-only** — `artworkSessions` Map |
| Object URL | **Runtime-only** — inside the session record; revoked on release |

Reload shows a "File Required" state; re-selecting the same file restores the image and, because identity matches, existing pins are kept.

## Rationale

- Keeps `localStorage` small and reliable.
- Review decisions (statuses, comments, pins) never depend on the binary; only display does.
- Object URLs are inherently session-scoped — persisting them would create dangling references.
- Identity-based replacement (ADR: `isSameArtworkIdentity`) protects pin validity.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| IndexedDB for binaries | Future option; no current need — would add complexity and a second persistence API |
| Base64 into localStorage | Blows the quota; corrupts export files; slow |
| Backend/object storage | No backend in MVP (ADR-001); revisit at layer M / I1 |

## Consequences

**Positive**

- No quota risk; exports stay text-only and portable.
- Clean lifecycle: every Object URL has a revocation path, including `beforeunload` → `releaseAllSessionArtworks`.

**Negative**

- Image must be re-selected after reload (UX cost, mitigated by "File Required" state and same-file identity fast path).
- Multi-layer sessions multiply in-memory binaries.

## Revisit When

- Large-image handling becomes a requirement (roadmap I1 — e.g. downscaling for display or IndexedDB persistence).
- Backend/object storage exists (roadmap M).

## Related Files

- `js/app.js` — `artworkSessions`, `adoptSessionArtwork`, `releaseLayerSessionArtwork`, `inspectArtworkFile`, `applyArtworkIdentity`, `renderArtworkState`
- [architecture/artwork-workspace.md](../architecture/artwork-workspace.md)
- [quality/performance-considerations.md](../quality/performance-considerations.md)

## Related Roadmap Layers

E2 (artwork identity), I1 (high-resolution strategy), M (backend storage).