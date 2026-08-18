// ============================================================
// SHARED TEST HELPERS
// ============================================================
//
// Reusable fixtures, snapshot utilities and DOM lookup helpers.
//
// This file may read and manipulate the application because the
// suite is an in-browser regression suite loaded after app.js.
//
// Layer-specific test cases do not belong here.
// ============================================================

(function () {
  "use strict";

  const suite = window.ArtworkTests;

  if (!suite) {
    throw new Error(
      "ArtworkTests framework must load before helpers.js.",
    );
  }

  const {
    assertExists,
  } = suite;

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
    const parsedState = deserializeState(
      snapshot.serializedState,
    );

    if (!parsedState || !validateState(parsedState)) {
      throw new Error("Unable to restore test snapshot.");
    }

    const hydratedState = rehydrateState(parsedState);

    appState.schemaVersion = hydratedState.schemaVersion;

    appState.activeProductId =
      hydratedState.activeProductId;

    appState.products = hydratedState.products;

    openCommentItemIds.clear();

    snapshot.openCommentItemIds.forEach((itemId) => {
      openCommentItemIds.add(itemId);
    });

    editingTitleItemId =
      snapshot.editingTitleItemId;

    currentZoom = snapshot.currentZoom;

    if (snapshot.storageValue === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        snapshot.storageValue,
      );
    }

    const wrapper =
      document.getElementById("artwork-wrapper");

    if (wrapper) {
      wrapper.style.transform =
        `scale(${currentZoom})`;
    }

    const zoomLevel =
      document.getElementById("zoom-level");

    if (zoomLevel) {
      zoomLevel.textContent =
        Math.round(currentZoom * 100) + "%";
    }

    renderChecklist();

    renderProductTabs();

    renderAppState();
  }

  function createTestArtworkMetadata(
    name = "test-artwork.png",
  ) {
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
    return document.querySelector(
      `.check-item[data-id="${itemId}"]`,
    );
  }

  function getReviewButton(itemId, action) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      `[data-action="${action}"]`,
    );
  }

  function getStatusLabel(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      '[data-role="status-label"]',
    );
  }

  function getCommentButton(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      '[data-action="comment"]',
    );
  }

  function getCommentPanel(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      '[data-role="comment-panel"]',
    );
  }

  function getCommentTextarea(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      '[data-role="comment-input"]',
    );
  }

  function getCommentError(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      '[data-role="comment-error"]',
    );
  }

  function getItemTitleElement(itemId) {
    const element = getItemElement(itemId);

    if (!element) {
      return null;
    }

    return element.querySelector(
      ".check-item-title",
    );
  }

  function getEditTitleButton(itemId) {
    return (
      getItemElement(itemId)?.querySelector(
        '[data-action="edit-title"]',
      ) || null
    );
  }

  function getTitleEditInput(itemId) {
    return (
      getItemElement(itemId)?.querySelector(
        '[data-role="title-edit-input"]',
      ) || null
    );
  }

  function getEditedBadge(itemId) {
    return (
      getItemElement(itemId)?.querySelector(
        '[data-role="edited-badge"]',
      ) || null
    );
  }

  function getRestoreTitleButton(itemId) {
    return (
      getItemElement(itemId)?.querySelector(
        '[data-action="restore-title"]',
      ) || null
    );
  }

  function getOriginalTitleElement(itemId) {
    return (
      getItemElement(itemId)?.querySelector(
        '[data-role="original-title"]',
      ) || null
    );
  }

  function resetWorkspaceForMultiProductTest() {
    const productId = "test-product-root";

    appState.schemaVersion =
      CURRENT_SCHEMA_VERSION;

    appState.activeProductId = productId;

    appState.products = {
      [productId]: createProduct(productId),
    };

    openCommentItemIds.clear();

    editingTitleItemId = null;

    renderChecklist();

    renderProductTabs();

    renderAppState();

    return productId;
  }

  function getProductTab(productId) {
    return document.querySelector(
      `.product-tab[data-product-id="${productId}"]`,
    );
  }

  Object.assign(suite, {
    clonePin,
    createSnapshot,
    restoreSnapshot,
    createTestArtworkMetadata,
    resetArtworkForTest,
    resetItem1A,
    getItemElement,
    getReviewButton,
    getStatusLabel,
    getCommentButton,
    getCommentPanel,
    getCommentTextarea,
    getCommentError,
    getItemTitleElement,
    getEditTitleButton,
    getTitleEditInput,
    getEditedBadge,
    getRestoreTitleButton,
    getOriginalTitleElement,
    resetWorkspaceForMultiProductTest,
    getProductTab,
  });
})();
