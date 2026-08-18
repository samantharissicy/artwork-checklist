// ============================================================
// B1 — DOMAIN FOUNDATION
// ============================================================
//
// Tests owned by this roadmap layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assert,
    assertEqual,
    assertNotEqual,
    assertDeepEqual,
    assertExists,
    assertClose,
    resetItem1A,
    getItemTitleElement,
  } = window.ArtworkTests;

  test("appState uses the current schema version", () => {
    assertExists(appState, "appState must exist.");

    assertEqual(appState.schemaVersion, CURRENT_SCHEMA_VERSION);
  });

  test("activeProductId points to an existing product", () => {
    assert(
      typeof appState.activeProductId === "string",
      "activeProductId must be a string.",
    );

    assertExists(
      appState.products[appState.activeProductId],
      "activeProductId must reference an existing product.",
    );
  });

  test("active product contains the expected domain fields", () => {
    const product = getActiveProduct();

    assertExists(product);

    [
      "id",
      "brand",
      "productName",
      "weight",
      "sku",
      "artwork",
      "items",
      "reviewer",
      "signature",
      "createdAt",
      "updatedAt",
    ].forEach((field) => {
      assert(
        Object.prototype.hasOwnProperty.call(product, field),
        `Product must contain "${field}".`,
      );
    });
  });

  test("there are exactly 49 checklist items", () => {
    const product = getActiveProduct();

    assertEqual(
      Object.keys(product.items).length,
      49,
      "Expected exactly 49 checklist items.",
    );
  });

  test("all six section definitions exist", () => {
    assertEqual(
      sectionDefinitions.length,
      6,
      "Expected exactly 6 section definitions.",
    );
  });

  test("item 1A has the expected Layer B structure", () => {
    const item = getItemById("1a");

    assertExists(item);

    [
      "id",
      "sectionId",
      "originalTitle",
      "currentTitle",
      "note",
      "status",
      "comment",
      "pin",
    ].forEach((field) => {
      assert(
        Object.prototype.hasOwnProperty.call(item, field),
        `Item 1A must contain "${field}".`,
      );
    });

    assertEqual(item.sectionId, "legal-core");
  });

  // ============================================================
  // 2. STATUS RULES
  // ============================================================

  test("every newly defined item uses a valid single status value", () => {
    const validStatuses = new Set([
      REVIEW_STATUSES.PENDING,
      REVIEW_STATUSES.APPROVED,
      REVIEW_STATUSES.REJECTED,
    ]);

    Object.values(getActiveProduct().items).forEach((item) => {
      assert(
        validStatuses.has(item.status),
        `${item.id} has invalid status "${item.status}".`,
      );

      assertEqual(
        typeof item.status,
        "string",
        `${item.id} status must be a single string value.`,
      );
    });
  });

  test("createInitialItems initializes every item as pending", () => {
    const freshItems = createInitialItems();

    assertEqual(Object.keys(freshItems).length, 49);

    const allPending = Object.values(freshItems).every(
      (item) => item.status === REVIEW_STATUSES.PENDING,
    );

    assert(
      allPending,
      "Every newly created checklist item must start as pending.",
    );
  });

  test("approved and rejected are mutually exclusive", () => {
    resetItem1A();

    assert(setItemStatus("1a", REVIEW_STATUSES.APPROVED));
    assertEqual(getItemById("1a").status, REVIEW_STATUSES.APPROVED);

    assert(setItemStatus("1a", REVIEW_STATUSES.REJECTED));
    assertEqual(getItemById("1a").status, REVIEW_STATUSES.REJECTED);

    const item = getItemById("1a");

    assert(
      !Object.prototype.hasOwnProperty.call(item, "approved"),
      "Item should not have a separate approved boolean.",
    );

    assert(
      !Object.prototype.hasOwnProperty.call(item, "rejected"),
      "Item should not have a separate rejected boolean.",
    );
  });

  test("invalid status values are rejected", () => {
    resetItem1A();

    const previousStatus = getItemById("1a").status;

    const result = setItemStatus("1a", "banana");

    assertEqual(result, false);
    assertEqual(getItemById("1a").status, previousStatus);
  });

  // ============================================================
  // 3. REJECTED + COMMENT DOMAIN RULE
  // ============================================================

  test("rejected item without comment fails domain validation", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);
    setItemComment("1a", "");

    const result = validateItemState(getItemById("1a"));

    assertEqual(result.valid, false);

    assert(
      result.errors.some((error) => error.toLowerCase().includes("comment")),
      "Validation error should mention the required comment.",
    );
  });

  test("rejected item with comment passes domain validation", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);
    setItemComment("1a", "Legal product name needs correction.");

    const result = validateItemState(getItemById("1a"));

    assertEqual(result.valid, true);
    assertEqual(result.errors.length, 0);
  });

  // ============================================================
  // 4. TITLE RULES
  // ============================================================

  test("originalTitle is immutable", () => {
    const item = getItemById("1a");

    const original = item.originalTitle;

    const descriptor = Object.getOwnPropertyDescriptor(item, "originalTitle");

    assertExists(descriptor);

    assertEqual(
      descriptor.writable,
      false,
      "originalTitle should be non-writable.",
    );

    let assignmentFailed = false;

    try {
      item.originalTitle = "THIS MUST NOT REPLACE THE ORIGINAL";
    } catch (_) {
      assignmentFailed = true;
    }

    // In strict mode assignment throws; the important requirement is that
    // the stored value remains unchanged.
    assertEqual(item.originalTitle, original);

    // Keeps the variable used so linters do not complain.
    void assignmentFailed;
  });

  test("currentTitle can be changed independently", () => {
    resetItem1A();

    const original = getItemById("1a").originalTitle;

    assert(setItemCurrentTitle("1a", "Tikka Masala Spices"));

    assertEqual(getItemById("1a").currentTitle, "Tikka Masala Spices");

    assertEqual(
      getItemById("1a").originalTitle,
      original,
      "Changing currentTitle must not change originalTitle.",
    );
  });

  // ============================================================
  // 5. APP STATE -> UI
  // ============================================================

  test("changing currentTitle in appState and rendering updates the DOM", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "Tikka Masala Spices");

    renderAppState();

    const title = getItemTitleElement("1a");

    assertExists(title);

    assertEqual(title.textContent.trim(), "Tikka Masala Spices");
  });

  // ============================================================
  // 6. PRODUCT INPUTS
  // ============================================================

  test("product input event updates appState", () => {
    const input = document.getElementById("inp-brand");

    assertExists(input);

    input.value = "Paulig Test";

    input.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    assertEqual(getActiveProduct().brand, "Paulig Test");
  });

  test("changing product state and rendering updates product input DOM", () => {
    getActiveProduct().brand = "TEST BRAND";

    renderAppState();

    const input = document.getElementById("inp-brand");

    assertExists(input);

    assertEqual(input.value, "TEST BRAND");
  });

  // ============================================================
  // 7. PIN STATE -> UI
  // ============================================================

  test("setItemPin stores pin coordinates in appState", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    assertDeepEqual(getItemById("1a").pin, {
      xRatio: 0.25,
      yRatio: 0.5,
    });
  });

  test("renderAppState renders a pin stored in appState", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    renderAppState();

    const pin = document.querySelector('.pin[data-pid="1a"]');

    assertExists(pin, "Pin 1A should be rendered from appState.");
  });

  test("pin tooltip uses currentTitle from appState", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "New Legal Product Name");

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    renderAppState();

    const tooltip = document.querySelector('.pin[data-pid="1a"] .pin-tooltip');

    assertExists(tooltip);

    assertEqual(tooltip.textContent.trim(), "New Legal Product Name");
  });

  test("clearPins clears both appState and rendered pins", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    renderAppState();

    clearPins();

    assertEqual(getItemById("1a").pin, null);

    const pin = document.querySelector('.pin[data-pid="1a"]');

    assertEqual(pin, null, "Pin element should disappear after clearPins().");
  });

  // ============================================================
  // 8. MANUAL DRAG/DROP SUPPORT
  // ============================================================

  test("pins layer can receive pointer/drag events", () => {
    const layer = document.getElementById("pins-layer");

    assertExists(layer);

    const computed = window.getComputedStyle(layer);

    assertNotEqual(
      computed.pointerEvents,
      "none",
      'The CSS for .pins-layer must not use "pointer-events: none".',
    );
  });

  test("drop event path writes normalized pin coordinates to appState", () => {
    resetItem1A();

    const layer = document.getElementById("pins-layer");

    const wrapper = document.getElementById("artwork-wrapper");

    assertExists(layer);
    assertExists(wrapper);

    const rect = wrapper.getBoundingClientRect();

    const fakeDrop = new Event("drop", {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(fakeDrop, "dataTransfer", {
      value: {
        getData(type) {
          return type === "text/plain" ? "1a" : "";
        },
      },
    });

    Object.defineProperty(fakeDrop, "clientX", {
      value: rect.left + rect.width * 0.25,
    });

    Object.defineProperty(fakeDrop, "clientY", {
      value: rect.top + rect.height * 0.6,
    });

    layer.dispatchEvent(fakeDrop);

    const pin = getItemById("1a").pin;

    assertExists(pin, "Drop handler should store a pin in appState.");

    assertClose(pin.xRatio, 0.25);

    assertClose(pin.yRatio, 0.6);

    const renderedPin = document.querySelector('.pin[data-pid="1a"]');

    assertExists(renderedPin, "Drop handler should render the pin.");
  });

  // ============================================================
  // 9. LEGACY SAVE EXPORT
  // ============================================================

  test("legacy export reads product data from appState", () => {
    const product = getActiveProduct();

    product.brand = "Unit Test Brand";
    product.productName = "Unit Test Product";
    product.weight = "250g";
    product.sku = "UT-001";

    const data = buildLegacyCheckData();

    assertEqual(data.product.brand, "Unit Test Brand");

    assertEqual(data.product.name, "Unit Test Product");

    assertEqual(data.product.weight, "250g");

    assertEqual(data.product.sku, "UT-001");
  });

  test("legacy export reads checks from appState", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    const data = buildLegacyCheckData();

    assertEqual(data.checks["1a"], true);

    setItemStatus("1a", REVIEW_STATUSES.PENDING);

    const data2 = buildLegacyCheckData();

    assertEqual(data2.checks["1a"], false);
  });

  test("legacy export converts normalized pins back to pixels", () => {
    resetItem1A();

    const dimensions = getArtworkBaseDimensions();

    assertExists(dimensions);

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const data = buildLegacyCheckData();

    assertClose(data.pins["1a"].x, dimensions.width * 0.25);

    assertClose(data.pins["1a"].y, dimensions.height * 0.75);
  });

  // ============================================================
  // 10. DUPLICATED itemTitles REMOVED
  // ============================================================

  test("legacy itemTitles object is no longer used", () => {
    assertEqual(
      typeof itemTitles,
      "undefined",
      "itemTitles should be removed; titles should come from appState.",
    );
  });
})();
