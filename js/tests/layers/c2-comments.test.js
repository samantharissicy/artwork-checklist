// ============================================================
// C2 — REVIEW COMMENTS
// ============================================================
//
// Tests owned by this layer only.
// Shared assertions and fixtures come from window.ArtworkTests.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assert,
    assertEqual,
    assertExists,
    resetItem1A,
    getItemElement,
    getReviewButton,
    getCommentButton,
    getCommentPanel,
    getCommentTextarea,
    getCommentError,
  } = window.ArtworkTests;

  test("every rendered item has a comment control", () => {
    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 50);

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
})();
