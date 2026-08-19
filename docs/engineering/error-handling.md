# Error Handling

**Status: Current**

## Purpose

Document how the application handles failure: recoverable errors, validation errors, user confirmations, and fatal/unexpected cases — grounded in the actual implementation.

## Strategy Summary

| Category | Example | Handling |
| --- | --- | --- |
| **Recoverable** | Corrupted `localStorage`, malformed JSON, unsupported schema, quota exceeded | Safe fallback: log (`console.error`/`warn`), keep running with default or unchanged state |
| **Validation error** | Rejected item without comment, invalid file type, empty layer name, invalid status | Refuse the mutation, show inline error or toast; state unchanged |
| **User confirmation** | Artwork replacement with pins, product/layer deletion, layer delete with pins | Custom dialog (`showConfirmDialog`); action only proceeds on confirm |
| **Fatal/unexpected** | Migration failure, import of an incompatible file | Log + friendly toast; current state untouched |

## Error Handling Mechanisms

### Toast (`showToast`, js/app.js:6786)

- Writes `#toast` text, adds `.show`, auto-hides after 2500 ms (`toastTimeoutId`).
- Used for non-blocking feedback: save confirmation, import success/failure, clear pins, add layer, etc.

### Custom Dialog (`openAppDialog`, js/app.js:9016)

- Modal `#app-dialog-overlay` with `role="dialog"`, `aria-modal`, tones (warning/danger/success), optional text prompt.
- Public wrappers: `showConfirmDialog(options)` (js/app.js:9201) and `showPromptDialog(options)` (js/app.js:9221).
- Keyboard: Escape dismisses; Enter submits when the prompt input is focused.
- `deleteProduct(productId, confirmDelete = window.confirm)` (js/app.js:3733) and `applyArtworkIdentity(..., confirmReplacement, ...)` (4662) accept a confirm callback — production uses the custom dialog, tests inject stubs.

### Safe Fallbacks (by function)

| Function | Fallback |
| --- | --- |
| `deserializeState` (5468) | `null` on malformed JSON |
| `loadStateFromStorage` (6408) | any pipeline failure → in-memory `appState` untouched |
| `migrateState` (6295) / `migrateImportData` (9262) | `null` on unsupported versions (with `console.warn`) |
| `saveStateToStorage` (6484) | `false` + `console.error` on quota/API errors |
| `getActiveArtworkLayer` (777) | falls back to `artworkLayers[0]` |
| `getArtworkSession` | `null` when no session exists |
| `validateImportData` (9388) | `null` → import rejected with toast |

### try/catch Blocks (13 in js/app.js)

Located in: `deserializeState`, `migrateStateV1ToV2`, `migrateStateV2ToV3`, `migrateStateV3ToV4`, `loadStateFromStorage` (nested), `saveStateToStorage`, `downloadJsonFile`, `handleArtworkFileChange`, `migrateImportData` (×3), `handleCheckFileChange`.

## Error Scenarios (implementation mapping)

| Scenario | Behaviour |
| --- | --- |
| **Invalid JSON in storage** | `deserializeState` → `null`; default state loads; `console.error` |
| **Corrupted localStorage** | `loadStateFromStorage` catches; app opens with seeded product (test: `D2 corrupted localStorage does not crash state loading`) |
| **Unsupported schema** | `migrateState` → `null`; default state; `console.warn` |
| **Invalid imported state** | `applyImportedReview` → `migrateImportData`/`validateImportData` reject with toast; current state untouched (tests: `G5-048`, `G5-049`, `G4A-039`) |
| **Missing artwork file** | `renderArtworkState` shows "File Required" state; metadata persists, binary does not |
| **Artwork replacement** | `isSameArtworkIdentity` comparison; confirm dialog when pins exist; confirmed replacement clears pins |
| **Last product deletion** | rejected (`deleteProduct`), delete menu item disabled |
| **Last layer deletion** | rejected (`deleteArtworkLayer`), delete menu item disabled |
| **Rejected without comment** | `validateItemState` (js/app.js:2170) flags invalid; UI shows inline error "Comment required"; final gating in `validateActiveProduct` |
| **Invalid domain references** | pin/layer validation (`isValidStoredLayerPin`, `validateItemPins`, `validateProductLayers`); dangling layer references rejected on import |
| **Object URL cleanup** | `URL.revokeObjectURL` on session release, replacement, product/layer deletion, `beforeunload` |
| **User cancellation** | dialogs resolve `null`/false; no state change |

## Logging Convention

- `console.error`: unexpected failures (deserialization, storage save, file read, migration failures).
- `console.warn`: recoverable/ignorable conditions (unsupported version, legacy-key replacement failure, invalid status warnings).
- No `console.log` in `js/app.js`.

## Related Documents

- [engineering/browser-runtime.md](browser-runtime.md)
- [persistence/import-export.md](../persistence/import-export.md) — failure behaviour on import.
- [architecture/persistence-and-schema.md](../architecture/persistence-and-schema.md) — load pipeline guarantees.
- [domain/business-rules.md](../domain/business-rules.md) — validation rules.