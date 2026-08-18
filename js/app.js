// ============================================================
// ARTWORK & PACK COPY CHECKLIST
// Layer B — Centralized Domain Model
// ============================================================

// ============================================================
// REVIEW STATUS DEFINITIONS
// ============================================================

const CURRENT_SCHEMA_VERSION = 2;

const REVIEW_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const REVIEW_STATUS_LABELS = Object.freeze({
  [REVIEW_STATUSES.PENDING]: "Pending",
  [REVIEW_STATUSES.APPROVED]: "Approved",
  [REVIEW_STATUSES.REJECTED]: "Rejected",
});

function getReviewStatusLabel(status) {
  return REVIEW_STATUS_LABELS[status] || "Unknown";
}

const VALID_REVIEW_STATUSES = new Set(Object.values(REVIEW_STATUSES));

// ============================================================
// STATIC CHECKLIST DEFINITIONS
// ============================================================
//
// sectionDefinitions contains the original/static definition
// of the checklist.
//
// It is NOT the current state of a review.
//
// The actual review state lives inside appState.
//

const sectionDefinitions = [
  {
    id: "legal-core",
    title: "1. Legal Core (BRCGS 5.2.1)",
    items: [
      {
        id: "1a",
        title: "Product Name / Legal Name",
        note: "Must be clear, not misleading, and reflect true nature of food",
      },
      {
        id: "1b",
        title: "Net Quantity (Weight / Volume)",
        note: "g or ml, with e-mark where applicable",
      },
      {
        id: "1c",
        title: "e Mark Present",
        note: "If pre-packed, verify e-mark is correctly placed",
      },
      {
        id: "1d",
        title: "Legal Product Descriptor",
        note: "Accurate description of product category",
      },
      {
        id: "1e",
        title: "Business Name & Address (FBO)",
        note: "Full address or code referencing pack info",
      },
      {
        id: "1f",
        title: "Website",
        note: "",
      },
      {
        id: "1g",
        title: "Country of Manufacture / Origin",
        note: "COOL info if required (primary ingredient rule)",
      },
      {
        id: "1h",
        title: "Best Before / Use By Date Format & Location",
        note: "",
      },
      {
        id: "1i",
        title: "Lot / Batch Code Present",
        note: "",
      },
      {
        id: "1j",
        title: "Barcode & 2D Codes",
        note: "Readable, correct dimensions, front & back if applicable",
      },
    ],
  },

  {
    id: "ingredients-allergens",
    title: "2. Ingredients & Allergens",
    items: [
      {
        id: "2a",
        title: "Ingredients Declaration",
        note: "Descending order by weight; bolded allergens",
      },
      {
        id: "2b",
        title: "Allergy Advice Box",
        note: '"For allergens, see ingredients in bold" (if contains allergens)',
      },
      {
        id: "2c",
        title: "Nut Warning Statement",
        note: "O/H & B/L or B/L only as applicable",
      },
      {
        id: "2d",
        title: "Intolerance Info",
        note: "",
      },
      {
        id: "2e",
        title: '"Some Separation is Natural"',
        note: "If applicable",
      },
    ],
  },

  {
    id: "nutrition-serving",
    title: "3. Nutrition & Serving",
    items: [
      {
        id: "3a",
        title: "Energy (kJ / kcal)",
        note: "",
      },
      {
        id: "3b",
        title: "Fat & Saturates",
        note: "",
      },
      {
        id: "3c",
        title: "Carbohydrates & Sugars",
        note: "",
      },
      {
        id: "3d",
        title: "Protein",
        note: "",
      },
      {
        id: "3e",
        title: "Salt",
        note: 'Or "Salt due to presence of naturally occurring sodium"',
      },
      {
        id: "3f",
        title: "Optional: Fibre, Starch, Polyols, Mono/Polyunsaturates",
        note: "",
      },
      {
        id: "3g",
        title: "Vitamins & Minerals",
        note: "If added or claimed",
      },
      {
        id: "3h",
        title: "Reference Intakes (RIs) — Front of Pack",
        note: "",
      },
      {
        id: "3i",
        title: "Serving Size & Number of Servings",
        note: "",
      },
      {
        id: "3j",
        title: "Guideline Daily Amounts / % RI per portion",
        note: "",
      },
    ],
  },

  {
    id: "storage-cooking",
    title: "4. Storage & Cooking",
    items: [
      {
        id: "4a",
        title: "Storage Instructions",
        note: "",
      },
      {
        id: "4b",
        title: "Storage Instructions — Once Opened",
        note: "",
      },
      {
        id: "4c",
        title: "Cooking Instructions",
        note: "If applicable",
      },
      {
        id: "4d",
        title: "Serving Suggestion",
        note: "If image shown",
      },
    ],
  },

  {
    id: "claims-certifications",
    title: "5. Claims & Certifications",
    items: [
      {
        id: "5a",
        title: "Suitable for Vegetarians",
        note: "",
      },
      {
        id: "5b",
        title: "Suitable for Vegans / Vegan Certified",
        note: "Certified requires registration number/logo",
      },
      {
        id: "5c",
        title: "Gluten Free / Wheat Free / Suitable",
        note: "",
      },
      {
        id: "5d",
        title: "Free From Claims",
        note: "",
      },
      {
        id: "5e",
        title: "Halal Claim",
        note: "",
      },
      {
        id: "5f",
        title: "Kosher Claim",
        note: "",
      },
      {
        id: "5g",
        title: "Organic Logo & Cert Body",
        note: "Logo min 9mm(H) × 13.5mm(W), ratio 1:1.5",
      },
      {
        id: "5h",
        title: "No Artificial Colours, Preservatives or Flavours",
        note: "",
      },
      {
        id: "5i",
        title: "No Added Fat / Low Fat / Low Sugar / Low Calorie",
        note: "",
      },
      {
        id: "5j",
        title: "Provenance / Variety Claim",
        note: "",
      },
      {
        id: "5k",
        title: "Chilli Pepper Heat Level",
        note: "",
      },
      {
        id: "5l",
        title: "Any Other Claim",
        note: "Specify in notes",
      },
    ],
  },

  {
    id: "packaging-marks-languages",
    title: "6. Packaging, Marks & Languages",
    items: [
      {
        id: "6a",
        title: "Multilingual Wording",
        note: "ES, FR, IT, DE etc.",
      },
      {
        id: "6b",
        title: "Customer Guarantee Statement",
        note: "",
      },
      {
        id: "6c",
        title: "Package Recycling Statement / Info",
        note: "",
      },
      {
        id: "6d",
        title: "Dairy Health Mark",
        note: "UK FR 036 EC / UK FR 048 EC",
      },
      {
        id: "6e",
        title: "Label Size — Length / Width",
        note: "",
      },
      {
        id: "6f",
        title: "Label Commodity Codes",
        note: "",
      },
      {
        id: "6g",
        title: "Product Name on Back Label Too?",
        note: "Y/N",
      },
      {
        id: "6h",
        title: "Tamper Evidence",
        note: "Type, Text, Size",
      },
    ],
  },
];

