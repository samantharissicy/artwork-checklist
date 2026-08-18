// ============================================================
// C3 — INLINE COPY CORRECTIONS
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
    resetItem1A,
    getEditTitleButton,
    getTitleEditInput,
    getEditedBadge,
    getRestoreTitleButton,
    getOriginalTitleElement,
  } = window.ArtworkTests;

  function getActiveLayerId() {
    return getActiveArtworkLayer(getActiveProduct()).id;
  }

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

    assertDeepEqual(getItemPinForLayer(item, getActiveLayerId()), {
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
})();
