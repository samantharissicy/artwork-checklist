// ============================================================
// G4A — MULTI-LAYER ARTWORK DOMAIN FOUNDATION
// ============================================================
//
// Tests owned by this roadmap layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
//
// This layer covers schema v3:
// - artworkLayers[] / activeArtworkLayerId;
// - per-layer item pins (item.pins[]);
// - the v1 → v2 → v3 migration chain;
// - layer-aware sessions, identity and rendering.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assertEqual,
    assertDeepEqual,
    assertExists,
    assertClose,
    assertNotEqual,
    createTestArtworkMetadata,
    resetWorkspaceForMultiProductTest,
    createSnapshot,
    restoreSnapshot,
  } = window.ArtworkTests;

  const DEFAULT_LAYER_ID = "layer-main";

  function addTestLayer(product, layerId, name) {
    product.artworkLayers.push(createArtworkLayer(layerId, name));
  }

  function buildV2StateFromCurrent() {
    const v2State = JSON.parse(serializeState());

    delete v2State.products[v2State.activeProductId].artworkLayers;

    delete v2State.products[v2State.activeProductId].activeArtworkLayerId;

    v2State.products[v2State.activeProductId].artwork =
      createTestArtworkMetadata("v2-artwork.png");

    Object.values(v2State.products[v2State.activeProductId].items).forEach(
      (item) => {
        delete item.pins;

        item.pin = null;
      },
    );

    v2State.products[v2State.activeProductId].items["1a"].pin = {
      xRatio: 0.3,
      yRatio: 0.6,
    };

    v2State.schemaVersion = 2;

    return v2State;
  }

  test("G4A-001 createArtworkLayer builds a canonical layer", () => {
    const layer = createArtworkLayer("layer-back", "Back Label");

    assertEqual(layer.id, "layer-back");

    assertEqual(layer.name, "Back Label");

    assertEqual(layer.artwork, null);
  });

  test("G4A-002 createArtworkLayer clones artwork metadata", () => {
    const metadata = createTestArtworkMetadata("front.png");

    const layer = createArtworkLayer("layer-front", "Front", metadata);

    assertDeepEqual(layer.artwork, metadata);

    assertNotEqual(layer.artwork, metadata);

    layer.artwork.name = "changed.png";

    assertEqual(metadata.name, "front.png");
  });

  test("G4A-003 new product contains a default active layer", () => {
    const product = createProduct("g4a-product");

    assertEqual(product.artworkLayers.length, 1);

    assertEqual(product.artworkLayers[0].id, DEFAULT_LAYER_ID);

    assertEqual(product.artworkLayers[0].name, "Main Artwork");

    assertEqual(product.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertEqual(product.artwork, undefined);
  });

  test("G4A-004 getArtworkLayerById and getArtworkLayerIds", () => {
    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    assertExists(getArtworkLayerById(product, DEFAULT_LAYER_ID));

    assertEqual(getArtworkLayerById(product, "ghost"), null);

    assertDeepEqual(getArtworkLayerIds(product), [
      DEFAULT_LAYER_ID,
      "layer-back",
    ]);
  });

  test("G4A-005 getActiveArtworkLayer honors activeArtworkLayerId", () => {
    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    assertEqual(getActiveArtworkLayer(product).id, "layer-back");

    product.activeArtworkLayerId = "missing";

    assertEqual(getActiveArtworkLayer(product).id, DEFAULT_LAYER_ID);
  });

  test("G4A-006 getActiveArtworkMetadata returns active layer artwork", () => {
    const product = getActiveProduct();

    const metadata = createTestArtworkMetadata("front.png");

    getActiveArtworkLayer(product).artwork = metadata;

    assertDeepEqual(getActiveArtworkMetadata(product), metadata);

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    assertDeepEqual(getActiveArtworkMetadata(product), metadata);
  });

  test("G4A-007 generateArtworkLayerId is unique within a product", () => {
    const product = getActiveProduct();

    const first = generateArtworkLayerId(product);

    product.artworkLayers.push(createArtworkLayer(first, "One"));

    const second = generateArtworkLayerId(product);

    assertNotEqual(first, second);

    assertEqual(product.artworkLayers.filter((l) => l.id === first).length, 1);
  });

  test("G4A-008 setItemPinForLayer stores a normalized pin for the layer", () => {
    resetWorkspaceForMultiProductTest();

    assertEqual(
      setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
        xRatio: 0.25,
        yRatio: 0.5,
      }),
      true,
    );

    assertDeepEqual(getItemById("1a").pins, [
      {
        layerId: DEFAULT_LAYER_ID,
        xRatio: 0.25,
        yRatio: 0.5,
      },
    ]);
  });

  test("G4A-009 setItemPinForLayer rejects invalid pins and layer ids", () => {
    resetWorkspaceForMultiProductTest();

    assertEqual(
      setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
        xRatio: -0.1,
        yRatio: 0.5,
      }),
      false,
    );

    assertEqual(
      setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
        xRatio: 1.1,
        yRatio: 0.5,
      }),
      false,
    );

    assertEqual(
      setItemPinForLayer("1a", "", {
        xRatio: 0.1,
        yRatio: 0.5,
      }),
      false,
    );

    assertEqual(setItemPinForLayer("ghost", DEFAULT_LAYER_ID, null), false);

    assertEqual(getItemById("1a").pins.length, 0);
  });

  test("G4A-010 setItemPinForLayer null removes the layer pin", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    assertEqual(
      setItemPinForLayer("1a", DEFAULT_LAYER_ID, null),
      true,
    );

    assertEqual(getItemById("1a").pins.length, 0);
  });

  test("G4A-011 a pin on layer B does not affect layer A", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.1,
      yRatio: 0.9,
    });

    assertEqual(itemHasPinOnLayer(getItemById("1a"), "layer-back"), true);

    assertEqual(itemHasPinOnLayer(getItemById("1a"), DEFAULT_LAYER_ID), false);

    assertEqual(getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID), null);
  });

  test("G4A-012 setItemPinForLayer upserts one pin per (item, layer)", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.2,
      yRatio: 0.4,
    });

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.8,
      yRatio: 0.6,
    });

    assertEqual(getItemById("1a").pins.length, 1);

    assertDeepEqual(getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID), {
      xRatio: 0.8,
      yRatio: 0.6,
    });
  });

  test("G4A-013 layerHasPins and clearLayerPins are layer-scoped", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.2,
      yRatio: 0.4,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.3,
      yRatio: 0.7,
    });

    setItemPinForLayer("1b", DEFAULT_LAYER_ID, {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    assertEqual(layerHasPins(product, DEFAULT_LAYER_ID), true);

    assertEqual(layerHasPins(product, "layer-back"), true);

    assertEqual(clearLayerPins(product, DEFAULT_LAYER_ID), 2);

    assertEqual(layerHasPins(product, DEFAULT_LAYER_ID), false);

    assertEqual(layerHasPins(product, "layer-back"), true);

    assertEqual(getItemById("1a").pins.length, 1);

    assertEqual(getItemById("1a").pins[0].layerId, "layer-back");
  });

  test("G4A-014 productHasPins and clearProductPins span all layers", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    assertEqual(productHasPins(product), false);

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.1,
      yRatio: 0.1,
    });

    assertEqual(productHasPins(product), true);

    assertEqual(clearProductPins(product), 1);

    assertEqual(productHasPins(product), false);

    assertEqual(getItemById("1a").pins.length, 0);
  });

  test("G4A-015 removeItemPinFromLayer removes only the target layer pin", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.2,
      yRatio: 0.4,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.3,
      yRatio: 0.7,
    });

    assertEqual(removeItemPinFromLayer("1a", DEFAULT_LAYER_ID), true);

    assertEqual(removeItemPinFromLayer("1a", DEFAULT_LAYER_ID), false);

    assertEqual(getItemById("1a").pins.length, 1);

    assertEqual(getItemById("1a").pins[0].layerId, "layer-back");
  });

  test("G4A-016 migrateStateV2ToV3 moves artwork into the default layer", () => {
    const v2State = buildV2StateFromCurrent();

    const migrated = migrateStateV2ToV3(v2State);

    assertExists(migrated);

    assertEqual(migrated.schemaVersion, 3);

    const product =
      migrated.products[migrated.activeProductId];

    assertEqual(product.artworkLayers.length, 1);

    assertEqual(product.artworkLayers[0].id, DEFAULT_LAYER_ID);

    assertEqual(product.artworkLayers[0].name, "Main Artwork");

    assertEqual(product.artworkLayers[0].artwork.name, "v2-artwork.png");

    assertEqual(product.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertEqual(product.artwork, undefined);
  });

  test("G4A-017 migrateStateV2ToV3 moves item.pin into per-layer pins", () => {
    const v2State = buildV2StateFromCurrent();

    const migrated = migrateStateV2ToV3(v2State);

    const item = migrated.products[migrated.activeProductId].items["1a"];

    assertDeepEqual(item.pins, [
      {
        layerId: DEFAULT_LAYER_ID,
        xRatio: 0.3,
        yRatio: 0.6,
      },
    ]);

    assertEqual(item.pin, undefined);
  });

  test("G4A-018 schema v1 state migrates through the full chain to v3", () => {
    const dimensions = getArtworkBaseDimensions();

    assertExists(dimensions);

    const v2State = buildV2StateFromCurrent();

    v2State.schemaVersion = 1;

    v2State.products[v2State.activeProductId].items["1a"].pin = {
      x: dimensions.width * 0.4,
      y: dimensions.height * 0.7,
    };

    const migrated = migrateState(v2State);

    assertExists(migrated);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    const item = migrated.products[migrated.activeProductId].items["1a"];

    assertEqual(item.pins.length, 1);

    assertEqual(item.pins[0].layerId, DEFAULT_LAYER_ID);

    assertClose(item.pins[0].xRatio, 0.4);

    assertClose(item.pins[0].yRatio, 0.7);
  });

  test("G4A-019 migrateStateV2ToV3 never mutates the input state", () => {
    const v2State = buildV2StateFromCurrent();

    migrateStateV2ToV3(v2State);

    assertEqual(v2State.schemaVersion, 2);

    assertEqual(v2State.products[v2State.activeProductId].artworkLayers, undefined);

    assertEqual(
      v2State.products[v2State.activeProductId].items["1a"].pins,
      undefined,
    );

    assertDeepEqual(
      v2State.products[v2State.activeProductId].items["1a"].pin,
      {
        xRatio: 0.3,
        yRatio: 0.6,
      },
    );
  });

  test("G4A-020 migrated v3 state passes validateState", () => {
    const v2State = buildV2StateFromCurrent();

    const migrated = migrateState(v2State);

    assertEqual(validateState(migrated), true);
  });

  test("G4A-021 validateState rejects broken layer structures", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    let parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].artworkLayers = [];

    assertEqual(validateState(parsed), false);

    parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].artworkLayers = [
      createArtworkLayer("layer-x", "X"),
      createArtworkLayer("layer-x", "Duplicate"),
    ];

    assertEqual(validateState(parsed), false);

    parsed = JSON.parse(serializeState());

    delete parsed.products[parsed.activeProductId].activeArtworkLayerId;

    assertEqual(validateState(parsed), false);

    assertEqual(product.artworkLayers.length, 1);
  });

  test("G4A-022 validateState rejects dangling and duplicate layer pins", () => {
    resetWorkspaceForMultiProductTest();

    let parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].items["1a"].pins.push({
      layerId: "ghost-layer",
      xRatio: 0.5,
      yRatio: 0.5,
    });

    assertEqual(validateState(parsed), false);

    parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].items["1a"].pins.push({
      layerId: DEFAULT_LAYER_ID,
      xRatio: 0.5,
      yRatio: 0.5,
    });

    parsed.products[parsed.activeProductId].items["1a"].pins.push({
      layerId: DEFAULT_LAYER_ID,
      xRatio: 0.7,
      yRatio: 0.3,
    });

    assertEqual(validateState(parsed), false);
  });

  test("G4A-023 v3 state survives serialize/deserialize roundtrip", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getActiveArtworkLayer(product).artwork = createTestArtworkMetadata(
      "front.png",
    );

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const parsed = deserializeState(serializeState());

    assertEqual(parsed.schemaVersion, 3);

    const parsedProduct = parsed.products[parsed.activeProductId];

    assertEqual(parsedProduct.artworkLayers.length, 2);

    assertEqual(parsedProduct.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertDeepEqual(parsedProduct.items["1a"].pins, [
      {
        layerId: DEFAULT_LAYER_ID,
        xRatio: 0.25,
        yRatio: 0.5,
      },
      {
        layerId: "layer-back",
        xRatio: 0.75,
        yRatio: 0.25,
      },
    ]);
  });

  test("G4A-024 rehydrateProduct rebuilds independent layer clones", () => {
    resetWorkspaceForMultiProductTest();

    let parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].artworkLayers[0].artwork =
      createTestArtworkMetadata("test-artwork.png");

    parsed.products[parsed.activeProductId].artworkLayers.push(
      createArtworkLayer(
        "layer-back",
        "Back Label",
        createTestArtworkMetadata("back.png"),
      ),
    );

    const hydrated = rehydrateState(parsed);

    const hydratedProduct =
      hydrated.products[hydrated.activeProductId];

    assertEqual(hydratedProduct.artworkLayers.length, 2);

    assertEqual(hydratedProduct.activeArtworkLayerId, DEFAULT_LAYER_ID);

    hydratedProduct.artworkLayers[0].artwork.name = "mutated.png";

    assertEqual(
      parsed.products[parsed.activeProductId].artworkLayers[0].artwork.name,
      "test-artwork.png",
    );
  });

  test("G4A-025 buildExportData exports the v3 shape", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getActiveArtworkLayer(product).artwork = createTestArtworkMetadata(
      "front.png",
    );

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const data = buildExportData();

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertEqual(data.artworkLayers.length, 2);

    assertEqual(data.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertEqual(data.artworkLayers[0].artwork.name, "front.png");

    assertDeepEqual(data.items["1a"].pins, [
      {
        layerId: DEFAULT_LAYER_ID,
        xRatio: 0.25,
        yRatio: 0.5,
      },
      {
        layerId: "layer-back",
        xRatio: 0.75,
        yRatio: 0.25,
      },
    ]);

    assertEqual(data.artwork, undefined);

    assertEqual(data.items["1a"].pin, undefined);
  });

  test("G4A-026 export/import roundtrip preserves layers and pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getActiveArtworkLayer(product).artwork = createTestArtworkMetadata(
      "front.png",
    );

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const imported = getActiveProduct();

    assertEqual(imported.artworkLayers.length, 2);

    assertEqual(imported.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertDeepEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID),
      {
        xRatio: 0.25,
        yRatio: 0.5,
      },
    );

    assertDeepEqual(getItemPinForLayer(getItemById("1a"), "layer-back"), {
      xRatio: 0.75,
      yRatio: 0.25,
    });
  });

  test("G4A-027 schema-v2 review files migrate on import", () => {
    const base = JSON.parse(serializeState());

    const sourceProduct = base.products[base.activeProductId];

    const v2Export = {
      schemaVersion: 2,

      product: {
        id: sourceProduct.id,
        brand: sourceProduct.brand,
        productName: sourceProduct.productName,
        weight: sourceProduct.weight,
        sku: sourceProduct.sku,
        createdAt: sourceProduct.createdAt,
        updatedAt: sourceProduct.updatedAt,
      },

      items: Object.fromEntries(
        Object.entries(sourceProduct.items).map(([itemId, item]) => {
          const { pins, ...rest } = item;

          return [itemId, { ...rest, pin: null }];
        }),
      ),

      artwork: createTestArtworkMetadata("v2-import.png"),

      reviewer: sourceProduct.reviewer,
    };

    v2Export.items["1a"].pin = {
      xRatio: 0.25,
      yRatio: 0.5,
    };

    const result = applyImportedReview(v2Export);

    assertEqual(result.valid, true);

    const imported = getActiveProduct();

    assertEqual(imported.artworkLayers.length, 1);

    assertEqual(imported.artworkLayers[0].artwork.name, "v2-import.png");

    assertEqual(imported.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertDeepEqual(getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID), {
      xRatio: 0.25,
      yRatio: 0.5,
    });
  });

  test("G4A-028 legacy export uses active-layer pins only", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.9,
      yRatio: 0.1,
    });

    const dimensions = getArtworkBaseDimensions();

    const data = buildLegacyCheckData();

    assertClose(data.pins["1a"].x, dimensions.width * 0.25);

    assertClose(data.pins["1a"].y, dimensions.height * 0.75);

    product.activeArtworkLayerId = "layer-back";

    const data2 = buildLegacyCheckData();

    assertClose(data2.pins["1a"].x, dimensions.width * 0.9);

    assertClose(data2.pins["1a"].y, dimensions.height * 0.1);
  });

  test("G4A-029 duplicateProduct copies layers and pins without sessions", () => {
    resetWorkspaceForMultiProductTest();

    const sourceId = appState.activeProductId;

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getActiveArtworkLayer(product).artwork = createTestArtworkMetadata(
      "front.png",
    );

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    adoptSessionArtwork(
      createTestArtworkMetadata("front.png"),
      "blob:http://localhost/g4a-duplicate",
      sourceId,
      DEFAULT_LAYER_ID,
    );

    const duplicateId = duplicateProduct(sourceId);

    const duplicate = getProductById(duplicateId);

    assertEqual(duplicate.artworkLayers.length, 2);

    assertEqual(duplicate.activeArtworkLayerId, DEFAULT_LAYER_ID);

    assertEqual(duplicate.artworkLayers[0].artwork.name, "front.png");

    assertDeepEqual(
      getItemPinForLayer(duplicate.items["1a"], DEFAULT_LAYER_ID),
      {
        xRatio: 0.25,
        yRatio: 0.5,
      },
    );

    assertDeepEqual(getItemPinForLayer(duplicate.items["1a"], "layer-back"), {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    assertEqual(getArtworkSession(duplicateId, DEFAULT_LAYER_ID, false), null);

    releaseProductSessionArtworks(sourceId);
  });

  test("G4A-030 applyArtworkIdentity is layer-scoped (BR-G4A-ART-001/003)", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getActiveArtworkLayer(product).artwork = createTestArtworkMetadata(
      "front-old.png",
    );

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const cancelled = applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => false,
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(cancelled.applied, false);

    assertEqual(cancelled.reason, "cancelled");

    assertEqual(getActiveArtworkLayer(product).artwork.name, "front-old.png");

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID) !== null,
      true,
    );

    const replacement = applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => true,
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(replacement.applied, true);

    assertEqual(replacement.pinsCleared, 1);

    assertEqual(getActiveArtworkLayer(product).artwork.name, "front-new.png");

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID),
      null,
    );

    assertEqual(
      getArtworkLayerById(product, "layer-back").artwork.name,
      "back.png",
    );

    assertDeepEqual(getItemPinForLayer(getItemById("1a"), "layer-back"), {
      xRatio: 0.75,
      yRatio: 0.25,
    });
  });

  test("G4A-031 renderPins shows only active-layer pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    renderAppState();

    assertExists(document.querySelector('.pin[data-pid="1a"]'));

    assertEqual(document.querySelector('.pin[data-pid="1b"]'), null);

    product.activeArtworkLayerId = "layer-back";

    renderAppState();

    assertEqual(document.querySelector('.pin[data-pid="1a"]'), null);

    assertExists(document.querySelector('.pin[data-pid="1b"]'));
  });

  test("G4A-032 renderArtworkState reflects the active layer artwork", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    const demoArtwork = document.getElementById("demo-artwork");

    const missingState = document.getElementById("artwork-missing");

    const missingName = document.getElementById("artwork-missing-name");

    const statusBadge = document.getElementById("artwork-status-badge");

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back-only.png");

    renderArtworkState();

    assertEqual(missingState.hidden, true);

    assertEqual(demoArtwork.hidden, false);

    product.activeArtworkLayerId = "layer-back";

    renderArtworkState();

    assertEqual(missingState.hidden, false);

    assertEqual(missingName.textContent, "back-only.png");

    assertEqual(statusBadge.textContent, "File required");

    assertEqual(demoArtwork.hidden, true);

    assertEqual(pinsLayer.hidden, true);
  });

  test("G4A-033 sessions are nested per (product, layer)", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    const frontMetadata = createTestArtworkMetadata("front.png");

    const backMetadata = createTestArtworkMetadata("back.png");

    adoptSessionArtwork(
      frontMetadata,
      "blob:http://localhost/g4a-session-front",
      product.id,
      DEFAULT_LAYER_ID,
    );

    adoptSessionArtwork(
      backMetadata,
      "blob:http://localhost/g4a-session-back",
      product.id,
      "layer-back",
    );

    assertEqual(
      getArtworkSession(product.id, DEFAULT_LAYER_ID, false).objectUrl,
      "blob:http://localhost/g4a-session-front",
    );

    assertEqual(
      getArtworkSession(product.id, "layer-back", false).objectUrl,
      "blob:http://localhost/g4a-session-back",
    );

    releaseLayerSessionArtwork(product.id, DEFAULT_LAYER_ID);

    assertEqual(getArtworkSession(product.id, DEFAULT_LAYER_ID, false), null);

    assertEqual(
      getArtworkSession(product.id, "layer-back", false).objectUrl,
      "blob:http://localhost/g4a-session-back",
    );

    releaseProductSessionArtworks(product.id);

    assertEqual(getArtworkSession(product.id, "layer-back", false), null);
  });

  test("G4A-034 isArtworkLoadedInSession is layer-aware", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    const frontMetadata = createTestArtworkMetadata("front.png");

    adoptSessionArtwork(
      frontMetadata,
      "blob:http://localhost/g4a-loaded-front",
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(
      isArtworkLoadedInSession(frontMetadata, product.id, DEFAULT_LAYER_ID),
      true,
    );

    assertEqual(
      isArtworkLoadedInSession(frontMetadata, product.id, "layer-back"),
      false,
    );

    assertEqual(
      isArtworkLoadedInSession(
        createTestArtworkMetadata("other.png"),
        product.id,
        DEFAULT_LAYER_ID,
      ),
      false,
    );

    releaseProductSessionArtworks(product.id);
  });

  test("G4A-035 deleteProduct releases every layer session", () => {
    resetWorkspaceForMultiProductTest();

    const sourceId = appState.activeProductId;

    const secondId = createNewProduct();

    adoptSessionArtwork(
      createTestArtworkMetadata("front.png"),
      "blob:http://localhost/g4a-delete-front",
      sourceId,
      DEFAULT_LAYER_ID,
    );

    assertEqual(artworkSessions.has(sourceId), true);

    assertEqual(deleteProduct(sourceId, () => true), true);

    assertEqual(artworkSessions.has(sourceId), false);

    assertEqual(getProductById(sourceId), null);

    assertEqual(appState.activeProductId, secondId);
  });

  test("G4A-036 addPin and clearPins operate on the active layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    addPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID) !== null,
      true,
    );

    assertEqual(itemHasPinOnLayer(getItemById("1a"), "layer-back"), false);

    product.activeArtworkLayerId = "layer-back";

    clearPins();

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID) !== null,
      true,
    );

    assertEqual(itemHasPinOnLayer(getItemById("1a"), "layer-back"), false);

    addPin("1b", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    assertEqual(itemHasPinOnLayer(getItemById("1b"), "layer-back"), true);

    clearPins();

    assertEqual(itemHasPinOnLayer(getItemById("1b"), "layer-back"), false);

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID) !== null,
      true,
    );
  });

  test("G4A-037 export and legacy export stay isolated per layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const data = buildExportData();

    assertDeepEqual(data.items["1a"].pins, [
      {
        layerId: DEFAULT_LAYER_ID,
        xRatio: 0.25,
        yRatio: 0.5,
      },
    ]);

    assertDeepEqual(data.items["1b"].pins, [
      {
        layerId: "layer-back",
        xRatio: 0.75,
        yRatio: 0.25,
      },
    ]);
  });

  test("G4A-038 localStorage v2 record migrates to the v3 key", () => {
    const snapshot = createSnapshot();

    try {
      const v2State = buildV2StateFromCurrent();

      localStorage.removeItem(STORAGE_KEY);

      localStorage.setItem(
        "artworkChecklist:v2",
        JSON.stringify(v2State),
      );

      const result = loadStateFromStorage();

      assertEqual(result, true);

      assertEqual(localStorage.getItem("artworkChecklist:v2"), null);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

      assertEqual(stored.schemaVersion, 3);

      assertEqual(appState.schemaVersion, 3);

      assertEqual(
        appState.products[appState.activeProductId].artworkLayers.length,
        1,
      );
    } finally {
      restoreSnapshot(snapshot);
    }
  });

  test("G4A-039 schema-v2 state fails validation without migration", () => {
    const v2State = buildV2StateFromCurrent();

    assertEqual(validateState(v2State), false);

    const migrated = migrateState(v2State);

    assertEqual(validateState(migrated), true);
  });

  test("G4A-040 getItemPinForLayer returns a detached copy", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const pin = getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID);

    pin.xRatio = 0.99;

    assertEqual(getItemById("1a").pins[0].xRatio, 0.25);

    assertEqual(
      getItemPinForLayer(getItemById("1a"), DEFAULT_LAYER_ID).xRatio,
      0.25,
    );
  });

  // ============================================================
  // G4B — MULTI-LAYER ARTWORK WORKSPACE
  // ============================================================
  //
  // UI-driven layer management on top of the G4A domain foundation:
  // - artwork layer tabs and per-layer rendering;
  // - Add / Rename / Delete layer workflows with the app dialog;
  // - permanent layer identity and per-layer pin ownership;
  // - per-product active layer persistence and session isolation.
  // ============================================================

  function getLayerTab(layerId) {
    return document.querySelector(
      `.artwork-layer-tab[data-layer-id="${layerId}"]`,
    );
  }

  function withWindowStub(name, stub, fn) {
    const original = window[name];

    window[name] = stub;

    try {
      return fn();
    } finally {
      window[name] = original;
    }
  }

  function pinStateFor(itemId, layerId) {
    return getItemPinForLayer(getItemById(itemId), layerId);
  }

  test("G4B-001 renderArtworkLayerTabs renders one tab per layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    renderAppState();

    const tabs = document.querySelectorAll(".artwork-layer-tab");

    assertEqual(tabs.length, 2);

    assertEqual(getLayerTab(DEFAULT_LAYER_ID).textContent, "Main Artwork");

    assertEqual(getLayerTab("layer-back").textContent, "Back Label");
  });

  test("G4B-002 active layer tab carries active state", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    renderAppState();

    assertEqual(getLayerTab(DEFAULT_LAYER_ID).classList.contains("active"), true);

    assertEqual(getLayerTab(DEFAULT_LAYER_ID).getAttribute("aria-selected"), "true");

    assertEqual(getLayerTab("layer-back").classList.contains("active"), false);

    assertEqual(getLayerTab("layer-back").getAttribute("aria-selected"), "false");
  });

  test("G4B-003 Add Layer flow creates a layer with a permanent id", async () => {
    resetWorkspaceForMultiProductTest();

    await withWindowStub("showPromptDialog", async () => "Back Label", async () => {
      await addArtworkLayer();
    });

    const product = getActiveProduct();

    assertEqual(product.artworkLayers.length, 2);

    const backLayer = product.artworkLayers[1];

    assertNotEqual(backLayer.id, DEFAULT_LAYER_ID);

    assertEqual(backLayer.id.indexOf("layer-"), 0);

    assertEqual(backLayer.name, "Back Label");
  });

  test("G4B-004 createArtworkLayerForProduct trims layer names", () => {
    resetWorkspaceForMultiProductTest();

    const layer = createArtworkLayerForProduct(
      appState.activeProductId,
      "  Back  ",
    );

    assertEqual(layer.name, "Back");
  });

  test("G4B-005 empty layer name is rejected without mutation", async () => {
    resetWorkspaceForMultiProductTest();

    const before = JSON.parse(serializeState());

    await withWindowStub("showPromptDialog", async () => "", async () => {
      await addArtworkLayer();
    });

    const product = getActiveProduct();

    assertEqual(product.artworkLayers.length, 1);

    assertDeepEqual(JSON.parse(serializeState()), before);
  });

  test("G4B-006 added layer becomes the active layer", async () => {
    resetWorkspaceForMultiProductTest();

    await withWindowStub("showPromptDialog", async () => "Back", async () => {
      await addArtworkLayer();
    });

    const product = getActiveProduct();

    const activeLayer = getActiveArtworkLayer(product);

    assertEqual(activeLayer.name, "Back");

    assertEqual(product.activeArtworkLayerId, product.artworkLayers[1].id);

    assertEqual(getLayerTab(activeLayer.id).classList.contains("active"), true);
  });

  test("G4B-007 switching layers preserves product identity and updatedAt", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    const productIdAtStart = appState.activeProductId;

    const updatedAtAtStart = product.updatedAt;

    assertEqual(switchArtworkLayer("layer-back"), true);

    assertEqual(appState.activeProductId, productIdAtStart);

    assertEqual(product.updatedAt, updatedAtAtStart);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(
      stored.products[appState.activeProductId].activeArtworkLayerId,
      "layer-back",
    );
  });

  test("G4B-008 switching layers re-renders the artwork viewer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back-only.png");

    const missingState = document.getElementById("artwork-missing");

    const missingName = document.getElementById("artwork-missing-name");

    switchArtworkLayer("layer-back");

    assertEqual(missingState.hidden, false);

    assertEqual(missingName.textContent, "back-only.png");
  });

  test("G4B-009 switching layers re-renders only that layer's pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    switchArtworkLayer("layer-back");

    assertEqual(document.querySelector('.pin[data-pid="1a"]'), null);

    assertExists(document.querySelector('.pin[data-pid="1b"]'));
  });

  test("G4B-010 rename flow preserves the permanent layer id", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    const originalId = product.artworkLayers[1].id;

    await withWindowStub("showPromptDialog", async () => "Back Panel", async () => {
      await renameActiveArtworkLayer();
    });

    const renamedLayer = getArtworkLayerById(product, originalId);

    assertEqual(renamedLayer.name, "Back Panel");

    assertEqual(renamedLayer.id, originalId);

    assertEqual(product.activeArtworkLayerId, "layer-back");
  });

  test("G4B-011 rename preserves pins, artwork and active status", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    await withWindowStub("showPromptDialog", async () => "Back Label 2", async () => {
      await renameActiveArtworkLayer();
    });

    const renamedLayer = getArtworkLayerById(product, "layer-back");

    assertEqual(renamedLayer.artwork.name, "back.png");

    assertEqual(pinStateFor("1b", "layer-back").xRatio, 0.5);

    assertEqual(product.activeArtworkLayerId, "layer-back");
  });

  test("G4B-012 rename updates the product modification timestamp", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    const before = product.updatedAt;

    await withWindowStub("showPromptDialog", async () => "Back 2", async () => {
      await renameActiveArtworkLayer();
    });

    assertNotEqual(product.updatedAt, before);
  });

  test("G4B-013 deleting the last layer is rejected without a dialog", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    const layerId = product.artworkLayers[0].id;

    let confirmCalled = false;

    await withWindowStub("showConfirmDialog", async () => {
      confirmCalled = true;

      return true;
    }, async () => {
      await deleteActiveArtworkLayer();
    });

    assertEqual(confirmCalled, false);

    assertEqual(product.artworkLayers.length, 1);

    assertEqual(product.activeArtworkLayerId, layerId);
  });

  test("G4B-014 deleting a layer with pins requires confirmation", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    let confirmCalled = false;

    await withWindowStub("showConfirmDialog", async () => {
      confirmCalled = true;

      return false;
    }, async () => {
      await deleteActiveArtworkLayer();
    });

    assertEqual(confirmCalled, true);

    assertEqual(product.artworkLayers.length, 2);

    assertExists(pinStateFor("1b", "layer-back"));
  });

  test("G4B-015 cancelling deletion leaves the workspace unchanged", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    const before = JSON.parse(serializeState());

    await withWindowStub("showConfirmDialog", async () => false, async () => {
      await deleteActiveArtworkLayer();
    });

    assertDeepEqual(JSON.parse(serializeState()), before);
  });

  test("G4B-016 confirmed deletion removes the layer", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.5,
      yRatio: 0.5,
    });

    await withWindowStub("showConfirmDialog", async () => true, async () => {
      await deleteActiveArtworkLayer();
    });

    assertEqual(product.artworkLayers.length, 1);

    assertEqual(getArtworkLayerById(product, "layer-back"), null);
  });

  test("G4B-017 deletion removes only the target layer's pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    assertEqual(deleteArtworkLayer(product.id, "layer-back"), true);

    assertExists(pinStateFor("1a", DEFAULT_LAYER_ID));

    assertEqual(pinStateFor("1b", "layer-back"), null);

    assertEqual(getItemById("1b").pins.length, 0);
  });

  test("G4B-018 deletion preserves other layers' data", async () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    addTestLayer(product, "layer-third", "Third");

    product.activeArtworkLayerId = "layer-third";

    getArtworkLayerById(product, DEFAULT_LAYER_ID).artwork =
      createTestArtworkMetadata("front.png");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    await withWindowStub("showConfirmDialog", async () => true, async () => {
      await deleteActiveArtworkLayer();
    });

    assertEqual(product.artworkLayers.length, 2);

    assertEqual(
      getArtworkLayerById(product, "layer-back").artwork.name,
      "back.png",
    );

    assertExists(pinStateFor("1b", "layer-back"));

    assertExists(pinStateFor("1a", DEFAULT_LAYER_ID));
  });

  test("G4B-019 active layer falls back deterministically after deletion", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    addTestLayer(product, "layer-third", "Third");

    product.activeArtworkLayerId = "layer-back";

    deleteArtworkLayer(product.id, "layer-back");

    assertEqual(product.activeArtworkLayerId, "layer-third");

    deleteArtworkLayer(product.id, "layer-third");

    assertEqual(product.activeArtworkLayerId, DEFAULT_LAYER_ID);

    resetWorkspaceForMultiProductTest();

    const product2 = getActiveProduct();

    addTestLayer(product2, "layer-back", "Back Label");

    addTestLayer(product2, "layer-third", "Third");

    product2.activeArtworkLayerId = DEFAULT_LAYER_ID;

    deleteArtworkLayer(product2.id, DEFAULT_LAYER_ID);

    assertEqual(product2.activeArtworkLayerId, "layer-back");
  });

  test("G4B-020 deleting a layer releases only its session", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    adoptSessionArtwork(
      createTestArtworkMetadata("front.png"),
      "blob:http://localhost/g4b-front",
      product.id,
      DEFAULT_LAYER_ID,
    );

    adoptSessionArtwork(
      createTestArtworkMetadata("back.png"),
      "blob:http://localhost/g4b-back",
      product.id,
      "layer-back",
    );

    const revoked = [];

    withWindowStub("URL", {
      revokeObjectURL: (url) => {
        revoked.push(url);
      },
    }, () => {
      deleteArtworkLayer(product.id, "layer-back");
    });

    assertDeepEqual(revoked, ["blob:http://localhost/g4b-back"]);

    assertEqual(getArtworkSession(product.id, "layer-back", false), null);

    assertEqual(
      getArtworkSession(product.id, DEFAULT_LAYER_ID, false).objectUrl,
      "blob:http://localhost/g4b-front",
    );
  });

  test("G4B-021 replacing artwork pins clears only the target layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    let confirmCalled = false;

    const cancelled = applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => {
        confirmCalled = true;

        return false;
      },
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(cancelled.applied, false);

    assertEqual(cancelled.reason, "cancelled");

    assertExists(pinStateFor("1a", DEFAULT_LAYER_ID));

    const applied = applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => {
        confirmCalled = true;

        return true;
      },
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(applied.applied, true);

    assertEqual(applied.pinsCleared, 1);

    assertEqual(pinStateFor("1a", DEFAULT_LAYER_ID), null);

    assertEqual(confirmCalled, true);
  });

  test("G4B-022 replacing keeps other layers' artwork metadata", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => true,
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(
      getArtworkLayerById(product, "layer-back").artwork.name,
      "back.png",
    );

    assertEqual(
      getArtworkLayerById(product, DEFAULT_LAYER_ID).artwork.name,
      "front-new.png",
    );
  });

  test("G4B-023 replacing artwork keeps other layers' sessions", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    adoptSessionArtwork(
      createTestArtworkMetadata("back.png"),
      "blob:http://localhost/g4b-back-session",
      product.id,
      "layer-back",
    );

    applyArtworkIdentity(
      createTestArtworkMetadata("front-new.png"),
      () => true,
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(
      getArtworkSession(product.id, "layer-back", false).objectUrl,
      "blob:http://localhost/g4b-back-session",
    );
  });

  test("G4B-024 re-selecting the same artwork keeps pins without confirmation", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    const metadata = createTestArtworkMetadata("same.png");

    applyArtworkIdentity(
      metadata,
      () => true,
      product.id,
      DEFAULT_LAYER_ID,
    );

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    let confirmCalled = false;

    const result = applyArtworkIdentity(
      metadata,
      () => {
        confirmCalled = true;

        return true;
      },
      product.id,
      DEFAULT_LAYER_ID,
    );

    assertEqual(result.sameArtwork, true);

    assertEqual(result.pinsCleared, 0);

    assertEqual(confirmCalled, false);

    assertExists(pinStateFor("1a", DEFAULT_LAYER_ID));
  });

  test("G4B-025 one pin per item is allowed on every layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", "layer-back", {
      xRatio: 0.8,
      yRatio: 0.2,
    });

    const pins = getItemById("1a").pins;

    assertEqual(pins.length, 2);

    assertEqual(pins[0].layerId, DEFAULT_LAYER_ID);

    assertEqual(pins[1].layerId, "layer-back");
  });

  test("G4B-026 duplicate pins on the same layer are replaced", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.9,
      yRatio: 0.1,
    });

    const pins = getItemById("1a").pins;

    assertEqual(pins.length, 1);

    assertClose(pins[0].xRatio, 0.9);

    assertClose(pins[0].yRatio, 0.1);
  });

  test("G4B-027 clearPins clears only the active layer and pins carry identity", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    renderAppState();

    const pinElement = document.querySelector('.pin[data-pid="1a"]');

    assertEqual(pinElement.dataset.itemId, "1a");

    assertEqual(pinElement.dataset.layerId, DEFAULT_LAYER_ID);

    clearPins();

    assertEqual(document.querySelector('.pin[data-pid="1a"]'), null);

    assertEqual(getItemById("1a").pins.length, 0);

    assertExists(pinStateFor("1b", "layer-back"));
  });

  test("G4B-028 clearPins preserves other layers' pins and artwork", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back.png");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    clearPins();

    assertEqual(
      getArtworkLayerById(product, "layer-back").artwork.name,
      "back.png",
    );

    assertExists(pinStateFor("1b", "layer-back"));
  });

  test("G4B-029 each product remembers its own active layer", () => {
    resetWorkspaceForMultiProductTest();

    const productA = getActiveProduct();

    addTestLayer(productA, "layer-back", "Back Label");

    productA.activeArtworkLayerId = "layer-back";

    const productB = createProduct("test-product-b");

    appState.products[productB.id] = productB;

    switchProduct(productB.id);

    assertEqual(getActiveArtworkLayer(productB).id, DEFAULT_LAYER_ID);

    switchProduct(productA.id);

    assertEqual(getActiveArtworkLayer(productA).id, "layer-back");
  });

  test("G4B-030 duplicateProduct copies layers and per-layer pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const duplicatedId = duplicateProduct(product.id);

    const duplicated = getProductById(duplicatedId);

    assertEqual(duplicated.artworkLayers.length, 2);

    assertEqual(
      duplicated.artworkLayers.map((layer) => layer.name).join("|"),
      "Main Artwork|Back Label",
    );

    assertEqual(
      duplicated.items["1a"].pins[0].layerId,
      DEFAULT_LAYER_ID,
    );

    assertEqual(duplicated.items["1b"].pins[0].layerId, "layer-back");
  });

  test("G4B-031 duplicateProduct never copies artwork sessions", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    adoptSessionArtwork(
      createTestArtworkMetadata("front.png"),
      "blob:http://localhost/g4b-front-session",
      product.id,
      DEFAULT_LAYER_ID,
    );

    const duplicatedId = duplicateProduct(product.id);

    assertEqual(getArtworkSession(duplicatedId, DEFAULT_LAYER_ID, false), null);

    assertEqual(getArtworkSession(duplicatedId, "layer-back", false), null);
  });

  test("G4B-032 export represents every layer and the active layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const data = buildExportData();

    assertEqual(data.activeArtworkLayerId, "layer-back");

    assertEqual(data.artworkLayers.length, 2);

    assertEqual(data.items["1a"].pins[0].layerId, DEFAULT_LAYER_ID);

    assertEqual(data.items["1b"].pins[0].layerId, "layer-back");
  });

  test("G4B-033 import restores multiple layers and per-layer pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    const data = buildExportData();

    const result = applyImportedReview(data);

    assertEqual(result.valid, true);

    const importedProduct = getActiveProduct();

    assertEqual(importedProduct.artworkLayers.length, 2);

    assertEqual(importedProduct.activeArtworkLayerId, "layer-back");

    assertEqual(
      importedProduct.items["1a"].pins[0].layerId,
      DEFAULT_LAYER_ID,
    );

    assertEqual(importedProduct.items["1b"].pins[0].layerId, "layer-back");
  });

  test("G4B-034 imported active layer drives the artwork viewer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back-only.png");

    product.activeArtworkLayerId = "layer-back";

    const data = buildExportData();

    applyImportedReview(data);

    const missingState = document.getElementById("artwork-missing");

    const missingName = document.getElementById("artwork-missing-name");

    assertEqual(missingState.hidden, false);

    assertEqual(missingName.textContent, "back-only.png");
  });

  test("G4B-035 localStorage reload preserves layers, active layer and pins", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    saveStateToStorage();

    const reloaded = deserializeState(
      localStorage.getItem(STORAGE_KEY),
    );

    const reloadedProduct = reloaded.products[appState.activeProductId];

    assertEqual(reloadedProduct.artworkLayers.length, 2);

    assertEqual(reloadedProduct.activeArtworkLayerId, "layer-back");

    assertEqual(
      reloadedProduct.items["1a"].pins[0].layerId,
      DEFAULT_LAYER_ID,
    );

    assertEqual(reloadedProduct.items["1b"].pins[0].layerId, "layer-back");
  });

  test("G4B-036 metadata without a binary shows File required per layer", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.activeArtworkLayerId = "layer-back";

    getArtworkLayerById(product, "layer-back").artwork =
      createTestArtworkMetadata("back-only.png");

    getArtworkLayerById(product, DEFAULT_LAYER_ID).artwork =
      createTestArtworkMetadata("front-only.png");

    const missingState = document.getElementById("artwork-missing");

    const missingName = document.getElementById("artwork-missing-name");

    const statusBadge = document.getElementById("artwork-status-badge");

    renderAppState();

    assertEqual(missingState.hidden, false);

    assertEqual(missingName.textContent, "back-only.png");

    assertEqual(statusBadge.textContent, "File required");

    switchArtworkLayer(DEFAULT_LAYER_ID);

    assertEqual(missingName.textContent, "front-only.png");
  });

  test("G4B-037 zoom does not alter pin coordinates", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    renderAppState();

    const before = pinStateFor("1a", DEFAULT_LAYER_ID);

    const zoomBefore = currentZoom;

    zoom(-0.1);

    const after = pinStateFor("1a", DEFAULT_LAYER_ID);

    assertNotEqual(currentZoom, zoomBefore);

    assertClose(after.xRatio, before.xRatio);

    assertClose(after.yRatio, before.yRatio);
  });

  test("G4B-038 clicking a pin scrolls to its checklist item", () => {
    resetWorkspaceForMultiProductTest();

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    renderAppState();

    let scrolledItemId = null;

    withWindowStub("scrollToItem", (itemId) => {
      scrolledItemId = itemId;
    }, () => {
      document.querySelector('.pin[data-pid="1a"]').click();
    });

    assertEqual(scrolledItemId, "1a");
  });

  test("G4B-039 hover highlights only the active layer's pin", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    setItemPinForLayer("1a", DEFAULT_LAYER_ID, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemPinForLayer("1b", "layer-back", {
      xRatio: 0.75,
      yRatio: 0.25,
    });

    renderAppState();

    const item1a = document.querySelector('.check-item[data-id="1a"]');

    const item1b = document.querySelector('.check-item[data-id="1b"]');

    item1a.dispatchEvent(new MouseEvent("mouseenter"));

    assertEqual(
      document.querySelector('.pin[data-pid="1a"]').classList.contains("pulse"),
      true,
    );

    item1a.dispatchEvent(new MouseEvent("mouseleave"));

    item1b.dispatchEvent(new MouseEvent("mouseenter"));

    assertEqual(
      document.querySelector('.pin[data-pid="1b"]'),
      null,
    );

    switchArtworkLayer("layer-back");

    item1b.dispatchEvent(new MouseEvent("mouseenter"));

    assertEqual(
      document.querySelector('.pin[data-pid="1b"]').classList.contains("pulse"),
      true,
    );

    assertEqual(document.querySelector('.pin[data-pid="1a"]'), null);
  });

  test("G4B-040 G3 review metadata survives layer switching", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    addTestLayer(product, "layer-back", "Back Label");

    product.productName = "Rice";

    product.productionCode = "OH1";

    product.site = "BL";

    product.artworkVersion = "03";

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    renderAppState();

    switchArtworkLayer("layer-back");

    assertEqual(
      document.getElementById("ctx-product").textContent,
      "Rice",
    );

    assertEqual(
      document.getElementById("ctx-code").textContent,
      "OH1",
    );

    assertEqual(
      document.getElementById("ctx-site").textContent,
      "BL",
    );

    assertEqual(
      document.getElementById("ctx-artwork-rev").textContent,
      "03",
    );

    assertEqual(
      document.querySelector('.check-item[data-id="1a"]').dataset.status,
      "approved",
    );

    switchArtworkLayer(DEFAULT_LAYER_ID);

    assertEqual(
      document.getElementById("ctx-product").textContent,
      "Rice",
    );
  });
})();
