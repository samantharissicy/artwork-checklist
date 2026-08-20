// ============================================================
// G5 — PANTONE PACK-COPY COMPLIANCE
// ============================================================
//
// Tests owned by this layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
//
// This layer was realigned from the legacy Colour Specification
// registry into a checklist-based Pantone compliance workflow:
//
// G5 CURRENT (G5R-*)
// - canonical checklist item 6i
//   "Pantone Colours Match Approved Pack Copy?";
// - standard review workflow (Pending / Approved / Rejected),
//   comment requirement and multi-layer pins;
// - schema-v4 feature compatibility inside the current persistence schema;
// - UI retirement of the Colour Specification component.
//
// G5 LEGACY (G5-*, G5P-*)
// - backward-compatible pantoneColors metadata preservation;
// - serialization, rehydration, export/import and duplication;
// - referential integrity with artwork layers;
// - permanent colour IDs and PANTONE_LIMITS validation.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assertEqual,
    assertDeepEqual,
    assertExists,
    assertNotEqual,
    resetWorkspaceForMultiProductTest,
    createTestArtworkMetadata,
  } = window.ArtworkTests;

  function freshWorkspace() {
    resetWorkspaceForMultiProductTest();

    return getActiveProduct();
  }

  function addTestLayer(product, layerId, name) {
    product.artworkLayers.push(createArtworkLayer(layerId, name));
  }

  function colourData(overrides = {}) {
    return {
      name: "Primary Brand Red",
      pantoneCode: "PANTONE 186 C",
      notes: "",
      layerIds: [],
      ...overrides,
    };
  }

  function addTestColour(product, overrides = {}) {
    const result = addPantoneColour(product.id, colourData(overrides));

    assertEqual(result.ok, true, "Colour should be created.");

    return result.colour;
  }

  async function flushAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // ============================================================
  // G5 LEGACY — PANTONE METADATA COMPATIBILITY
  // ============================================================
  //
  // The tests below cover the retained legacy pantoneColors metadata
  // behavior (domain, integration, persistence, export/import and
  // limits). They are kept so the v3 → v4 data-preservation guarantee
  // remains verified.

  test("G5-001 new product contains pantoneColors []", () => {
    const product = createProduct("g5-blank-product");

    assertEqual(Array.isArray(product.pantoneColors), true);

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5-002 pre-G5 schema-v3 product without pantoneColors remains valid", () => {
    freshWorkspace();

    const parsed = JSON.parse(serializeState());

    delete parsed.products[parsed.activeProductId].pantoneColors;

    assertEqual(validateState(parsed), true);
  });

  test("G5-003 pre-G5 schema-v3 product rehydrates pantoneColors as []", () => {
    freshWorkspace();

    const parsed = JSON.parse(serializeState());

    delete parsed.products[parsed.activeProductId].pantoneColors;

    const hydrated = rehydrateState(parsed);

    assertDeepEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors,
      [],
    );
  });

  test("G5-004 Pantone colour factory creates independent object", () => {
    const sourceLayers = ["layer-a"];

    const colour = createPantoneColour({
      id: "colour-x",
      name: "Brand Red",
      pantoneCode: "PANTONE 186 C",
      notes: "",
      layerIds: sourceLayers,
    });

    sourceLayers.push("layer-b");

    assertEqual(colour.layerIds.length, 1);

    colour.layerIds.push("layer-z");

    assertEqual(sourceLayers.length, 2);

    colour.name = "Mutated Name";

    assertEqual(
      createPantoneColour({
        id: "colour-y",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      }).name,
      "Brand Red",
    );
  });

  test("G5-005 Pantone colour receives permanent unique ID", () => {
    const product = freshWorkspace();

    const first = addTestColour(product);

    const second = addTestColour(product, { name: "Accent Yellow" });

    assertEqual(first.id.length > 0, true);

    assertEqual(second.id.length > 0, true);

    assertEqual(first.id !== second.id, true);

    assertEqual(deletePantoneColour(product.id, first.id).ok, true);

    const third = addTestColour(product, { name: "Text Black" });

    assertEqual(third.id !== first.id, true);
  });

  test("G5-006 adding colour trims name", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product, { name: "  Brand Red  " });

    assertEqual(colour.name, "Brand Red");
  });

  test("G5-007 adding colour trims pantoneCode", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product, {
      pantoneCode: "  PANTONE 186 C  ",
    });

    assertEqual(colour.pantoneCode, "PANTONE 186 C");
  });

  test("G5-008 empty name is rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(product.id, colourData({ name: "  " }));

    assertEqual(result.ok, false);

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5-009 empty pantoneCode is rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ pantoneCode: "" }),
    );

    assertEqual(result.ok, false);

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5-010 empty notes are allowed", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    assertEqual(colour.notes, "");

    const withNotes = addPantoneColour(
      product.id,
      colourData({
        name: "Text Black",
        pantoneCode: "PANTONE Black C",
        notes: "  Body copy text  ",
      }),
    );

    assertEqual(withNotes.ok, true);

    assertEqual(withNotes.colour.notes, "Body copy text");
  });

  test("G5-011 empty layerIds are allowed", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    assertDeepEqual(colour.layerIds, []);
  });

  test("G5-012 colour may reference one artwork layer", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    const colour = addTestColour(product, {
      layerIds: ["layer-front"],
    });

    assertDeepEqual(colour.layerIds, ["layer-front"]);
  });

  test("G5-013 colour may reference multiple artwork layers", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front", "layer-back"],
    });

    assertDeepEqual(colour.layerIds, ["layer-front", "layer-back"]);
  });

  test("G5-014 duplicate layer IDs are normalized before persistence", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front", "layer-back", "layer-front"],
    });

    assertDeepEqual(colour.layerIds, ["layer-front", "layer-back"]);
  });

  test("G5-015 unknown layer ID is rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ layerIds: ["layer-ghost"] }),
    );

    assertEqual(result.ok, false);

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5-016 editing colour preserves colour ID", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ name: "Paulig Red" }),
    );

    assertEqual(result.ok, true);

    assertEqual(result.colour.id, colour.id);
  });

  test("G5-017 editing colour changes name", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ name: "Paulig Red" }),
    );

    assertEqual(result.colour.name, "Paulig Red");
  });

  test("G5-018 editing colour changes pantoneCode", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ pantoneCode: "PANTONE 123 C" }),
    );

    assertEqual(result.colour.pantoneCode, "PANTONE 123 C");
  });

  test("G5-019 editing colour changes notes", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ notes: "Primary logo and hero graphics" }),
    );

    assertEqual(result.colour.notes, "Primary logo and hero graphics");
  });

  test("G5-020 editing colour changes layer associations", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front"],
    });

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ layerIds: ["layer-front", "layer-back"] }),
    );

    assertDeepEqual(result.colour.layerIds, ["layer-front", "layer-back"]);
  });

  test("G5-021 deleting colour removes only requested colour", () => {
    const product = freshWorkspace();

    const red = addTestColour(product, { name: "Red" });

    const yellow = addTestColour(product, {
      name: "Yellow",
      pantoneCode: "PANTONE 123 C",
    });

    const black = addTestColour(product, { name: "Black", pantoneCode: "PANTONE Black C" });

    assertEqual(deletePantoneColour(product.id, yellow.id).ok, true);

    assertEqual(product.pantoneColors.length, 2);

    assertEqual(product.pantoneColors[0].id, red.id);

    assertEqual(product.pantoneColors[1].id, black.id);
  });

  test("G5-022 deleting colour does not alter artwork layers", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    const layersSnapshot = JSON.parse(
      JSON.stringify(product.artworkLayers),
    );

    addTestColour(product);

    deletePantoneColour(product.id, "colour-1");

    assertDeepEqual(product.artworkLayers, layersSnapshot);
  });

  test("G5-023 deleting colour does not alter checklist pins", () => {
    const product = freshWorkspace();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const pinSnapshot = JSON.parse(
      JSON.stringify(getItemById("1a").pins),
    );

    addTestColour(product);

    deletePantoneColour(product.id, "colour-1");

    assertDeepEqual(getItemById("1a").pins, pinSnapshot);
  });

  // ============================================================
  // G4 INTEGRATION
  // ============================================================

  test("G5-024 renaming artwork layer preserves Pantone layerId association", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    const colour = addTestColour(product, {
      layerIds: ["layer-front"],
    });

    assertEqual(renameArtworkLayer("layer-front", "Front Panel"), true);

    assertDeepEqual(
      getPantoneColourById(product, colour.id).layerIds,
      ["layer-front"],
    );
  });

  test("G5-026 deleting artwork layer removes its ID from Pantone layerIds", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front", "layer-back"],
    });

    assertEqual(deleteArtworkLayer(product.id, "layer-back"), true);

    assertDeepEqual(
      getPantoneColourById(product, colour.id).layerIds,
      ["layer-front"],
    );
  });

  test("G5-027 deleting artwork layer preserves Pantone colour itself", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-back"],
    });

    deleteArtworkLayer(product.id, "layer-back");

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, colour.id);
  });

  test("G5-029 adding artwork layer does not automatically modify existing colours", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    const colour = addTestColour(product, {
      layerIds: ["layer-front"],
    });

    assertEqual(
      createArtworkLayerForProduct(product.id, "Sleeve") !== null,
      true,
    );

    assertDeepEqual(
      getPantoneColourById(product, colour.id).layerIds,
      ["layer-front"],
    );
  });

  test("G5-030 switching active artwork layer does not modify colour specifications", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front", "layer-back"],
    });

    const colourSnapshot = JSON.parse(
      JSON.stringify(getPantoneColourById(product, colour.id)),
    );

    assertEqual(switchArtworkLayer("layer-back"), true);

    assertDeepEqual(
      getPantoneColourById(product, colour.id),
      colourSnapshot,
    );
  });

  // ============================================================
  // PRODUCT INTEGRATION
  // ============================================================

  test("G5-031 product A and product B have independent pantoneColors", () => {
    const productA = freshWorkspace();

    const productB = createProduct("g5-product-b");

    appState.products[productB.id] = productB;

    addTestColour(productA, { name: "Red" });

    addTestColour(productB, { name: "Yellow", pantoneCode: "PANTONE 123 C" });

    assertEqual(productA.pantoneColors.length, 1);

    assertEqual(productB.pantoneColors.length, 1);

    assertEqual(productA.pantoneColors[0].name, "Red");

    assertEqual(productB.pantoneColors[0].name, "Yellow");
  });

  test("G5-033 duplicating product clones pantoneColors", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const sourceColour = addTestColour(product, {
      name: "Red",
      notes: "Logo",
      layerIds: ["layer-front", "layer-back"],
    });

    const duplicateId = duplicateProduct(product.id);

    assertExists(duplicateId);

    const duplicate = getProductById(duplicateId);

    assertEqual(duplicate.pantoneColors.length, 1);

    assertEqual(duplicate.pantoneColors[0].id, sourceColour.id);

    assertEqual(duplicate.pantoneColors[0].name, "Red");

    assertEqual(duplicate.pantoneColors[0].notes, "Logo");

    assertDeepEqual(duplicate.pantoneColors[0].layerIds, [
      "layer-front",
      "layer-back",
    ]);
  });

  test("G5-034 duplicated product does not share PantoneColour object references", () => {
    const product = freshWorkspace();

    addTestColour(product);

    const duplicateId = duplicateProduct(product.id);

    const duplicate = getProductById(duplicateId);

    assertEqual(
      duplicate.pantoneColors[0] === product.pantoneColors[0],
      false,
    );
  });

  test("G5-035 duplicated product does not share layerIds array references", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestColour(product, { layerIds: ["layer-front"] });

    const duplicateId = duplicateProduct(product.id);

    const duplicate = getProductById(duplicateId);

    assertEqual(
      duplicate.pantoneColors[0].layerIds ===
        product.pantoneColors[0].layerIds,
      false,
    );
  });

  test("G5-036 editing colour in duplicate does not mutate source product", () => {
    const product = freshWorkspace();

    const sourceColour = addTestColour(product, { name: "Primary Brand Red" });

    const duplicateId = duplicateProduct(product.id);

    const duplicate = getProductById(duplicateId);

    const result = updatePantoneColour(
      duplicate.id,
      sourceColour.id,
      colourData({ name: "Duplicate Red" }),
    );

    assertEqual(result.ok, true);

    assertEqual(product.pantoneColors[0].name, "Primary Brand Red");

    assertEqual(duplicate.pantoneColors[0].name, "Duplicate Red");
  });

  // ============================================================
  // PERSISTENCE
  // ============================================================

  test("G5-037 serializeState includes pantoneColors", () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Red" });

    const parsed = JSON.parse(serializeState());

    assertEqual(
      Array.isArray(
        parsed.products[parsed.activeProductId].pantoneColors,
      ),
      true,
    );

    assertEqual(
      parsed.products[parsed.activeProductId].pantoneColors.length,
      1,
    );
  });

  test("G5-038 localStorage roundtrip preserves pantoneColors", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product, {
      name: "Red",
      pantoneCode: "PANTONE Black C",
      notes: "Body copy",
      layerIds: [],
    });

    saveStateToStorage();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertDeepEqual(
      stored.products[stored.activeProductId].pantoneColors,
      [colour],
    );
  });

  test("G5-039 rehydration preserves colour IDs", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0].id,
      colour.id,
    );
  });

  test("G5-040 rehydration preserves colour name", () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Paulig Red" });

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0].name,
      "Paulig Red",
    );
  });

  test("G5-041 rehydration preserves pantoneCode", () => {
    const product = freshWorkspace();

    addTestColour(product, { pantoneCode: "PANTONE 123 C" });

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0]
        .pantoneCode,
      "PANTONE 123 C",
    );
  });

  test("G5-042 rehydration preserves colour notes", () => {
    const product = freshWorkspace();

    addTestColour(product, { notes: "Primary logo colour" });

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0].notes,
      "Primary logo colour",
    );
  });

  test("G5-043 rehydration preserves colour layerIds", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    addTestColour(product, {
      layerIds: ["layer-front", "layer-back"],
    });

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertDeepEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0]
        .layerIds,
      ["layer-front", "layer-back"],
    );
  });

  // ============================================================
  // EXPORT / IMPORT
  // ============================================================

  test("G5-044 JSON export contains pantoneColors", () => {
    const product = freshWorkspace();

    addTestColour(product, {
      name: "Red",
      pantoneCode: "PANTONE 186 C",
      notes: "Primary logo colour",
      layerIds: [],
    });

    const data = buildExportData();

    assertDeepEqual(data.pantoneColors, product.pantoneColors);

    assertEqual(data.pantoneColors[0].pantoneCode, "PANTONE 186 C");
  });

  test("G5-045 JSON export uses the current schema version", () => {
    freshWorkspace();

    const data = buildExportData();

    assertEqual(data.schemaVersion, 5);

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);
  });

  test("G5-046 Open Check restores pantoneColors", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestColour(product, {
      name: "Red",
      layerIds: ["layer-front"],
    });

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const restored = getActiveProduct();

    assertEqual(restored.pantoneColors.length, 1);

    assertEqual(
      restored.pantoneColors[0].id,
      exported.pantoneColors[0].id,
    );

    assertEqual(restored.pantoneColors[0].name, "Red");

    assertDeepEqual(restored.pantoneColors[0].layerIds, ["layer-front"]);
  });

  test("G5-047 Open Check accepts schema-v3 review without pantoneColors", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    delete exported.pantoneColors;

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertDeepEqual(getActiveProduct().pantoneColors, []);
  });

  test("G5-048 Open Check rejects malformed pantoneColors", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.pantoneColors = "not-an-array";

    const result = validateImportData(exported);

    assertEqual(result.valid, false);
  });

  test("G5-049 Open Check rejects dangling layerIds", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.pantoneColors = [
      {
        id: "colour-1",
        name: "Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: ["layer-missing"],
      },
    ];

    const result = validateImportData(exported);

    assertEqual(result.valid, false);
  });

  test("G5-050 export/import roundtrip preserves multi-layer associations", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    addTestColour(product, {
      name: "Primary Brand Red",
      notes: "Logo",
      layerIds: ["layer-front", "layer-back"],
    });

    addTestColour(product, {
      name: "Primary Text",
      pantoneCode: "PANTONE Black C",
      layerIds: ["layer-back"],
    });

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const restored = getActiveProduct();

    assertDeepEqual(restored.pantoneColors, exported.pantoneColors);
  });

  // ============================================================
  // UI
  // ============================================================

  // ============================================================
  // G5 POLISH — PERMANENT IDS
  // ============================================================

  test("G5P-001 newly generated colour IDs are non-empty strings", () => {
    const product = freshWorkspace();

    const colourId = generatePantoneColourId(product);

    assertEqual(typeof colourId, "string");

    assertEqual(colourId.length > 0, true);
  });

  test("G5P-002 two newly generated colours receive different IDs", () => {
    const product = freshWorkspace();

    const first = addTestColour(product);

    const second = addTestColour(product, { name: "Accent Yellow" });

    assertEqual(first.id !== second.id, true);
  });

  test("G5P-003 deleted colour ID is never reused", () => {
    const product = freshWorkspace();

    const first = addTestColour(product, { name: "Colour A" });

    const second = addTestColour(product, {
      name: "Colour B",
      pantoneCode: "PANTONE 123 C",
    });

    assertEqual(deletePantoneColour(product.id, second.id).ok, true);

    const third = addTestColour(product, {
      name: "Colour C",
      pantoneCode: "PANTONE Black C",
    });

    assertEqual(third.id !== first.id, true);

    assertEqual(third.id !== second.id, true);
  });

  test("G5P-004 editing a colour preserves its ID", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    const result = updatePantoneColour(
      product.id,
      colour.id,
      colourData({ name: "Edited Name" }),
    );

    assertEqual(result.ok, true);

    assertEqual(result.colour.id, colour.id);
  });

  test("G5P-005 legacy numeric IDs remain valid and unchanged after rehydration", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Legacy Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      }),
      createPantoneColour({
        id: "colour-2",
        name: "Legacy Black",
        pantoneCode: "PANTONE Black C",
        notes: "",
        layerIds: [],
      }),
    );

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);

    const hydrated = rehydrateState(parsed);

    const colours = hydrated.products[hydrated.activeProductId].pantoneColors;

    assertEqual(colours[0].id, "colour-1");

    assertEqual(colours[1].id, "colour-2");
  });

  // ============================================================
  // G5 POLISH — NOTES
  // ============================================================

  // ============================================================
  // G5 POLISH — CSS DECOUPLING
  // ============================================================

  // ============================================================
  // G5 POLISH — DRAFT PRESERVATION
  // ============================================================

