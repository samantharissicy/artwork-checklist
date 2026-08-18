// ============================================================
// G5 — ARTWORK COLOUR SPECIFICATIONS
// ============================================================
//
// Tests owned by this roadmap layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
//
// This layer covers schema v3:
// - product.pantoneColors[] (Pantone reference as textual authority);
// - permanent colour IDs and layer associations;
// - persistence, export/import and product duplication;
// - referential integrity with artwork layers;
// - Colour Specification component and inline editor.
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
  // DOMAIN
  // ============================================================

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

  test("G5-025 renamed layer name appears correctly when colour is rendered", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-front", "layer-back"],
    });

    renameArtworkLayer("layer-front", "Front Panel");

    renderPantoneColours();

    const row = document.querySelector(
      `.pantone-colour-row[data-colour-id="${colour.id}"]`,
    );

    assertExists(row);

    assertEqual(
      row.querySelector(".pantone-colour-layers").textContent,
      "Front Panel · Back",
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

  test("G5-028 colour becomes Unassigned when its last layer is deleted", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-back", "Back");

    const colour = addTestColour(product, {
      layerIds: ["layer-back"],
    });

    deleteArtworkLayer(product.id, "layer-back");

    assertDeepEqual(
      getPantoneColourById(product, colour.id).layerIds,
      [],
    );

    renderPantoneColours();

    const row = document.querySelector(
      `.pantone-colour-row[data-colour-id="${colour.id}"]`,
    );

    assertExists(row);

    assertEqual(
      row.querySelector(".pantone-colour-layers").textContent,
      "Unassigned",
    );
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

  test("G5-032 switching products renders correct colour specifications", () => {
    freshWorkspace();

    const productA = getActiveProduct();

    addTestColour(productA, { name: "Red" });

    const productB = createProduct("g5-product-c");

    appState.products[productB.id] = productB;

    addTestColour(productB, {
      name: "Yellow",
      pantoneCode: "PANTONE 123 C",
    });

    switchProduct(productB.id);

    const list = document.getElementById("pantone-colours-list");

    assertExists(list);

    assertEqual(list.textContent.includes("PANTONE 186 C"), false);

    assertEqual(list.textContent.includes("PANTONE 123 C"), true);

    switchProduct(productA.id);

    assertEqual(list.textContent.includes("PANTONE 186 C"), true);

    assertEqual(list.textContent.includes("PANTONE 123 C"), false);
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

  test("G5-045 JSON export remains schema version 3", () => {
    freshWorkspace();

    const data = buildExportData();

    assertEqual(data.schemaVersion, 3);

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

  test("G5-051 Colour Specification component renders", () => {
    freshWorkspace();

    assertExists(document.getElementById("colour-specification"));

    assertExists(document.getElementById("pantone-colours-list"));

    assertExists(document.getElementById("btn-add-colour"));

    assertExists(document.getElementById("pantone-colour-editor"));
  });

  test("G5-052 empty state renders when no colours exist", () => {
    freshWorkspace();

    renderPantoneColours();

    const list = document.getElementById("pantone-colours-list");

    assertEqual(
      list.textContent.includes("No colour specifications added yet."),
      true,
    );
  });

  test("G5-053 Add Colour opens editor", () => {
    freshWorkspace();

    const editor = document.getElementById("pantone-colour-editor");

    assertEqual(editor.hidden, true);

    document.getElementById("btn-add-colour").click();

    assertEqual(editor.hidden, false);

    closePantoneColourEditor();
  });

  test("G5-054 cancel Add Colour does not modify appState", () => {
    const product = freshWorkspace();

    document.getElementById("btn-add-colour").click();

    const codeInput = document.getElementById("pantone-code-input");

    codeInput.value = "PANTONE 186 C";

    const nameInput = document.getElementById("pantone-name-input");

    nameInput.value = "Brand Red";

    document.getElementById("btn-cancel-colour").click();

    assertEqual(product.pantoneColors.length, 0);

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      true,
    );
  });

  test("G5-055 Save Colour adds specification", () => {
    const product = freshWorkspace();

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-code-input").value = "PANTONE 186 C";

    document.getElementById("pantone-name-input").value = "Brand Red";

    document.getElementById("btn-save-colour").click();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].name, "Brand Red");

    const list = document.getElementById("pantone-colours-list");

    assertEqual(list.textContent.includes("PANTONE 186 C"), true);

    assertEqual(list.textContent.includes("Brand Red"), true);
  });

  test("G5-056 Edit opens editor populated with current data", () => {
    freshWorkspace();

    const product = getActiveProduct();

    const first = addTestColour(product, {
      name: "Paulig Red",
      pantoneCode: "PANTONE 186 C",
      notes: "Primary logo",
      layerIds: [],
    });

    openEditPantoneColourEditor(first.id);

    assertEqual(
      document.getElementById("pantone-code-input").value,
      "PANTONE 186 C",
    );

    assertEqual(
      document.getElementById("pantone-name-input").value,
      "Paulig Red",
    );

    assertEqual(
      document.getElementById("pantone-notes-input").value,
      "Primary logo",
    );

    assertEqual(
      document.getElementById("btn-save-colour").textContent,
      "Save Changes",
    );

    closePantoneColourEditor();
  });

  test("G5-057 cancel Edit preserves original data", () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Paulig Red" });

    openEditPantoneColourEditor("colour-1");

    document.getElementById("pantone-name-input").value = "Changed";

    document.getElementById("btn-cancel-colour").click();

    assertEqual(product.pantoneColors[0].name, "Paulig Red");

    assertEqual(product.pantoneColors[0].pantoneCode, "PANTONE 186 C");
  });

  test("G5-058 Save Changes updates specification", () => {
    const product = freshWorkspace();

    const colour = addTestColour(product, { name: "Paulig Red" });

    openEditPantoneColourEditor(colour.id);

    document.getElementById("pantone-name-input").value = "Paulig Deep Red";

    document.getElementById("pantone-code-input").value = "PANTONE 186 CP";

    document.getElementById("btn-save-colour").click();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, colour.id);

    assertEqual(product.pantoneColors[0].name, "Paulig Deep Red");

    assertEqual(product.pantoneColors[0].pantoneCode, "PANTONE 186 CP");

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      true,
    );
  });

  test("G5-059 Delete invokes confirmation", async () => {
    const product = freshWorkspace();

    addTestColour(product);

    renderPantoneColours();

    const deleteButton = document.querySelector(
      ".pantone-colour-row .pantone-colour-action-danger",
    );

    assertExists(deleteButton);

    deleteButton.click();

    await flushAsync();

    const overlay = document.getElementById("app-dialog-overlay");

    assertEqual(overlay.classList.contains("hidden"), false);

    assertEqual(
      document.getElementById("app-dialog-title").textContent,
      "Delete colour specification?",
    );

    assertEqual(product.pantoneColors.length, 1);

    document.getElementById("app-dialog-cancel").click();

    await flushAsync();
  });

  test("G5-060 cancelled delete changes nothing", async () => {
    const product = freshWorkspace();

    const colour = addTestColour(product);

    renderPantoneColours();

    const deleteButton = document.querySelector(
      ".pantone-colour-row .pantone-colour-action-danger",
    );

    deleteButton.click();

    await flushAsync();

    document.getElementById("app-dialog-cancel").click();

    await flushAsync();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, colour.id);
  });

  test("G5-061 confirmed delete removes specification", async () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Red" });

    const yellow = addTestColour(product, {
      name: "Yellow",
      pantoneCode: "PANTONE 123 C",
    });

    renderPantoneColours();

    const rows = document.querySelectorAll(".pantone-colour-row");

    assertEqual(rows.length, 2);

    rows[0]
      .querySelector(".pantone-colour-action-danger")
      .click();

    await flushAsync();

    document.getElementById("app-dialog-confirm").click();

    await flushAsync();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, yellow.id);

    const list = document.getElementById("pantone-colours-list");

    assertEqual(list.textContent.includes("PANTONE 186 C"), false);

    assertEqual(list.textContent.includes("PANTONE 123 C"), true);
  });

  test("G5-062 layer names render from current artworkLayers", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-sleeve", "Sleeve");

    addTestColour(product, { layerIds: ["layer-sleeve"] });

    renderPantoneColours();

    const row = document.querySelector(".pantone-colour-row");

    assertEqual(
      row.querySelector(".pantone-colour-layers").textContent,
      "Sleeve",
    );
  });

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

  test("G5P-006 colour row renders notes when notes exist", () => {
    const product = freshWorkspace();

    addTestColour(product, {
      name: "Primary Brand Red",
      notes: "Primary logo and hero graphics.",
    });

    renderPantoneColours();

    const row = document.querySelector(".pantone-colour-row");

    assertExists(row.querySelector(".pantone-colour-notes"));

    assertEqual(
      row.querySelector(".pantone-colour-notes").textContent,
      "Primary logo and hero graphics.",
    );
  });

  test("G5P-007 colour row does not render note element when notes are empty", () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Accent Yellow", notes: "" });

    renderPantoneColours();

    const row = document.querySelector(".pantone-colour-row");

    assertEqual(row.querySelector(".pantone-colour-notes"), null);
  });

  test("G5P-008 notes are rendered as text, not interpreted as HTML", () => {
    const product = freshWorkspace();

    addTestColour(product, {
      name: "Brand Red",
      notes: "<b>Bold</b> & <script>alert('x')</script>",
    });

    renderPantoneColours();

    const row = document.querySelector(".pantone-colour-row");

    const notesElement = row.querySelector(".pantone-colour-notes");

    assertExists(notesElement);

    assertEqual(
      notesElement.textContent,
      "<b>Bold</b> & <script>alert('x')</script>",
    );

    assertEqual(
      notesElement.querySelector("b, script") === null,
      true,
    );
  });

  // ============================================================
  // G5 POLISH — CSS DECOUPLING
  // ============================================================

  test("G5P-009 Add Colour button still exists and opens editor", () => {
    freshWorkspace();

    const editor = document.getElementById("pantone-colour-editor");

    assertEqual(editor.hidden, true);

    document.getElementById("btn-add-colour").click();

    assertEqual(editor.hidden, false);

    closePantoneColourEditor();
  });

  test("G5P-010 G5 HTML no longer requires layer-action-* classes", () => {
    const addButton = document.getElementById("btn-add-colour");

    const cancelButton = document.getElementById("btn-cancel-colour");

    const saveButton = document.getElementById("btn-save-colour");

    ["layer-action-btn", "layer-action-add", "layer-action-danger"]
      .forEach((legacyClass) => {
        assertEqual(addButton.classList.contains(legacyClass), false);

        assertEqual(cancelButton.classList.contains(legacyClass), false);

        assertEqual(saveButton.classList.contains(legacyClass), false);
      });

    assertEqual(addButton.classList.contains("colour-action-btn"), true);

    assertEqual(addButton.classList.contains("colour-action-primary"), true);

    assertEqual(saveButton.classList.contains("colour-action-primary"), true);
  });

  // ============================================================
  // G5 POLISH — DRAFT PRESERVATION
  // ============================================================

  test("G5P-011 opening Add Colour editor and switching artwork layer keeps editor open", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    document.getElementById("btn-add-colour").click();

    assertEqual(switchArtworkLayer("layer-back"), true);

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      false,
    );

    closePantoneColourEditor();
  });

  test("G5P-012 Pantone code draft survives artwork layer switch", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-code-input").value = "PANTONE 123 C";

    switchArtworkLayer("layer-back");

    assertEqual(
      document.getElementById("pantone-code-input").value,
      "PANTONE 123 C",
    );

    closePantoneColourEditor();
  });

  test("G5P-013 Name draft survives artwork layer switch", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-name-input").value = "Accent Yellow";

    switchArtworkLayer("layer-back");

    assertEqual(
      document.getElementById("pantone-name-input").value,
      "Accent Yellow",
    );

    closePantoneColourEditor();
  });

  test("G5P-014 Notes draft survives artwork layer switch", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-notes-input").value = "Callout areas";

    switchArtworkLayer("layer-back");

    assertEqual(
      document.getElementById("pantone-notes-input").value,
      "Callout areas",
    );

    closePantoneColourEditor();
  });

  test("G5P-015 layer checkbox draft survives artwork layer switch", () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    document.getElementById("btn-add-colour").click();

    const frontInput = document.querySelector(
      '#pantone-layer-options input[data-layer-id="layer-front"]',
    );

    frontInput.checked = true;

    switchArtworkLayer("layer-back");

    const frontAfter = document.querySelector(
      '#pantone-layer-options input[data-layer-id="layer-front"]',
    );

    assertExists(frontAfter);

    assertEqual(frontAfter.checked, true);

    closePantoneColourEditor();
  });

  test("G5P-016 switching products closes editor", () => {
    freshWorkspace();

    const productB = createProduct("g5-polish-product-b");

    appState.products[productB.id] = productB;

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-code-input").value = "PANTONE 123 C";

    switchProduct(productB.id);

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      true,
    );

    switchProduct("product-1");

    assertEqual(productB.pantoneColors.length, 0);
  });

  test("G5P-017 importing review closes editor", () => {
    freshWorkspace();

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-code-input").value = "PANTONE 123 C";

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      true,
    );
  });

  test("G5P-018 deleting a selected artwork layer removes only that invalid checkbox selection from an open draft", async () => {
    const product = freshWorkspace();

    addTestLayer(product, "layer-front", "Front");

    addTestLayer(product, "layer-back", "Back");

    addTestLayer(product, "layer-sleeve", "Sleeve");

    assertEqual(switchArtworkLayer("layer-back"), true);

    document.getElementById("btn-add-colour").click();

    document.getElementById("pantone-code-input").value = "PANTONE 123 C";

    document.getElementById("pantone-name-input").value = "Accent Yellow";

    document.getElementById("pantone-notes-input").value = "Callout areas";

    document.querySelector(
      '#pantone-layer-options input[data-layer-id="layer-front"]',
    ).checked = true;

    document.querySelector(
      '#pantone-layer-options input[data-layer-id="layer-back"]',
    ).checked = true;

    await deleteActiveArtworkLayer();

    await flushAsync();

    assertEqual(
      document.getElementById("pantone-colour-editor").hidden,
      false,
    );

    assertEqual(
      document.getElementById("pantone-code-input").value,
      "PANTONE 123 C",
    );

    assertEqual(
      document.getElementById("pantone-name-input").value,
      "Accent Yellow",
    );

    assertEqual(
      document.getElementById("pantone-notes-input").value,
      "Callout areas",
    );

    assertEqual(
      document.querySelector(
        '#pantone-layer-options input[data-layer-id="layer-back"]',
      ),
      null,
    );

    assertEqual(
      document.querySelector(
        '#pantone-layer-options input[data-layer-id="layer-front"]',
      ).checked,
      true,
    );

    assertEqual(product.pantoneColors.length, 0);

    closePantoneColourEditor();
  });

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
})();