// ============================================================
// DOMAIN FACTORIES
// ============================================================

function createInitialItems() {
  const items = {};

  sectionDefinitions.forEach((section) => {
    section.items.forEach((definition) => {
      const itemState = {
        id: definition.id,

        sectionId: section.id,

        currentTitle: definition.title,

        note: definition.note,

        status: REVIEW_STATUSES.PENDING,

        comment: "",

        pin: null,
      };

      /*
       * originalTitle represents the immutable title defined
       * by the checklist template.
       *
       * It can be read and serialized, but the application
       * cannot overwrite it accidentally.
       */
      Object.defineProperty(itemState, "originalTitle", {
        value: definition.title,
        writable: false,
        enumerable: true,
        configurable: false,
      });

      items[definition.id] = itemState;
    });
  });

  return items;
}

function createProduct(id) {
  const now = new Date().toISOString();

  return {
    id,

    brand: "",

    productName: "",

    weight: "",

    sku: "",

    artwork: null,

    items: createInitialItems(),

    reviewer: {
      name: "",
      role: "",
      reviewedAt: null,
    },

    signature: null,

    createdAt: now,

    updatedAt: now,
  };
}

// ============================================================
// APPLICATION STATE
// ============================================================
//
// This is the main source of truth for domain data.
//
// DOM elements must reflect this object.
// The DOM must not be used as the authoritative source
// of review data.
//

const appState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,

  activeProductId: "product-1",

  products: {},
};

appState.products["product-1"] = createProduct("product-1");

// ============================================================
// DOMAIN GETTERS
// ============================================================

function getActiveProduct() {
  return appState.products[appState.activeProductId] || null;
}

function getItemById(itemId) {
  const product = getActiveProduct();

  if (!product) {
    return null;
  }

  return product.items[itemId] || null;
}

// ============================================================
// DOMAIN HELPERS
// ============================================================

function touchActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  product.updatedAt = new Date().toISOString();
}

function isValidReviewStatus(status) {
  return VALID_REVIEW_STATUSES.has(status);
}

function setItemStatus(itemId, status) {
  const item = getItemById(itemId);

  if (!item) {
    console.warn(`Checklist item "${itemId}" was not found.`);
    return false;
  }

  if (!isValidReviewStatus(status)) {
    console.warn(`Invalid review status: "${status}".`);
    return false;
  }

  item.status = status;

  touchActiveProduct();

  return true;
}

function setItemCurrentTitle(itemId, newTitle) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  const normalizedTitle = String(newTitle).trim();

  if (!normalizedTitle) {
    return false;
  }

  item.currentTitle = normalizedTitle;

  touchActiveProduct();

  return true;
}

function setItemComment(itemId, comment) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  item.comment = String(comment);

  touchActiveProduct();

  saveStateToStorage();

  return true;
}

function setItemPin(itemId, pin) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  if (pin !== null && !isNormalizedPin(pin)) {
    console.warn(`Invalid normalized pin for "${itemId}".`);

    return false;
  }

  item.pin =
    pin === null
      ? null
      : {
          xRatio: pin.xRatio,
          yRatio: pin.yRatio,
        };

  touchActiveProduct();

  return true;
}

// ============================================================
// DOMAIN VALIDATION
// ============================================================
//
// Rejected + empty comment is recognized as an invalid state.
//
// The UI enforcement of this rule belongs to the comments
// workflow layer, but the domain already understands the rule.
//

