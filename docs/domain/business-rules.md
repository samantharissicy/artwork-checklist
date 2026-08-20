# Business Rules

**Status: Current**

## Purpose

Formal rule catalog derived from the actual implementation (`js/app.js` + tests). Every rule below is enforced by code and/or asserted by tests. Rules that exist in the planned but are not implemented are excluded (see [future/layer-planning.md](../future/layer-planning.md)).

## BR-REVIEW — Review workflow

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-REVIEW-001 | Every checklist item shall have exactly one review status. | `REVIEW_STATUSES` enum; `validateSerializedItem` |
| BR-REVIEW-002 | Every new item shall default to `pending`. | `createInitialItems`; `rehydrateItems` |
| BR-REVIEW-003 | `approved` and `rejected` are mutually exclusive; selecting one replaces the other. | single `status` field; `setItemStatus` |
| BR-REVIEW-004 | Rejected items require a non-empty comment. | `validateItemState` ; UI error + `aria-invalid` |
| BR-REVIEW-005 | Rejecting an item opens its comment editor. | `handleReviewAction` |
| BR-REVIEW-006 | Clicking the active status button toggles the item back to `pending`. | `handleReviewAction` |
| BR-REVIEW-007 | Review progress counts approved + rejected as reviewed. | `updateProgress` |
| BR-REVIEW-008 | `originalTitle` shall never be modified. | `Object.defineProperty` non-writable; `setItemCurrentTitle` only writes `currentTitle` |

## BR-PRODUCT — Products

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-PRODUCT-001 | The workspace shall always contain at least one product. | `deleteProduct` rejects last product; menu delete disabled (1-product workspace) |
| BR-PRODUCT-002 | Every product shall have a permanent, unique ID. | `generateProductId` (`crypto.randomUUID` + fallback) |
| BR-PRODUCT-003 | The active product shall be explicitly tracked and persisted. | `appState.activeProductId`; `validateState` |
| BR-PRODUCT-004 | Product deletion requires confirmation. | `deleteProductWithDialog` → `showConfirmDialog` |
| BR-PRODUCT-005 | Duplication creates an independent copy with a new ID, fresh timestamps and its own state. | `duplicateProduct` (JSON deep-clone + `rehydrateProduct`) |
| BR-PRODUCT-006 | Duplicated products do not inherit session artwork binaries. | `duplicateProduct` — sessions never cloned |
| BR-PRODUCT-007 | Site shall belong to the allowed set (`OH1`, `OH2`, `BL`). | `ALLOWED_SITES`; `validateSerializedProduct` |
| BR-PRODUCT-008 | Production code shall never be auto-derived from SKU. | separate fields; no derivation logic |

## BR-LAYER — Artwork layers

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-LAYER-001 | Every product shall contain at least one artwork layer. | `createProduct` seeds `layer-main`; `deleteArtworkLayer` rejects last; menu delete disabled |
| BR-LAYER-002 | Every layer shall have a permanent ID and a display name. | `createArtworkLayer`; `validateProductLayers` |
| BR-LAYER-003 | Layer names shall be non-empty (trimmed). | `createArtworkLayerForProduct` / `renameArtworkLayer` |
| BR-LAYER-004 | Switching layers shall not change the active product. | `switchArtworkLayer` only touches layer selection |
| BR-LAYER-005 | Deleting a layer with pins or artwork requires confirmation; the target is re-verified after the dialog. | `deleteArtworkLayerWithDialog` |
| BR-LAYER-006 | Deleting a layer removes its pins and clears legacy Pantone layer references. | `deleteArtworkLayer` → `clearLayerPins`, `clearPantoneLayerReferences` |
| BR-LAYER-007 | Replacing a layer's artwork does not affect other layers. | per-layer sessions (asserted by tests) |

## BR-PIN — Pins

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-PIN-001 | Stored pin coordinates shall be normalized ratios in `[0, 1]`. | `isValidStoredLayerPin`; `calculatePinRatios` clamps |
| BR-PIN-002 | Every pin shall reference an existing artwork layer. | `validateItemPins` + layer validation; import rejection on dangling `layerId` |
| BR-PIN-003 | Each item may hold at most one pin per layer. | `setItemPinForLayer` replace semantics; `validateItemPins` |
| BR-PIN-004 | An item may be pinned on multiple layers. | `item.pins[]` per layer |
| BR-PIN-005 | Pin visibility follows the active layer. | `renderPins` filters by active layer |
| BR-PIN-006 | Replacing artwork with a different identity and existing pins requires confirmation; confirmed replacement clears the layer's pins. | `applyArtworkIdentity`; `ARTWORK_REPLACEMENT_MESSAGE` |
| BR-PIN-007 | Clear Pins clears the active layer's pins only. | `clearPins` → `clearLayerPins` |

## BR-PERSISTENCE — Persistence

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-PERSISTENCE-001 | Canonical state shall be stored under a versioned key. | `STORAGE_KEY = "artworkChecklist:v5"` |
| BR-PERSISTENCE-002 | Corrupted or unsupported stored state shall never prevent the app from opening. | `loadStateFromStorage` pipeline; `deserializeState` → null |
| BR-PERSISTENCE-003 | Legacy storage keys shall be migrated to the current key on successful load. | `getStoredStateRecord` + post-load save/remove |
| BR-PERSISTENCE-004 | Stored state shall validate against the current schema before use. | `validateState` |
| BR-PERSISTENCE-005 | Artwork binary data shall never be persisted. | `artworkSessions` only; metadata-only in state |
| BR-PERSISTENCE-006 | Every domain mutation shall update `updatedAt`. | `touchProduct` / `touchActiveProduct` |

