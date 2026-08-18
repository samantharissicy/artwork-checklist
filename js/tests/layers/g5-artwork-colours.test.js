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

    assertEqual(first.id, "colour-1");

    assertEqual(second.id, "colour-2");

    assertEqual(deletePantoneColour(product.id, "colour-1").ok, true);

    const third = addTestColour(product, { name: "Text Black" });

    assertEqual(third.id, "colour-3");
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

    addTestColour(product, { name: "Red" });

    addTestColour(product, { name: "Yellow", pantoneCode: "PANTONE 123 C" });

    addTestColour(product, { name: "Black", pantoneCode: "PANTONE Black C" });

    assertEqual(deletePantoneColour(product.id, "colour-2").ok, true);

    assertEqual(product.pantoneColors.length, 2);

    assertEqual(product.pantoneColors[0].id, "colour-1");

    assertEqual(product.pantoneColors[1].id, "colour-3");
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

    addTestColour(product, {
      name: "Red",
      notes: "Logo",
      layerIds: ["layer-front", "layer-back"],
    });

    const duplicateId = duplicateProduct(product.id);

    assertExists(duplicateId);

    const duplicate = getProductById(duplicateId);

    assertEqual(duplicate.pantoneColors.length, 1);

    assertEqual(duplicate.pantoneColors[0].id, "colour-1");

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

    addTestColour(product, { name: "Primary Brand Red" });

    const duplicateId = duplicateProduct(product.id);

    const duplicate = getProductById(duplicateId);

    const result = updatePantoneColour(
      duplicate.id,
      "colour-1",
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

    addTestColour(product, {
      name: "Red",
      pantoneCode: "PANTONE Black C",
      notes: "Body copy",
      layerIds: [],
    });

    saveStateToStorage();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertDeepEqual(
      stored.products[stored.activeProductId].pantoneColors,
      [
        {
          id: "colour-1",
          name: "Red",
          pantoneCode: "PANTONE Black C",
          notes: "Body copy",
          layerIds: [],
        },
      ],
    );
  });

  test("G5-039 rehydration preserves colour IDs", () => {
    const product = freshWorkspace();

    addTestColour(product);

    const hydrated = rehydrateState(JSON.parse(serializeState()));

    assertEqual(
      hydrated.products[hydrated.activeProductId].pantoneColors[0].id,
      "colour-1",
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

    assertEqual(restored.pantoneColors[0].id, "colour-1");

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

    assertDeepEqual(restored.pantoneColors, [
      {
        id: "colour-1",
        name: "Primary Brand Red",
        pantoneCode: "PANTONE 186 C",
        notes: "Logo",
        layerIds: ["layer-front", "layer-back"],
      },
      {
        id: "colour-2",
        name: "Primary Text",
        pantoneCode: "PANTONE Black C",
        notes: "",
        layerIds: ["layer-back"],
      },
    ]);
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

    addTestColour(product, {
      name: "Paulig Red",
      pantoneCode: "PANTONE 186 C",
      notes: "Primary logo",
      layerIds: [],
    });

    openEditPantoneColourEditor("colour-1");

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

    addTestColour(product, { name: "Paulig Red" });

    openEditPantoneColourEditor("colour-1");

    document.getElementById("pantone-name-input").value = "Paulig Deep Red";

    document.getElementById("pantone-code-input").value = "PANTONE 186 CP";

    document.getElementById("btn-save-colour").click();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, "colour-1");

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

    addTestColour(product);

    renderPantoneColours();

    const deleteButton = document.querySelector(
      ".pantone-colour-row .pantone-colour-action-danger",
    );

    deleteButton.click();

    await flushAsync();

    document.getElementById("app-dialog-cancel").click();

    await flushAsync();

    assertEqual(product.pantoneColors.length, 1);

    assertEqual(product.pantoneColors[0].id, "colour-1");
  });

  test("G5-061 confirmed delete removes specification", async () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Red" });

    addTestColour(product, { name: "Yellow", pantoneCode: "PANTONE 123 C" });

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

    assertEqual(product.pantoneColors[0].id, "colour-2");

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

  test("G5-063 empty layerIds render as Unassigned", () => {
    const product = freshWorkspace();

    addTestColour(product, { name: "Accent Yellow" });

    renderPantoneColours();

    const row = document.querySelector(".pantone-colour-row");

    assertEqual(
      row.querySelector(".pantone-colour-layers").textContent,
      "Unassigned",
    );
  });
})();