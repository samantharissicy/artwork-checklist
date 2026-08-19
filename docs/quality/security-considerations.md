# Security Considerations

**Status: Current** — this documents the current posture. It is not a security certification.

## Threat Boundaries

| Boundary | Description |
| --- | --- |
| **Local files** | The app runs entirely in the browser; no files are transmitted anywhere by the application (no network code exists). |
| **Imported JSON** | `Open Check` reads user-provided review files — untrusted input. |
| **User-provided product names/comments** | Text entered into product fields, titles, comments and notes. |
| **Artwork images** | Local image files selected by the user; displayed via Object URLs. |
| **Browser storage** | `localStorage` under the serving origin holds review state. |
| **Future backend** | Any backend would introduce authentication, transport and storage concerns — currently not applicable ([future/backend-transition.md](../future/backend-transition.md)). |

## Current Mitigations

| Concern | Mitigation |
| --- | --- |
| Untrusted imported JSON | Parsed with try/catch; structurally validated (`validateImportData` → `validateSerializedProduct`); rehydrated into a **fresh object graph** — parsed objects never enter `appState` by reference |
| XSS via user content | User content is rendered with `textContent` (titles, comments, notes); no `innerHTML` injection of user strings; no `eval` anywhere |
| Stored-state corruption | `deserializeState` → null; `validateState`; migration guards; app never crashes on bad storage |
| Object URL leaks | Every created Object URL has a revocation path (session release, replacement, deletion, `beforeunload` → `releaseAllSessionArtworks`) |
| Origin isolation | State is scoped to the serving origin's `localStorage`; another origin cannot read it |
| File-type gating | Artwork upload requires `image/*`; import requires `.json` |

## Current Limitations

| Concern | Limitation |
| --- | --- |
| Data at rest | `localStorage` is plaintext on the user's machine; anyone with OS access can read it |
| No authentication | Any user of the machine can open the app and see/modify all reviews |
| Imported JSON | Validation is structural, not semantic-proof: a crafted file could carry unusual-but-valid text or legacy fields (e.g. `pantoneColors`); it is rendered as data only |
| Privacy | Review data (product names, comments) is stored locally on the user's device; exporting creates a file the user controls |
| CSP | No Content-Security-Policy header exists (static hosting, no server); script injection is only possible through repository code |
| Dependency risk | Zero dependencies = zero supply-chain surface |

## Future Requirements (if backend appears)

- Authentication and authorization (roadmap M2).
- Transport security (HTTPS).
- Server-side import validation and file-size limits.
- Immutable audit log (roadmap M4).
- Object storage with access control for artwork binaries.

None of these are implemented or promised; see [future/future-architecture.md](../future/future-architecture.md).

## Related Documents

- [persistence/import-export.md](../persistence/import-export.md) — import validation pipeline.
- [engineering/browser-runtime.md](../engineering/browser-runtime.md)
- [operations/recovery-and-backup.md](../operations/recovery-and-backup.md)