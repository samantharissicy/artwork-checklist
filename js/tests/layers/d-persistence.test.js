// ============================================================
// D1–D4 — PERSISTENCE / SERIALIZATION / IMPORT / EXPORT
// ============================================================
//
// Tests owned by this layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assertEqual,
    assertDeepEqual,
    assertExists,
    resetItem1A,
    getEditTitleButton,
    getTitleEditInput,
  } = window.ArtworkTests;

  function getActiveLayerId() {
    return getActiveArtworkLayer(getActiveProduct()).id;
  }

  test("D1 serialize and deserialize preserve review state", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "Serialized Title");

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    setItemComment("1a", "Serialized comment");

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const serialized = serializeState();

    const parsed = deserializeState(serialized);

    assertExists(parsed);

    const item = parsed.products[parsed.activeProductId].items["1a"];

    assertEqual(item.currentTitle, "Serialized Title");

    assertEqual(item.status, REVIEW_STATUSES.APPROVED);

    assertEqual(item.comment, "Serialized comment");

    assertDeepEqual(item.pins, [
      {
        layerId: getActiveLayerId(),
        xRatio: 0.25,
        yRatio: 0.5,
      },
    ]);
  });

  test("D1 deserializeState rejects malformed JSON", () => {
    const result = deserializeState("{this-is-not-json");

    assertEqual(result, null);
  });

  test("D1 validateState rejects missing active product", () => {
    const parsed = JSON.parse(serializeState());

    parsed.activeProductId = "missing-product";

    assertEqual(validateState(parsed), false);
  });

  test("D1 rehydration restores immutable originalTitle", () => {
    const parsed = JSON.parse(serializeState());

    const hydrated = rehydrateState(parsed);

    const item = hydrated.products[hydrated.activeProductId].items["1a"];

    const descriptor = Object.getOwnPropertyDescriptor(item, "originalTitle");

    assertExists(descriptor);

    assertEqual(descriptor.writable, false);
  });

  test("D2 inline title edit is saved to localStorage", () => {
    resetItem1A();

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    input.value = "Persisted Legal Name";

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(
      stored.products[stored.activeProductId].items["1a"].currentTitle,
      "Persisted Legal Name",
    );
  });

  test("D2 pin creation and clearing are persisted", () => {
    resetItem1A();

    addPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertDeepEqual(
      stored.products[stored.activeProductId].items["1a"].pins[0],
      {
        layerId: getActiveLayerId(),
        xRatio: 0.25,
        yRatio: 0.5,
      },
    );

    clearPins();

    stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(
      stored.products[stored.activeProductId].items["1a"].pins.length,
      0,
    );
  });

  test("D2 corrupted localStorage does not crash state loading", () => {
    const previous = localStorage.getItem(STORAGE_KEY);

    try {
      localStorage.setItem(STORAGE_KEY, "{broken-json");

      const result = loadStateFromStorage();

      assertEqual(result, false);

      assertExists(getActiveProduct());
    } finally {
      if (previous === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, previous);
      }
    }
  });

  test("D3 export contains complete review data", () => {
    resetItem1A();

    const product = getActiveProduct();

    product.brand = "Export Brand";

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    setItemComment("1a", "Export comment");

    setItemCurrentTitle("1a", "Exported Legal Name");

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const data = buildExportData();

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);

    assertEqual(data.product.brand, "Export Brand");

    assertEqual(data.items["1a"].status, REVIEW_STATUSES.REJECTED);

    assertEqual(data.items["1a"].comment, "Export comment");

    assertEqual(data.items["1a"].currentTitle, "Exported Legal Name");

    assertDeepEqual(data.items["1a"].pins[0], {
      layerId: getActiveLayerId(),
      xRatio: 0.25,
      yRatio: 0.5,
    });
  });

  test("D4 incompatible schema version is rejected", () => {
    const data = buildExportData();

    data.schemaVersion = 999;

    const result = validateImportData(data);

    assertEqual(result.valid, false);
  });

  test("D4 export import roundtrip restores review", () => {
    resetItem1A();

    const product = getActiveProduct();

    product.brand = "Roundtrip Brand";

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    setItemComment("1a", "Roundtrip comment");

    setItemCurrentTitle("1a", "Roundtrip Title");

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const restored = getItemById("1a");

    assertEqual(getActiveProduct().brand, "Roundtrip Brand");

    assertEqual(restored.status, REVIEW_STATUSES.REJECTED);

    assertEqual(restored.comment, "Roundtrip comment");

    assertEqual(restored.currentTitle, "Roundtrip Title");

    assertDeepEqual(getItemPinForLayer(restored, getActiveLayerId()), {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const descriptor = Object.getOwnPropertyDescriptor(
      restored,
      "originalTitle",
    );

    assertEqual(descriptor.writable, false);
  });
})();
