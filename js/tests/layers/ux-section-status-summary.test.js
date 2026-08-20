// ============================================================
// UX — CHECKLIST SECTION STATUS SUMMARIES
// ============================================================
//
// Compact Approved / Rejected / Pending previews shown in every
// collapsible checklist section header.
// ============================================================

(function () {
  "use strict";

  const {
    test,
    assert,
    assertEqual,
    assertExists,
    assertDeepEqual,
    createSnapshot,
    restoreSnapshot,
  } = window.ArtworkTests;

  function runIsolated(assertion) {
    const snapshot = createSnapshot();

    try {
      assertion();
    } finally {
      restoreSnapshot(snapshot);
    }
  }

  function getSection(sectionId) {
    return sectionDefinitions.find((section) => section.id === sectionId);
  }

  function getSectionButton(sectionId) {
    return Array.from(document.querySelectorAll(".section-btn")).find(
      (button) => button.dataset.sectionId === sectionId,
    );
  }

  function getSectionSummary(sectionId) {
    return getSectionButton(sectionId)?.querySelector(
      '[data-role="section-status-summary"]',
    );
  }

  function setSectionStatuses(product, sectionId, statuses) {
    const section = getSection(sectionId);

    section.items.forEach((definition, index) => {
      product.items[definition.id].status =
        statuses[index] ?? REVIEW_STATUSES.PENDING;
    });
  }

  test("UXS-001 section metrics include only their canonical items", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("ingredients-allergens");

      setSectionStatuses(product, section.id, [
        REVIEW_STATUSES.APPROVED,
        REVIEW_STATUSES.APPROVED,
        REVIEW_STATUSES.REJECTED,
      ]);

      product.items["1a"].status = REVIEW_STATUSES.REJECTED;

      const metrics = computeSectionReviewMetrics(product, section);

      assertDeepEqual(
        {
          total: metrics.total,
          approved: metrics.approved,
          rejected: metrics.rejected,
          pending: metrics.pending,
          reviewed: metrics.reviewed,
        },
        {
          total: 5,
          approved: 2,
          rejected: 1,
          pending: 2,
          reviewed: 3,
        },
      );
    });
  });

  test("UXS-002 section metrics calculate review and approval percentages", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("storage-cooking");

      setSectionStatuses(product, section.id, [
        REVIEW_STATUSES.APPROVED,
        REVIEW_STATUSES.REJECTED,
      ]);

      const metrics = computeSectionReviewMetrics(product, section);

      assertEqual(metrics.total, 4);
      assertEqual(metrics.reviewProgress, 50);
      assertEqual(metrics.approvalRate, 25);
    });
  });

  test("UXS-003 invalid section inputs safely return empty metrics", () => {
    const metrics = computeSectionReviewMetrics(null, null);

    assertEqual(metrics.total, 0);
    assertEqual(metrics.approved, 0);
    assertEqual(metrics.rejected, 0);
    assertEqual(metrics.pending, 0);
    assertEqual(metrics.reviewProgress, 0);
  });

  test("UXS-004 every checklist section renders one status summary", () => {
    runIsolated(() => {
      renderChecklist();

      assertEqual(document.querySelectorAll(".section-btn").length, 6);
      assertEqual(
        document.querySelectorAll('[data-role="section-status-summary"]')
          .length,
        6,
      );

      sectionDefinitions.forEach((section) => {
        assertExists(getSectionSummary(section.id));
      });
    });
  });

  test("UXS-005 all-pending sections show one compact Pending chip", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("legal-core");

      setSectionStatuses(product, section.id, []);
      renderAppState();

      const summary = getSectionSummary(section.id);
      const chips = summary.querySelectorAll(".section-status-chip");

      assertEqual(summary.dataset.total, "10");
      assertEqual(summary.dataset.pending, "10");
      assertEqual(chips.length, 1);
      assertEqual(chips[0].dataset.status, REVIEW_STATUSES.PENDING);
      assertEqual(chips[0].textContent.replace(/\s+/g, " ").trim(), "○ 10");
    });
  });

  test("UXS-006 zero-value statuses stay out of the visual summary", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("ingredients-allergens");

      setSectionStatuses(
        product,
        section.id,
        section.items.map(() => REVIEW_STATUSES.APPROVED),
      );
      renderAppState();

      const summary = getSectionSummary(section.id);

      assertEqual(summary.querySelectorAll(".section-status-chip").length, 1);
      assertExists(
        summary.querySelector('[data-status="approved"]'),
      );
      assertEqual(summary.querySelector('[data-status="rejected"]'), null);
      assertEqual(summary.querySelector('[data-status="pending"]'), null);
    });
  });

  test("UXS-007 mixed sections display Approved, Rejected and Pending counts", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("storage-cooking");

      setSectionStatuses(product, section.id, [
        REVIEW_STATUSES.APPROVED,
        REVIEW_STATUSES.APPROVED,
        REVIEW_STATUSES.REJECTED,
        REVIEW_STATUSES.PENDING,
      ]);
      renderAppState();

      const summary = getSectionSummary(section.id);

      assertEqual(summary.dataset.approved, "2");
      assertEqual(summary.dataset.rejected, "1");
      assertEqual(summary.dataset.pending, "1");
      assertEqual(summary.querySelectorAll(".section-status-chip").length, 3);
    });
  });

  test("UXS-008 accessible summary always announces all three counts", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const section = getSection("claims-certifications");

      setSectionStatuses(
        product,
        section.id,
        section.items.map(() => REVIEW_STATUSES.APPROVED),
      );
      renderAppState();

      assertEqual(
        getSectionSummary(section.id).getAttribute("aria-label"),
        "Approved: 12; Rejected: 0; Pending: 0",
      );
    });
  });

  test("UXS-009 review actions update only the affected section summary", () => {
    runIsolated(() => {
      const product = getActiveProduct();

      Object.values(product.items).forEach((item) => {
        item.status = REVIEW_STATUSES.PENDING;
      });

      renderAppState();

      const legalBefore = getSectionSummary("legal-core").outerHTML;
      const nutritionBefore = getSectionSummary("nutrition-serving").outerHTML;

      handleReviewAction("1a", REVIEW_STATUSES.APPROVED);

      const legalAfter = getSectionSummary("legal-core");

      assert(legalAfter.outerHTML !== legalBefore);
      assertEqual(legalAfter.dataset.approved, "1");
      assertEqual(legalAfter.dataset.pending, "9");
      assertEqual(
        getSectionSummary("nutrition-serving").outerHTML,
        nutritionBefore,
      );
    });
  });

  test("UXS-010 collapsed headers keep summaries visible and expansion state accurate", () => {
    runIsolated(() => {
      renderChecklist();

      const button = getSectionButton("ingredients-allergens");
      const summary = getSectionSummary("ingredients-allergens");
      const content = document.getElementById(button.getAttribute("aria-controls"));

      assert(button.classList.contains("collapsed"));
      assertEqual(button.getAttribute("aria-expanded"), "false");
      assert(content.classList.contains("hidden"));
      assertExists(summary);

      button.click();

      assert(!button.classList.contains("collapsed"));
      assertEqual(button.getAttribute("aria-expanded"), "true");
      assert(!content.classList.contains("hidden"));
      assertExists(getSectionSummary("ingredients-allergens"));
    });
  });

  test("UXS-011 product switches refresh summaries without rebuilding the checklist", () => {
    runIsolated(() => {
      const firstProduct = getActiveProduct();
      const firstProductId = firstProduct.id;
      const section = getSection("legal-core");

      setSectionStatuses(
        firstProduct,
        section.id,
        section.items.map(() => REVIEW_STATUSES.APPROVED),
      );
      renderAppState();

      const buttonBeforeSwitch = getSectionButton(section.id);
      const secondProductId = createNewProduct();

      assertEqual(getSectionSummary(section.id).dataset.pending, "10");
      assertEqual(getSectionButton(section.id), buttonBeforeSwitch);

      switchProduct(firstProductId);

      assertEqual(getSectionSummary(section.id).dataset.approved, "10");
      assertEqual(getSectionSummary(section.id).dataset.pending, "0");
      assertEqual(getSectionButton(section.id), buttonBeforeSwitch);
      assert(secondProductId !== firstProductId);
    });
  });

  test("UXS-012 section titles preserve their full accessible tooltip", () => {
    runIsolated(() => {
      renderChecklist();

      sectionDefinitions.forEach((section) => {
        const title = getSectionButton(section.id).querySelector(
          ".section-btn-title",
        );

        assertEqual(title.textContent.trim(), section.title);
        assertEqual(title.getAttribute("title"), section.title);
      });
    });
  });

  test("UXS-013 unknown section IDs do not mutate rendered summaries", () => {
    runIsolated(() => {
      const before = Array.from(
        document.querySelectorAll('[data-role="section-status-summary"]'),
      ).map((summary) => summary.outerHTML);

      assertEqual(renderSectionStatusSummary("unknown-section"), false);

      const after = Array.from(
        document.querySelectorAll('[data-role="section-status-summary"]'),
      ).map((summary) => summary.outerHTML);

      assertDeepEqual(after, before);
    });
  });
})();
