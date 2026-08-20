# Troubleshooting

**Status: Current**

## Purpose

Common problems, likely causes, checks and resolutions. Commands listed are the ones actually documented for this project.

## App Does Not Load

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| Blank page | Opened via `file://` | URL starts with `file://` | Serve via `python -m http.server 5500` and open `http://localhost:5500/index.html` |
| JS error in console | File missing / path wrong | DevTools → Sources; confirm `js/app.js` loads | Ensure the repo is served from its root (paths are relative) |

## CSS Missing / Broken Layout

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| No styles at all | `css/style.css` 404 | Network tab; confirm the file exists | Serve from repo root; check the `@import` chain in `style.css` |
| 404 on CSS imports | `@import url("./…")` paths wrong | Network tab lists failed `@import`s | Keep the 18 imports intact in `style.css` (see [css-architecture.md](../architecture/css-architecture.md)) |
| Partial styles | Orphaned legacy file confusion | Confirm `style.legacy.css` is not linked (it is not, by design) | Do not add it back |

## Artwork Missing After Reload

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| "File Required" state | Binary is session-only by design (ADR-004) | Metadata visible in `#artwork-meta` | Re-select the same file — identity match restores the image and keeps pins |
| Image never loads | Non-image file | File type check rejects non-`image/*` | Use a PNG/JPEG/… file |

## Pins Visible but Image Unavailable

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| Pins shown over demo/missing artwork | Session image lost after reload; pins persisted | Pins belong to the layer; image is session-only | Re-select the same file; or Clear Pins if obsolete |

## Open Check Rejected

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| Toast rejection on import | File not `.json`, malformed JSON, or invalid structure | File content; `schemaVersion` | Use a valid Save Check file; v1/v2/v3 files are auto-migrated, unsupported structures are not |
| Imported product shows wrong data | File edited by hand | Validation is structural | Re-export and re-import |

## Corrupted localStorage

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| App opens with default product, old data "lost" | Garbage under `artworkChecklist:v5` | Application → Local Storage | Safe fallback is intentional (test `D2`); delete the key to start fresh |

## Old Schema Migration

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| v4/v3/v2/v1 state loaded and promoted | Legacy keys walked in order | Storage tab: key changed to `artworkChecklist:v5`, old key removed | Expected behaviour; missing 6I/sign-offs added as Pending, data preserved |
| Migration failed silently | Unsupported version | Console shows `console.warn` | Re-save as v4 file via Save Check; do not hand-edit the key |

## Context Menu Not Appearing

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| Right-click does nothing on tabs | Clicked elsewhere, or page state odd | Menu opens only on `.product-tab` / `.artwork-layer-tab` | Right-click exactly on a tab; native menu remains elsewhere by design |
| Menu appears off-screen | Old stale layout | Viewport resize closes menus | Re-open the menu |

## Tests Failing

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| `runArtworkTests` errors | Scripts not loaded in order | Console at load time; `window.ArtworkTests` exists | Load via HTTP server; clear cache; confirm `js/tests.js` loads last |
| Failures after a change | Regression | Failed test names listed in console | Fix the regression; re-run; see [manual-regression-guide.md](../quality/manual-regression-guide.md) |
| Blob URL console warning | Known fixture artifact (`G4UX-028` fake `blob:http://localhost/…`) | Warning text | Not an app defect; documented in [testing-strategy.md](../engineering/testing-strategy.md) |

## Stale Browser Cache / Wrong Branch

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| Old behaviour still visible | Browser cache | Hard refresh (Ctrl+Shift+R) or DevTools → Network → Disable cache | Reload |
| Code differs from docs | Wrong branch checked out | `git status`, `git branch`, `git log --oneline` | Checkout `main` or the expected feature branch |

## Console Errors

| Symptom | Likely cause | Check | Resolution |
| --- | --- | --- | --- |
| `Failed to deserialize state:` / `Failed to load state from storage:` | Corrupted stored JSON | Console context | Expected for corrupt storage (app continues); clear the key to reset |
| `Failed to migrate imported review` | Invalid import file | File validity | Use a valid file |
| Any other `console.error` | Real defect | Stack trace | Report via the project issue flow; do not silence |

## Related Documents

- [operations/local-development.md](local-development.md)
- [engineering/error-handling.md](../engineering/error-handling.md)
- [engineering/browser-runtime.md](../engineering/browser-runtime.md)
