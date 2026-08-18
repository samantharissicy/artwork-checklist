// Artwork & Pack Copy Checklist
// Layer B + C1 + C2 + C3 + D1 + D2 + D3 + D4 + E1 + E2 Test Suite
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
    return {
      serializedState: serializeState(),

      storageValue: localStorage.getItem(STORAGE_KEY),

      openCommentItemIds: [...openCommentItemIds],

      editingTitleItemId,

      currentZoom,
    };
  }

  function restoreSnapshot(snapshot) {
    const parsedState = deserializeState(snapshot.serializedState);

    if (!parsedState || !validateState(parsedState)) {
      throw new Error("Unable to restore test snapshot.");
    }

    const hydratedState = rehydrateState(parsedState);

    appState.schemaVersion = hydratedState.schemaVersion;

    appState.activeProductId = hydratedState.activeProductId;

    appState.products = hydratedState.products;

    openCommentItemIds.clear();

    snapshot.openCommentItemIds.forEach((itemId) => {
      openCommentItemIds.add(itemId);
    });

    editingTitleItemId = snapshot.editingTitleItemId;

    currentZoom = snapshot.currentZoom;

    if (snapshot.storageValue === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, snapshot.storageValue);
    }

    const wrapper = document.getElementById("artwork-wrapper");

    if (wrapper) {
      wrapper.style.transform = `scale(${currentZoom})`;
    }

    const zoomLevel = document.getElementById("zoom-level");

    if (zoomLevel) {
      zoomLevel.textContent = Math.round(currentZoom * 100) + "%";
    }

    renderChecklist();

    renderAppState();
  }

  function createTestArtworkMetadata(name = "test-artwork.png") {
    return {
      name,
      type: "image/png",
      size: 204800,
      width: 1200,
      height: 1600,
    };
  }

  function resetArtworkForTest() {
    const product = getActiveProduct();

    assertExists(product);

    product.artwork = null;

    clearProductPins(product);

    touchActiveProduct();

    renderArtworkState();

    renderPins();
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

    if (editingTitleItemId === "1a") {
      editingTitleItemId = null;
    }

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
      xRatio: 0.25,
      yRatio: 0.75,
    });

    renderAppState();

    assertEqual(getItemById("1a").comment, "Keep this review note.");
  });

  // ============================================================
  // C3 — Product Title Editing
  // ============================================================

  function getEditTitleButton(itemId) {
    return (
      getItemElement(itemId)?.querySelector('[data-action="edit-title"]') ||
      null
    );
  }

  function getTitleEditInput(itemId) {
    return (
      getItemElement(itemId)?.querySelector('[data-role="title-edit-input"]') ||
      null
    );
  }

  function getEditedBadge(itemId) {
    return (
      getItemElement(itemId)?.querySelector('[data-role="edited-badge"]') ||
      null
    );
  }

  function getRestoreTitleButton(itemId) {
    return (
      getItemElement(itemId)?.querySelector('[data-action="restore-title"]') ||
      null
    );
  }

  function getOriginalTitleElement(itemId) {
    return (
      getItemElement(itemId)?.querySelector('[data-role="original-title"]') ||
      null
    );
  }

  // ============================================================
  // C3 — INLINE COPY CORRECTIONS
  // ============================================================

  test("every rendered item has an Edit control", () => {
    document.querySelectorAll(".check-item").forEach((item) => {
      assertExists(item.querySelector('[data-action="edit-title"]'));
    });
  });

  test("clicking Edit opens a prefilled title input", () => {
    resetItem1A();

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    assertEqual(input.hidden, false);

    assertEqual(input.value, getItemById("1a").currentTitle);
  });

  test("Enter commits an inline title edit", () => {
    resetItem1A();

    const original = getItemById("1a").originalTitle;

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    input.value = "Tikka Masala Spices";

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    assertEqual(getItemById("1a").currentTitle, "Tikka Masala Spices");

    assertEqual(getItemById("1a").originalTitle, original);
  });

  test("Escape cancels an inline title edit", () => {
    resetItem1A();

    const previousTitle = getItemById("1a").currentTitle;

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    input.value = "This must be cancelled";

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    assertEqual(getItemById("1a").currentTitle, previousTitle);
  });

  test("blur commits a valid inline edit", () => {
    resetItem1A();

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    assertExists(input);

    input.value = "Updated Legal Name";

    input.dispatchEvent(
      new FocusEvent("blur", {
        bubbles: false,
      }),
    );

    assertEqual(getItemById("1a").currentTitle, "Updated Legal Name");
  });

  test("edited item displays Edited and original title", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "Suggested Product Name");

    renderItemState("1a");

    assertEqual(getEditedBadge("1a").hidden, false);

    assertEqual(
      getOriginalTitleElement("1a").textContent.trim(),
      getItemById("1a").originalTitle,
    );
  });

  test("Restore original restores currentTitle", () => {
    resetItem1A();

    setItemCurrentTitle("1a", "Changed Product Name");

    renderItemState("1a");

    getRestoreTitleButton("1a").click();

    assertEqual(
      getItemById("1a").currentTitle,
      getItemById("1a").originalTitle,
    );

    assertEqual(getEditedBadge("1a").hidden, true);
  });

  test("editing a pinned item updates pin tooltip", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    renderAppState();

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    input.value = "Updated Pin Copy";

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    const tooltip = document.querySelector('.pin[data-pid="1a"] .pin-tooltip');

    assertEqual(tooltip.textContent.trim(), "Updated Pin Copy");
  });

  test("copy edit preserves status comment and pin", () => {
    resetItem1A();

    setItemStatus("1a", REVIEW_STATUSES.REJECTED);

    setItemComment("1a", "Keep this comment.");

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    setItemCurrentTitle("1a", "Changed Copy");

    renderAppState();

    const item = getItemById("1a");

    assertEqual(item.status, REVIEW_STATUSES.REJECTED);

    assertEqual(item.comment, "Keep this comment.");

    assertDeepEqual(item.pin, {
      xRatio: 0.25,
      yRatio: 0.5,
    });
  });

  test("empty inline edit does not replace currentTitle", () => {
    resetItem1A();

    const previous = getItemById("1a").currentTitle;

    getEditTitleButton("1a").click();

    const input = getTitleEditInput("1a");

    input.value = "   ";

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    assertEqual(getItemById("1a").currentTitle, previous);
  });

  // ============================================================
  // 1. APP STATE / DOMAIN SHAPE
  // ============================================================

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

  function assertClose(actual, expected, tolerance = 0.0001) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`Expected ${actual} to be close to ${expected}`);
    }
  }

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

  // ============================================================
  // D — PERSISTENCE / SERIALIZATION / IMPORT / EXPORT
  // ============================================================

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

    assertDeepEqual(item.pin, {
      xRatio: 0.25,
      yRatio: 0.5,
    });
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

    assertDeepEqual(stored.products[stored.activeProductId].items["1a"].pin, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    clearPins();

    stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    assertEqual(stored.products[stored.activeProductId].items["1a"].pin, null);
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

    assertDeepEqual(data.items["1a"].pin, {
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

    assertDeepEqual(restored.pin, {
      xRatio: 0.25,
      yRatio: 0.5,
    });

    const descriptor = Object.getOwnPropertyDescriptor(
      restored,
      "originalTitle",
    );

    assertEqual(descriptor.writable, false);
  });

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

    const originalPin = {
      ...getItemById("1a").pin,
    };

    const previousZoom = currentZoom;

    currentZoom = 0.5;
    renderPin("1a");

    assertDeepEqual(getItemById("1a").pin, originalPin);

    currentZoom = 1;
    renderPin("1a");

    assertDeepEqual(getItemById("1a").pin, originalPin);

    currentZoom = 2;
    renderPin("1a");

    assertDeepEqual(getItemById("1a").pin, originalPin);

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

  test("E1 schema v1 state migrates pins to schema v2", () => {
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

    const pin = migrated.products[migrated.activeProductId].items["1a"].pin;

    assertClose(pin.xRatio, 0.4);

    assertClose(pin.yRatio, 0.7);
  });

  test("E1 normalized pin survives serialization roundtrip", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const parsed = deserializeState(serializeState());

    const pin = parsed.products[parsed.activeProductId].items["1a"].pin;

    assertDeepEqual(pin, {
      xRatio: 0.25,
      yRatio: 0.75,
    });
  });

  test("E1 export uses normalized pin geometry", () => {
    resetItem1A();

    setItemPin("1a", {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    const data = buildExportData();

    assertDeepEqual(data.items["1a"].pin, {
      xRatio: 0.25,
      yRatio: 0.75,
    });

    assertEqual(data.schemaVersion, CURRENT_SCHEMA_VERSION);
  });

  // ============================================================
  // E2 — ARTWORK IDENTITY
  // ============================================================

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
      "%cArtwork Checklist — Layer B + C + D + E Test Suite",
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
    "Artwork Layer B + C + D + E tests loaded. Run: runArtworkTests()",
  );
})();
