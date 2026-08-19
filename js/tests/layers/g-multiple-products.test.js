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

  test("G1 new products start with 50 pending items", () => {
    resetWorkspaceForMultiProductTest();

    createNewProduct();

    const items = Object.values(getActiveProduct().items);

    assertEqual(items.length, 50);

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

    assertDeepEqual(getItemPinForLayer(getItemById("1a"), "layer-main"), {
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

  // ============================================================
  // G2 UX POLISH — PRODUCT CONTEXT MENU
  // ============================================================

  const getContextMenu = () =>
    document.getElementById("product-context-menu");

  function openContextMenuOn(productId, clientX = 140, clientY = 90) {
    const tab = getProductTab(productId);

    assertExists(tab);

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    });

    tab.dispatchEvent(event);

    return event;
  }

  function setupThreeProductWorkspace() {
    const firstId = resetWorkspaceForMultiProductTest();

    renameProduct(firstId, "Product A");

    const secondId = createNewProduct();

    renameProduct(secondId, "Product B");

    const thirdId = createNewProduct();

    renameProduct(thirdId, "Product C");

    switchProduct(firstId);

    return { firstId, secondId, thirdId };
  }

  test("G2UX-001 right-click on product tab prevents native context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    const event = openContextMenuOn(secondId, 60, 40);

    assertEqual(event.defaultPrevented, true);
  });

  test("G2UX-002 right-click opens custom product context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    const menu = getContextMenu();

    assertExists(menu);

    assertEqual(menu.hidden, false);

    assertEqual(menu.getAttribute("role"), "menu");

    const left = parseInt(menu.style.left, 10);

    const top = parseInt(menu.style.top, 10);

    assertEqual(left >= 0, true);

    assertEqual(top >= 0, true);

    assertEqual(left + menu.offsetWidth <= window.innerWidth, true);

    assertEqual(top + menu.offsetHeight <= window.innerHeight, true);
  });

  test("G2UX-003 context menu stores right-clicked product ID", () => {
    const { secondId, thirdId } = setupThreeProductWorkspace();

    openContextMenuOn(thirdId, 300, 150);

    assertEqual(productContextMenuState.productId, thirdId);

    assertEqual(productContextMenuState.isOpen, true);

    const highlighted = document.querySelector(
      ".product-tab.context-target",
    );

    assertExists(highlighted);

    assertEqual(highlighted.dataset.productId, thirdId);

    assertEqual(
      document.querySelectorAll(".product-tab.context-target").length,
      1,
    );
  });

  test("G2UX-004 right-click does not change active product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    assertEqual(appState.activeProductId, firstId);

    assertEqual(getActiveProduct().productName, "Product A");
  });

  test("G2UX-005 opening menu for another tab changes target ID", () => {
    const { secondId, thirdId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    assertEqual(productContextMenuState.productId, secondId);

    openContextMenuOn(thirdId, 300, 150);

    assertEqual(productContextMenuState.productId, thirdId);

    const highlighted = document.querySelector(
      ".product-tab.context-target",
    );

    assertEqual(highlighted.dataset.productId, thirdId);

    assertEqual(
      document.querySelectorAll(".product-tab.context-target").length,
      1,
    );

    assertEqual(getContextMenu().hidden, false);
  });

  test("G2UX-006 outside click closes context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    document.body.click();

    assertEqual(getContextMenu().hidden, true);

    assertEqual(productContextMenuState.isOpen, false);

    assertEqual(productContextMenuState.productId, null);

    assertEqual(
      document.querySelector(".product-tab.context-target"),
      null,
    );
  });

  test("G2UX-007 Escape closes context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape" }),
    );

    assertEqual(getContextMenu().hidden, true);

    assertEqual(productContextMenuState.isOpen, false);
  });

  test("G2UX-008 window resize closes context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    window.dispatchEvent(new Event("resize"));

    assertEqual(getContextMenu().hidden, true);

    assertEqual(productContextMenuState.isOpen, false);
  });

  test("G2UX-009 scroll closes context menu", () => {
    const { secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    window.dispatchEvent(new Event("scroll"));

    assertEqual(getContextMenu().hidden, true);

    assertEqual(productContextMenuState.isOpen, false);
  });

  test("G2UX-010 rename action targets right-clicked product", async () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    let capturedTarget = null;

    const originalRenameWithDialog = window.renameProductWithDialog;

    window.renameProductWithDialog = async (productId) => {
      capturedTarget = productId;

      return true;
    };

    try {
      handleProductContextMenuAction("rename");
    } finally {
      window.renameProductWithDialog = originalRenameWithDialog;
    }

    assertEqual(capturedTarget, secondId);

    assertEqual(appState.activeProductId, firstId);

    assertEqual(getContextMenu().hidden, true);
  });

  test("G2UX-011 rename does not rename active product when another tab is targeted", async () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    const originalPrompt = window.showPromptDialog;

    window.showPromptDialog = async () => "Sauce";

    try {
      const result = await renameProductWithDialog(secondId);

      assertEqual(result, true);
    } finally {
      window.showPromptDialog = originalPrompt;
    }

    assertEqual(getProductById(secondId).productName, "Sauce");

    assertEqual(getProductById(firstId).productName, "Product A");

    assertEqual(appState.activeProductId, firstId);
  });

  test("G2UX-012 duplicate targets right-clicked product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    handleProductContextMenuAction("duplicate");

    const active = getActiveProduct();

    assertEqual(active.productName, "Product B Copy");

    assertNotEqual(active.id, secondId);

    assertExists(getProductById(secondId));

    assertEqual(active.id, appState.activeProductId);

    assertEqual(getContextMenu().hidden, true);
  });

  test("G2UX-013 duplicate does not duplicate unrelated active product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    handleProductContextMenuAction("duplicate");

    assertEqual(getProductById(firstId).productName, "Product A");

    assertExists(getProductById(firstId));

    const productCount = Object.keys(appState.products).length;

    assertEqual(productCount, 4);
  });

  test("G2UX-014 New Product creates a product", () => {
    const { secondId } = setupThreeProductWorkspace();

    const before = Object.keys(appState.products).length;

    openContextMenuOn(secondId, 140, 90);

    handleProductContextMenuAction("new");

    assertEqual(Object.keys(appState.products).length, before + 1);

    assertEqual(getContextMenu().hidden, true);
  });

  test("G2UX-015 New Product activates new product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    handleProductContextMenuAction("new");

    const newId = appState.activeProductId;

    assertNotEqual(newId, firstId);

    assertNotEqual(newId, secondId);

    assertEqual(
      document.querySelector(".product-tab.active").dataset.productId,
      newId,
    );
  });

  test("G2UX-016 delete action targets right-clicked product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    openContextMenuOn(secondId, 140, 90);

    let capturedTarget = null;

    const originalDeleteWithDialog = window.deleteProductWithDialog;

    window.deleteProductWithDialog = async (productId) => {
      capturedTarget = productId;

      return true;
    };

    try {
      handleProductContextMenuAction("delete");
    } finally {
      window.deleteProductWithDialog = originalDeleteWithDialog;
    }

    assertEqual(capturedTarget, secondId);

    assertExists(getProductById(secondId));

    assertEqual(appState.activeProductId, firstId);

    assertEqual(getContextMenu().hidden, true);
  });

  test("G2UX-017 delete does not remove unrelated active product", async () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    const originalConfirm = window.showConfirmDialog;

    window.showConfirmDialog = async () => true;

    try {
      const result = await deleteProductWithDialog(secondId);

      assertEqual(result, true);
    } finally {
      window.showConfirmDialog = originalConfirm;
    }

    assertEqual(getProductById(secondId), null);

    assertEqual(appState.activeProductId, firstId);

    assertExists(getProductById(firstId));
  });

  test("G2UX-018 delete is disabled when only one product exists", () => {
    resetWorkspaceForMultiProductTest();

    const onlyId = appState.activeProductId;

    openContextMenuOn(onlyId, 140, 90);

    const deleteItem = getContextMenu().querySelector(
      '[data-product-context-action="delete"]',
    );

    assertEqual(deleteItem.disabled, true);

    assertEqual(deleteItem.getAttribute("aria-disabled"), "true");

    deleteItem.click();

    assertEqual(Object.keys(appState.products).length, 1);

    assertEqual(appState.activeProductId, onlyId);
  });

  test("G2UX-019 left click still switches active product", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    getProductTab(secondId).click();

    assertEqual(appState.activeProductId, secondId);

    getProductTab(firstId).click();

    assertEqual(appState.activeProductId, firstId);
  });

  test("G2UX-020 product names still render via textContent", () => {
    const { firstId } = setupThreeProductWorkspace();

    renameProduct(firstId, "Sauce <b>Hot</b>");

    const tab = getProductTab(firstId);

    assertEqual(tab.textContent.trim(), "Sauce <b>Hot</b>");

    assertEqual(tab.querySelector("b"), null);

    assertEqual(tab.childElementCount, 0);
  });

  test("G2UX-021 long product names keep title tooltip", () => {
    const { firstId } = setupThreeProductWorkspace();

    const longName =
      "An extremely long product name that is meant to overflow the tab";

    renameProduct(firstId, longName);

    const tab = getProductTab(firstId);

    assertEqual(tab.title, longName);

    assertEqual(tab.textContent.trim(), longName);
  });

  test("G2UX-022 rename button outside context menu still works", async () => {
    const { firstId } = setupThreeProductWorkspace();

    const originalPrompt = window.showPromptDialog;

    window.showPromptDialog = async () => "Renamed Via Button";

    try {
      await renameActiveProduct();
    } finally {
      window.showPromptDialog = originalPrompt;
    }

    assertEqual(getActiveProduct().productName, "Renamed Via Button");

    assertEqual(appState.activeProductId, firstId);
  });

  test("G2UX-023 duplicate button outside context menu still works", () => {
    const { firstId } = setupThreeProductWorkspace();

    duplicateActiveProduct();

    assertEqual(getActiveProduct().productName, "Product A Copy");

    assertNotEqual(appState.activeProductId, firstId);

    assertEqual(getProductById(firstId).productName, "Product A");
  });

  test("G2UX-024 delete button outside context menu still works", async () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    const originalConfirm = window.showConfirmDialog;

    window.showConfirmDialog = async () => true;

    try {
      await deleteActiveProduct();
    } finally {
      window.showConfirmDialog = originalConfirm;
    }

    assertEqual(getProductById(firstId), null);

    assertEqual(appState.activeProductId, secondId);
  });

  test("G2UX-025 New Product button outside context menu still works", () => {
    const { firstId, secondId } = setupThreeProductWorkspace();

    const button = document.getElementById("btn-new-product");

    assertExists(button);

    button.click();

    assertEqual(Object.keys(appState.products).length, 4);

    assertNotEqual(appState.activeProductId, firstId);

    assertNotEqual(appState.activeProductId, secondId);
  });

  test("G2UX-026 menu opened near right edge remains inside viewport", () => {
    const viewportWidth = 800;

    const viewportHeight = 600;

    const menuWidth = 200;

    const menuHeight = 160;

    const margin = 8;

    const nearEdge = calculateContextMenuPosition({
      clientX: 760,
      clientY: 100,
      menuWidth,
      menuHeight,
      viewportWidth,
      viewportHeight,
      margin,
    });

    assertEqual(nearEdge.left, 560);

    assertEqual(nearEdge.top, 100);

    assertEqual(
      nearEdge.left + menuWidth <= viewportWidth - margin,
      true,
    );

    const extreme = calculateContextMenuPosition({
      clientX: 810,
      clientY: 100,
      menuWidth,
      menuHeight,
      viewportWidth,
      viewportHeight,
      margin,
    });

    assertEqual(extreme.left + menuWidth <= viewportWidth - margin, true);

    assertEqual(extreme.left >= margin, true);
  });

  test("G2UX-027 menu opened near bottom edge remains inside viewport", () => {
    const viewportWidth = 800;

    const viewportHeight = 600;

    const menuWidth = 200;

    const menuHeight = 160;

    const margin = 8;

    const nearBottom = calculateContextMenuPosition({
      clientX: 100,
      clientY: 560,
      menuWidth,
      menuHeight,
      viewportWidth,
      viewportHeight,
      margin,
    });

    assertEqual(nearBottom.left, 100);

    assertEqual(nearBottom.top, 400);

    assertEqual(
      nearBottom.top + menuHeight <= viewportHeight - margin,
      true,
    );

    const corner = calculateContextMenuPosition({
      clientX: 790,
      clientY: 595,
      menuWidth,
      menuHeight,
      viewportWidth,
      viewportHeight,
      margin,
    });

    assertEqual(
      corner.left + menuWidth <= viewportWidth - margin,
      true,
    );

    assertEqual(
      corner.top + menuHeight <= viewportHeight - margin,
      true,
    );

    assertEqual(corner.left >= margin, true);

    assertEqual(corner.top >= margin, true);
  });

  test("G2UX-028 menu opened in normal position remains near requested coordinates", () => {
    const position = calculateContextMenuPosition({
      clientX: 120,
      clientY: 90,
      menuWidth: 200,
      menuHeight: 160,
      viewportWidth: 800,
      viewportHeight: 600,
      margin: 8,
    });

    assertEqual(position.left, 120);

    assertEqual(position.top, 90);
  });
})();
