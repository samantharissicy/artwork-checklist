# ADR-009 — Pantone Pack-Copy Compliance

**Status: Accepted**

## Context

The original G5 interpretation implemented an **internal Pantone colour specification registry** (add/edit/delete Pantone references per product, with a Colour Specification UI). Stakeholder clarification changed the requirement: the **approved pack copy is the authoritative source** for colours — the tool's job is to let reviewers **verify compliance**, not to maintain a colour database.

## Decision

Move Pantone review into the checklist as canonical item **6I**:

```text
6I — Pantone Colours Match Approved Pack Copy?
Note: Verify the artwork uses the Pantone colours specified in the approved pack copy
```

- 6I lives in section 6 (Packaging, Marks & Languages) of every product and follows the standard workflow: Pending / Approved / Rejected, mandatory comment on rejection, per-layer pins, persistence, export/import.
- The schema was bumped to **v4**; v3 state migrates by adding 6I as Pending to every product (`addPantoneComplianceItem` shared by storage and import migration).
- The Colour Specification UI was **removed**; its CSS and JS are retained with LEGACY banners but nothing calls them, and tests assert the UI element is absent.

## Legacy `pantoneColors` — preserved, not deleted

The old registry remains in the data model, validated, rehydrated, exported, imported and duplicated — but it **never influences 6I's status** and is documented as backwards-compatibility data only.

Why not destructive removal: existing schema-v3 reviews and review files contain `pantoneColors`; deleting it would break Open Check for every pre-v4 review and violate the non-destructive migration philosophy. The data is kept until a compatibility policy explicitly drops v3 support.

## Rationale

- The pack copy (not the app) defines colours; a checklist item is the honest representation of "did the reviewer verify this".
- Reuses the battle-tested review workflow instead of a parallel subsystem.
- Non-destructive migration protects existing users and keeps the G5 promise of compatibility.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Keep the registry + add 6I | Two mechanisms for one concept; confusion about which is authoritative |
| Drop `pantoneColors` entirely | Breaks v3 review files; destructive |
| Automatic colour reading / RGB-HEX mapping | Out of scope — the app must not claim colour equivalence it cannot verify |

## Consequences

**Positive**

- Single, uniform review concept; 6I is testable like every item (G5R-001…049).
- Migration adds, never removes — data safety preserved.
- Clear documentation story: pack copy authoritative, registry legacy.

**Negative**

- Compatibility code remains (legacy domain/UI functions, legacy CSS) until a removal policy exists — documented in [legacy-compatibility.md](../persistence/legacy-compatibility.md).

## Revisit When

- A policy explicitly drops v3 review-file support → remove registry + legacy code safely.
- Real colour verification tooling (e.g. validated colour readings) is ever required — new ADR needed.

## Related Files

- `js/app.js` — `sectionDefinitions` 6I, `addPantoneComplianceItem`, `migrateStateV3ToV4`, `migrateImportData`, legacy Pantone block
- `css/components/artwork-colours.css` (LEGACY banner)
- [domain/review-workflow.md](../domain/review-workflow.md)
- [persistence/legacy-compatibility.md](../persistence/legacy-compatibility.md)

## Related Roadmap Layers

G5 (Pantone compliance), D3 (export), D4 (import).