function validateItemState(item) {
  const errors = [];

  if (!isValidReviewStatus(item.status)) {
    errors.push(`Invalid status "${item.status}".`);
  }

  if (item.status === REVIEW_STATUSES.REJECTED && item.comment.trim() === "") {
    errors.push("Rejected items require a comment.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return {
      valid: false,
      errors: ["No active product."],
    };
  }

  const errors = [];

  Object.values(product.items).forEach((item) => {
    const result = validateItemState(item);

    result.errors.forEach((error) => {
      errors.push(`${item.id.toUpperCase()}: ${error}`);
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// CHECKLIST RENDERING
// ============================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderChecklist() {
  const checklistElement = document.getElementById("checklist");

  if (!checklistElement) {
    return;
  }

  checklistElement.innerHTML = "";

  sectionDefinitions.forEach((section, sectionIndex) => {
    const sectionButton = document.createElement("button");

    sectionButton.className =
      "section-btn" + (sectionIndex > 0 ? " collapsed" : "");

    sectionButton.innerHTML = `
      <span>${section.title}</span>

      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path d="M19 9l-7 7-7-7"/>
      </svg>
    `;

    const sectionContent = document.createElement("div");

    sectionContent.className =
      "section-content" + (sectionIndex > 0 ? " hidden" : "");

    sectionButton.addEventListener("click", () => {
      sectionContent.classList.toggle("hidden");

      sectionButton.classList.toggle("collapsed");
    });

    section.items.forEach((itemDefinition) => {
      const item = getItemById(itemDefinition.id);

      if (!item) {
        return;
      }

      const itemElement = document.createElement("div");

      itemElement.className = "check-item";

      itemElement.draggable = true;

      itemElement.dataset.id = item.id;

      itemElement.dataset.status = item.status;

      itemElement.innerHTML = `
        <div class="check-item-body">

          <div class="check-item-top">

            <span class="ref-tag">
              ${item.id.toUpperCase()}
            </span>

            <div class="copy-title-area">

              <div class="copy-title-row">

                <span
                  class="check-item-title"
                  data-role="current-title"
                >
                  ${escapeHtml(item.currentTitle)}
                </span>

                <span
                  class="edited-badge"
                  data-role="edited-badge"
                  hidden
                >
                  Edited
                </span>

              </div>

            <input
              type="text"
              class="title-edit-input"
              data-role="title-edit-input"
              aria-label="Edit title for ${item.id.toUpperCase()}"
              draggable="false"
              hidden
            >

          </div>

            <span
              class="review-status"
              data-role="status-label"
              data-status="${item.status}"
            >
              ${getReviewStatusLabel(item.status)}
            </span>

          </div>

          <div
            class="copy-correction-meta"
            data-role="copy-correction-meta"
            hidden
          >
            <span>
              Original:
              <span data-role="original-title"></span>
            </span>

            <button
              type="button"
              class="restore-title-btn"
              data-action="restore-title"
            >
              Restore original
            </button>
          </div>

          ${item.note ? `<div class="check-item-note">${item.note}</div>` : ""}

          <div
            class="comment-panel"
            id="comment-panel-${item.id}"
            data-role="comment-panel"
            hidden
          >
            <label
              class="comment-label"
              for="comment-${item.id}"
            >
              Review comment
            </label>

            <textarea
              id="comment-${item.id}"
              class="comment-textarea"
              data-role="comment-input"
              rows="3"
              placeholder="Add a review comment..."
              aria-describedby="comment-error-${item.id}"
              aria-invalid="false"
              draggable="false"
            ></textarea>
          </div>

          <div
            class="comment-error"
            id="comment-error-${item.id}"
            data-role="comment-error"
            role="alert"
            hidden
          ></div>

        </div>

        <div class="review-actions">
          <button
            type="button"
            class="review-btn review-btn-comment"
            data-action="comment"
            title="Add comment"
            aria-label="Add comment to ${item.id.toUpperCase()}"
            aria-controls="comment-panel-${item.id}"
            aria-expanded="false"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
              />
            </svg>
          </button>

          <button
            type="button"
            class="review-btn review-btn-approve"
            data-action="approve"
            title="Approve"
            aria-label="Approve ${item.id.toUpperCase()}"
            aria-pressed="false"
          >
            ✓
          </button>

          <button
            type="button"
            class="review-btn review-btn-reject"
            data-action="reject"
            title="Reject"
            aria-label="Reject ${item.id.toUpperCase()}"
            aria-pressed="false"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          class="check-item-hint edit-title-btn"
          data-action="edit-title"
          title="Edit copy"
          aria-label="Edit ${item.id.toUpperCase()}"
          aria-pressed="false"
        >

          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>

        </button>
      `;

      const approveButton = itemElement.querySelector(
        '[data-action="approve"]',
      );

      const rejectButton = itemElement.querySelector('[data-action="reject"]');

      const commentButton = itemElement.querySelector(
        '[data-action="comment"]',
      );

      const commentTextarea = itemElement.querySelector(
        '[data-role="comment-input"]',
      );

      const editTitleButton = itemElement.querySelector(
        '[data-action="edit-title"]',
      );

      const titleEditInput = itemElement.querySelector(
        '[data-role="title-edit-input"]',
      );

      const restoreTitleButton = itemElement.querySelector(
        '[data-action="restore-title"]',
      );

      // ============================================================
      // COMMENT EVENTS
      // ============================================================

      commentButton.addEventListener("click", (event) => {
        event.stopPropagation();

        toggleCommentPanel(item.id);
      });

      commentTextarea.addEventListener("input", (event) => {
        setItemComment(item.id, event.target.value);

        renderCommentState(item.id);
      });

      commentTextarea.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });

      commentTextarea.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      editTitleButton.addEventListener("click", (event) => {
        event.stopPropagation();

        if (editingTitleItemId === item.id) {
          commitTitleEdit(item.id);
          return;
        }

        beginTitleEdit(item.id);
      });

      titleEditInput.addEventListener("keydown", (event) => {
        event.stopPropagation();

        if (event.key === "Enter") {
          event.preventDefault();

          commitTitleEdit(item.id);
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();

          cancelTitleEdit(item.id);
        }
      });

      titleEditInput.addEventListener("blur", () => {
        if (editingTitleItemId !== item.id) {
          return;
        }

        commitTitleEdit(item.id);
      });

      titleEditInput.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });

      restoreTitleButton.addEventListener("click", (event) => {
        event.stopPropagation();

        restoreOriginalTitle(item.id);
      });

      // ============================================================
      // REVIEW ACTION EVENTS
      // ============================================================

      approveButton.addEventListener("click", (event) => {
        event.stopPropagation();

        handleReviewAction(item.id, REVIEW_STATUSES.APPROVED);
      });

      rejectButton.addEventListener("click", (event) => {
        event.stopPropagation();

        handleReviewAction(item.id, REVIEW_STATUSES.REJECTED);
      });

      // ============================================================
      // DRAG ITEM TO ARTWORK
      // ============================================================

      itemElement.addEventListener("dragstart", (event) => {
        /*
         * Interactive controls inside the checklist item must not
         * start an artwork drag operation.
         */
        if (event.target.closest("button, textarea, input, label")) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.setData("text/plain", item.id);

        event.dataTransfer.effectAllowed = "copy";

        itemElement.classList.add("dragging");
      });

      itemElement.addEventListener("dragend", () => {
        itemElement.classList.remove("dragging");
      });

      itemElement.addEventListener("mouseenter", () => {
        highlightPin(item.id);
      });

      itemElement.addEventListener("mouseleave", () => {
        unhighlightPin(item.id);
      });

      sectionContent.appendChild(itemElement);
    });

    checklistElement.appendChild(sectionButton);

    checklistElement.appendChild(sectionContent);
  });
}

// ============================================================
// UI STATE
// ============================================================
//
// These values describe temporary interface state.
// They are not part of the product/review domain.
//

