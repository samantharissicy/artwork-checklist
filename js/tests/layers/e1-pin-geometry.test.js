// ============================================================
// E1 — NORMALIZED PIN GEOMETRY
// ============================================================
//
// Tests owned by this roadmap layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assertEqual,
    assertDeepEqual,
    assertExists,
    assertClose,
    resetItem1A,
  } = window.ArtworkTests;

  test("E1 normalized pin must stay between 0 and 1", () => {
    assertEqual(
      isNormalizedPin({
        xRatio: 0.5,
        yRatio: 0.25,
      }),
      true,
    );

    assertEqual(
      isNormalizedPin({
        xRatio: -0.1,
        yRatio: 0.5,
      }),
      false,
    );

    assertEqual(
      isNormalizedPin({
        xRatio: 1.1,
        yRatio: 0.5,
      }),
      false,
    );
  });

  test("E1 screen coordinates convert to relative ratios", () => {
    const rectangle = {
      left: 100,
      top: 50,
      width: 400,
      height: 800,
    };

    const pin = calculatePinRatios(200, 450, rectangle);

    assertClose(pin.xRatio, 0.25);

    assertClose(pin.yRatio, 0.5);
  });

  test("E1 pin renders using percentage coordinates", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.6,
    });

    renderAppState();

    const pin = document.querySelector('.pin[data-pid="1a"]');

    assertExists(pin);

    assertEqual(pin.style.left, "25%");

    assertEqual(pin.style.top, "60%");
  });

  test("E1 zoom does not mutate normalized pin state", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const originalPin = getItemPinForLayer(getItemById("1a"), "layer-main");

    const previousZoom = currentZoom;

    currentZoom = 0.5;
    renderPin("1a");

    assertDeepEqual(
      getItemPinForLayer(getItemById("1a"), "layer-main"),
      originalPin,
    );

    currentZoom = 1;
    renderPin("1a");

    assertDeepEqual(
      getItemPinForLayer(getItemById("1a"), "layer-main"),
      originalPin,
    );

    currentZoom = 2;
    renderPin("1a");

    assertDeepEqual(
      getItemPinForLayer(getItemById("1a"), "layer-main"),
      originalPin,
    );

    currentZoom = previousZoom;
  });

  test("E1 legacy pixel pin converts to normalized coordinates", () => {
    const pin = convertLegacyPixelPin(
      {
        x: 120,
        y: 250,
      },
      480,
      1000,
    );

    assertClose(pin.xRatio, 0.25);

    assertClose(pin.yRatio, 0.25);
  });

  test("E1 schema v1 state migrates pins to the current schema", () => {
    const dimensions = getArtworkBaseDimensions();

    assertExists(dimensions);

    const legacyState = JSON.parse(serializeState());

    legacyState.schemaVersion = 1;

    legacyState.products[legacyState.activeProductId].items["1a"].pin = {
      x: dimensions.width * 0.4,

      y: dimensions.height * 0.7,
    };

    const migrated = migrateState(legacyState);

    assertExists(migrated);

    assertEqual(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);

    const pins =
      migrated.products[migrated.activeProductId].items["1a"].pins;

    assertEqual(pins.length, 1);

    assertEqual(pins[0].layerId, "layer-main");

    assertClose(pins[0].xRatio, 0.4);

    assertClose(pins[0].yRatio, 0.7);
  });

  test("E1 normalized pin survives serialization roundtrip", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const parsed = deserializeState(serializeState());

    const pins = parsed.products[parsed.activeProductId].items["1a"].pins;

    assertDeepEqual(pins, [
      {
        layerId: "layer-main",
        xRatio: 0.25,
        yRatio: 0.75,
      },
    ]);
  });

  test("E1 export uses normalized pin geometry", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const data = buildExportData();

    assertDeepEqual(data.items["1a"].pins[0], {
      layerId: "layer-main",
      xRatio: 0.25,
      yRatio: 0.75,
    });

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);
  });
})();
