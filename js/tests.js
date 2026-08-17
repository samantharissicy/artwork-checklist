// Artwork & Pack Copy Checklist — Layer B + C1 + C2 Test Suite
// ============================================================
//
// Usage:
// 1. Open the app, press F12 -> Console
// 2. Run:
//      runArtworkTests()
//
// ============================================================

(function () {
  "use strict";

  const RESULTS = [];

  // ------------------------------------------------------------
  // Tiny assertion helpers
  // ------------------------------------------------------------

  function assert(condition, message = "Assertion failed") {
    if (!condition) {
      throw new Error(message);
    }
  }

  function assertEqual(actual, expected, message = "") {
    if (actual !== expected) {
      throw new Error(
        message ||
          `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
      );
    }
  }

  function assertNotEqual(actual, expected, message = "") {
    if (actual === expected) {
      throw new Error(
        message || `Expected value to differ from ${JSON.stringify(expected)}`,
      );
    }
  }

  function assertDeepEqual(actual, expected, message = "") {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);

    if (actualJson !== expectedJson) {
      throw new Error(
        message || `Expected ${expectedJson}, received ${actualJson}`,
      );
    }
  }

  function assertExists(value, message = "Expected value to exist") {
    if (value === null || value === undefined) {
      throw new Error(message);
    }
  }

  // ------------------------------------------------------------
  // Test registration
  // ------------------------------------------------------------

  const TESTS = [];

  function test(name, fn) {
    TESTS.push({ name, fn });
  }

  // ------------------------------------------------------------
  // Snapshot / restore
  // ------------------------------------------------------------

  function clonePin(pin) {
    return pin ? { ...pin } : null;
  }

  function createSnapshot() {
    const product = getActiveProduct();

    if (!product) {
      throw new Error("No active product found. Cannot create test snapshot.");
    }

    const items = {};

    Object.values(product.items).forEach((item) => {
      items[item.id] = {
        currentTitle: item.currentTitle,
        status: item.status,
        comment: item.comment,
        pin: clonePin(item.pin),
      };
    });

    return {
      brand: product.brand,
      productName: product.productName,
      weight: product.weight,
      sku: product.sku,
      updatedAt: product.updatedAt,

      openCommentItemIds: [...openCommentItemIds],

      items,
    };
  }

  function restoreSnapshot(snapshot) {
    const product = getActiveProduct();

    if (!product) return;

    product.brand = snapshot.brand;
    product.productName = snapshot.productName;
    product.weight = snapshot.weight;
    product.sku = snapshot.sku;
    product.updatedAt = snapshot.updatedAt;

    Object.entries(snapshot.items).forEach(([itemId, saved]) => {
      const item = getItemById(itemId);

      if (!item) return;

      item.currentTitle = saved.currentTitle;
      item.status = saved.status;
      item.comment = saved.comment;
      item.pin = clonePin(saved.pin);
    });

    openCommentItemIds.clear();

    snapshot.openCommentItemIds.forEach((itemId) => {
      openCommentItemIds.add(itemId);
    });

    renderAppState();
  }

  // ------------------------------------------------------------
  // Convenience helpers
  // ------------------------------------------------------------

  function resetItem1A() {
    const item = getItemById("1a");

    assertExists(item, "Item 1A must exist.");

    item.currentTitle = item.originalTitle;
    item.status = REVIEW_STATUSES.PENDING;
    item.comment = "";
    item.pin = null;

    openCommentItemIds.delete("1a");
    renderAppState();
  }

  function getItemElement(itemId) {
    return document.querySelector(`.check-item[data-id="${itemId}"]`);
  }

  function getReviewButton(itemId, action) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(`[data-action="${action}"]`);
  }

  function getStatusLabel(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector('[data-role="status-label"]');
  }

  function getCommentButton(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector('[data-action="comment"]');
  }

  function getCommentPanel(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector('[data-role="comment-panel"]');
  }

  function getCommentTextarea(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector('[data-role="comment-input"]');
  }

  function getCommentError(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector('[data-role="comment-error"]');
  }

  // ============================================================
  // C1 — TRI-STATE REVIEW WORKFLOW
  // ============================================================

  test("all items start as pending", () => {
    const freshItems = createInitialItems();

    const allPending = Object.values(freshItems).every(
      (item) => item.status === REVIEW_STATUSES.PENDING,
    );

    assert(allPending);
  });

  test("every rendered item has Approve and Reject controls", () => {
    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 49);

    items.forEach((item) => {
      assertExists(item.querySelector('[data-action="approve"]'));

      assertExists(item.querySelector('[data-action="reject"]'));
    });
  });

  test("Pending -> Approved through Approve button", () => {
    resetItem1A();

    const approveButton = getReviewButton("1a", "approve");

    assertExists(approveButton);

    approveButton.click();

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.APPROVED);
  });

  test("Approved -> Rejected through Reject button", () => {
    resetItem1A();

    getReviewButton("1a", "approve").click();

    getReviewButton("1a", "reject").click();

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.REJECTED);
  });

  test("Rejected -> Approved through Approve button", () => {
    resetItem1A();

    getReviewButton("1a", "reject").click();

    getReviewButton("1a", "approve").click();

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.APPROVED);
  });

  test("Approved -> Pending by clicking Approve again", () => {
    resetItem1A();

    const approveButton = getReviewButton("1a", "approve");

    approveButton.click();

    approveButton.click();

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.PENDING);
  });

  test("Rejected -> Pending by clicking Reject again", () => {
    resetItem1A();

    const rejectButton = getReviewButton("1a", "reject");

    rejectButton.click();

    rejectButton.click();

    assertEqual(getItemById("1a").status, REVIEW_STATUSES.PENDING);
  });

  test("Approved state is reflected in the UI", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    renderItemState("1a");

    const item = getItemElement("1a");

    const approveButton = getReviewButton("1a", "approve");

    const label = getStatusLabel("1a");

    assertEqual(item.dataset.status, REVIEW_STATUSES.APPROVED);

    assert(approveButton.classList.contains("active"));

    assertEqual(approveButton.getAttribute("aria-pressed"), "true");

    assertEqual(label.textContent.trim(), "Approved");
  });

  test("Rejected state is reflected in the UI", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    renderItemState("1a");

    const item = getItemElement("1a");

    const rejectButton = getReviewButton("1a", "reject");

    const label = getStatusLabel("1a");

    assertEqual(item.dataset.status, REVIEW_STATUSES.REJECTED);

    assert(rejectButton.classList.contains("active"));

    assertEqual(rejectButton.getAttribute("aria-pressed"), "true");

    assertEqual(label.textContent.trim(), "Rejected");
  });

  test("progress counts both approved and rejected as reviewed", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    product.items["1a"].status = REVIEW_STATUSES.APPROVED;

    product.items["1b"].status = REVIEW_STATUSES.APPROVED;

    product.items["1c"].status = REVIEW_STATUSES.REJECTED;

    updateProgress();

    const progressText = document.getElementById("progress-text");

    assertEqual(progressText.textContent.trim(), "3 / 49 reviewed");
  });

  function getItemTitleElement(itemId) {
    const element = getItemElement(itemId);

    if (!element) return null;

    return element.querySelector(".check-item-title");
  }

  // ============================================================
  // C2 — REVIEW COMMENTS
  // ============================================================

  test("every rendered item has a comment control", () => {
    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 49);

    items.forEach((item) => {
      assertExists(item.querySelector('[data-action="comment"]'));

      assertExists(item.querySelector('[data-role="comment-input"]'));
    });
  });

  test("comment button opens the textarea", () => {
    resetItem1A();

    const button = getCommentButton("1a");

    const panel = getCommentPanel("1a");

    assertExists(button);
    assertExists(panel);

    assertEqual(panel.hidden, true);

    button.click();

    assertEqual(panel.hidden, false);
  });

  test("comment button collapses the textarea when clicked again", () => {
    resetItem1A();

    const button = getCommentButton("1a");

    const panel = getCommentPanel("1a");

    button.click();

    assertEqual(panel.hidden, false);

    button.click();

    assertEqual(panel.hidden, true);
  });

  test("typing a comment updates appState", () => {
    resetItem1A();

    getCommentButton("1a").click();

    const textarea = getCommentTextarea("1a");

    textarea.value = "Incorrect legal product name.";

    textarea.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    assertEqual(getItemById("1a").comment, "Incorrect legal product name.");
  });

  test("comment persists after collapsing and reopening", () => {
    resetItem1A();

    const button = getCommentButton("1a");

    const textarea = getCommentTextarea("1a");

    button.click();

    textarea.value = "Review comment test.";

    textarea.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    button.click();

    assertEqual(getCommentPanel("1a").hidden, true);

    button.click();

    assertEqual(getCommentTextarea("1a").value, "Review comment test.");

    assertEqual(getItemById("1a").comment, "Review comment test.");
  });

  test("rejecting an item automatically opens its comment editor", () => {
    resetItem1A();

    getReviewButton("1a", "reject").click();

    assertEqual(getCommentPanel("1a").hidden, false);
  });

  test("rejected item without comment is invalid in state and UI", () => {
    resetItem1A();

    getReviewButton("1a", "reject").click();

    const item = getItemById("1a");

    const element = getItemElement("1a");

    const error = getCommentError("1a");

    const validation = validateItemState(item);

    assertEqual(validation.valid, false);

    assertEqual(element.dataset.valid, "false");

    assertEqual(error.hidden, false);

    assert(error.textContent.includes("Comment required"));
  });

  test("rejected item becomes valid after entering a comment", () => {
    resetItem1A();

    getReviewButton("1a", "reject").click();

    const textarea = getCommentTextarea("1a");

    textarea.value = "Net quantity does not match the approved specification.";

    textarea.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    const validation = validateItemState(getItemById("1a"));

    assertEqual(validation.valid, true);

    assertEqual(getItemElement("1a").dataset.valid, "true");

    assertEqual(getCommentError("1a").hidden, true);
  });

  test("approved item does not require a comment", () => {
    resetItem1A();

    getReviewButton("1a", "approve").click();

    const item = getItemById("1a");

    assertEqual(item.comment, "");

    const validation = validateItemState(item);

    assertEqual(validation.valid, true);
  });

  test("comment remains after changing other item properties", () => {
    resetItem1A();

    setItemComment("1a", "Keep this review note.");

    setItemCurrentTitle("1a", "Updated Product Name");

    setItemStatus("1a", REVIEW_STATUSES.APPROVED);

    setItemPin("1a", {
      x: 100,
      y: 100,
    });

    renderAppState();

    assertEqual(getItemById("1a").comment, "Keep this review note.");
  });

  // ============================================================
  // 1. APP STATE / DOMAIN SHAPE
  // ============================================================

  test("appState exists and uses schemaVersion 1", () => {
    assertExists(appState, "appState must exist.");
    assertEqual(appState.schemaVersion, 1);
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
      x: 100,
      y: 100,
    });

    assertDeepEqual(getItemById("1a").pin, {
      x: 100,
      y: 100,
    });
  });

  test("renderAppState renders a pin stored in appState", () => {
    resetItem1A();

    setItemPin("1a", {
      x: 100,
      y: 100,
    });

    renderAppState();

    const pin = document.querySelector('.pin[data-pid="1a"]');

    assertExists(pin, "Pin 1A should be rendered from appState.");
  });

  test("pin tooltip uses currentTitle from appState", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "New Legal Product Name");

    setItemPin("1a", {
      x: 100,
      y: 100,
    });

    renderAppState();

    const tooltip = document.querySelector('.pin[data-pid="1a"] .pin-tooltip');

    assertExists(tooltip);

    assertEqual(tooltip.textContent.trim(), "New Legal Product Name");
  });

  test("clearPins clears both appState and rendered pins", () => {
    resetItem1A();

    setItemPin("1a", {
      x: 100,
      y: 100,
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

  test("drop event path writes pin coordinates to appState", () => {
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
      value: rect.left + 100,
    });

    Object.defineProperty(fakeDrop, "clientY", {
      value: rect.top + 100,
    });

    layer.dispatchEvent(fakeDrop);

    assertExists(
      getItemById("1a").pin,
      "Drop handler should store a pin in appState.",
    );

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

  test("legacy export reads pins from appState", () => {
    resetItem1A();

    setItemPin("1a", {
      x: 111,
      y: 222,
    });

    const data = buildLegacyCheckData();

    assertDeepEqual(data.pins["1a"], {
      x: 111,
      y: 222,
    });
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

  // ============================================================
  // 11. BASELINE DOM REGRESSION SMOKE TESTS
  // ============================================================

  test("49 checklist elements are rendered", () => {
    assertEqual(document.querySelectorAll(".check-item").length, 49);
  });

  test("6 section buttons are rendered", () => {
    assertEqual(document.querySelectorAll(".section-btn").length, 6);
  });

  test("zoom controls still operate the artwork wrapper", () => {
    const wrapper = document.getElementById("artwork-wrapper");

    assertExists(wrapper);

    const previousZoom = currentZoom;

    zoom(0.1);

    assertNotEqual(
      currentZoom,
      previousZoom,
      "zoom() should change currentZoom.",
    );

    assert(
      wrapper.style.transform.includes("scale("),
      "zoom() should update artwork wrapper transform.",
    );

    // Restore the original zoom level.
    currentZoom = previousZoom;

    wrapper.style.transform = `scale(${currentZoom})`;

    const zoomLevel = document.getElementById("zoom-level");

    if (zoomLevel) {
      zoomLevel.textContent = Math.round(currentZoom * 100) + "%";
    }
  });

  // ============================================================
  // RUNNER
  // ============================================================

  window.runArtworkTests = async function runArtworkTests() {
    RESULTS.length = 0;

    console.group(
      "%cArtwork Checklist — Layer B + C1 + C2 Test Suite",
      "font-size: 14px; font-weight: bold;",
    );

    let snapshot;

    try {
      snapshot = createSnapshot();
    } catch (error) {
      console.error("Unable to start test suite:", error);

      console.groupEnd();

      return;
    }

    for (const { name, fn } of TESTS) {
      try {
        const result = fn();

        if (result && typeof result.then === "function") {
          await result;
        }

        RESULTS.push({
          name,
          passed: true,
          error: null,
        });

        console.log(
          `%cPASS%c ${name}`,
          "color: #059669; font-weight: bold;",
          "",
        );
      } catch (error) {
        RESULTS.push({
          name,
          passed: false,
          error,
        });

        console.error(`FAIL ${name}`, error);
      }
    }

    // Restore user state even when individual tests fail.
    try {
      restoreSnapshot(snapshot);
    } catch (error) {
      console.error("Failed to restore the original application state:", error);
    }

    const passed = RESULTS.filter((result) => result.passed).length;

    const failed = RESULTS.length - passed;

    console.log("");
    console.log(
      `%c${passed}/${RESULTS.length} tests passed`,
      `font-weight: bold; color: ${failed === 0 ? "#059669" : "#dc2626"};`,
    );

    if (failed > 0) {
      console.log("");
      console.log("Failed tests:");

      RESULTS.filter((result) => !result.passed).forEach((result) => {
        console.log(`- ${result.name}: ${result.error.message}`);
      });
    }

    console.groupEnd();

    return {
      total: RESULTS.length,
      passed,
      failed,
      results: [...RESULTS],
    };
  };

  window.getArtworkTestResults = function getArtworkTestResults() {
    return [...RESULTS];
  };

  console.info(
    "Artwork Layer B + C1 + C2 tests loaded. Run: runArtworkTests()",
  );
})();