const openCommentItemIds = new Set();

let editingTitleItemId = null;

let currentZoom = 1;

// ============================================================
// ZOOM
// ============================================================

function zoom(delta) {
  currentZoom = Math.max(0.5, Math.min(2, currentZoom + delta));

  const wrapper = document.getElementById("artwork-wrapper");

  const zoomLevel = document.getElementById("zoom-level");

  if (wrapper) {
    wrapper.style.transform = `scale(${currentZoom})`;
  }

  if (zoomLevel) {
    zoomLevel.textContent = Math.round(currentZoom * 100) + "%";
  }
}

// ============================================================
// COMMENT UI
// ============================================================

function toggleCommentPanel(itemId) {
  if (openCommentItemIds.has(itemId)) {
    openCommentItemIds.delete(itemId);
  } else {
    openCommentItemIds.add(itemId);
  }

  renderCommentState(itemId);
}

function openCommentPanel(itemId, shouldFocus = false) {
  openCommentItemIds.add(itemId);

  renderCommentState(itemId);

  if (shouldFocus) {
    const itemElement = document.querySelector(
      `.check-item[data-id="${itemId}"]`,
    );

    const textarea = itemElement?.querySelector('[data-role="comment-input"]');

    if (textarea) {
      textarea.focus();
    }
  }
}

function renderCommentState(itemId) {
  const item = getItemById(itemId);

  if (!item) {
    return;
  }

  const itemElement = document.querySelector(
    `.check-item[data-id="${itemId}"]`,
  );

  if (!itemElement) {
    return;
  }

  const commentButton = itemElement.querySelector('[data-action="comment"]');

  const commentPanel = itemElement.querySelector('[data-role="comment-panel"]');

  const textarea = itemElement.querySelector('[data-role="comment-input"]');

  const errorElement = itemElement.querySelector('[data-role="comment-error"]');

  const isOpen = openCommentItemIds.has(itemId);

  const hasComment = item.comment.trim().length > 0;

  const validation = validateItemState(item);

  const commentRequired = validation.errors.includes(
    "Rejected items require a comment.",
  );

  itemElement.dataset.valid = String(validation.valid);

  if (commentPanel) {
    commentPanel.hidden = !isOpen;
  }

  if (textarea && textarea.value !== item.comment) {
    textarea.value = item.comment;
  }

  if (textarea) {
    textarea.setAttribute("aria-invalid", String(commentRequired));
  }

  if (commentButton) {
    commentButton.classList.toggle("active", isOpen);

    commentButton.classList.toggle("has-comment", hasComment);

    commentButton.classList.toggle("invalid", commentRequired);

    commentButton.setAttribute("aria-expanded", String(isOpen));

    commentButton.title = hasComment ? "View or edit comment" : "Add comment";
  }

  if (errorElement) {
    errorElement.hidden = !commentRequired;

    errorElement.textContent = commentRequired
      ? "Comment required: explain why this item was rejected."
      : "";
  }
}

// ============================================================
// INLINE COPY EDITING
// ============================================================

function isItemTitleEdited(item) {
  return item.currentTitle !== item.originalTitle;
}

function beginTitleEdit(itemId) {
  const item = getItemById(itemId);

  if (!item) {
    return;
  }

  editingTitleItemId = itemId;

  renderItemState(itemId);

  const itemElement = document.querySelector(
    `.check-item[data-id="${itemId}"]`,
  );

  const input = itemElement?.querySelector('[data-role="title-edit-input"]');

  if (input) {
    input.focus();
    input.select();
  }
}

function commitTitleEdit(itemId) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  const itemElement = document.querySelector(
    `.check-item[data-id="${itemId}"]`,
  );

  const input = itemElement?.querySelector('[data-role="title-edit-input"]');

  if (!input) {
    return false;
  }

  const proposedTitle = input.value.trim();

  if (!proposedTitle) {
    editingTitleItemId = null;

    renderItemState(itemId);

    showToast("Title cannot be empty. Edit cancelled.");

    return false;
  }

  const updated = setItemCurrentTitle(itemId, proposedTitle);

  if (!updated) {
    return false;
  }

  editingTitleItemId = null;

  renderItemState(itemId);

  if (item.pin) {
    renderPin(itemId);
  }

  saveStateToStorage();

  return true;
}

function cancelTitleEdit(itemId) {
  if (editingTitleItemId !== itemId) {
    return;
  }

  editingTitleItemId = null;

  renderItemState(itemId);
}

function restoreOriginalTitle(itemId) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  const restored = setItemCurrentTitle(itemId, item.originalTitle);

  if (!restored) {
    return false;
  }

  editingTitleItemId = null;

  renderItemState(itemId);

  if (item.pin) {
    renderPin(itemId);
  }

  saveStateToStorage();

  return true;
}

// ============================================================
// ITEM STATE RENDERING
// ============================================================

