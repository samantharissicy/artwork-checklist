// ============================================================
// F1 — REVIEW METRICS
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
  } = window.ArtworkTests;

  test("F1 metrics derive from state (approved, rejected, pending)", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    product.items["1a"].status = REVIEW_STATUSES.APPROVED;

    product.items["1b"].status = REVIEW_STATUSES.REJECTED;

    const m = computeReviewMetrics(product);

    assertEqual(m.total, 50);
    assertEqual(m.approved, 1);
    assertEqual(m.rejected, 1);
    assertEqual(m.pending, 48);
    assertEqual(m.reviewed, 2);
  });

  test("F1 review percentage counts approved and rejected, approval counts approved only", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    product.items["1a"].status = REVIEW_STATUSES.APPROVED;

    product.items["1b"].status = REVIEW_STATUSES.APPROVED;

    product.items["1c"].status = REVIEW_STATUSES.REJECTED;

    const m = computeReviewMetrics(product);

    assertEqual(m.reviewed, 3);
    assertEqual(Math.round(m.reviewProgress), 6);
    assertEqual(Math.round(m.approvalRate), 4);
  });

  test("F1 updateProgress renders counters and percentages", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    product.items["1a"].status = REVIEW_STATUSES.APPROVED;

    product.items["1b"].status = REVIEW_STATUSES.APPROVED;

    product.items["1c"].status = REVIEW_STATUSES.REJECTED;

    updateProgress();

    assertEqual(document.getElementById("progress-total").textContent.trim(), "50");
    assertEqual(document.getElementById("progress-approved").textContent.trim(), "2");
    assertEqual(document.getElementById("progress-rejected").textContent.trim(), "1");
    assertEqual(document.getElementById("progress-pending").textContent.trim(), "47");
    assertEqual(document.getElementById("progress-review-pct").textContent.trim(), "6% reviewed");
    assertEqual(document.getElementById("progress-approval-pct").textContent.trim(), "4% approved");
  });

  test("F1 progress bar width follows reviewed / total", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    product.items["1a"].status = REVIEW_STATUSES.APPROVED;

    product.items["1b"].status = REVIEW_STATUSES.REJECTED;

    updateProgress();

    assertEqual(document.getElementById("progress-bar").style.width, "4%");
  });

  test("F1 all pending shows zero review and zero approval", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.PENDING;
    });

    updateProgress();

    assertEqual(document.getElementById("progress-review-pct").textContent.trim(), "0% reviewed");
    assertEqual(document.getElementById("progress-approval-pct").textContent.trim(), "0% approved");
    assertEqual(document.getElementById("progress-bar").style.width, "0%");
  });

  test("F1 fully approved shows full review and approval", () => {
    const product = getActiveProduct();

    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.APPROVED;
    });

    updateProgress();

    assertEqual(document.getElementById("progress-review-pct").textContent.trim(), "100% reviewed");
    assertEqual(document.getElementById("progress-approval-pct").textContent.trim(), "100% approved");
    assertEqual(document.getElementById("progress-bar").style.width, "100%");
  });

  test("F1 computeReviewMetrics guards against an empty checklist", () => {
    const empty = { items: {} };

    const m = computeReviewMetrics(empty);

    assertEqual(m.total, 0);
    assertEqual(m.reviewed, 0);
    assertEqual(m.reviewProgress, 0);
    assertEqual(m.approvalRate, 0);
  });
})();