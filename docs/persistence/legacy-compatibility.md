# Legacy Compatibility

**Status: Current**

## Purpose

Centralize the backwards-compatibility debt: every legacy feature, why it is retained, what replaces it, and the conditions under which it may be removed.

## Compatibility Inventory

| Legacy feature | Reason retained | Current replacement | Safe removal condition |
| --- | --- | --- | --- |
| **Schema v1 storage/file format** (pixel pins `{x,y}`, single product/artwork) | Existing reviews exported before normalization | v2+ formats; migration chain | When backwards-compat policy explicitly drops v1 review files |
| **Schema v2 format** (normalized pins, single layer) | Existing reviews exported before multi-layer | v3+ formats; migration chain | When policy drops v2 review files |
| **Schema v3 format** (multi-layer, no 6I) | Existing reviews exported before the Pantone realignment | v4 + canonical item 6I; migration chain | When policy drops v3 review files |
| **Legacy storage keys** `artworkChecklist:v1/v2/v3` | Users with stored state from older app versions | `artworkChecklist:v4` (one-time promotion on load) | After a policy window for old storage; promotion makes keys empty naturally |
| **Legacy `pantoneColors` registry** | Schema-v3 reviews may contain it; promised compatibility | Checklist item **6I** — the canonical Pantone compliance workflow | Only after policy explicitly drops v3 review files (data would be lost) |
| **Legacy Pantone domain functions** (`addPantoneColour`, `updatePantoneColour`, `deletePantoneColour`, `createPantoneColour`, …) | Supporting code for retained data + tests (`G5-*` tests assert registry behaviour) | None in current UI | Together with `pantoneColors` removal |
| **Legacy Pantone UI functions** (`renderPantoneColours`, `openAddPantoneColourEditor`, `pantoneColourEditorState`, …) | Historical reference; nothing calls them (G5 tests assert the UI element is absent) | None | After registry removal (or a dedicated dead-code cleanup with tests) |
| **`css/components/artwork-colours.css`** | Historical stylesheet with LEGACY banner; not imported | None | With the Pantone UI cleanup |
| **`css/style.legacy.css`** | Pre-modularization monolith; not linked/imported | Modular `css/**` | After confirming no tooling/history needs it |
| **Legacy baseline export** (`buildLegacyCheckData`/`saveCheck`: boolean `checks`, pixel pins, old product shape) | Historical consumers of the baseline format | `buildExportData` (schema-v4 JSON) | When baseline-format consumers are gone |
| **`setItemPin(itemId, pin)`** | Backward-compatible shorthand used by older tests | `setItemPinForLayer(itemId, layerId, pin)` | After old tests migrate |
| **`migrateLegacyItemsToV2(items)`** | Standalone items-level converter | part of `migrateState` chain | With v1 support removal |
| **Pin element `data-pid` attribute** | Backward compatibility with older selectors | `data-item-id` / `data-layer-id` | After external selectors migrate |
| **`window.confirm` default parameters** | Dependency injection for tests | custom `showConfirmDialog` | Never required; harmless |

## Why Old Data Was Not Destructively Removed

The Pantone realignment (G5) moved colour review from a registry to checklist item 6I. Existing v3 reviews contained `pantoneColors` data that users may still rely on for historical review files. Destructive removal would:

- break Open Check for every pre-v4 review;
- violate the non-destructive migration philosophy ([migrations.md](migrations.md));
- contradict the promised preservation in earlier documentation.

Therefore the registry is preserved, validated, round-tripped, exported and duplicated — but **never influences the status of item 6I** ([business-rules.md](../domain/business-rules.md) BR-PANTONE-004).

## Current Guarantees (tested)

- v1/v2/v3 storage and files import successfully and are promoted to v4.
- `pantoneColors` survives reload, migration, export/import and duplication (G5 tests).
- Old storage keys are promoted once and removed.
- The retired Colour Specification UI is **absent** from the DOM (asserted by tests).

## Migration Debt Table

| Schema | Promoted on load | Promoted on import | Old key promoted |
| --- | --- | --- | --- |
| v1 | yes (`migrateState`) | yes (`migrateImportData`) | `artworkChecklist:v1` |
| v2 | yes | yes | `artworkChecklist:v2` |
| v3 | yes | yes | `artworkChecklist:v3` |

## Related Documents

- [persistence/migrations.md](migrations.md)
- [architecture/persistence-and-schema.md](../architecture/persistence-and-schema.md)
- [architecture/css-architecture.md](../architecture/css-architecture.md)
- [decisions/ADR-009-pantone-pack-copy-compliance.md](../decisions/ADR-009-pantone-pack-copy-compliance.md)
- [quality/quality-strategy.md](../quality/quality-strategy.md)