function renderItemState(itemId) {
  const item = getItemById(itemId);

  if (!item) {
    return;
  }

  const itemElement = document.querySelector(
    `.check-item[data-id="${itemId}"]`,
  );

  if (!itemElement) {
    return;
  }

  const titleElement = itemElement.querySelector(".check-item-title");

  const titleEditInput = itemElement.querySelector(
    '[data-role="title-edit-input"]',
  );

  const editedBadge = itemElement.querySelector('[data-role="edited-badge"]');

  const correctionMeta = itemElement.querySelector(
    '[data-role="copy-correction-meta"]',
  );

  const originalTitleElement = itemElement.querySelector(
    '[data-role="original-title"]',
  );

  const editTitleButton = itemElement.querySelector(
    '[data-action="edit-title"]',
  );

  const isEditing = editingTitleItemId === itemId;

  const isEdited = isItemTitleEdited(item);

  itemElement.dataset.edited = String(isEdited);

  const statusLabel = itemElement.querySelector('[data-role="status-label"]');

  const approveButton = itemElement.querySelector('[data-action="approve"]');

  const rejectButton = itemElement.querySelector('[data-action="reject"]');

  const isApproved = item.status === REVIEW_STATUSES.APPROVED;

  const isRejected = item.status === REVIEW_STATUSES.REJECTED;

  itemElement.dataset.status = item.status;

  if (titleElement) {
    titleElement.textContent = item.currentTitle;

    titleElement.hidden = isEditing;
  }

  if (titleEditInput) {
    titleEditInput.hidden = !isEditing;

    if (!isEditing || document.activeElement !== titleEditInput) {
      titleEditInput.value = item.currentTitle;
    }
  }

  if (editedBadge) {
    editedBadge.hidden = !isEdited;
  }

  if (correctionMeta) {
    correctionMeta.hidden = !isEdited;
  }

  if (originalTitleElement) {
    originalTitleElement.textContent = item.originalTitle;
  }

  if (editTitleButton) {
    editTitleButton.classList.toggle("active", isEditing);

    editTitleButton.setAttribute("aria-pressed", String(isEditing));
  }

  if (statusLabel) {
    statusLabel.textContent = getReviewStatusLabel(item.status);

    statusLabel.dataset.status = item.status;
  }

  if (approveButton) {
    approveButton.classList.toggle("active", isApproved);

    approveButton.setAttribute("aria-pressed", String(isApproved));
  }

  if (rejectButton) {
    rejectButton.classList.toggle("active", isRejected);

    rejectButton.setAttribute("aria-pressed", String(isRejected));
  }
  renderCommentState(itemId);
}

// ============================================================
// REVIEW STATUS ACTIONS
// ============================================================
//
// User action
//      ↓
// domain state
//      ↓
// render
//      ↓
// UI
//

function handleReviewAction(itemId, requestedStatus) {
  const item = getItemById(itemId);

  if (!item) {
    return;
  }

  const nextStatus =
    item.status === requestedStatus ? REVIEW_STATUSES.PENDING : requestedStatus;

  if (!setItemStatus(itemId, nextStatus)) {
    return;
  }

  if (nextStatus === REVIEW_STATUSES.REJECTED) {
    openCommentItemIds.add(itemId);
  }

  renderItemState(itemId);

  updateProgress();

  if (nextStatus === REVIEW_STATUSES.REJECTED) {
    const itemElement = document.querySelector(
      `.check-item[data-id="${itemId}"]`,
    );

    const textarea = itemElement?.querySelector('[data-role="comment-input"]');

    if (textarea) {
      textarea.focus();
    }
  }

  saveStateToStorage();
}

// ============================================================
// PROGRESS
// ============================================================
//
// Progress reads appState.
// It does not count checked DOM elements.
//

function updateProgress() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const items = Object.values(product.items);

  const reviewedCount = items.filter(
    (item) => item.status !== REVIEW_STATUSES.PENDING,
  ).length;

  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");

  if (progressText) {
    progressText.textContent = `${reviewedCount} / ${items.length} reviewed`;
  }

  const percentage =
    items.length === 0 ? 0 : (reviewedCount / items.length) * 100;

  if (progressBar) {
    progressBar.style.width = percentage + "%";
  }
}

// ============================================================
// PRODUCT INPUTS
// ============================================================

function renderProductInputs() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const brandInput = document.getElementById("inp-brand");

  const nameInput = document.getElementById("inp-name");

  const weightInput = document.getElementById("inp-weight");

  const skuInput = document.getElementById("inp-sku");

  if (brandInput) {
    brandInput.value = product.brand;
  }

  if (nameInput) {
    nameInput.value = product.productName;
  }

  if (weightInput) {
    weightInput.value = product.weight;
  }

  if (skuInput) {
    skuInput.value = product.sku;
  }
}

function bindProductInputs() {
  const brandInput = document.getElementById("inp-brand");

  const nameInput = document.getElementById("inp-name");

  const weightInput = document.getElementById("inp-weight");

  const skuInput = document.getElementById("inp-sku");

  if (brandInput) {
    brandInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.brand = event.target.value;

      touchActiveProduct();

      saveStateToStorage();
    });
  }

  if (nameInput) {
    nameInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.productName = event.target.value;

      touchActiveProduct();

      saveStateToStorage();
    });
  }

  if (weightInput) {
    weightInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.weight = event.target.value;

      touchActiveProduct();

      saveStateToStorage();
    });
  }

  if (skuInput) {
    skuInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.sku = event.target.value;

      touchActiveProduct();

      saveStateToStorage();
    });
  }
}

// ============================================================
// PINS
// ============================================================

const pinsLayer = document.getElementById("pins-layer");

const artworkWrapper = document.getElementById("artwork-wrapper");

function clampRatio(value) {
  return Math.min(1, Math.max(0, value));
}

function isNormalizedPin(pin) {
  if (!isPlainObject(pin)) {
    return false;
  }

  return (
    Number.isFinite(pin.xRatio) &&
    Number.isFinite(pin.yRatio) &&
    pin.xRatio >= 0 &&
    pin.xRatio <= 1 &&
    pin.yRatio >= 0 &&
    pin.yRatio <= 1
  );
}

function isLegacyPixelPin(pin) {
  if (!isPlainObject(pin)) {
    return false;
  }

  return Number.isFinite(pin.x) && Number.isFinite(pin.y);
}

function calculatePinRatios(clientX, clientY, rectangle) {
  if (!rectangle || rectangle.width <= 0 || rectangle.height <= 0) {
    return null;
  }

  return {
    xRatio: clampRatio((clientX - rectangle.left) / rectangle.width),

    yRatio: clampRatio((clientY - rectangle.top) / rectangle.height),
  };
}

function getArtworkBaseDimensions() {
  if (!artworkWrapper) {
    return null;
  }

  const width = artworkWrapper.offsetWidth;

  const height = artworkWrapper.offsetHeight;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    width,
    height,
  };
}

function convertLegacyPixelPin(pin, width, height) {
  if (!isLegacyPixelPin(pin) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    xRatio: clampRatio(pin.x / width),

    yRatio: clampRatio(pin.y / height),
  };
}

