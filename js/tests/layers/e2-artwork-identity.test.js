// ============================================================
// E2 — ARTWORK IDENTITY
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
    createTestArtworkMetadata,
    resetArtworkForTest,
  } = window.ArtworkTests;

  test("E2 validates complete artwork metadata", () => {
    const metadata = createTestArtworkMetadata();

    assertEqual(isValidArtworkMetadata(metadata), true);

    assertEqual(
      isValidArtworkMetadata({
        name: "bad.png",
      }),
      false,
    );
  });

  test("E2 detects matching artwork identity", () => {
    const first = createTestArtworkMetadata("same.png");

    const second = {
      ...first,
    };

    assertEqual(isSameArtworkIdentity(first, second), true);

    second.size += 1;

    assertEqual(isSameArtworkIdentity(first, second), false);
  });

  test("E2 detects existing product pins", () => {
    resetArtworkForTest();

    assertEqual(productHasPins(), false);

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    assertEqual(productHasPins(), true);
  });

  test("E2 cancelling artwork replacement preserves artwork and pins", () => {
    resetArtworkForTest();

    const product = getActiveProduct();

    const originalArtwork = createTestArtworkMetadata("original.png");

    const replacement = createTestArtworkMetadata("replacement.png");

    product.artwork = {
      ...originalArtwork,
    };

    setItemPin("1a", {
      xRatio: 0.3,
      yRatio: 0.4,
    });

    const result = applyArtworkIdentity(replacement, () => false);

    assertEqual(result.applied, false);

    assertDeepEqual(product.artwork, originalArtwork);

    assertDeepEqual(getItemById("1a").pin, {
      xRatio: 0.3,
      yRatio: 0.4,
    });
  });

  test("E2 confirmed artwork replacement clears pins", () => {
    resetArtworkForTest();

    const product = getActiveProduct();

    product.artwork = createTestArtworkMetadata("old.png");

    setItemPin("1a", {
      xRatio: 0.2,
      yRatio: 0.8,
    });

    const replacement = createTestArtworkMetadata("new.png");

    const result = applyArtworkIdentity(replacement, () => true);

    assertEqual(result.applied, true);

    assertEqual(result.pinsCleared, 1);

    assertEqual(getItemById("1a").pin, null);

    assertDeepEqual(product.artwork, replacement);
  });

  test("E2 reselecting same artwork preserves pins without confirmation", () => {
    resetArtworkForTest();

    const product = getActiveProduct();

    const artwork = createTestArtworkMetadata("same-artwork.png");

    product.artwork = {
      ...artwork,
    };

    setItemPin("1a", {
      xRatio: 0.45,
      yRatio: 0.55,
    });

    let confirmationCalls = 0;

    const result = applyArtworkIdentity(artwork, () => {
      confirmationCalls += 1;

      return false;
    });

    assertEqual(result.applied, true);

    assertEqual(result.sameArtwork, true);

    assertEqual(confirmationCalls, 0);

    assertDeepEqual(getItemById("1a").pin, {
      xRatio: 0.45,
      yRatio: 0.55,
    });
  });

  test("E2 invalid artwork metadata makes serialized state invalid", () => {
    resetArtworkForTest();

    const parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].artwork = {
      name: "broken.png",
    };

    assertEqual(validateState(parsed), false);
  });

  test("E2 artwork metadata survives serialization roundtrip", () => {
    resetArtworkForTest();

    const metadata = createTestArtworkMetadata("serialized.png");

    const product = getActiveProduct();

    product.artwork = {
      ...metadata,
    };

    const parsed = deserializeState(serializeState());

    assertDeepEqual(parsed.products[parsed.activeProductId].artwork, metadata);
  });

  test("E2 export includes artwork metadata", () => {
    resetArtworkForTest();

    const metadata = createTestArtworkMetadata("export.png");

    getActiveProduct().artwork = {
      ...metadata,
    };

    const data = buildExportData();

    assertDeepEqual(data.artwork, metadata);
  });

  test("E2 export import roundtrip restores artwork metadata", () => {
    resetArtworkForTest();

    const metadata = createTestArtworkMetadata("roundtrip.png");

    getActiveProduct().artwork = {
      ...metadata,
    };

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertDeepEqual(getActiveProduct().artwork, metadata);
  });

  test("E2 artwork controls and missing-file state render correctly", () => {
    resetArtworkForTest();

    assertExists(document.getElementById("artwork-file-input"));

    assertExists(document.getElementById("btn-artwork"));

    assertExists(document.getElementById("artwork-image"));

    assertExists(document.getElementById("artwork-missing"));

    getActiveProduct().artwork = createTestArtworkMetadata("missing-file.png");

    renderArtworkState();

    const missing = document.getElementById("artwork-missing");

    assertEqual(missing.hidden, false);

    assertEqual(pinsLayer.hidden, true);
  });
})();