// ============================================================
  // G5 POLISH — LIMITS
  // ============================================================

  test("G5P-019 Pantone code at exactly 120 characters is accepted", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ pantoneCode: "A".repeat(120) }),
    );

    assertEqual(result.ok, true);

    assertEqual(result.colour.pantoneCode.length, 120);
  });

  test("G5P-020 Pantone code above 120 is rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ pantoneCode: "A".repeat(121) }),
    );

    assertEqual(result.ok, false);

    assertEqual(
      result.error,
      "Pantone reference must be 120 characters or fewer.",
    );

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5P-021 Name at exactly 120 is accepted", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(product.id, colourData({ name: "N".repeat(120) }));

    assertEqual(result.ok, true);

    assertEqual(result.colour.name.length, 120);
  });

  test("G5P-022 Name above 120 is rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(product.id, colourData({ name: "N".repeat(121) }));

    assertEqual(result.ok, false);

    assertEqual(
      result.error,
      "Colour name must be 120 characters or fewer.",
    );

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5P-023 Notes at exactly 500 is accepted", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ notes: "T".repeat(500) }),
    );

    assertEqual(result.ok, true);

    assertEqual(result.colour.notes.length, 500);
  });

  test("G5P-024 Notes above 500 are rejected", () => {
    const product = freshWorkspace();

    const result = addPantoneColour(
      product.id,
      colourData({ notes: "T".repeat(501) }),
    );

    assertEqual(result.ok, false);

    assertEqual(result.error, "Notes must be 500 characters or fewer.");

    assertEqual(product.pantoneColors.length, 0);
  });

  test("G5P-025 import rejects oversized Pantone strings", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.pantoneColors = [
      {
        id: "colour-1",
        name: "Red",
        pantoneCode: "A".repeat(121),
        notes: "",
        layerIds: [],
      },
    ];

    const result = validateImportData(exported);

    assertEqual(result.valid, false);
  });

  test("G5P-026 pre-existing valid G5 data remains accepted", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "N".repeat(120),
        pantoneCode: "A".repeat(120),
        notes: "T".repeat(500),
        layerIds: [],
      }),
    );

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);

    const hydrated = rehydrateState(parsed);

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0].name
        .length,
      120,
    );
  });

  // ============================================================
  // G5 CURRENT — PANTONE PACK-COPY COMPLIANCE
  // ============================================================

  test("G5R-001 new products contain canonical checklist item 6i", () => {
    const product = createProduct("g5r-product-001");

    const item = product.items["6i"];

    assertExists(item);

    assertEqual(item.id, "6i");

    assertEqual(item.sectionId, "packaging-marks-languages");

    assertEqual(item.originalTitle, "Pantone Colours Match Approved Pack Copy?");

    assertEqual(
      item.currentTitle,
      "Pantone Colours Match Approved Pack Copy?",
    );

    assertEqual(
      item.note,
      "Verify the artwork uses the Pantone colours specified in the approved pack copy",
    );

    assertEqual(item.status, REVIEW_STATUSES.PENDING);

    assertEqual(item.comment, "");

    assertDeepEqual(item.pins, []);
  });

  test("G5R-002 6i is defined after section 6h in section 6", () => {
    const section = sectionDefinitions.find(
      (s) => s.id === "packaging-marks-languages",
    );

    assertExists(section);

    const ids = section.items.map((item) => item.id);

    const index6h = ids.indexOf("6h");

    const index6i = ids.indexOf("6i");

    assertEqual(index6h !== -1, true);

    assertEqual(index6i !== -1, true);

    assertEqual(index6i === index6h + 1, true);
  });

  test("G5R-003 canonical checklist total increases by one", () => {
    const items = createInitialItems();

    assertEqual(Object.keys(items).length, 50);
  });

  test("G5R-004 6i originalTitle is immutable", () => {
    const product = createProduct("g5r-product-004");

    const descriptor = Object.getOwnPropertyDescriptor(
      product.items["6i"],
      "originalTitle",
    );

    assertEqual(descriptor.writable, false);

    assertEqual(descriptor.configurable, false);
  });

  test("G5R-005 6i renders in section 6 as the last item", () => {
    resetWorkspaceForMultiProductTest();

    const sectionButtons = document.querySelectorAll(".section-btn");

    sectionButtons[5].click();

    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 50);

    const lastItem = items[items.length - 1];

    assertEqual(
      lastItem.dataset.id,
      "6i",
      "Last rendered item must be 6i.",
    );

    assertEqual(
      lastItem.textContent.includes("Pantone Colours Match Approved Pack Copy?"),
      true,
    );
  });

  test("G5R-006 6i can be approved through the standard workflow", () => {
    resetWorkspaceForMultiProductTest();

    const item = getActiveProduct().items["6i"];

    assertEqual(item.status, REVIEW_STATUSES.PENDING);

    item.status = REVIEW_STATUSES.APPROVED;

    assertEqual(item.status, REVIEW_STATUSES.APPROVED);

    assertEqual(item.comment, "");
  });

  test("G5R-007 6i can be rejected through the standard workflow", () => {
    resetWorkspaceForMultiProductTest();

    const item = getActiveProduct().items["6i"];

    item.status = REVIEW_STATUSES.REJECTED;

    item.comment = "Artwork uses PANTONE 185 C instead of 186 C.";

    assertEqual(item.status, REVIEW_STATUSES.REJECTED);

    assertEqual(item.comment.length > 0, true);
  });

  test("G5R-008 6i rejection requires a comment", () => {
    const product = freshWorkspace();

    const item = product.items["6i"];

    item.status = REVIEW_STATUSES.REJECTED;

    item.comment = "";

    const invalid = validateItemState(item);

    assertEqual(invalid.valid, false);

    assertEqual(
      invalid.errors.includes("Rejected items require a comment."),
      true,
    );

    item.comment = "Artwork uses the wrong Pantone red.";

    const valid = validateItemState(item);

    assertEqual(valid.valid, true);
  });

  test("G5R-009 6i comment is persisted through serializeState", () => {
    const product = freshWorkspace();

    product.items["6i"].status = REVIEW_STATUSES.REJECTED;

    product.items["6i"].comment = "Colour mismatch on front pack.";

    const parsed = JSON.parse(serializeState());

    const stored = parsed.products[parsed.activeProductId].items["6i"];

    assertEqual(stored.status, REVIEW_STATUSES.REJECTED);

    assertEqual(stored.comment, "Colour mismatch on front pack.");

    assertEqual(stored.id, "6i");

    assertEqual(stored.currentTitle, "Pantone Colours Match Approved Pack Copy?");
  });

  test("G5R-010 6i comment survives localStorage roundtrip", () => {
    const product = freshWorkspace();

    product.items["6i"].status = REVIEW_STATUSES.REJECTED;

    product.items["6i"].comment = "Needs PANTONE 186 C.";

    saveStateToStorage();

    const snapshot = localStorage.getItem(STORAGE_KEY);

    assertEqual(snapshot !== null, true);

    const parsed = JSON.parse(snapshot);

    assertEqual(parsed.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertEqual(
      parsed.products[parsed.activeProductId].items["6i"].comment,
      "Needs PANTONE 186 C.",
    );
  });

  test("G5R-011 6i accepts a single artwork-layer pin", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    product.items["6i"].pins.push({
      layerId: "layer-front",
      xRatio: 0.5,
      yRatio: 0.5,
    });

    assertEqual(product.items["6i"].pins.length, 1);

    assertEqual(product.items["6i"].pins[0].layerId, "layer-front");

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);
  });

  test("G5R-012 6i accepts multi-layer pins", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const item = product.items["6i"];

    item.pins.push({ layerId: "layer-front", xRatio: 0.1, yRatio: 0.2 });

    item.pins.push({ layerId: "layer-back", xRatio: 0.8, yRatio: 0.9 });

    assertEqual(item.pins.length, 2);

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);

    const hydrated = rehydrateState(parsed);

    assertEqual(
      hydrated.products[hydrated.activeProductId].items["6i"].pins.length,
      2,
    );
  });

  test("G5R-013 6i pins survive rehydration with canonical properties", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    product.items["6i"].pins.push({
      layerId: "layer-front",
      xRatio: 0.4,
      yRatio: 0.6,
    });

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    const parsed = JSON.parse(serializeState());

    const hydrated = rehydrateState(parsed);

    const item = hydrated.products[hydrated.activeProductId].items["6i"];

    assertEqual(item.status, REVIEW_STATUSES.APPROVED);

    assertEqual(item.pins.length, 1);

    assertEqual(item.originalTitle, "Pantone Colours Match Approved Pack Copy?");

    assertEqual(item.sectionId, "packaging-marks-languages");
  });

  test("G5R-014 6i counts toward review progress", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    product.items["6a"].status = REVIEW_STATUSES.APPROVED;

    product.items["6b"].status = REVIEW_STATUSES.APPROVED;

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    updateProgress();

    assertEqual(document.getElementById("progress-approved").textContent.trim(), "3");

    assertEqual(document.getElementById("progress-review-pct").textContent.trim(), "6% reviewed");
  });

  test("G5R-015 approving only 6i advances the reviewed counter", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    updateProgress();

    assertEqual(document.getElementById("progress-approved").textContent.trim(), "1");

    assertEqual(document.getElementById("progress-review-pct").textContent.trim(), "2% reviewed");
  });

  test("G5R-016 6i accepts multi-layer pins like other items", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    setItemPinForLayer("6i", "layer-front", { xRatio: 0.25, yRatio: 0.25 });

    setItemPinForLayer("6i", "layer-back", { xRatio: 0.75, yRatio: 0.75 });

    assertEqual(getItemById("6i").pins.length, 2);

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);
  });

  test("G5R-017 removing a 6i pin from one layer keeps the other", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    setItemPinForLayer("6i", "layer-front", { xRatio: 0.25, yRatio: 0.25 });

    setItemPinForLayer("6i", "layer-back", { xRatio: 0.75, yRatio: 0.75 });

    assertEqual(removeItemPinFromLayer("6i", "layer-front"), true);

    const item = getItemById("6i");

    assertEqual(item.pins.length, 1);

    assertEqual(item.pins[0].layerId, "layer-back");
  });

  test("G5R-018 deleting a layer removes its 6i pins only", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    setItemPinForLayer("6i", "layer-front", { xRatio: 0.25, yRatio: 0.25 });

    setItemPinForLayer("6i", "layer-back", { xRatio: 0.75, yRatio: 0.75 });

    assertEqual(deleteArtworkLayer(product.id, "layer-back"), true);

    const item = getItemById("6i");

    assertEqual(item.pins.length, 1);

    assertEqual(item.pins[0].layerId, "layer-front");
  });

  test("G5R-019 6i pin rendering uses the same pin surface as other items", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    assertEqual(document.querySelectorAll(".pin").length, 0);

    setItemPinForLayer("6i", "layer-main", { xRatio: 0.5, yRatio: 0.5 });

    renderPins();

    const pins = document.querySelectorAll(".pin");

    assertEqual(pins.length, 1);

    assertEqual(pins[0].dataset.itemId, "6i");
  });

  test("G5R-020 6i pin follows the standard pin model", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    setItemPinForLayer("6i", "layer-front", { xRatio: 0.3, yRatio: 0.7 });

    const pin = getItemPinForLayer(product.items["6i"], "layer-front");

    assertEqual(pin.xRatio, 0.3);

    assertEqual(pin.yRatio, 0.7);
  });

  test("G5R-021 current schema uses the v5 storage key", () => {
    assertEqual(CURRENT_SCHEMA_VERSION, 5);

    assertEqual(STORAGE_KEY, "artworkChecklist:v5");

    assertEqual(LEGACY_STORAGE_KEYS.includes("artworkChecklist:v4"), true);

    assertEqual(LEGACY_STORAGE_KEYS.includes("artworkChecklist:v3"), true);

    assertEqual(LEGACY_STORAGE_KEYS.includes("artworkChecklist:v2"), true);

    assertEqual(LEGACY_STORAGE_KEYS.includes("artworkChecklist:v1"), true);
  });

  test("G5R-022 migrateStateV3ToV4 adds 6i as pending", () => {
    freshWorkspace();

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    const migrated = migrateStateV3ToV4(state);

    assertExists(migrated);

    assertEqual(migrated.schemaVersion, 4);

    const item = migrated.products[migrated.activeProductId].items["6i"];

    assertEqual(item.id, "6i");

    assertEqual(item.sectionId, "packaging-marks-languages");

    assertEqual(item.status, REVIEW_STATUSES.PENDING);

    assertEqual(item.comment, "");

    assertDeepEqual(item.pins, []);

    assertEqual(item.originalTitle, "Pantone Colours Match Approved Pack Copy?");

    assertEqual(
      item.note,
      "Verify the artwork uses the Pantone colours specified in the approved pack copy",
    );
  });

  test("G5R-023 v3 state migrates to current schema through migrateState", () => {
    freshWorkspace();

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    const migrated = migrateState(state);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(migrated.products[migrated.activeProductId].items["6i"]);
  });

  test("G5R-024 v2 state migrates to current schema through migrateState", () => {
    freshWorkspace();

    const state = JSON.parse(serializeState());

    state.schemaVersion = 2;

    const product = state.products[state.activeProductId];

    delete product.artworkLayers;

    delete product.activeArtworkLayerId;

    product.artwork = createArtworkMetadata("v2-art.png", 100, 100);

    Object.values(product.items).forEach((item) => {
      item.pin = item.pins[0] || null;

      delete item.pins;
    });

    const migrated = migrateState(state);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    const migratedProduct = migrated.products[migrated.activeProductId];

    assertEqual(migratedProduct.artworkLayers.length, 1);

    assertEqual(migratedProduct.artworkLayers[0].id, "layer-main");

    assertExists(migratedProduct.items["6i"]);
  });

  test("G5R-025 v1 state migrates to current schema through migrateState", () => {
    const dimensions = getArtworkBaseDimensions();

    assertExists(dimensions);

    const state = JSON.parse(serializeState());

    state.schemaVersion = 1;

    const product = state.products[state.activeProductId];

    delete product.artworkLayers;

    delete product.activeArtworkLayerId;

    product.artwork = createArtworkMetadata(
      "v1-art.png",
      dimensions.width,
      dimensions.height,
    );

    Object.values(product.items).forEach((item) => {
      item.pin = item.pins[0]
        ? {
            x: item.pins[0].xRatio * dimensions.width,
            y: item.pins[0].yRatio * dimensions.height,
          }
        : null;

      delete item.pins;
    });

    const migrated = migrateState(state);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(migrated.products[migrated.activeProductId].items["6i"]);
  });

  test("G5R-026 migrateStateV3ToV4 preserves legacy pantoneColors", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "Primary logo",
        layerIds: [],
      }),
    );

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    const migrated = migrateStateV3ToV4(state);

    const legacy = migrated.products[migrated.activeProductId].pantoneColors;

    assertEqual(legacy.length, 1);

    assertEqual(legacy[0].id, "colour-1");

    assertEqual(legacy[0].pantoneCode, "PANTONE 186 C");
  });

  test("G5R-027 legacy pantoneColors never control the 6i status", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      }),
    );

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    const migrated = migrateStateV3ToV4(state);

    const item = migrated.products[migrated.activeProductId].items["6i"];

    assertEqual(item.status, REVIEW_STATUSES.PENDING);

    assertEqual(item.status !== REVIEW_STATUSES.APPROVED, true);

    assertEqual(item.status !== REVIEW_STATUSES.REJECTED, true);
  });

  test("G5R-028 missing 6i in v3 does not fail migration", () => {
    freshWorkspace();

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    const migrated = migrateStateV3ToV4(state);

    assertExists(migrated);

    assertEqual(migrated.schemaVersion, 4);

    assertExists(migrated.products[migrated.activeProductId].items["6i"]);
  });

  test("G5R-029 v3 legacy storage is loaded and migrated to current schema", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    const state = JSON.parse(serializeState());

    state.schemaVersion = 3;

    delete state.products[state.activeProductId].items["6i"];

    localStorage.removeItem(STORAGE_KEY);

    localStorage.setItem("artworkChecklist:v3", JSON.stringify(state));

    const result = loadStateFromStorage();

    assertEqual(result, true);

    assertEqual(appState.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(appState.products[appState.activeProductId].items["6i"]);

    assertEqual(localStorage.getItem("artworkChecklist:v3"), null);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(stored.schemaVersion, CURRENT_SCHEMA_VERSION);
  });

  test("G5R-030 v3 Open Check import gains 6i", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 3;

    delete exported.items["6i"];

    const migrated = migrateImportData(exported);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(migrated.items["6i"]);

    assertEqual(migrated.items["6i"].status, REVIEW_STATUSES.PENDING);

    const result = applyImportedReview(migrated);

    assertEqual(result.valid, true);

    assertExists(getActiveProduct().items["6i"]);
  });

  test("G5R-031 v4 Open Check import migrates to current schema", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 4;

    delete exported.signOffs;

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertExists(getActiveProduct().items["6i"]);
  });

  test("G5R-032 v2 Open Check import migrates to current schema with 6i", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 2;

    delete exported.items["6i"];

    delete exported.artworkLayers;

    delete exported.activeArtworkLayerId;

    exported.artwork = createTestArtworkMetadata("v2-import.png");

    Object.values(exported.items).forEach((item) => {
      item.pin = item.pins[0] || null;

      delete item.pins;
    });

    const migrated = migrateImportData(exported);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(migrated.items["6i"]);

    const result = applyImportedReview(migrated);

    assertEqual(result.valid, true);

    assertExists(getActiveProduct().items["6i"]);
  });

  test("G5R-033 v1 Open Check import migrates to current schema with 6i", () => {
    const dimensions = getArtworkBaseDimensions();

    assertExists(dimensions);

    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 1;

    delete exported.items["6i"];

    delete exported.artworkLayers;

    delete exported.activeArtworkLayerId;

    exported.artwork = createTestArtworkMetadata("v1-import.png");

    Object.values(exported.items).forEach((item) => {
      item.pin = item.pins[0]
        ? {
            x: item.pins[0].xRatio * dimensions.width,
            y: item.pins[0].yRatio * dimensions.height,
          }
        : null;

      delete item.pins;
    });

    const migrated = migrateImportData(exported);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(migrated.items["6i"]);

    const result = applyImportedReview(migrated);

    assertEqual(result.valid, true);

    assertExists(getActiveProduct().items["6i"]);
  });

  test("G5R-034 validateSerializedProduct requires all 50 items including 6i", () => {
    const product = createProduct("g5r-validate-items");

    const parsed = JSON.parse(serializeState());

    assertEqual(validateState(parsed), true);

    delete parsed.products[parsed.activeProductId].items["6i"];

    assertEqual(validateState(parsed), false);

    parsed.products[parsed.activeProductId].items["6i"] = {
      id: "6i",
      sectionId: "packaging-marks-languages",
      originalTitle: "Pantone Colours Match Approved Pack Copy?",
      currentTitle: "Pantone Colours Match Approved Pack Copy?",
      note: "Verify the artwork uses the Pantone colours specified in the approved pack copy",
      status: "pending",
      comment: "",
      pins: [],
    };

    assertEqual(validateState(parsed), true);
  });

  test("G5R-035 rehydrateItems rebuilds 6i with canonical originalTitle", () => {
    const product = freshWorkspace();

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    const parsed = JSON.parse(serializeState());

    const hydrated = rehydrateState(parsed);

    const item = hydrated.products[hydrated.activeProductId].items["6i"];

    assertEqual(item.status, REVIEW_STATUSES.APPROVED);

    assertEqual(item.originalTitle, "Pantone Colours Match Approved Pack Copy?");

    assertEqual(item.currentTitle, "Pantone Colours Match Approved Pack Copy?");

    assertEqual(item.sectionId, "packaging-marks-languages");
  });

  test("G5R-036 6i status survives serialization roundtrip", () => {
    const product = freshWorkspace();

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    const parsed = JSON.parse(serializeState());

    assertEqual(
      parsed.products[parsed.activeProductId].items["6i"].status,
      "approved",
    );

    const hydrated = rehydrateState(parsed);

    assertEqual(
      hydrated.products[hydrated.activeProductId].items["6i"].status,
      "approved",
    );
  });

  test("G5R-037 6i survives duplicateProduct with independent pins", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    product.items["6i"].pins.push({
      layerId: "layer-front",
      xRatio: 0.5,
      yRatio: 0.5,
    });

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    const newId = duplicateProduct(product.id);

    const copy = getActiveProduct();

    assertEqual(copy.id, newId);

    const item = copy.items["6i"];

    assertEqual(item.status, REVIEW_STATUSES.APPROVED);

    assertEqual(item.pins.length, 1);

    assertEqual(item.pins[0].layerId, "layer-front");

    item.pins[0].xRatio = 0.9;

    assertEqual(product.items["6i"].pins[0].xRatio, 0.5);
  });

  test("G5R-038 duplicateProduct clones legacy pantoneColors independently", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      }),
    );

    const newId = duplicateProduct(product.id);

    const copy = getActiveProduct();

    assertEqual(copy.pantoneColors.length, 1);

    assertEqual(copy.pantoneColors[0].id, "colour-1");

    copy.pantoneColors[0].name = "Mutated";

    assertEqual(product.pantoneColors[0].name, "Brand Red");
  });

  test("G5R-039 current JSON export contains 6i and legacy pantoneColors", () => {
    const product = freshWorkspace();

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      }),
    );

    product.items["6i"].status = REVIEW_STATUSES.APPROVED;

    const data = buildExportData();

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertExists(data.items["6i"]);

    assertEqual(data.items["6i"].status, REVIEW_STATUSES.APPROVED);

    assertEqual(data.pantoneColors.length, 1);

    assertEqual(data.pantoneColors[0].id, "colour-1");
  });

  test("G5R-040 primary UI no longer renders the Colour Specification editor", () => {
    resetWorkspaceForMultiProductTest();

    assertEqual(document.getElementById("colour-specification"), null);

    assertEqual(document.getElementById("pantone-colour-editor"), null);

    assertEqual(document.getElementById("btn-add-colour"), null);

    assertEqual(document.getElementById("pantone-colours-list"), null);
  });

  test("G5R-041 right panel renders viewer, tabs and canvas only", () => {
    resetWorkspaceForMultiProductTest();

    const panel = document.querySelector(".right-panel");

    assertExists(panel);

    const panelText = panel.textContent;

    assertEqual(panelText.includes("Colour Specification"), false);

    assertExists(document.getElementById("canvas-area"));

    assertExists(document.getElementById("artwork-wrapper"));

    assertEqual(panel.querySelectorAll(".pantone-colour-row").length, 0);
  });

  test("G5R-042 artwork canvas is not displaced by a removed colour bar", () => {
    resetWorkspaceForMultiProductTest();

    const wrapper = document.getElementById("artwork-wrapper");

    const canvas = document.getElementById("canvas-area");

    assertExists(wrapper);

    assertExists(canvas);

    const wrapperTop = wrapper.getBoundingClientRect().top;

    const canvasTop = canvas.getBoundingClientRect().top;

    assertEqual(canvasTop <= wrapperTop, true);

    const sections = canvas.querySelectorAll(".colour-specification");

    assertEqual(sections.length, 0);
  });

  test("G5R-043 legacy Pantone domain functions remain available", () => {
    assertEqual(typeof addPantoneColour, "function");

    assertEqual(typeof updatePantoneColour, "function");

    assertEqual(typeof deletePantoneColour, "function");

    assertEqual(typeof getPantoneColourById, "function");

    assertEqual(typeof clearPantoneLayerReferences, "function");

    assertEqual(typeof clonePantoneColours, "function");

    assertEqual(typeof validateSerializedPantoneColours, "function");
  });

  test("G5R-044 clearPantoneLayerReferences keeps working for legacy data", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    product.pantoneColors.push(
      createPantoneColour({
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: ["layer-front", "layer-back"],
      }),
    );

    clearPantoneLayerReferences(product, "layer-back");

    assertDeepEqual(product.pantoneColors[0].layerIds, ["layer-front"]);

    assertEqual(product.pantoneColors.length, 1);
  });

  test("G5R-045 old v3 review with pantoneColors loads with 6i Pending", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 3;

    delete exported.items["6i"];

    exported.pantoneColors = [
      {
        id: "colour-1",
        name: "Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "",
        layerIds: [],
      },
    ];

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const restored = getActiveProduct();

    assertEqual(restored.pantoneColors.length, 1);

    assertEqual(restored.items["6i"].status, REVIEW_STATUSES.PENDING);

    assertEqual(restored.items["6i"].comment, "");
  });

  test("G5R-046 old v3 review pantoneColors survive Save Check roundtrip", () => {
    freshWorkspace();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.schemaVersion = 3;

    delete exported.items["6i"];

    exported.pantoneColors = [
      {
        id: "colour-legacy-1",
        name: "Legacy Red",
        pantoneCode: "PANTONE 186 C",
        notes: "Preserved note",
        layerIds: [],
      },
    ];

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    saveStateToStorage();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(stored.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertEqual(
      stored.products[stored.activeProductId].pantoneColors.length,
      1,
    );

    assertEqual(
      stored.products[stored.activeProductId].pantoneColors[0].notes,
      "Preserved note",
    );

    assertExists(stored.products[stored.activeProductId].items["6i"]);

    assertEqual(
      stored.products[stored.activeProductId].items["6i"].status,
      REVIEW_STATUSES.PENDING,
    );
  });

  test("G5R-047 UI removal does not break the standard review workflow", () => {
    resetWorkspaceForMultiProductTest();

    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 50);

    const approveButton = document.querySelector(
      '.check-item[data-id="6i"] [data-action="approve"]',
    );

    assertExists(approveButton);

    approveButton.click();

    assertEqual(getItemById("6i").status, REVIEW_STATUSES.APPROVED);

    renderAppState();

    assertEqual(getItemById("6i").status, REVIEW_STATUSES.APPROVED);
  });

  test("G5R-048 comment input on 6i works after UI removal", () => {
    resetWorkspaceForMultiProductTest();

    const input = document.querySelector(
      '.check-item[data-id="6i"] [data-role="comment-input"]',
    );

    assertExists(input);

    input.value = "Verified against approved pack copy.";

    input.dispatchEvent(new Event("input"));

    assertEqual(
      getItemById("6i").comment,
      "Verified against approved pack copy.",
    );
  });

  test("G5R-049 6i survives full workspace persistence roundtrip", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-front", "Front");

    product.items["6i"].status = REVIEW_STATUSES.REJECTED;

    product.items["6i"].comment = "Pantone mismatch on front pack.";

    product.items["6i"].pins.push({
      layerId: "layer-front",
      xRatio: 0.2,
      yRatio: 0.4,
    });

    saveStateToStorage();

    const snapshot = localStorage.getItem(STORAGE_KEY);

    const parsed = JSON.parse(snapshot);

    const hydrated = rehydrateState(parsed);

    const restored = hydrated.products[hydrated.activeProductId];

    assertEqual(restored.items["6i"].status, REVIEW_STATUSES.REJECTED);

    assertEqual(restored.items["6i"].comment, "Pantone mismatch on front pack.");

    assertEqual(restored.items["6i"].pins.length, 1);

    assertEqual(restored.items["6i"].pins[0].layerId, "layer-front");

    assertEqual(
      restored.items["6i"].originalTitle,
      "Pantone Colours Match Approved Pack Copy?",
    );
  });

})();