if (pinsLayer) {
  pinsLayer.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  pinsLayer.addEventListener("drop", (event) => {
    event.preventDefault();

    const itemId = event.dataTransfer.getData("text/plain");

    if (!itemId || !artworkWrapper) {
      return;
    }

    const rectangle = artworkWrapper.getBoundingClientRect();

    const pin = calculatePinRatios(event.clientX, event.clientY, rectangle);

    if (!pin) {
      return;
    }

    addPin(itemId, pin);
  });
}

function createPinElement(item) {
  const pinElement = document.createElement("div");

  pinElement.className = "pin";

  pinElement.dataset.pid = item.id;

  pinElement.style.left = `${item.pin.xRatio * 100}%`;

  pinElement.style.top = `${item.pin.yRatio * 100}%`;

  pinElement.innerHTML = `
    <div class="pin-tooltip">
      ${escapeHtml(item.currentTitle)}
    </div>

    <div class="pin-marker">
      ${item.id.toUpperCase()}
    </div>
  `;

  pinElement.addEventListener("click", () => {
    scrollToItem(item.id);
  });

  return pinElement;
}

function renderPin(itemId) {
  if (!pinsLayer) {
    return;
  }

  const existing = document.querySelector(`.pin[data-pid="${itemId}"]`);

  if (existing) {
    existing.remove();
  }

  const item = getItemById(itemId);

  if (!item || !item.pin) {
    return;
  }

  const pinElement = createPinElement(item);

  pinsLayer.appendChild(pinElement);
}

function renderPins() {
  if (!pinsLayer) {
    return;
  }

  pinsLayer.innerHTML = "";

  const product = getActiveProduct();

  if (!product) {
    return;
  }

  Object.values(product.items).forEach((item) => {
    if (item.pin) {
      const pinElement = createPinElement(item);

      pinsLayer.appendChild(pinElement);
    }
  });
}

function addPin(itemId, pin) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  if (!setItemPin(itemId, pin)) {
    return false;
  }

  renderPin(itemId);

  saveStateToStorage();

  showToast(`Pinned ${itemId.toUpperCase()} to artwork`);

  return true;
}

// ============================================================
// PIN ↔ CHECKLIST NAVIGATION
// ============================================================

function scrollToItem(itemId) {
  const element = document.querySelector(`.check-item[data-id="${itemId}"]`);

  if (!element) {
    return;
  }

  const section = element.closest(".section-content");

  if (section && section.classList.contains("hidden")) {
    const sectionButton = section.previousElementSibling;

    if (sectionButton) {
      sectionButton.click();
    }
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  element.style.background = "#dbeafe";

  setTimeout(() => {
    element.style.background = "";
  }, 1200);
}

function highlightPin(itemId) {
  const pin = document.querySelector(`.pin[data-pid="${itemId}"]`);

  if (pin) {
    pin.classList.add("pulse");
  }
}

function unhighlightPin(itemId) {
  const pin = document.querySelector(`.pin[data-pid="${itemId}"]`);

  if (pin) {
    pin.classList.remove("pulse");
  }
}

// ============================================================
// CLEAR PINS
// ============================================================

function clearPins() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  Object.values(product.items).forEach((item) => {
    item.pin = null;
  });

  touchActiveProduct();

  saveStateToStorage();

  renderPins();

  showToast("All pins cleared");
}
// ============================================================
// LAYER D — PERSISTENCE
// D2 — LOCAL STORAGE
// ============================================================

const STORAGE_KEY = `artworkChecklist:v${CURRENT_SCHEMA_VERSION}`;

const LEGACY_STORAGE_KEYS = ["artworkChecklist:v1"];
// ============================================================
// STATE SERIALIZATION
// ============================================================

function serializeState() {
  return JSON.stringify(appState);
}
// ============================================================
// LAYER D — PERSISTENCE
// D1 — DESERIALIZATION
// ============================================================

