# Browser Runtime

**Status: Current**

## Purpose

Document the browser-only runtime: relevant APIs, why a local HTTP server is recommended, and the runtime assumptions the application makes.

## Browser-Only Runtime

The application is a static, client-side web app:

- No server-side execution, no network requests, no remote data transmission.
- All code runs in the browser tab; state persists in `localStorage` of the app origin.
- Entry points: `index.html` → `js/app.js` → (test harness) `js/tests.js`.

## Relevant Browser APIs

See [tech-stack.md](tech-stack.md) for the verified API list. Highlights for runtime behaviour:

| API | Runtime consequence |
| --- | --- |
| `localStorage` | Persists review state; origin-scoped; ~5 MB quota |
| `URL.createObjectURL` / `URL.revokeObjectURL` | Session artwork display and JSON download; URLs are page-session-scoped |
| `File` / `file.text()` | Open Check JSON reading |
| `Image` + `onload` | Natural artwork dimensions for metadata |
| Drag and Drop API | Checklist → artwork pinning |
| `crypto.randomUUID` | Permanent product/layer/colour IDs (fallback included) |

## Why a Local HTTP Server Is Recommended

The README instructs:

```text
python -m http.server 5500
```

Why not just double-click `index.html` (file://)?

- The File API and Blob/object-URL flows behave inconsistently under `file://` across browsers.
- `localStorage` under `file://` is unreliable (origin is `null`) — state may not persist.
- The test harness loads scripts dynamically; a real origin guarantees consistent `document.currentScript` resolution.

**Recommendation:** always run through `http://localhost:PORT/`. `file://` is **not** a supported runtime.

## Browser Compatibility Assumptions

**Known Runtime Assumptions** (verified by usage in code, not by a formal compatibility matrix):

- A modern evergreen browser (Chromium/Firefox/Safari generation) with:
  - `crypto.randomUUID` (fallback to `Date.now()` + `Math.random()` exists, so older engines still work);
  - `file.text()` on `File` objects;
  - `URL.createObjectURL` / `revokeObjectURL`;
  - Drag and Drop (`dragstart`/`dragover`/`drop`), `pointerdown`, `contextmenu`;
  - ES2017+ syntax (async/await, object spread, template literals).
- The app is **not** documented as tested on any specific browser matrix; the automated suite runs in the developer's browser of choice.

## Session Lifecycle

- `beforeunload` → `releaseAllSessionArtworks()`: revokes every Object URL.
- Session images and Object URLs never survive a reload; metadata does.

## Known Runtime Limitations

| Limitation | Current state |
| --- | --- |
| Image persistence across reload | Not available (session-only by design, ADR-004) |
| Offline/multi-device sync | Not available (no backend, ADR-003) |
| Print stylesheets | Not implemented (future layer J2) |
| Touch/mobile interactions | Not implemented (future layer K3) |

## Related Documents

- [tech-stack.md](tech-stack.md)
- [operations/local-development.md](../operations/local-development.md)
- [operations/troubleshooting.md](../operations/troubleshooting.md)
- [operations/recovery-and-backup.md](../operations/recovery-and-backup.md)