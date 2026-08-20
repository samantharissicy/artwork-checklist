# Recovery and Backup

**Status: Current**

## Purpose

Clarify what is and is not backed up in this application, and how to preserve a review.

## What Is NOT Backup

| Asset | Nature | Consequence |
| --- | --- | --- |
| `localStorage` | Browser-stored plaintext state | Cleared with site data, browser profile or OS reset; not portable |
| Artwork binary | Session-only | Never stored; lost on reload/close |
| Git history | Source-code history | Tracks code, **not** review data |
| Save Check JSON | Portable review state | **This is the backup** |

## How to Back Up a Review

1. Complete the review (statuses, comments, copy edits, pins).
2. **Save Check** → downloads the active review as schema-v5 JSON, including department sign-offs and signatures.
3. Store the file outside the browser (drive, shared folder).
4. Optionally export one file per product (Save Check exports the **active product only**).

## How to Restore a Review

1. **Open Check** → select the saved `.json`.
2. The review is imported as a **new product** (the workspace is never overwritten).
3. Artwork images must be re-selected per layer (metadata persists; the binary does not).

## What Is Lost After the Session

| Data | Lost? |
| --- | --- |
| Artwork binary images | Yes — session-only (re-select the same file; pins survive because identity matches) |
| Open editors / menus / zoom | Yes — transient by design |
| `localStorage` state if storage cleared | Yes — restore from the saved JSON |

## What Remains

| Data | Remains |
| --- | --- |
| Review state in `localStorage` | Until storage is cleared or the origin's data is removed |
| Saved JSON files | Until the user deletes them |
| Legacy `pantoneColors` in imported v3 files | Preserved (see [legacy-compatibility.md](../persistence/legacy-compatibility.md)) |

## Recommendations

- Use **Save Check per product** as the standard backup habit.
- Treat `localStorage` as a convenience cache, never as the single copy.
- If multi-device or team backup becomes a real need, that is a backend driver (layer M; [backend-transition.md](../future/backend-transition.md)) — not something to hack into the MVP.

## Related Documents

- [persistence/import-export.md](../persistence/import-export.md)
- [architecture/artwork-workspace.md](../architecture/artwork-workspace.md)
- [engineering/browser-runtime.md](../engineering/browser-runtime.md)
- [operations/local-development.md](local-development.md)
