// ============================================================
// G1–G2 — MULTIPLE PRODUCTS
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
    assertNotEqual,
    assertDeepEqual,
    assertExists,
    resetWorkspaceForMultiProductTest,
    getProductTab,
  } = window.ArtworkTests;

  test("G1 generated product IDs are unique", () => {
    resetWorkspaceForMultiProductTest();

    const first = generateProductId();

    const second = generateProductId();

    assertNotEqual(first, second);

    assertEqual(Boolean(first), true);
  });

  test("G1 New Product adds and activates a product", () => {
    resetWorkspaceForMultiProductTest();

    const before = Object.keys(appState.products).length;

    const newId = createNewProduct();

    assertEqual(Object.keys(appState.products).length, before + 1);

    assertEqual(appState.activeProductId, newId);
  });

  test("G1 new products start with 49 pending items", () => {
    resetWorkspaceForMultiProductTest();

    createNewProduct();

    const items = Object.values(getActiveProduct().items);

    assertEqual(items.length, 49);

    assertEqual(
      items.every((item) => item.status === REVIEW_STATUSES.PENDING),
      true,
    );
  });

  test("G1 switching products preserves independent review state", () => {
    const firstId = resetWorkspaceForMultiProductTest();

    const first = getActiveProduct();

    first.productName = "First Product";

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    const secondId = createNewProduct();

    const second = getActiveProduct();

    second.productName = "Second Product";

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    setItemComment("1a", "Second product issue.");

    switchProduct(firstId);

    assertEqual(getActiveProduct().productName, "First Product");

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.APPROVED);

    switchProduct(secondId);

    assertEqual(getActiveProduct().productName, "Second Product");

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.REJECTED);
  });

  test("G1 switching product persists activeProductId", () => {
    resetWorkspaceForMultiProductTest();

    const secondId = createNewProduct();

    switchProduct(secondId);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(stored.activeProductId, secondId);
  });

  test("G1 rename updates product name", () => {
    const productId = resetWorkspaceForMultiProductTest();

    const result = renameProduct(productId, "Renamed Product");

    assertEqual(result, true);

    assertEqual(getActiveProduct().productName, "Renamed Product");
  });

  test("G1 duplicate creates a new ID and copies review state", () => {
    const sourceId = resetWorkspaceForMultiProductTest();

    getActiveProduct().productName = "Original";

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    setItemComment("1a", "Duplicate this review.");

    setItemPin("1a", {
      xRatio: 0.3,
      yRatio: 0.7,
    });

    const duplicateId = duplicateProduct(sourceId);

    assertNotEqual(duplicateId, sourceId);

    assertEqual(getActiveProduct().productName, "Original Copy");

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.REJECTED);

    assertEqual(getItemById("1a").comment, "Duplicate this review.");

    assertDeepEqual(getItemById("1a").pin, {
      xRatio: 0.3,
      yRatio: 0.7,
    });
  });

  test("G1 duplicated items preserve immutable originalTitle", () => {
    const sourceId = resetWorkspaceForMultiProductTest();

    duplicateProduct(sourceId);

    const descriptor = Object.getOwnPropertyDescriptor(
      getItemById("1a"),
      "originalTitle",
    );

    assertEqual(descriptor.writable, false);
  });

  test("G1 cancelling product deletion preserves the product", () => {
    resetWorkspaceForMultiProductTest();

    const secondId = createNewProduct();

    const result = deleteProduct(secondId, () => false);

    assertEqual(result, false);

    assertExists(getProductById(secondId));
  });

  test("G1 confirmed deletion removes product and selects another", () => {
    const firstId = resetWorkspaceForMultiProductTest();

    const secondId = createNewProduct();

    const result = deleteProduct(secondId, () => true);

    assertEqual(result, true);

    assertEqual(getProductById(secondId), null);

    assertEqual(appState.activeProductId, firstId);
  });

  test("G1 last product cannot be deleted", () => {
    const onlyId = resetWorkspaceForMultiProductTest();

    const result = deleteProduct(onlyId, () => true);

    assertEqual(result, false);

    assertExists(getProductById(onlyId));
  });

  test("G1 multiple products survive serialization roundtrip", () => {
    const firstId = resetWorkspaceForMultiProductTest();

    getActiveProduct().productName = "First";

    const secondId = createNewProduct();

    getActiveProduct().productName = "Second";

    const parsed = deserializeState(serializeState());

    assertEqual(validateState(parsed), true);

    const hydrated = rehydrateState(parsed);

    assertExists(hydrated.products[firstId]);

    assertExists(hydrated.products[secondId]);

    assertEqual(hydrated.activeProductId, secondId);
  });

  test("G1 Open Check import preserves existing products", () => {
    const existingId = resetWorkspaceForMultiProductTest();

    getActiveProduct().productName = "Existing";

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.product.id = "imported-product";

    exported.product.productName = "Imported";

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertExists(getProductById(existingId));

    assertExists(getProductById("imported-product"));

    assertEqual(appState.activeProductId, "imported-product");
  });

  test("G1 imported product ID collision creates a new ID", () => {
    const existingId = resetWorkspaceForMultiProductTest();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.product.id = existingId;

    const beforeCount = Object.keys(appState.products).length;

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    assertEqual(Object.keys(appState.products).length, beforeCount + 1);

    assertNotEqual(appState.activeProductId, existingId);
  });

  test("G2 renders one tab per product and marks active tab", () => {
    resetWorkspaceForMultiProductTest();

    createNewProduct();

    createNewProduct();

    renderProductTabs();

    assertEqual(
      document.querySelectorAll(".product-tab").length,
      Object.keys(appState.products).length,
    );

    const activeTab = document.querySelector(".product-tab.active");

    assertExists(activeTab);

    assertEqual(activeTab.dataset.productId, appState.activeProductId);
  });

  test("G2 tab label follows Product Name and tab click switches product", () => {
    const firstId = resetWorkspaceForMultiProductTest();

    renameProduct(firstId, "Alpha");

    const secondId = createNewProduct();

    renameProduct(secondId, "Beta");

    renderProductTabs();

    const firstTab = getProductTab(firstId);

    assertExists(firstTab);

    assertEqual(firstTab.textContent.trim(), "Alpha");

    firstTab.click();

    assertEqual(appState.activeProductId, firstId);
  });

  test("G3 new products start with empty review context metadata", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    assertEqual(product.productionCode, "");

    assertEqual(product.site, "");

    assertEqual(product.artworkVersion, "");
  });

  test("G3 production code is never derived from SKU", () => {
    resetWorkspaceForMultiProductTest();

    getActiveProduct().sku = "SKU-001";

    assertEqual(getActiveProduct().productionCode, "");

    assertNotEqual(getActiveProduct().productionCode, "SKU-001");
  });

  test("G3 allowed sites pass state validation", () => {
    resetWorkspaceForMultiProductTest();

    getActiveProduct().site = "OH1";

    const parsed = deserializeState(serializeState());

    assertEqual(validateState(parsed), true);

    assertEqual(ALLOWED_SITES.includes("OH2"), true);

    assertEqual(ALLOWED_SITES.includes("BL"), true);
  });

  test("G3 disallowed site fails state validation", () => {
    resetWorkspaceForMultiProductTest();

    const parsed = deserializeState(serializeState());

    parsed.products[parsed.activeProductId].site = "XX";

    assertEqual(validateState(parsed), false);

    parsed.products[parsed.activeProductId].site = "OH2";

    assertEqual(validateState(parsed), true);
  });

  test("G3 export includes review context metadata", () => {
    resetWorkspaceForMultiProductTest();

    getActiveProduct().productionCode = "PRD-00458";

    getActiveProduct().site = "OH1";

    getActiveProduct().artworkVersion = "03";

    const exported = buildExportData();

    assertEqual(exported.product.productionCode, "PRD-00458");

    assertEqual(exported.product.site, "OH1");

    assertEqual(exported.product.artworkVersion, "03");
  });

  test("G3 import restores review context metadata", () => {
    resetWorkspaceForMultiProductTest();

    getActiveProduct().productionCode = "PRD-00458";

    getActiveProduct().site = "BL";

    getActiveProduct().artworkVersion = "05";

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    exported.product.id = "context-import";

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const imported = getProductById("context-import");

    assertEqual(imported.productionCode, "PRD-00458");

    assertEqual(imported.site, "BL");

    assertEqual(imported.artworkVersion, "05");
  });

  test("G3 legacy import without context metadata keeps defaults", () => {
    resetWorkspaceForMultiProductTest();

    const exported = JSON.parse(JSON.stringify(buildExportData()));

    delete exported.product.productionCode;

    delete exported.product.site;

    delete exported.product.artworkVersion;

    exported.product.id = "legacy-import";

    const result = applyImportedReview(exported);

    assertEqual(result.valid, true);

    const imported = getProductById("legacy-import");

    assertEqual(imported.productionCode, "");

    assertEqual(imported.site, "");

    assertEqual(imported.artworkVersion, "");
  });

  test("G3 header context reflects the active product", () => {
    resetWorkspaceForMultiProductTest();

    const product = getActiveProduct();

    product.productName = "Basmati";

    product.productionCode = "PRD-001";

    product.site = "OH2";

    product.artworkVersion = "01";

    renderWorkspaceState();

    assertEqual(
      document.getElementById("ctx-product").textContent,
      "Basmati",
    );

    assertEqual(
      document.getElementById("ctx-code").textContent,
      "PRD-001",
    );

    assertEqual(
      document.getElementById("ctx-site").textContent,
      "OH2",
    );

    assertEqual(
      document.getElementById("ctx-artwork-rev").textContent,
      "01",
    );
  });

  test("G3 switching products updates header context immediately", () => {
    const firstId = resetWorkspaceForMultiProductTest();

    getActiveProduct().productName = "Alpha";

    const secondId = createNewProduct();

    getActiveProduct().productName = "Beta";

    getActiveProduct().productionCode = "PRD-002";

    getActiveProduct().site = "BL";

    getActiveProduct().artworkVersion = "04";

    renderWorkspaceState();

    assertEqual(
      document.getElementById("ctx-product").textContent,
      "Beta",
    );

    assertEqual(
      document.getElementById("ctx-code").textContent,
      "PRD-002",
    );

    assertEqual(document.getElementById("ctx-site").textContent, "BL");

    assertEqual(
      document.getElementById("ctx-artwork-rev").textContent,
      "04",
    );

    switchProduct(firstId);

    assertEqual(
      document.getElementById("ctx-product").textContent,
      "Alpha",
    );

    assertEqual(
      document.getElementById("ctx-code").textContent,
      "—",
    );

    assertEqual(
      document.getElementById("ctx-site").textContent,
      "—",
    );

    assertEqual(
      document.getElementById("ctx-artwork-rev").textContent,
      "—",
    );

    assertEqual(appState.activeProductId, firstId);
  });
})();