## BR-PANTONE — Pantone compliance

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-PANTONE-001 | The approved pack copy is the authoritative Pantone specification source; the application does not define Pantone colours. | checklist item 6I note; no colour logic in review flow |
| BR-PANTONE-002 | Pantone compliance is recorded through canonical checklist item 6I using the standard review workflow. | `addPantoneComplianceItem`; 6I in `sectionDefinitions` |
| BR-PANTONE-003 | Migrated 6I items start as `pending`. | `addPantoneComplianceItem` (clones canonical item) |
| BR-PANTONE-004 | Legacy `pantoneColors` metadata shall never influence the status of item 6I. | `migrateStateV3ToV4` / `addPantoneComplianceItem` never touch `pantoneColors` |
| BR-PANTONE-005 | Legacy `pantoneColors` shall survive reload, export/import, migration and duplication. | rehydrate/export/import/duplicate paths clone it |

## BR-SIGNOFF — Cross-functional sign-off

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-SIGNOFF-001 | Quality, Production and Product Development shall each have an independent required decision. | `SIGN_OFF_DEPARTMENTS`; `createInitialSignOffs`; `validateSerializedSignOffs` |
| BR-SIGNOFF-002 | Approved/Rejected decisions require current reviewer name, reviewer role and Artwork Revision. | `setDepartmentSignOffStatus` |
| BR-SIGNOFF-003 | A completed decision shall snapshot reviewer, `reviewedAt` and the current artwork revision. | `setDepartmentSignOffStatus` |
| BR-SIGNOFF-004 | A rejected department requires a non-empty comment for business validity. | `validateDepartmentSignOff`; sign-off UI `aria-invalid` |
| BR-SIGNOFF-005 | An incomplete rejection remains structurally restorable but blocks final approval. | `validateSerializedSignOffs` vs `validateDepartmentSignOff` / `validateFinalSignOff` |
| BR-SIGNOFF-006 | Changing Artwork Revision shall reset all department decisions and signatures. | `setActiveProductArtworkVersion` → `resetProductSignOffs` |
| BR-SIGNOFF-007 | Any required department Rejected makes overall status Rejected. | `computeOverallApproval` rejection precedence |
| BR-SIGNOFF-008 | Overall Approved requires every required department Approved and final validation valid. | `computeOverallApproval`; `validateFinalSignOff` |
| BR-SIGNOFF-009 | Final approval is blocked by missing required context, Pending checklist items, invalid checklist rejections, Pending departments or Rejected departments. | `getProductContextBlockers`; `getChecklistSignOffBlockers`; `validateFinalSignOff` |
| BR-SIGNOFF-010 | Department signatures are optional, bounded PNG data URLs and separate from decisions. | `isValidDepartmentSignature`; `setDepartmentSignature` |
| BR-SIGNOFF-011 | Signature input shall support mouse, pen and touchscreen through Pointer Events. | `bindSignOffUi` pointer handlers; `touch-action: none` |
| BR-SIGNOFF-012 | Changing a department decision shall clear its previous signature. | `setDepartmentSignOffStatus` |

## BR-IMPORT — Import

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-IMPORT-001 | Imported files shall be migrated and validated before any state change. | `applyImportedReview` pipeline |
| BR-IMPORT-002 | Unsupported or invalid import files shall be rejected with a friendly message and leave current state untouched. | `validateImportData` → toast |
| BR-IMPORT-003 | Imported reviews become new products in the workspace (never overwrite). | `applyImportedReview` — new product inserted, activated |

## BR-REPORT — Approval reporting

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-REPORT-001 | Report data shall be derived from product state and canonical checklist definitions, never scraped from the interactive DOM. | `buildReportData`; J tests |
| BR-REPORT-002 | The report shall contain all six categories and all 50 items regardless of section expansion state. | `buildReportData`; `buildPrintReportMarkup` |
| BR-REPORT-003 | Approved, Rejected and Pending collections/counts shall derive from each item's single canonical status. | `buildReportData`; `computeReviewMetricsForItems` |
| BR-REPORT-004 | Overall report approval and blockers shall reuse cross-functional final-validation rules. | `computeOverallApproval`; `validateFinalSignOff` |
| BR-REPORT-005 | Report generation shall not mutate or persist product state. | detached cloning in `buildReportData`; J non-mutation tests |
| BR-REPORT-006 | User-entered report content shall be escaped before insertion into print markup. | `escapeHtml` in print builders |
| BR-REPORT-007 | The first PDF workflow shall use native browser printing without a PDF dependency. | `printApprovalReport` → `window.print` |

## BR-ARTWORK — Artwork metadata

| ID | Rule | Enforced by |
| --- | --- | --- |
| BR-ARTWORK-001 | Artwork metadata shall contain a non-empty name, an `image/*` type, non-negative size and positive width/height. | `isValidArtworkMetadata` |
| BR-ARTWORK-002 | Only image files are accepted for artwork upload. | `handleArtworkFileChange` type check |
| BR-ARTWORK-003 | Same-file reselection keeps existing pins; different identity with pins requires confirmation. | `isSameArtworkIdentity` + `applyArtworkIdentity` |

## Related Documents

- [domain-overview.md](domain-overview.md)
- [review-workflow.md](review-workflow.md)
- [data-dictionary.md](data-dictionary.md)
- [cross-functional-signoff.md](cross-functional-signoff.md)
- [architecture/reporting.md](../architecture/reporting.md)
