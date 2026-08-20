// ============================================================
// H1–H4 — CROSS-FUNCTIONAL SIGN-OFF
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
    resetWorkspaceForMultiProductTest,
  } = window.ArtworkTests;

  function freshProduct() {
    resetWorkspaceForMultiProductTest();

    return getActiveProduct();
  }

  function fillRequiredContext(product) {
    product.productName = "Tomato Soup";
    product.productionCode = "TS-100";
    product.site = "OH1";
    product.artworkVersion = "REV-H1";
  }

  function setCurrentReviewer(product, name = "Alex Morgan", role = "QA Lead") {
    product.reviewer.name = name;
    product.reviewer.role = role;
  }

  function completeChecklist(product) {
    Object.values(product.items).forEach((item) => {
      item.status = REVIEW_STATUSES.APPROVED;
      item.comment = "";
    });
  }

  function prepareReadyProduct() {
    const product = freshProduct();

    fillRequiredContext(product);
    setCurrentReviewer(product);
    completeChecklist(product);

    return product;
  }

  function approveEveryDepartment(product) {
    SIGN_OFF_DEPARTMENTS.forEach((department) => {
      const result = setDepartmentSignOffStatus(
        department.id,
        REVIEW_STATUSES.APPROVED,
      );

      assertEqual(result.changed, true);
    });

    return product;
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

  // ============================================================
  // H1 — REVIEWER IDENTITY
  // ============================================================

  test("H-001 new product has empty reviewer identity", () => {
    const product = createProduct("h-reviewer-default");

    assertEqual(product.reviewer.name, "");
    assertEqual(product.reviewer.role, "");
    assertEqual(product.reviewer.reviewedAt, null);
  });

  test("H-002 reviewer identity requires both name and role", () => {
    assertEqual(
      isReviewerIdentityComplete({ name: "Alex", role: "" }),
      false,
    );
    assertEqual(
      isReviewerIdentityComplete({ name: "", role: "Quality" }),
      false,
    );
    assertEqual(
      isReviewerIdentityComplete({ name: "Alex", role: "Quality" }),
      true,
    );
  });

  test("H-003 updateActiveReviewer writes reviewer name", () => {
    const product = freshProduct();

    assertEqual(updateActiveReviewer("name", "Alex Morgan"), true);
    assertEqual(product.reviewer.name, "Alex Morgan");
  });

  test("H-004 updateActiveReviewer writes reviewer role", () => {
    const product = freshProduct();

    assertEqual(updateActiveReviewer("role", "QA Lead"), true);
    assertEqual(product.reviewer.role, "QA Lead");
  });

  test("H-005 updateActiveReviewer rejects unknown fields", () => {
    const product = freshProduct();

    assertEqual(updateActiveReviewer("department", "Quality"), false);
    assertEqual(product.reviewer.department, undefined);
  });

  test("H-006 completed decision captures an independent reviewer snapshot", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    product.reviewer.name = "Another Reviewer";

    assertEqual(product.signOffs[0].reviewer.name, "Alex Morgan");
    assertEqual(product.signOffs[0].reviewer.role, "QA Lead");
  });

  // ============================================================
  // H2 — DEPARTMENT SIGN-OFF
  // ============================================================

  test("H-007 new product has the three canonical departments", () => {
    const product = createProduct("h-departments");

    assertDeepEqual(
      product.signOffs.map(({ departmentId, departmentName }) => ({
        departmentId,
        departmentName,
      })),
      [
        { departmentId: "quality", departmentName: "Quality" },
        { departmentId: "production", departmentName: "Production" },
        {
          departmentId: "product-development",
          departmentName: "Product Development",
        },
      ],
    );
  });

  test("H-008 every new department starts Pending and unsigned", () => {
    const product = createProduct("h-pending-defaults");

    assertEqual(
      product.signOffs.every(
        (signOff) =>
          signOff.status === REVIEW_STATUSES.PENDING &&
          signOff.reviewedAt === null &&
          signOff.signature === null,
      ),
      true,
    );
  });

  test("H-009 separate products do not share sign-off objects", () => {
    const first = createProduct("h-independent-a");
    const second = createProduct("h-independent-b");

    first.signOffs[0].comment = "Only product A";

    assertNotEqual(first.signOffs, second.signOffs);
    assertNotEqual(first.signOffs[0], second.signOffs[0]);
    assertEqual(second.signOffs[0].comment, "");
  });

  test("H-010 department approval requires complete reviewer identity", () => {
    const product = freshProduct();

    fillRequiredContext(product);
    product.reviewer.name = "Alex";

    const result = setDepartmentSignOffStatus(
      "quality",
      REVIEW_STATUSES.APPROVED,
    );

    assertEqual(result.changed, false);
    assertEqual(result.reason, "reviewer-required");
  });

  test("H-011 department decision requires artwork revision", () => {
    const product = freshProduct();

    setCurrentReviewer(product);

    const result = setDepartmentSignOffStatus(
      "quality",
      REVIEW_STATUSES.APPROVED,
    );

    assertEqual(result.changed, false);
    assertEqual(result.reason, "artwork-version-required");
  });

  test("H-012 approved decision records reviewer revision and reviewedAt", () => {
    const product = prepareReadyProduct();

    const result = setDepartmentSignOffStatus(
      "quality",
      REVIEW_STATUSES.APPROVED,
    );
    const signOff = getDepartmentSignOff(product, "quality");

    assertEqual(result.changed, true);
    assertEqual(signOff.status, REVIEW_STATUSES.APPROVED);
    assertEqual(signOff.reviewer.name, "Alex Morgan");
    assertEqual(signOff.artworkVersion, "REV-H1");
    assertEqual(typeof signOff.reviewedAt, "string");
  });

  test("H-013 rejected decision records reviewer revision and reviewedAt", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("production", REVIEW_STATUSES.REJECTED);
    const signOff = getDepartmentSignOff(product, "production");

    assertEqual(signOff.status, REVIEW_STATUSES.REJECTED);
    assertEqual(signOff.reviewer.role, "QA Lead");
    assertEqual(signOff.artworkVersion, product.artworkVersion);
    assertEqual(typeof signOff.reviewedAt, "string");
  });

  test("H-014 rejected department without comment is invalid", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);

    const validation = validateDepartmentSignOff(
      getDepartmentSignOff(product, "quality"),
      product,
    );

    assertEqual(validation.valid, false);
    assert(
      validation.errors.some((error) => error.includes("require a comment")),
    );
  });

  test("H-015 rejected department becomes valid after comment", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);
    setDepartmentSignOffComment("quality", "Legal copy is incomplete.");

    assertEqual(
      validateDepartmentSignOff(
        getDepartmentSignOff(product, "quality"),
        product,
      ).valid,
      true,
    );
  });

  test("H-016 department decisions remain independent", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    assertEqual(
      getDepartmentSignOff(product, "quality").status,
      REVIEW_STATUSES.APPROVED,
    );
    assertEqual(
      getDepartmentSignOff(product, "production").status,
      REVIEW_STATUSES.PENDING,
    );
    assertEqual(
      getDepartmentSignOff(product, "product-development").status,
      REVIEW_STATUSES.PENDING,
    );
  });

  test("H-017 returning a department to Pending clears decision metadata", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.PENDING);

    const signOff = getDepartmentSignOff(product, "quality");

    assertEqual(signOff.status, REVIEW_STATUSES.PENDING);
    assertEqual(signOff.reviewer.name, "");
    assertEqual(signOff.reviewedAt, null);
    assertEqual(signOff.artworkVersion, "");
  });

  test("H-018 changing a decision clears its saved signature", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignature("quality", createTestSignature());
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);

    assertEqual(getDepartmentSignOff(product, "quality").signature, null);
  });

  test("H-019 changing a department decision updates product updatedAt", () => {
    const product = prepareReadyProduct();

    product.updatedAt = "2000-01-01T00:00:00.000Z";
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    assertNotEqual(product.updatedAt, "2000-01-01T00:00:00.000Z");
  });

  test("H-020 changing artwork revision resets all sign-offs", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignOffComment("production", "Draft note");

    const result = setActiveProductArtworkVersion("REV-H2");

    assertEqual(result.changed, true);
    assertEqual(result.signOffsReset, 2);
    assertEqual(
      product.signOffs.every(
        (signOff) => signOff.status === REVIEW_STATUSES.PENDING,
      ),
      true,
    );
  });

  test("H-021 assigning the same artwork revision preserves sign-offs", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    const result = setActiveProductArtworkVersion("REV-H1");

    assertEqual(result.changed, false);
    assertEqual(result.signOffsReset, 0);
    assertEqual(
      getDepartmentSignOff(product, "quality").status,
      REVIEW_STATUSES.APPROVED,
    );
  });

  // ============================================================
  // H2/H4 — OVERALL APPROVAL AND FINAL VALIDATION
  // ============================================================

  test("H-022 overall status starts Pending", () => {
    assertEqual(
      computeOverallApproval(freshProduct()),
      REVIEW_STATUSES.PENDING,
    );
  });

  test("H-023 any department rejection makes overall status Rejected", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignOffStatus("production", REVIEW_STATUSES.REJECTED);
    setDepartmentSignOffComment("production", "Print tolerance failed.");

    assertEqual(
      computeOverallApproval(product),
      REVIEW_STATUSES.REJECTED,
    );
  });

  test("H-024 all departments approved with Pending checklist remains Pending", () => {
    const product = freshProduct();

    fillRequiredContext(product);
    setCurrentReviewer(product);
    approveEveryDepartment(product);

    assertEqual(
      computeOverallApproval(product),
      REVIEW_STATUSES.PENDING,
    );
  });

  test("H-025 all requirements and departments approved makes overall Approved", () => {
    const product = approveEveryDepartment(prepareReadyProduct());

    assertEqual(
      computeOverallApproval(product),
      REVIEW_STATUSES.APPROVED,
    );
  });

  test("H-026 missing required product fields block final approval", () => {
    const product = freshProduct();
    const blockers = getProductContextBlockers(product);

    assertEqual(blockers.length, 4);
    assert(blockers.includes("Product Name is required."));
    assert(blockers.includes("Artwork Revision is required."));
  });

  test("H-027 Pending checklist items block final approval", () => {
    const product = freshProduct();
    const blockers = getChecklistSignOffBlockers(product);

    assertEqual(blockers.length, 1);
    assert(blockers[0].includes("50 checklist items"));
  });

  test("H-028 rejected checklist item without comment blocks final approval", () => {
    const product = prepareReadyProduct();

    product.items["1a"].status = REVIEW_STATUSES.REJECTED;
    product.items["1a"].comment = "";

    const blockers = getChecklistSignOffBlockers(product);

    assert(blockers.some((blocker) => blocker.includes("1A")));
  });

  test("H-029 required Pending department blocks final approval", () => {
    const product = prepareReadyProduct();
    const validation = validateFinalSignOff(product);

    assertEqual(validation.valid, false);
    assert(validation.blockers.includes("Quality is still Pending."));
  });

  test("H-030 required Rejected department blocks final approval", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);
    setDepartmentSignOffComment("quality", "Compliance mismatch.");

    const validation = validateFinalSignOff(product);

    assertEqual(validation.valid, false);
    assert(validation.blockers.includes("Quality rejected the artwork."));
  });

  test("H-031 complete valid review passes final sign-off validation", () => {
    const product = approveEveryDepartment(prepareReadyProduct());
    const validation = validateFinalSignOff(product);

    assertEqual(validation.valid, true);
    assertDeepEqual(validation.blockers, []);
  });

  // ============================================================
  // H3 — VISUAL SIGNATURE
  // ============================================================

  test("H-032 Pending department cannot be signed", () => {
    const product = prepareReadyProduct();
    const signOff = getDepartmentSignOff(product, "quality");

    assertEqual(
      validateDepartmentSignatureReadiness(product, signOff).valid,
      false,
    );
  });

  test("H-033 missing product data blocks a department signature", () => {
    const product = freshProduct();

    product.artworkVersion = "REV-H1";
    setCurrentReviewer(product);
    completeChecklist(product);
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    const readiness = validateDepartmentSignatureReadiness(
      product,
      getDepartmentSignOff(product, "quality"),
    );

    assertEqual(readiness.valid, false);
    assert(readiness.blockers.includes("Product Name is required."));
  });

  test("H-034 Pending checklist blocks a department signature", () => {
    const product = freshProduct();

    fillRequiredContext(product);
    setCurrentReviewer(product);
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    assertEqual(
      validateDepartmentSignatureReadiness(
        product,
        getDepartmentSignOff(product, "quality"),
      ).valid,
      false,
    );
  });

  test("H-035 valid approved department accepts a signature", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    assertEqual(setDepartmentSignature("quality", createTestSignature()), true);
    assertEqual(
      getDepartmentSignOff(product, "quality").signature.signedAt,
      "2026-08-20T12:00:00.000Z",
    );
  });

  test("H-036 valid rejected department may have an optional signature", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);
    setDepartmentSignOffComment("quality", "Rejected with evidence.");

    assertEqual(setDepartmentSignature("quality", createTestSignature()), true);
  });

  test("H-037 malformed signature data is rejected", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    assertEqual(
      setDepartmentSignature(
        "quality",
        createTestSignature({ dataUrl: "data:image/jpeg;base64,bad" }),
      ),
      false,
    );
  });

  test("H-038 oversized signature data is rejected", () => {
    const signature = createTestSignature({
      dataUrl: `data:image/png;base64,${"a".repeat(
        SIGNATURE_LIMITS.MAX_DATA_URL_LENGTH,
      )}`,
    });

    assertEqual(isValidDepartmentSignature(signature), false);
  });

  test("H-039 saved department signature can be removed", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignature("quality", createTestSignature());

    assertEqual(removeDepartmentSignature("quality"), true);
    assertEqual(getDepartmentSignOff(product, "quality").signature, null);
  });

  // ============================================================
  // SCHEMA V5, STORAGE, EXPORT, IMPORT AND DUPLICATION
  // ============================================================

  test("H-040 schema v5 uses the v5 storage key and retains v4 migration", () => {
    assertEqual(CURRENT_SCHEMA_VERSION, 5);
    assertEqual(STORAGE_KEY, "artworkChecklist:v5");
    assertEqual(LEGACY_STORAGE_KEYS[0], "artworkChecklist:v4");
  });

  test("H-041 serialize and rehydrate preserve sign-offs and signatures", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignature("quality", createTestSignature());

    const parsed = JSON.parse(serializeState());
    const hydrated = rehydrateState(parsed);
    const restored = hydrated.products[hydrated.activeProductId];

    assertEqual(restored.signOffs[0].status, REVIEW_STATUSES.APPROVED);
    assertEqual(restored.signOffs[0].reviewer.name, "Alex Morgan");
    assertEqual(restored.signOffs[0].signature.width, 900);
  });

  test("H-042 rehydrated sign-offs do not share parsed object references", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    const parsed = JSON.parse(serializeState());
    const savedSignOff = parsed.products[parsed.activeProductId].signOffs[0];
    const hydrated = rehydrateState(parsed);
    const restored = hydrated.products[hydrated.activeProductId].signOffs[0];

    assertNotEqual(restored, savedSignOff);
    assertNotEqual(restored.reviewer, savedSignOff.reviewer);
  });

  test("H-043 current product validation requires sign-offs", () => {
    freshProduct();

    const parsed = JSON.parse(serializeState());

    delete parsed.products[parsed.activeProductId].signOffs;

    assertEqual(validateState(parsed), false);
  });

  test("H-043A incomplete rejection remains structurally restorable", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.REJECTED);

    const parsed = JSON.parse(serializeState());

    assertEqual(
      validateDepartmentSignOff(
        getDepartmentSignOff(product, "quality"),
        product,
      ).valid,
      false,
    );
    assertEqual(validateState(parsed), true);

    const hydrated = rehydrateState(parsed);

    assertEqual(
      hydrated.products[hydrated.activeProductId].signOffs[0].status,
      REVIEW_STATUSES.REJECTED,
    );
  });

  test("H-044 validation rejects modified canonical department identity", () => {
    freshProduct();

    const parsed = JSON.parse(serializeState());

    parsed.products[parsed.activeProductId].signOffs[0].departmentName =
      "Finance";

    assertEqual(validateState(parsed), false);
  });

  test("H-045 Save Check export includes every sign-off", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    const exported = buildExportData();

    assertEqual(exported.schemaVersion, 5);
    assertEqual(exported.signOffs.length, 3);
    assertEqual(exported.signOffs[0].reviewer.name, "Alex Morgan");
  });

  test("H-046 Open Check roundtrip restores sign-offs", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);

    const exported = JSON.parse(JSON.stringify(buildExportData()));
    const result = applyImportedReview(exported);
    const imported = getActiveProduct();

    assertEqual(result.valid, true);
    assertEqual(
      getDepartmentSignOff(imported, "quality").status,
      REVIEW_STATUSES.APPROVED,
    );
  });

  test("H-047 schema-v4 migration creates Pending sign-offs without trusting legacy fields", () => {
    freshProduct();

    const legacyState = JSON.parse(serializeState());

    legacyState.schemaVersion = 4;
    delete legacyState.products[legacyState.activeProductId].signOffs;

    const migrated = migrateState(legacyState);
    const product = migrated.products[migrated.activeProductId];

    assertEqual(migrated.schemaVersion, 5);
    assertEqual(product.signOffs.length, 3);
    assertEqual(
      product.signOffs.every(
        (signOff) => signOff.status === REVIEW_STATUSES.PENDING,
      ),
      true,
    );

    const forgedLegacyState = JSON.parse(serializeState());

    forgedLegacyState.schemaVersion = 4;
    forgedLegacyState.products[
      forgedLegacyState.activeProductId
    ].signOffs[0] = {
      ...forgedLegacyState.products[forgedLegacyState.activeProductId]
        .signOffs[0],
      status: REVIEW_STATUSES.APPROVED,
      reviewer: { name: "Forged", role: "Legacy" },
      reviewedAt: "2026-08-20T00:00:00.000Z",
      artworkVersion: "forged",
    };

    const safelyMigrated = migrateState(forgedLegacyState);

    assertEqual(
      safelyMigrated.products[safelyMigrated.activeProductId].signOffs[0]
        .status,
      REVIEW_STATUSES.PENDING,
    );
  });

  test("H-048 duplicate product deeply clones sign-offs and signatures", () => {
    const source = prepareReadyProduct();

    source.productName = "Signed source";
    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    setDepartmentSignature("quality", createTestSignature());

    const duplicateId = duplicateProduct(source.id);
    const duplicate = getProductById(duplicateId);

    assertEqual(duplicate.signOffs[0].status, REVIEW_STATUSES.APPROVED);
    assertNotEqual(duplicate.signOffs, source.signOffs);
    assertNotEqual(duplicate.signOffs[0], source.signOffs[0]);
    assertNotEqual(
      duplicate.signOffs[0].signature,
      source.signOffs[0].signature,
    );
  });

  // ============================================================
  // UI AND POINTER EVENTS
  // ============================================================

  test("H-049 header renders derived overall sign-off status", () => {
    const product = approveEveryDepartment(prepareReadyProduct());

    renderSignOffState();

    const button = document.getElementById("signoff-button");

    assertEqual(button.dataset.status, REVIEW_STATUSES.APPROVED);
    assertEqual(
      document.getElementById("signoff-button-status").textContent,
      "Approved",
    );
  });

  test("H-050 sign-off panel renders exactly three department cards", () => {
    freshProduct();

    openSignOffPanel();

    assertEqual(signOffUiState.isOpen, true);
    assertEqual(
      document.querySelectorAll("[data-department-card]").length,
      3,
    );
    assertEqual(
      document.getElementById("signoff-overlay").getAttribute("aria-hidden"),
      "false",
    );
  });

  test("H-051 reviewer form input updates active product", () => {
    const product = freshProduct();

    openSignOffPanel();

    const input = document.getElementById("signoff-reviewer-name");

    input.value = "UI Reviewer";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    assertEqual(product.reviewer.name, "UI Reviewer");
  });

  test("H-052 UI decision button records an independent approval", () => {
    const product = prepareReadyProduct();

    openSignOffPanel();

    document
      .querySelector(
        '[data-department-id="quality"][data-decision="approved"]',
      )
      .click();

    assertEqual(
      getDepartmentSignOff(product, "quality").status,
      REVIEW_STATUSES.APPROVED,
    );
    assertEqual(
      getDepartmentSignOff(product, "production").status,
      REVIEW_STATUSES.PENDING,
    );
  });

  test("H-053 UI rejection exposes required comment validation", () => {
    prepareReadyProduct();

    openSignOffPanel();

    document
      .querySelector(
        '[data-department-id="quality"][data-decision="rejected"]',
      )
      .click();

    const comment = document.querySelector(
      '[data-department-comment="quality"]',
    );

    assertEqual(comment.getAttribute("aria-invalid"), "true");
    assertEqual(document.activeElement, comment);
  });

  test("H-054 mouse Pointer Events draw ink on the signature canvas", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    openSignOffPanel();
    openSignaturePad("quality");

    const canvas = document.getElementById("signature-canvas");
    const bounds = canvas.getBoundingClientRect();
    const x = bounds.left + Math.max(1, bounds.width / 3);
    const y = bounds.top + Math.max(1, bounds.height / 2);

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 101,
        pointerType: "mouse",
        clientX: x,
        clientY: y,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 101,
        pointerType: "mouse",
        clientX: x + 12,
        clientY: y + 8,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerId: 101,
        pointerType: "mouse",
        clientX: x + 12,
        clientY: y + 8,
      }),
    );

    assertEqual(signaturePadState.hasInk, true);
    assertEqual(signaturePadState.isDrawing, false);
  });

  test("H-055 touch Pointer Events use the same signature path", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    openSignOffPanel();
    openSignaturePad("quality");

    const canvas = document.getElementById("signature-canvas");
    const bounds = canvas.getBoundingClientRect();

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 202,
        pointerType: "touch",
        clientX: bounds.left + 10,
        clientY: bounds.top + 10,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerId: 202,
        pointerType: "touch",
        clientX: bounds.left + 10,
        clientY: bounds.top + 10,
      }),
    );

    assertEqual(signaturePadState.hasInk, true);
  });

  test("H-056 Clear removes all transient signature ink", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    openSignOffPanel();
    openSignaturePad("quality");
    signaturePadState.hasInk = true;

    document.getElementById("signature-clear").click();

    assertEqual(signaturePadState.hasInk, false);
  });

  test("H-057 Confirm stores the canvas PNG and renders Signed", () => {
    const product = prepareReadyProduct();

    setDepartmentSignOffStatus("quality", REVIEW_STATUSES.APPROVED);
    openSignOffPanel();
    openSignaturePad("quality");

    const canvas = document.getElementById("signature-canvas");
    const context = canvas.getContext("2d");

    context.beginPath();
    context.moveTo(20, 100);
    context.lineTo(160, 120);
    context.stroke();
    signaturePadState.hasInk = true;

    confirmDepartmentSignature();

    const signOff = getDepartmentSignOff(product, "quality");

    assertEqual(isValidDepartmentSignature(signOff.signature), true);
    assertEqual(
      document.querySelector(
        '[data-department-card="quality"] .department-signed-state',
      ).textContent,
      "Signed",
    );
  });
})();
