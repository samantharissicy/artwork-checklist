// ============================================================
// C1 — TRI-STATE REVIEW WORKFLOW
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
    assertExists,
    resetItem1A,
    getItemElement,
    getReviewButton,
    getStatusLabel,
  } = window.ArtworkTests;

  test("all items start as pending", () => {
    const freshItems = createInitialItems();

    const allPending = Object.values(freshItems).every(
      (item) => item.status === REVIEW_STATUSES.PENDING,
    );

    assert(allPending);
  });

  test("every rendered item has Approve and Reject controls", () => {
    const items = document.querySelectorAll(".check-item");

    assertEqual(items.length, 50);

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

    assertEqual(progressText.textContent.trim(), "3 / 50 reviewed");
  });
})();
