// ============================================================
// J1–J3 — PRINTABLE APPROVAL REPORT
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
    createSnapshot,
    restoreSnapshot,
  } = window.ArtworkTests;

  function createReportProduct(id = "j-report-product") {
    const product = createProduct(id);

    product.brand = "Paulig";
    product.productName = "Premium Basmati Rice";
    product.weight = "250g";
    product.sku = "RICE-250";
    product.productionCode = "PRD-00458";
    product.site = "OH1";
    product.artworkVersion = "REV-03";
    product.createdAt = "2026-08-18T09:00:00.000Z";
    product.updatedAt = "2026-08-20T10:00:00.000Z";
    product.reviewer = {
      name: "Alex Morgan",
      role: "QA Lead",
      reviewedAt: "2026-08-20T09:30:00.000Z",
    };

    return product;
  }

  function setAllItemStatuses(product, status) {
    Object.values(product.items).forEach((item) => {
      item.status = status;
      item.comment = "";
    });
  }

  function completeDepartmentSignOffs(product, status = REVIEW_STATUSES.APPROVED) {
    product.signOffs.forEach((signOff, index) => {
      signOff.status = status;
      signOff.reviewer = {
        name: `Reviewer ${index + 1}`,
        role: signOff.departmentName,
      };
      signOff.comment = status === REVIEW_STATUSES.REJECTED ? "Changes required." : "";
      signOff.reviewedAt = `2026-08-20T1${index}:00:00.000Z`;
      signOff.artworkVersion = product.artworkVersion;
    });
  }

  function createTestSignature(overrides = {}) {
    return {
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      signedAt: "2026-08-20T12:00:00.000Z",
      width: 900,
      height: 260,
      ...overrides,
    };
  }

  function runWithReportReset(assertion) {
    const report = document.getElementById("print-report");
    const html = report?.innerHTML ?? "";
    const productId = report?.dataset.productId ?? "";
    const overallStatus = report?.dataset.overallStatus ?? "";

    try {
      assertion();
    } finally {
      if (report) {
        report.innerHTML = html;

        if (productId) {
          report.dataset.productId = productId;
        } else {
          delete report.dataset.productId;
        }

        if (overallStatus) {
          report.dataset.overallStatus = overallStatus;
        } else {
          delete report.dataset.overallStatus;
        }
      }
    }
  }

  function runIsolated(assertion) {
    const snapshot = createSnapshot();

    try {
      assertion();
    } finally {
      restoreSnapshot(snapshot);
    }
  }

  function collectCssRules(styleSheet, collected = []) {
    let rules;

    try {
      rules = Array.from(styleSheet?.cssRules ?? []);
    } catch (error) {
      return collected;
    }

    rules.forEach((rule) => {
      collected.push(rule);

      if (rule.styleSheet) {
        collectCssRules(rule.styleSheet, collected);
      }

      if (rule.cssRules) {
        Array.from(rule.cssRules).forEach((nestedRule) => {
          collected.push(nestedRule);
        });
      }
    });

    return collected;
  }

  // ============================================================
  // J1 — REPORT MODEL
  // ============================================================

  test("J-001 buildReportData rejects a missing product", () => {
    assertEqual(buildReportData(null), null);
    assertEqual(buildReportData({}), null);
  });

  test("J-002 report contains complete product identification", () => {
    const product = createReportProduct();
    const report = buildReportData(product);

    assertDeepEqual(
      {
        id: report.productInformation.id,
        brand: report.productInformation.brand,
        productName: report.productInformation.productName,
        weight: report.productInformation.weight,
        sku: report.productInformation.sku,
        productionCode: report.productInformation.productionCode,
        site: report.productInformation.site,
        artworkVersion: report.productInformation.artworkVersion,
      },
      {
        id: product.id,
        brand: "Paulig",
        productName: "Premium Basmati Rice",
        weight: "250g",
        sku: "RICE-250",
        productionCode: "PRD-00458",
        site: "OH1",
        artworkVersion: "REV-03",
      },
    );
  });

  test("J-003 report includes detached artwork layer metadata", () => {
    const product = createReportProduct();

    product.artworkLayers[0].artwork = {
      name: "front.png",
      type: "image/png",
      size: 1024,
      width: 1200,
      height: 1600,
    };

    const report = buildReportData(product);
    const layer = report.productInformation.artworkLayers[0];

    assertEqual(layer.name, "Main Artwork");
    assertEqual(layer.artwork.name, "front.png");
    assertNotEqual(layer, product.artworkLayers[0]);
    assertNotEqual(layer.artwork, product.artworkLayers[0].artwork);
  });

  test("J-004 report preserves canonical section order", () => {
    const report = buildReportData(createReportProduct());

    assertDeepEqual(
      report.sections.map(({ id, title }) => ({ id, title })),
      sectionDefinitions.map(({ id, title }) => ({ id, title })),
    );
  });

  test("J-005 report contains all 50 checklist items exactly once", () => {
    const report = buildReportData(createReportProduct());
    const ids = report.sections.flatMap((section) =>
      section.items.map((item) => item.id),
    );

    assertEqual(ids.length, 50);
    assertEqual(new Set(ids).size, 50);
  });

  test("J-006 report separates Approved, Rejected and Pending items", () => {
    const product = createReportProduct();

    setAllItemStatuses(product, REVIEW_STATUSES.PENDING);
    product.items["1a"].status = REVIEW_STATUSES.APPROVED;
    product.items["1b"].status = REVIEW_STATUSES.APPROVED;
    product.items["1c"].status = REVIEW_STATUSES.REJECTED;
    product.items["1c"].comment = "Incorrect e mark.";

    const report = buildReportData(product);

    assertDeepEqual(
      report.approvedItems.map((item) => item.id),
      ["1a", "1b"],
    );
    assertDeepEqual(
      report.rejectedItems.map((item) => item.id),
      ["1c"],
    );
    assertEqual(report.pendingItems.length, 47);
  });

  test("J-007 report collects only non-empty checklist comments", () => {
    const product = createReportProduct();

    product.items["1a"].comment = "Legal name confirmed.";
    product.items["2a"].comment = "   ";

    const report = buildReportData(product);

    assertEqual(report.comments.length, 1);
    assertEqual(report.comments[0].itemId, "1a");
    assertEqual(report.comments[0].sectionId, "legal-core");
    assertEqual(report.comments[0].comment, "Legal name confirmed.");
  });

  test("J-008 report collects original and reviewed copy corrections", () => {
    const product = createReportProduct();

    product.items["1a"].currentTitle = "Registered Product Name";

    const report = buildReportData(product);

    assertEqual(report.copyCorrections.length, 1);
    assertDeepEqual(report.copyCorrections[0], {
      itemId: "1a",
      sectionId: "legal-core",
      sectionTitle: "1. Legal Core (BRCGS 5.2.1)",
      originalTitle: "Product Name / Legal Name",
      currentTitle: "Registered Product Name",
    });
  });

  test("J-009 report item retains note, status, comment and edited state", () => {
    const product = createReportProduct();

    product.items["2a"].status = REVIEW_STATUSES.REJECTED;
    product.items["2a"].comment = "Allergens need emphasis.";
    product.items["2a"].currentTitle = "Ingredients & Allergens Declaration";

    const report = buildReportData(product);
    const item = report.sections[1].items[0];

    assertEqual(item.note, product.items["2a"].note);
    assertEqual(item.status, REVIEW_STATUSES.REJECTED);
    assertEqual(item.comment, "Allergens need emphasis.");
    assertEqual(item.isEdited, true);
  });

  test("J-010 report metadata contains counts and percentages", () => {
    const product = createReportProduct();

    setAllItemStatuses(product, REVIEW_STATUSES.PENDING);
    product.items["1a"].status = REVIEW_STATUSES.APPROVED;
    product.items["1b"].status = REVIEW_STATUSES.REJECTED;
    product.items["1b"].comment = "Reason";

    const metrics = buildReportData(product).reviewMetadata.metrics;

    assertEqual(metrics.total, 50);
    assertEqual(metrics.approved, 1);
    assertEqual(metrics.rejected, 1);
    assertEqual(metrics.pending, 48);
    assertEqual(metrics.reviewed, 2);
    assertEqual(metrics.reviewProgress, 4);
    assertEqual(metrics.approvalRate, 2);
  });

  test("J-011 incomplete review metadata exposes Pending and blockers", () => {
    const product = createReportProduct();
    const metadata = buildReportData(product).reviewMetadata;

    assertEqual(metadata.overallStatus, REVIEW_STATUSES.PENDING);
    assertEqual(metadata.finalApprovalValid, false);
    assert(metadata.blockers.some((blocker) => blocker.includes("Pending")));
  });

  test("J-012 completed review metadata derives Overall Approved", () => {
    const product = createReportProduct();

    setAllItemStatuses(product, REVIEW_STATUSES.APPROVED);
    completeDepartmentSignOffs(product);

    const metadata = buildReportData(product).reviewMetadata;

    assertEqual(metadata.overallStatus, REVIEW_STATUSES.APPROVED);
    assertEqual(metadata.finalApprovalValid, true);
    assertEqual(metadata.blockers.length, 0);
  });

  test("J-013 rejected department gives the report Overall Rejected", () => {
    const product = createReportProduct();

    product.signOffs[0].status = REVIEW_STATUSES.REJECTED;

    assertEqual(
      buildReportData(product).reviewMetadata.overallStatus,
      REVIEW_STATUSES.REJECTED,
    );
  });

  test("J-014 report clones current reviewer identity", () => {
    const product = createReportProduct();
    const report = buildReportData(product);

    assertDeepEqual(report.reviewer, product.reviewer);
    assertNotEqual(report.reviewer, product.reviewer);
  });

  test("J-015 report clones every department decision", () => {
    const product = createReportProduct();

    completeDepartmentSignOffs(product);

    const report = buildReportData(product);

    assertEqual(report.signOffs.length, 3);
    assertEqual(report.signOffs[0].departmentName, "Quality");
    assertEqual(report.signOffs[0].status, REVIEW_STATUSES.APPROVED);
    assertNotEqual(report.signOffs[0], product.signOffs[0]);
    assertNotEqual(report.signOffs[0].reviewer, product.signOffs[0].reviewer);
  });

  test("J-016 report exposes only departments that have signatures", () => {
    const product = createReportProduct();

    completeDepartmentSignOffs(product);
    product.signOffs[0].signature = createTestSignature();
    product.signOffs[2].signature = createTestSignature({
      signedAt: "2026-08-20T13:00:00.000Z",
    });

    const report = buildReportData(product);

    assertEqual(report.signatures.length, 2);
    assertDeepEqual(
      report.signatures.map((signature) => signature.departmentId),
      ["quality", "product-development"],
    );
    assertEqual(report.reviewMetadata.signedDepartmentCount, 2);
  });

  test("J-017 report signature data is detached from appState", () => {
    const product = createReportProduct();

    completeDepartmentSignOffs(product);
    product.signOffs[0].signature = createTestSignature();

    const report = buildReportData(product);

    report.signOffs[0].signature.signedAt = "changed";
    report.signatures[0].dataUrl = "changed";

    assertEqual(
      product.signOffs[0].signature.signedAt,
      "2026-08-20T12:00:00.000Z",
    );
    assertEqual(
      product.signOffs[0].signature.dataUrl,
      "data:image/png;base64,iVBORw0KGgo=",
    );
  });

  test("J-018 review date is the latest valid review timestamp", () => {
    const product = createReportProduct();

    product.signOffs[0].reviewedAt = "2026-08-21T12:00:00.000Z";
    product.signOffs[1].reviewedAt = "invalid";

    assertEqual(
      deriveReportReviewDate(product),
      "2026-08-21T12:00:00.000Z",
    );
    assertEqual(
      buildReportData(product).reviewDate,
      "2026-08-21T12:00:00.000Z",
    );
  });

  test("J-019 report generation timestamp is valid ISO data", () => {
    const generatedAt = buildReportData(createReportProduct()).generatedAt;

    assert(Number.isFinite(Date.parse(generatedAt)));
    assertEqual(new Date(generatedAt).toISOString(), generatedAt);
  });

  test("J-020 report arrays never share item objects with the product", () => {
    const product = createReportProduct();
    const report = buildReportData(product);
    const reportItem = report.sections[0].items[0];

    reportItem.currentTitle = "Changed in report";

    assertNotEqual(reportItem, product.items["1a"]);
    assertEqual(product.items["1a"].currentTitle, "Product Name / Legal Name");
  });

  // ============================================================
  // J2 — PRINT VIEW
  // ============================================================

  test("J-021 print trigger and exclusive report container exist", () => {
    assertExists(document.getElementById("print-report-button"));
    assertExists(document.getElementById("print-report"));
    assertEqual(
      document.getElementById("print-report-button").getAttribute("aria-controls"),
      "print-report",
    );
  });

  test("J-022 report container stays hidden in screen media", () => {
    const report = document.getElementById("print-report");

    assertEqual(getComputedStyle(report).display, "none");
  });

  test("J-023 renderPrintReport fails safely without a product", () => {
    runWithReportReset(() => {
      assertEqual(renderPrintReport(null), null);
    });
  });

  test("J-024 print view renders report header and product identity", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      renderPrintReport(product);

      const container = document.getElementById("print-report");

      assertEqual(
        container.querySelector("h1").textContent.trim(),
        "Artwork Approval Report",
      );
      assert(
        container.textContent.includes("Premium Basmati Rice"),
        "Product name must be printed.",
      );
      assert(container.textContent.includes("PRD-00458"));
      assert(container.textContent.includes("REV-03"));
    });
  });

  test("J-025 print view renders six review metrics", () => {
    runWithReportReset(() => {
      renderPrintReport(createReportProduct());

      assertEqual(
        document.querySelectorAll("#print-report .print-report-metrics > div")
          .length,
        6,
      );
    });
  });

  test("J-026 print view groups all 50 items into six categories", () => {
    runWithReportReset(() => {
      renderPrintReport(createReportProduct());

      assertEqual(
        document.querySelectorAll("#print-report [data-report-section]").length,
        6,
      );
      assertEqual(
        document.querySelectorAll("#print-report [data-report-item]").length,
        50,
      );
    });
  });

  test("J-027 print item rows expose status semantically", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      product.items["1a"].status = REVIEW_STATUSES.APPROVED;
      renderPrintReport(product);

      const row = document.querySelector(
        '#print-report [data-report-item="1a"]',
      );

      assertEqual(row.dataset.status, REVIEW_STATUSES.APPROVED);
      assertEqual(
        row.querySelector(".print-report-status").textContent.trim(),
        "Approved",
      );
    });
  });

  test("J-028 print view includes comments and copy changes inline", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      product.items["1a"].comment = "Name requires legal suffix.";
      product.items["1a"].currentTitle = "Premium Basmati Rice Ltd";
      renderPrintReport(product);

      const row = document.querySelector(
        '#print-report [data-report-item="1a"]',
      );

      assertExists(row.querySelector(".print-report-comment"));
      assertExists(row.querySelector(".print-report-correction"));
      assert(row.textContent.includes("Name requires legal suffix."));
      assert(row.textContent.includes("Product Name / Legal Name"));
      assert(row.textContent.includes("Premium Basmati Rice Ltd"));
    });
  });

  test("J-029 print markup escapes user-controlled HTML", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      product.productName = '<script data-injected="true">bad()</script>';
      product.items["1a"].comment = '<img data-injected="true" src=x>';
      renderPrintReport(product);

      const container = document.getElementById("print-report");

      assertEqual(container.querySelector('[data-injected="true"]'), null);
      assert(container.textContent.includes('<script data-injected="true">'));
      assert(container.textContent.includes('<img data-injected="true" src=x>'));
    });
  });

  test("J-030 print view renders all department decisions", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      completeDepartmentSignOffs(product);
      renderPrintReport(product);

      const cards = document.querySelectorAll(
        "#print-report [data-report-department]",
      );

      assertEqual(cards.length, 3);
      assert(cards[0].textContent.includes("Reviewer 1"));
      assert(cards[0].textContent.includes("Approved"));
      assert(cards[0].textContent.includes("REV-03"));
      assert(cards[0].textContent.includes("2026"));
    });
  });

  test("J-031 print view renders saved signature and unsigned states", () => {
    runWithReportReset(() => {
      const product = createReportProduct();

      completeDepartmentSignOffs(product);
      product.signOffs[0].signature = createTestSignature();
      renderPrintReport(product);

      const quality = document.querySelector(
        '#print-report [data-report-department="quality"]',
      );
      const production = document.querySelector(
        '#print-report [data-report-department="production"]',
      );

      assertEqual(quality.querySelectorAll(".print-report-signature img").length, 1);
      assertEqual(
        quality.querySelector("img").getAttribute("alt"),
        "Quality signature",
      );
      assert(production.textContent.includes("Not signed"));
    });
  });

  test("J-032 rendered report identifies its product and overall state", () => {
    runWithReportReset(() => {
      const product = createReportProduct("j-dataset-product");

      renderPrintReport(product);

      const container = document.getElementById("print-report");

      assertEqual(container.dataset.productId, "j-dataset-product");
      assertEqual(container.dataset.overallStatus, REVIEW_STATUSES.PENDING);
    });
  });

  test("J-033 report markup contains no interactive review controls", () => {
    runWithReportReset(() => {
      renderPrintReport(createReportProduct());

      const container = document.getElementById("print-report");

      assertEqual(container.querySelectorAll("button, input, select, textarea").length, 0);
    });
  });

  test("J-034 active CSS contains dedicated print and page rules", () => {
    const rules = Array.from(document.styleSheets).flatMap((styleSheet) =>
      collectCssRules(styleSheet),
    );

    assert(
      rules.some((rule) => rule.conditionText === "print"),
      "Expected an active @media print rule.",
    );
    assert(
      rules.some((rule) => rule.cssText.trim().startsWith("@page")),
      "Expected an active @page rule.",
    );
    assert(
      rules.some(
        (rule) =>
          rule.selectorText === "body > .print-report" &&
          rule.style.display === "block",
      ),
      "Print media must display only the report container.",
    );
  });

  test("J-035 beforeprint refreshes the report from the active product", () => {
    runIsolated(() => {
      const product = getActiveProduct();

      product.productName = "Before Print Product";
      document.getElementById("print-report").innerHTML = "";

      window.dispatchEvent(new Event("beforeprint"));

      assert(
        document.getElementById("print-report").textContent.includes(
          "Before Print Product",
        ),
      );
    });
  });

  // ============================================================
  // J3 — NATIVE PDF EXPORT
  // ============================================================

  test("J-036 printApprovalReport invokes the native boundary once", () => {
    runIsolated(() => {
      let printCalls = 0;

      const result = printApprovalReport(() => {
        printCalls += 1;
      });

      assertEqual(result, true);
      assertEqual(printCalls, 1);
    });
  });

  test("J-037 printApprovalReport renders the active product before printing", () => {
    runIsolated(() => {
      const product = getActiveProduct();

      product.productName = "Active Product Report";

      printApprovalReport(() => {});

      const container = document.getElementById("print-report");

      assertEqual(container.dataset.productId, product.id);
      assert(container.textContent.includes("Active Product Report"));
    });
  });

  test("J-038 report generation does not mutate product timestamps or state", () => {
    runIsolated(() => {
      const product = getActiveProduct();
      const before = JSON.stringify(product);
      const updatedAt = product.updatedAt;

      buildReportData(product);
      renderPrintReport(product);
      printApprovalReport(() => {});

      assertEqual(product.updatedAt, updatedAt);
      assertEqual(JSON.stringify(product), before);
    });
  });
})();