function deserializeState(serializedState) {
  try {
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Failed to deserialize state:", error);

    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getChecklistDefinition(itemId) {
  for (const section of sectionDefinitions) {
    const definition = section.items.find((item) => item.id === itemId);

    if (definition) {
      return {
        section,
        definition,
      };
    }
  }

  return null;
}

function isValidStoredPin(pin) {
  if (pin === null) {
    return true;
  }

  return isNormalizedPin(pin);
}

function validateSerializedItem(item, expectedItemId) {
  if (!isPlainObject(item)) {
    return false;
  }

  const canonical = getChecklistDefinition(expectedItemId);

  if (!canonical) {
    return false;
  }

  if (item.id !== expectedItemId) {
    return false;
  }

  if (item.sectionId !== canonical.section.id) {
    return false;
  }

  if (item.originalTitle !== canonical.definition.title) {
    return false;
  }

  if (
    typeof item.currentTitle !== "string" ||
    item.currentTitle.trim() === ""
  ) {
    return false;
  }

  if (typeof item.comment !== "string") {
    return false;
  }

  if (!isValidReviewStatus(item.status)) {
    return false;
  }

  if (!isValidStoredPin(item.pin)) {
    return false;
  }

  return true;
}

function validateSerializedProduct(product) {
  if (!isPlainObject(product)) {
    return false;
  }

  if (typeof product.id !== "string" || product.id.trim() === "") {
    return false;
  }

  if (
    typeof product.brand !== "string" ||
    typeof product.productName !== "string" ||
    typeof product.weight !== "string" ||
    typeof product.sku !== "string"
  ) {
    return false;
  }

  if (!isPlainObject(product.items)) {
    return false;
  }

  const expectedItemIds = sectionDefinitions.flatMap((section) =>
    section.items.map((item) => item.id),
  );

  if (Object.keys(product.items).length !== expectedItemIds.length) {
    return false;
  }

  const itemsAreValid = expectedItemIds.every((itemId) =>
    validateSerializedItem(product.items[itemId], itemId),
  );

  if (!itemsAreValid) {
    return false;
  }

  if (product.artwork !== null && !isPlainObject(product.artwork)) {
    return false;
  }

  if (!isPlainObject(product.reviewer)) {
    return false;
  }

  if (
    product.createdAt !== undefined &&
    typeof product.createdAt !== "string"
  ) {
    return false;
  }

  if (
    product.updatedAt !== undefined &&
    typeof product.updatedAt !== "string"
  ) {
    return false;
  }

  return true;
}

function validateState(state) {
  if (!isPlainObject(state)) {
    return false;
  }

  if (state.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return false;
  }

  if (
    typeof state.activeProductId !== "string" ||
    state.activeProductId.trim() === ""
  ) {
    return false;
  }

  if (!isPlainObject(state.products)) {
    return false;
  }

  const productEntries = Object.entries(state.products);

  if (productEntries.length === 0) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(state.products, state.activeProductId)
  ) {
    return false;
  }

  return productEntries.every(([productId, product]) => {
    if (product.id !== productId) {
      return false;
    }

    return validateSerializedProduct(product);
  });
}

function rehydrateItems(savedItems) {
  const hydratedItems = createInitialItems();

  Object.keys(hydratedItems).forEach((itemId) => {
    const savedItem = savedItems[itemId];
    const hydratedItem = hydratedItems[itemId];

    hydratedItem.currentTitle = savedItem.currentTitle;

    hydratedItem.status = savedItem.status;

    hydratedItem.comment = savedItem.comment;

    hydratedItem.pin = savedItem.pin ? { ...savedItem.pin } : null;
  });

  return hydratedItems;
}

function rehydrateProduct(savedProduct) {
  const product = createProduct(savedProduct.id);

  product.brand = savedProduct.brand;

  product.productName = savedProduct.productName;

  product.weight = savedProduct.weight;

  product.sku = savedProduct.sku;

  product.artwork = savedProduct.artwork ?? null;

  product.items = rehydrateItems(savedProduct.items);

  product.reviewer = {
    ...product.reviewer,
    ...savedProduct.reviewer,
  };

  product.signature = savedProduct.signature ?? null;

  if (typeof savedProduct.createdAt === "string") {
    product.createdAt = savedProduct.createdAt;
  }

  if (typeof savedProduct.updatedAt === "string") {
    product.updatedAt = savedProduct.updatedAt;
  }

  return product;
}

function rehydrateState(savedState) {
  const hydratedState = {
    schemaVersion: savedState.schemaVersion,

    activeProductId: savedState.activeProductId,

    products: {},
  };

  Object.entries(savedState.products).forEach(([productId, product]) => {
    hydratedState.products[productId] = rehydrateProduct(product);
  });

  return hydratedState;
}

function migrateItemsPinsToV2(items, dimensions) {
  const migratedItems = {};

  Object.entries(items).forEach(([itemId, item]) => {
    let migratedPin = null;

    if (item.pin === null) {
      migratedPin = null;
    } else if (isNormalizedPin(item.pin)) {
      migratedPin = {
        ...item.pin,
      };
    } else if (isLegacyPixelPin(item.pin)) {
      migratedPin = convertLegacyPixelPin(
        item.pin,
        dimensions.width,
        dimensions.height,
      );

      if (!migratedPin) {
        throw new Error(`Unable to migrate pin for ${itemId}.`);
      }
    } else {
      throw new Error(`Invalid legacy pin for ${itemId}.`);
    }

    migratedItems[itemId] = {
      ...item,
      pin: migratedPin,
    };
  });

  return migratedItems;
}

function migrateState(state) {
  if (!isPlainObject(state)) {
    return null;
  }

  if (state.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return state;
  }

  if (state.schemaVersion === 1) {
    try {
      const dimensions = getArtworkBaseDimensions();

      if (!dimensions) {
        console.warn(
          "Unable to determine artwork dimensions for state migration.",
        );

        return null;
      }

      const migratedState = JSON.parse(JSON.stringify(state));

      Object.values(migratedState.products).forEach((product) => {
        product.items = migrateItemsPinsToV2(product.items, dimensions);
      });

      migratedState.schemaVersion = CURRENT_SCHEMA_VERSION;

      return migratedState;
    } catch (error) {
      console.error("Failed to migrate state:", error);

      return null;
    }
  }

  console.warn(`Unsupported schema version: ${state.schemaVersion}`);

  return null;
}

function getStoredStateRecord() {
  const currentState = localStorage.getItem(STORAGE_KEY);

  if (currentState) {
    return {
      key: STORAGE_KEY,
      serializedState: currentState,
    };
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyState = localStorage.getItem(legacyKey);

    if (legacyState) {
      return {
        key: legacyKey,
        serializedState: legacyState,
      };
    }
  }

  return null;
}

function loadStateFromStorage() {
  try {
    const storedRecord = getStoredStateRecord();

    if (!storedRecord) {
      return false;
    }

    const serializedState = storedRecord.serializedState;

    const parsedState = deserializeState(serializedState);

    if (!parsedState) {
      return false;
    }

    const migratedState = migrateState(parsedState);

    if (!migratedState) {
      return false;
    }

    if (!validateState(migratedState)) {
      console.warn("Saved state failed validation.");
      return false;
    }

    const hydratedState = rehydrateState(migratedState);

    appState.schemaVersion = hydratedState.schemaVersion;

    appState.activeProductId = hydratedState.activeProductId;

    appState.products = hydratedState.products;

    /*
     * If the state came from an older storage key,
     * save the migrated canonical state under the
     * current key and remove the legacy key.
     */
    if (storedRecord.key !== STORAGE_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeState());

        localStorage.removeItem(storedRecord.key);
      } catch (error) {
        console.warn(
          "State migrated but could not replace legacy storage key.",
          error,
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to load state from storage:", error);

    return false;
  }
}
function saveStateToStorage() {
  try {
    const serializedState = serializeState();

    localStorage.setItem(STORAGE_KEY, serializedState);

    showToast("Saved locally");

    return true;
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);

    return false;
  }
}
// ============================================================
// VERSIONED JSON EXPORT — D3
// ============================================================

function buildExportData() {
  const product = getActiveProduct();

  if (!product) {
    return null;
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    exportedAt: new Date().toISOString(),

    product: {
      id: product.id,
      brand: product.brand,
      productName: product.productName,
      weight: product.weight,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    },

    items: product.items,

    artwork: product.artwork,

    reviewer: product.reviewer,
  };
}
function exportReviewAsJson() {
  const data = buildExportData();

  if (!data) {
    showToast("Unable to export review.");
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `artwork-review-${Date.now()}.json`;

  link.click();

  URL.revokeObjectURL(url);

  showToast("Review exported successfully.");
}
// ============================================================
// LEGACY EXPORT
// ============================================================
//
// The JSON format is intentionally kept compatible with
// the baseline.
//
// Versioned serialization belongs to Layer D.
//

function normalizedPinToPixels(pin) {
  if (!isNormalizedPin(pin)) {
    return null;
  }

  const dimensions = getArtworkBaseDimensions();

  if (!dimensions) {
    return null;
  }

  return {
    x: pin.xRatio * dimensions.width,

    y: pin.yRatio * dimensions.height,
  };
}

function buildLegacyCheckData() {
  const product = getActiveProduct();

  if (!product) {
    return null;
  }

  const checks = {};

  const pins = {};

  Object.values(product.items).forEach((item) => {
    checks[item.id] = item.status === REVIEW_STATUSES.APPROVED;

    if (item.pin) {
      const pixelPin = normalizedPinToPixels(item.pin);

      if (pixelPin) {
        pins[item.id] = pixelPin;
      }
    }
  });

  return {
    product: {
      brand: product.brand,

      name: product.productName,

      weight: product.weight,

      sku: product.sku,
    },

    checks,

    pins,

    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// SAVE CHECK
// ============================================================

function saveCheck() {
  const data = buildLegacyCheckData();

  if (!data) {
    showToast("Unable to save checklist.");

    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `artwork-check-${Date.now()}.json`;

  link.click();

  URL.revokeObjectURL(url);

  showToast("Checklist saved! JSON file downloaded.");
}

// ============================================================
// TOAST
// ============================================================

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ============================================================
// COMPLETE STATE RENDER
// ============================================================

function renderAppState() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  renderProductInputs();

  Object.keys(product.items).forEach((itemId) => {
    renderItemState(itemId);
  });

  renderPins();

  updateProgress();
}

// ============================================================
// INITIALIZATION
// ============================================================

function migrateImportData(data) {
  if (!isPlainObject(data)) {
    return null;
  }

  if (data.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  if (data.schemaVersion === 1) {
    try {
      const dimensions = getArtworkBaseDimensions();

      if (!dimensions || !isPlainObject(data.items)) {
        return null;
      }

      const migratedData = JSON.parse(JSON.stringify(data));

      migratedData.items = migrateItemsPinsToV2(migratedData.items, dimensions);

      migratedData.schemaVersion = CURRENT_SCHEMA_VERSION;

      return migratedData;
    } catch (error) {
      console.error("Failed to migrate imported review:", error);

      return null;
    }
  }

  return null;
}

function validateImportData(data) {
  if (!isPlainObject(data)) {
    return {
      valid: false,
      message: "Invalid review file.",
    };
  }

  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return {
      valid: false,
      message: "Unsupported review file version.",
    };
  }

  if (!isPlainObject(data.product)) {
    return {
      valid: false,
      message: "Review file has no valid product.",
    };
  }

  if (typeof data.product.id !== "string" || data.product.id.trim() === "") {
    return {
      valid: false,
      message: "Review file has no valid product ID.",
    };
  }

  if (!isPlainObject(data.items)) {
    return {
      valid: false,
      message: "Review file has no valid checklist items.",
    };
  }

  const candidateProduct = {
    id: data.product.id,

    brand: data.product.brand ?? "",

    productName: data.product.productName ?? "",

    weight: data.product.weight ?? "",

    sku: data.product.sku ?? "",

    items: data.items,

    artwork: data.artwork ?? null,

    reviewer: data.reviewer ?? {
      name: "",
      role: "",
      reviewedAt: null,
    },

    createdAt: data.product.createdAt,

    updatedAt: data.product.updatedAt,
  };

  if (!validateSerializedProduct(candidateProduct)) {
    return {
      valid: false,
      message: "Review file structure is incompatible.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

function buildImportedProduct(importedData) {
  const productId = importedData.product.id;

  const product = createProduct(productId);

  product.brand = importedData.product.brand;

  product.productName = importedData.product.productName;

  product.weight = importedData.product.weight;

  product.sku = importedData.product.sku;

  product.items = rehydrateItems(importedData.items);

  product.artwork = importedData.artwork ?? null;

  product.reviewer = {
    ...product.reviewer,
    ...(importedData.reviewer || {}),
  };

  if (typeof importedData.product.createdAt === "string") {
    product.createdAt = importedData.product.createdAt;
  }

  product.updatedAt = new Date().toISOString();

  return product;
}

function applyImportedReview(importedData) {
  const migratedData = migrateImportData(importedData);

  if (!migratedData) {
    return {
      valid: false,
      message: "Unsupported or incompatible review file.",
    };
  }

  const validation = validateImportData(migratedData);

  if (!validation.valid) {
    return validation;
  }

  const importedProduct = buildImportedProduct(migratedData);

  appState.schemaVersion = migratedData.schemaVersion;

  appState.activeProductId = importedProduct.id;

  appState.products = {
    [importedProduct.id]: importedProduct,
  };

  openCommentItemIds.clear();

  editingTitleItemId = null;

  saveStateToStorage();

  renderChecklist();

  renderAppState();

  return {
    valid: true,
    message: "",
  };
}

function openCheck() {
  const fileInput = document.getElementById("check-file-input");

  if (!fileInput) {
    console.error("Check file input not found.");

    return;
  }

  fileInput.value = "";

  fileInput.onchange = function (event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      showToast("Please select a JSON review file.");

      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      const importedData = deserializeState(reader.result);

      if (!importedData) {
        showToast("Unable to parse review file.");

        return;
      }

      const result = applyImportedReview(importedData);

      if (!result.valid) {
        console.warn("Review import rejected:", result.message);

        showToast(result.message);

        return;
      }

      showToast("Check opened successfully.");
    };

    reader.onerror = function () {
      console.error("Failed to read check file.");

      showToast("Unable to read check file.");
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

function initializeApp() {
  loadStateFromStorage();

  renderChecklist();

  bindProductInputs();

  renderAppState();
}

initializeApp();
