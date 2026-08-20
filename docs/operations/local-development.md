# Local Development

**Status: Current**

## Purpose

Explain exactly how to run the project locally and run the tests.

## Requirements

- Any modern browser (see [browser-runtime.md](../engineering/browser-runtime.md)).
- Python 3 (for the recommended static server) **or** any other static file server.
- Git (to clone).
- Node.js is **optional** — used only for `node --check` syntax validation, never to run the app.

## Steps

```text
1. Clone the repository
   git clone <repository-url> artwork-checklist
   cd artwork-checklist

2. Start a simple HTTP server
   python -m http.server 5500

3. Open in the browser
   http://localhost:5500/index.html
```

**No `npm install` is required** — there are no dependencies, no package.json and no build step.

Windows note: `python -m http.server 5500` works in PowerShell and CMD with Python installed; alternatives such as `npx serve` or any static server also work. Serving through `http://localhost` is **required** — `file://` is not a supported runtime (see [browser-runtime.md](../engineering/browser-runtime.md)).

## DevTools

1. Open DevTools (F12 / Ctrl+Shift+I).
2. **Console tab**: watch for errors; run tests here.
3. **Application tab → Local Storage → http://localhost:5500**: inspect `artworkChecklist:v5`.

## Running the Tests

```text
1. Serve the repository (step 2 above).
2. Open the app.
3. DevTools Console:
     await runArtworkTests();
4. Read the summary line, e.g.:
     %c449/449 tests passed
```

The suite snapshots application state before running and restores it afterwards.

## Syntax Checks (optional)

```powershell
node --check js/app.js
node --check js/tests.js
Get-ChildItem js/tests -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Related Documents

- [engineering/browser-runtime.md](../engineering/browser-runtime.md)
- [engineering/testing-strategy.md](../engineering/testing-strategy.md)
- [operations/troubleshooting.md](troubleshooting.md)
- [operations/recovery-and-backup.md](recovery-and-backup.md)
