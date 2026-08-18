// ============================================================
// ARTWORK & PACK COPY CHECKLIST
// Main Application Logic
// ============================================================
//
// This file contains the core application logic for the
// Artwork & Pack Copy Checklist.
//
// Main responsibilities:
// - checklist domain definitions;
// - centralized application state;
// - review status and validation;
// - comments and inline copy editing;
// - multi-product workspace management;
// - artwork loading and identity;
// - normalized artwork pins;
// - local persistence;
// - JSON import/export;
// - UI rendering and dialogs.
//
// The application follows a data-first architecture:
// appState is the source of truth and the DOM is a
// representation of that state.
// ============================================================

/**
 * @typedef {"pending" | "approved" | "rejected"} ReviewStatus
 */

/**
 * Position of a checklist pin relative to the artwork dimensions.
 *
 * Both values are normalized between 0 and 1 so that pin positions
 * remain stable when the artwork is resized or zoomed.
 *
 * @typedef {Object} NormalizedPin
 * @property {number} xRatio - Horizontal position from 0 (left) to 1 (right).
 * @property {number} yRatio - Vertical position from 0 (top) to 1 (bottom).
 */

/**
 * Persistable identity information for an artwork image.
 *
 * The binary image itself is intentionally not stored in appState.
 *
 * @typedef {Object} ArtworkMetadata
 * @property {string} name - Original file name.
 * @property {string} type - MIME type, such as "image/png".
 * @property {number} size - File size in bytes.
 * @property {number} width - Natural image width in pixels.
 * @property {number} height - Natural image height in pixels.
 */

/**
 * Runtime review state for one checklist requirement.
 *
 * @typedef {Object} ReviewItem
 * @property {string} id - Permanent checklist item identifier.
 * @property {string} sectionId - Identifier of the section containing the item.
 * @property {string} originalTitle - Immutable title defined by the checklist template.
 * @property {string} currentTitle - Current or reviewer-edited title.
 * @property {string} note - Supporting checklist guidance.
 * @property {ReviewStatus} status - Current review decision.
 * @property {string} comment - Reviewer comment or rejection reason.
 * @property {NormalizedPin|null} pin - Optional position on the artwork.
 */

/**
 * Complete review state for one product.
 *
 * @typedef {Object} Product
 * @property {string} id - Permanent unique product identifier.
 * @property {string} brand
 * @property {string} productName
 * @property {string} weight
 * @property {string} sku
 * @property {ArtworkMetadata|null} artwork
 * @property {Object.<string, ReviewItem>} items
 * @property {Object} reviewer
 * @property {Object|null} signature
 * @property {string} createdAt - ISO creation timestamp.
 * @property {string} updatedAt - ISO last-modification timestamp.
 */

const CURRENT_SCHEMA_VERSION = 2;

const ARTWORK_REPLACEMENT_MESSAGE =
  "Replacing this artwork will invalidate existing pins.\nContinue?";

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

/**
 * Converts an internal review status into the human-readable label
 * displayed by the interface.
 *
 * Unknown values are intentionally mapped to "Unknown" instead of
 * throwing an error so that rendering remains defensive.
 *
 * @param {string} status - Internal review status value.
 * @returns {string} Display label for the supplied status.
 */
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

/**
 * Creates a fresh review-state object for every checklist item defined
 * in the static sectionDefinitions template.
 *
 * Every item starts as Pending, with an empty comment and no artwork pin.
 * The originalTitle property is created as immutable so that reviewer
 * edits can only affect currentTitle.
 *
 * A completely new object graph is returned on every call. This is
 * important when creating or duplicating products because review state
 * must never be accidentally shared between products.
 *
 * @returns {Object.<string, ReviewItem>} Fresh checklist items keyed by item ID.
 */
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

/**
 * Creates a new product review with empty product information and a fresh
 * copy of the complete checklist.
 *
 * Creation and update timestamps are initialized to the same ISO timestamp.
 * Artwork, signature and review decisions start empty.
 *
 * @param {string} id - Permanent unique identifier assigned to the product.
 * @returns {Product} Newly initialized product review.
 */
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

const artworkSessions = new Map();

appState.products["product-1"] = createProduct("product-1");

// ============================================================
// DOMAIN GETTERS
// ============================================================

/**
 * Returns the product currently selected by appState.activeProductId.
 *
 * This is the preferred entry point for functions that operate on the
 * product currently visible in the interface.
 *
 * @returns {Product|null} Active product, or null if the ID is invalid.
 */
function getActiveProduct() {
  return appState.products[appState.activeProductId] || null;
}

/**
 * Looks up a product directly by its permanent identifier.
 *
 * Unlike getActiveProduct(), this function does not depend on the currently
 * selected product and is therefore useful for multi-product operations.
 *
 * @param {string} productId - Permanent product identifier.
 * @returns {Product|null} Matching product, or null when it does not exist.
 */
function getProductById(productId) {
  return appState.products[productId] || null;
}

/**
 * Returns the identifiers of every product currently stored in the workspace.
 *
 * The returned array reflects the current key order of appState.products.
 *
 * @returns {string[]} Product identifiers.
 */
function getProductIds() {
  return Object.keys(appState.products);
}

/**
 * Determines the label used to represent a product in the interface.
 *
 * Product Name is preferred whenever available. Products without a name
 * receive a numbered fallback such as "Product 2".
 *
 * @param {Product|null} product - Product whose label should be generated.
 * @param {number} [index=0] - Zero-based product position used by the fallback label.
 * @returns {string} Human-readable product label.
 */
function getProductDisplayName(product, index = 0) {
  if (!product) {
    return "Product";
  }

  const name = product.productName.trim();

  if (name) {
    return name;
  }

  return `Product ${index + 1}`;
}

/**
 * Generates a permanent unique identifier for a new product.
 *
 * crypto.randomUUID() is preferred when supported by the browser.
 * A timestamp-and-random fallback is used in older environments.
 *
 * The generated value is checked against appState.products before it is
 * returned, preventing accidental replacement of an existing product.
 *
 * @returns {string} Unique product identifier prefixed with "product-".
 */
function generateProductId() {
  let productId;

  do {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      productId = `product-${window.crypto.randomUUID()}`;
    } else {
      productId = `product-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
    }
  } while (Object.prototype.hasOwnProperty.call(appState.products, productId));

  return productId;
}

/**
 * Retrieves a checklist item from the currently active product.
 *
 * Checklist item IDs are shared by all products, so the active product
 * determines which review state is returned.
 *
 * @param {string} itemId - Permanent checklist item identifier, such as "1a".
 * @returns {ReviewItem|null} Matching item from the active product, or null.
 */
function getItemById(itemId) {
  const product = getActiveProduct();

  if (!product) {
    return null;
  }

  return product.items[itemId] || null;
}

function cloneArtworkMetadata(metadata) {
  if (!metadata) {
    return null;
  }

  return {
    name: metadata.name,
    type: metadata.type,
    size: metadata.size,
    width: metadata.width,
    height: metadata.height,
  };
}

function isValidArtworkMetadata(metadata) {
  if (!isPlainObject(metadata)) {
    return false;
  }

  return (
    typeof metadata.name === "string" &&
    metadata.name.trim() !== "" &&
    typeof metadata.type === "string" &&
    metadata.type.startsWith("image/") &&
    Number.isFinite(metadata.size) &&
    metadata.size >= 0 &&
    Number.isFinite(metadata.width) &&
    metadata.width > 0 &&
    Number.isFinite(metadata.height) &&
    metadata.height > 0
  );
}

function isSameArtworkIdentity(firstArtwork, secondArtwork) {
  if (firstArtwork === null || secondArtwork === null) {
    return firstArtwork === secondArtwork;
  }

  if (
    !isValidArtworkMetadata(firstArtwork) ||
    !isValidArtworkMetadata(secondArtwork)
  ) {
    return false;
  }

  return (
    firstArtwork.name === secondArtwork.name &&
    firstArtwork.type === secondArtwork.type &&
    firstArtwork.size === secondArtwork.size &&
    firstArtwork.width === secondArtwork.width &&
    firstArtwork.height === secondArtwork.height
  );
}

function productHasPins(product = getActiveProduct()) {
  if (!product) {
    return false;
  }

  return Object.values(product.items).some((item) => item.pin !== null);
}

function clearProductPins(product) {
  if (!product) {
    return 0;
  }

  let clearedCount = 0;

  Object.values(product.items).forEach((item) => {
    if (item.pin !== null) {
      item.pin = null;

      clearedCount += 1;
    }
  });

  return clearedCount;
}

// ============================================================
// DOMAIN HELPERS
// ============================================================

function touchProduct(productId) {
  const product = getProductById(productId);

  if (!product) {
    return false;
  }

  product.updatedAt = new Date().toISOString();

  return true;
}

function touchActiveProduct() {
  return touchProduct(appState.activeProductId);
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

function resetTransientReviewUiState() {
  openCommentItemIds.clear();

  editingTitleItemId = null;
}

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
// MULTI-PRODUCT WORKSPACE — G1
// ============================================================

function createNewProduct() {
  const productId = generateProductId();

  const product = createProduct(productId);

  appState.products[productId] = product;

  appState.activeProductId = productId;

  resetTransientReviewUiState();

  saveStateToStorage();

  renderProductTabs();

  renderAppState();

  scrollActiveProductTabIntoView();

  showToast("New product created.");

  return productId;
}

function switchProduct(productId) {
  const product = getProductById(productId);

  if (!product) {
    console.warn(`Product "${productId}" was not found.`);

    return false;
  }

  if (appState.activeProductId === productId) {
    return true;
  }

  appState.activeProductId = productId;

  resetTransientReviewUiState();

  saveStateToStorage();

  renderProductTabs();

  renderAppState();

  scrollActiveProductTabIntoView();

  return true;
}

function renameProduct(productId, newName) {
  const product = getProductById(productId);

  if (!product) {
    return false;
  }

  const normalizedName = String(newName).trim();

  if (!normalizedName) {
    return false;
  }

  product.productName = normalizedName;

  touchProduct(productId);

  saveStateToStorage();

  renderProductTabs();

  if (appState.activeProductId === productId) {
    renderProductInputs();
  }

  return true;
}

async function renameActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const proposedName = await showPromptDialog({
    tone: "primary",
    title: "Rename product",
    message: "Enter the new product name.",
    label: "Product name",
    initialValue: product.productName,
    placeholder: "Type the product name",
    confirmText: "Save",
    cancelText: "Cancel",
  });

  if (proposedName === null) {
    return;
  }

  if (!renameProduct(product.id, proposedName)) {
    showToast("Product name cannot be empty.");
    return;
  }

  showToast("Product renamed.");
}

function duplicateProduct(productId) {
  const sourceProduct = getProductById(productId);

  if (!sourceProduct) {
    return null;
  }

  const newProductId = generateProductId();

  const serializedClone = JSON.parse(JSON.stringify(sourceProduct));

  serializedClone.id = newProductId;

  const sourceName = sourceProduct.productName.trim();

  serializedClone.productName = sourceName
    ? `${sourceName} Copy`
    : "Product Copy";

  const now = new Date().toISOString();

  serializedClone.createdAt = now;

  serializedClone.updatedAt = now;

  const duplicatedProduct = rehydrateProduct(serializedClone);

  appState.products[newProductId] = duplicatedProduct;

  appState.activeProductId = newProductId;

  /*
   * Artwork metadata is duplicated,
   * but the binary/session Object URL
   * intentionally is not.
   */

  resetTransientReviewUiState();

  saveStateToStorage();

  renderProductTabs();

  renderAppState();

  scrollActiveProductTabIntoView();

  showToast("Product duplicated.");

  return newProductId;
}

function duplicateActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  duplicateProduct(product.id);
}

function deleteProduct(productId, confirmDelete = window.confirm) {
  const product = getProductById(productId);

  if (!product) {
    return false;
  }

  const productIds = getProductIds();

  if (productIds.length <= 1) {
    showToast("At least one product must remain.");

    return false;
  }

  const productIndex = productIds.indexOf(productId);

  const displayName = getProductDisplayName(product, productIndex);

  const confirmed = confirmDelete(
    `Delete "${displayName}" and all of its review data?`,
  );

  if (!confirmed) {
    return false;
  }

  const wasActive = appState.activeProductId === productId;

  releaseSessionArtwork(productId);

  delete appState.products[productId];

  if (wasActive) {
    const remainingIds = getProductIds();

    const nextIndex = Math.min(productIndex, remainingIds.length - 1);

    appState.activeProductId = remainingIds[nextIndex];

    resetTransientReviewUiState();
  }

  saveStateToStorage();

  renderProductTabs();

  renderAppState();

  showToast("Product deleted.");

  return true;
}

async function deleteActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const productIds = getProductIds();

  if (productIds.length <= 1) {
    showToast("At least one product must remain.");
    return;
  }

  const productIndex = productIds.indexOf(product.id);
  const displayName = getProductDisplayName(product, productIndex);

  const confirmed = await showConfirmDialog({
    tone: "danger",
    title: "Delete product",
    message: `Delete "${displayName}" and all of its review data? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!confirmed) {
    return;
  }

  deleteProduct(product.id, () => true);
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

      renderProductTabs();
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

function applyArtworkIdentity(
  metadata,
  confirmReplacement = window.confirm,
  productId = appState.activeProductId,
) {
  const product = getProductById(productId);

  if (!product) {
    return {
      applied: false,
      reason: "no-product",
    };
  }

  if (!isValidArtworkMetadata(metadata)) {
    return {
      applied: false,
      reason: "invalid-metadata",
    };
  }

  const previousArtwork = product.artwork;

  const sameArtwork = isSameArtworkIdentity(previousArtwork, metadata);

  const hasPins = productHasPins(product);

  if (!sameArtwork && hasPins) {
    const confirmed = confirmReplacement(ARTWORK_REPLACEMENT_MESSAGE);

    if (!confirmed) {
      return {
        applied: false,
        reason: "cancelled",
      };
    }
  }

  let pinsCleared = 0;

  if (!sameArtwork && hasPins) {
    pinsCleared = clearProductPins(product);
  }

  product.artwork = cloneArtworkMetadata(metadata);

  touchProduct(productId);
  saveStateToStorage();

  return {
    applied: true,
    sameArtwork,
    pinsCleared,
  };
}

function createArtworkMetadata(file, width, height) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    width,
    height,
  };
}

function getArtworkSession(
  productId = appState.activeProductId,
  createIfMissing = false,
) {
  if (!productId) {
    return null;
  }

  if (!artworkSessions.has(productId) && createIfMissing) {
    artworkSessions.set(productId, {
      metadata: null,
      objectUrl: null,
    });
  }

  return artworkSessions.get(productId) || null;
}

function releaseSessionArtwork(productId = appState.activeProductId) {
  const session = getArtworkSession(productId, false);

  if (!session) {
    return;
  }

  if (session.objectUrl) {
    URL.revokeObjectURL(session.objectUrl);
  }

  artworkSessions.delete(productId);
}

function releaseAllSessionArtworks() {
  [...artworkSessions.keys()].forEach((productId) => {
    releaseSessionArtwork(productId);
  });
}

function adoptSessionArtwork(
  metadata,
  objectUrl,
  productId = appState.activeProductId,
) {
  if (!productId) {
    return false;
  }

  const session = getArtworkSession(productId, true);

  if (session.objectUrl && session.objectUrl !== objectUrl) {
    URL.revokeObjectURL(session.objectUrl);
  }

  session.metadata = cloneArtworkMetadata(metadata);

  session.objectUrl = objectUrl;

  return true;
}

function isArtworkLoadedInSession(
  metadata,
  productId = appState.activeProductId,
) {
  const session = getArtworkSession(productId, false);

  return (
    Boolean(session?.objectUrl) &&
    isSameArtworkIdentity(session.metadata, metadata)
  );
}

function inspectArtworkFile(file) {
  return new Promise((resolve, reject) => {
    if (
      !file ||
      typeof file.type !== "string" ||
      !file.type.startsWith("image/")
    ) {
      reject(new Error("Selected file is not an image."));

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      const metadata = createArtworkMetadata(
        file,
        image.naturalWidth,
        image.naturalHeight,
      );

      if (!isValidArtworkMetadata(metadata)) {
        URL.revokeObjectURL(objectUrl);

        reject(new Error("Invalid artwork metadata."));

        return;
      }

      resolve({
        metadata,
        objectUrl,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(new Error("Unable to load artwork image."));
    };

    image.src = objectUrl;
  });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatArtworkSummary(metadata) {
  if (!isValidArtworkMetadata(metadata)) {
    return "";
  }

  return [
    metadata.name,
    `${metadata.width}×${metadata.height}`,
    formatFileSize(metadata.size),
  ].join(" · ");
}

function renderArtworkState() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const demoArtwork = document.getElementById("demo-artwork");

  const artworkImage = document.getElementById("artwork-image");

  const missingState = document.getElementById("artwork-missing");

  const missingName = document.getElementById("artwork-missing-name");

  const statusBadge = document.getElementById("artwork-status-badge");

  const metadataText = document.getElementById("artwork-meta");

  const artworkButton = document.getElementById("btn-artwork");

  const metadata = product.artwork;

  /*
   * No artwork selected:
   * preserve the original demo.
   */
  if (!metadata) {
    if (demoArtwork) {
      demoArtwork.hidden = false;
    }

    if (artworkImage) {
      artworkImage.hidden = true;

      artworkImage.removeAttribute("src");
    }

    if (missingState) {
      missingState.hidden = true;
    }

    if (statusBadge) {
      statusBadge.textContent = "Demo";
    }

    if (metadataText) {
      metadataText.textContent = "Demo artwork";
    }

    if (artworkButton) {
      artworkButton.textContent = "Set Artwork";
    }

    if (pinsLayer) {
      pinsLayer.hidden = false;
    }

    return;
  }

  if (metadataText) {
    metadataText.textContent = formatArtworkSummary(metadata);
  }

  if (artworkButton) {
    artworkButton.textContent = "Replace Artwork";
  }

  const artworkSession = getArtworkSession(product.id, false);

  const isLoaded = isArtworkLoadedInSession(metadata, product.id);

  if (isLoaded) {
    if (demoArtwork) {
      demoArtwork.hidden = true;
    }

    if (missingState) {
      missingState.hidden = true;
    }

    if (artworkImage) {
      artworkImage.src = artworkSession.objectUrl;

      artworkImage.hidden = false;
    }

    if (statusBadge) {
      statusBadge.textContent = "Loaded";
    }

    if (pinsLayer) {
      pinsLayer.hidden = false;
    }

    return;
  }

  /*
   * Metadata was restored from localStorage or JSON,
   * but browser file access cannot be persisted.
   */
  if (demoArtwork) {
    demoArtwork.hidden = true;
  }

  if (artworkImage) {
    artworkImage.hidden = true;

    artworkImage.removeAttribute("src");
  }

  if (missingState) {
    missingState.hidden = false;
  }

  if (missingName) {
    missingName.textContent = metadata.name;
  }

  if (statusBadge) {
    statusBadge.textContent = "File required";
  }

  /*
   * Pins remain in appState but should not be shown
   * over a placeholder.
   */
  if (pinsLayer) {
    pinsLayer.hidden = true;
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

  clearProductPins(product);

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

  if (product.artwork !== null && !isValidArtworkMetadata(product.artwork)) {
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

  product.artwork = savedProduct.artwork
    ? cloneArtworkMetadata(savedProduct.artwork)
    : null;

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

    artwork: cloneArtworkMetadata(product.artwork),

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

  renderArtworkState();

  Object.keys(product.items).forEach((itemId) => {
    renderItemState(itemId);
  });

  renderPins();

  updateProgress();
}

function selectArtwork() {
  const fileInput = document.getElementById("artwork-file-input");

  if (!fileInput) {
    console.error("Artwork file input not found.");

    return;
  }

  fileInput.value = "";

  fileInput.click();
}

async function handleArtworkFileChange(event) {
  const file = event.target.files?.[0];

  const targetProductId = appState.activeProductId;

  if (!file) {
    return;
  }

  try {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.");

      return;
    }

    const { metadata, objectUrl } = await inspectArtworkFile(file);

    const targetProduct = getProductById(targetProductId);

    if (!targetProduct) {
      URL.revokeObjectURL(objectUrl);
      showToast("Unable to find the target product.");
      return;
    }

    const sameArtwork = isSameArtworkIdentity(targetProduct.artwork, metadata);

    const hasPins = productHasPins(targetProduct);

    if (!sameArtwork && hasPins) {
      const confirmed = await showConfirmDialog({
        tone: "warning",
        title: "Replace artwork",
        message:
          "Replacing this artwork will invalidate existing pins. Do you want to continue?",
        confirmText: "Replace",
        cancelText: "Cancel",
      });

      if (!confirmed) {
        URL.revokeObjectURL(objectUrl);
        showToast("Artwork replacement cancelled.");
        return;
      }
    }

    const result = applyArtworkIdentity(metadata, () => true, targetProductId);

    if (!result.applied) {
      URL.revokeObjectURL(objectUrl);

      if (result.reason === "cancelled") {
        showToast("Artwork replacement cancelled.");
      } else {
        showToast("Unable to use selected artwork.");
      }

      return;
    }

    adoptSessionArtwork(metadata, objectUrl, targetProductId);

    if (appState.activeProductId === targetProductId) {
      renderArtworkState();

      renderPins();
    }

    if (result.sameArtwork) {
      showToast("Artwork file loaded.");

      return;
    }

    if (result.pinsCleared > 0) {
      showToast("Artwork replaced and existing pins cleared.");

      return;
    }

    showToast("Artwork loaded successfully.");
  } catch (error) {
    console.error("Failed to load artwork:", error);

    showToast("Unable to load artwork image.");
  } finally {
    event.target.value = "";
  }
}

function bindArtworkInput() {
  const fileInput = document.getElementById("artwork-file-input");

  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", handleArtworkFileChange);
}

function renderProductTabs() {
  const container = document.getElementById("product-tabs");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const products = Object.values(appState.products);

  products.forEach((product, index) => {
    const tab = document.createElement("button");

    tab.type = "button";

    tab.className = "product-tab";

    tab.dataset.productId = product.id;

    tab.setAttribute("role", "tab");

    const isActive = product.id === appState.activeProductId;

    tab.setAttribute("aria-selected", String(isActive));

    if (isActive) {
      tab.classList.add("active");
    }

    const displayName = getProductDisplayName(product, index);

    tab.textContent = displayName;

    tab.title = displayName;

    tab.addEventListener("click", () => {
      switchProduct(product.id);
    });

    container.appendChild(tab);
  });
}

function scrollActiveProductTabIntoView() {
  const activeTab = document.querySelector(".product-tab.active");

  if (!activeTab) {
    return;
  }

  activeTab.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
}

// ============================================================
// APP DIALOG
// ============================================================

const appDialogState = {
  isOpen: false,
  resolve: null,
  type: "confirm",
};

function getAppDialogElements() {
  return {
    overlay: document.getElementById("app-dialog-overlay"),
    icon: document.getElementById("app-dialog-icon"),
    title: document.getElementById("app-dialog-title"),
    message: document.getElementById("app-dialog-message"),
    inputWrapper: document.getElementById("app-dialog-input-wrapper"),
    inputLabel: document.getElementById("app-dialog-input-label"),
    input: document.getElementById("app-dialog-input"),
    confirmButton: document.getElementById("app-dialog-confirm"),
    cancelButton: document.getElementById("app-dialog-cancel"),
  };
}

function closeAppDialog(result = null) {
  const elements = getAppDialogElements();

  if (!elements.overlay || !appDialogState.isOpen) {
    return;
  }

  elements.overlay.classList.add("hidden");
  elements.overlay.setAttribute("aria-hidden", "true");

  appDialogState.isOpen = false;

  const resolver = appDialogState.resolve;
  appDialogState.resolve = null;

  if (typeof resolver === "function") {
    resolver(result);
  }
}

function openAppDialog({
  type = "confirm",
  tone = "primary",
  title = "Confirm action",
  message = "",
  label = "Value",
  initialValue = "",
  placeholder = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  const elements = getAppDialogElements();

  if (!elements.overlay) {
    console.error("App dialog elements not found.");

    return Promise.resolve(null);
  }

  appDialogState.type = type;

  elements.title.textContent = title;
  elements.message.textContent = message;

  elements.icon.className = "app-dialog-icon";
  elements.confirmButton.className = "app-dialog-btn";

  if (tone === "danger") {
    elements.icon.classList.add("danger");
    elements.icon.textContent = "!";
    elements.confirmButton.classList.add("app-dialog-btn-danger");
  } else if (tone === "warning") {
    elements.icon.classList.add("warning");
    elements.icon.textContent = "!";
    elements.confirmButton.classList.add("app-dialog-btn-warning");
  } else if (tone === "success") {
    elements.icon.classList.add("success");
    elements.icon.textContent = "✓";
    elements.confirmButton.classList.add("app-dialog-btn-primary");
  } else {
    elements.icon.textContent = "?";
    elements.confirmButton.classList.add("app-dialog-btn-primary");
  }

  elements.confirmButton.textContent = confirmText;
  elements.cancelButton.textContent = cancelText;

  if (type === "prompt") {
    elements.inputWrapper.classList.remove("hidden");
    elements.inputLabel.textContent = label;
    elements.input.value = initialValue ?? "";
    elements.input.placeholder = placeholder ?? "";
  } else {
    elements.inputWrapper.classList.add("hidden");
    elements.input.value = "";
    elements.input.placeholder = "";
  }

  elements.overlay.classList.remove("hidden");
  elements.overlay.setAttribute("aria-hidden", "false");

  appDialogState.isOpen = true;

  return new Promise((resolve) => {
    appDialogState.resolve = resolve;

    requestAnimationFrame(() => {
      if (type === "prompt") {
        elements.input.focus();
        elements.input.select();
      } else {
        elements.confirmButton.focus();
      }
    });
  });
}

function bindAppDialog() {
  const elements = getAppDialogElements();

  if (!elements.overlay) {
    return;
  }

  elements.confirmButton.addEventListener("click", () => {
    if (appDialogState.type === "prompt") {
      closeAppDialog(elements.input.value);
      return;
    }

    closeAppDialog(true);
  });

  elements.cancelButton.addEventListener("click", () => {
    if (appDialogState.type === "prompt") {
      closeAppDialog(null);
      return;
    }

    closeAppDialog(false);
  });

  elements.overlay.addEventListener("click", (event) => {
    if (event.target !== elements.overlay) {
      return;
    }

    if (appDialogState.type === "prompt") {
      closeAppDialog(null);
      return;
    }

    closeAppDialog(false);
  });

  document.addEventListener("keydown", (event) => {
    if (!appDialogState.isOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      if (appDialogState.type === "prompt") {
        closeAppDialog(null);
      } else {
        closeAppDialog(false);
      }
    }

    if (event.key === "Enter" && appDialogState.type === "prompt") {
      const activeElement = document.activeElement;

      if (activeElement?.id === "app-dialog-input") {
        event.preventDefault();
        closeAppDialog(elements.input.value);
      }
    }
  });
}

function showConfirmDialog(options) {
  return openAppDialog({
    type: "confirm",
    ...options,
  });
}

function showPromptDialog(options) {
  return openAppDialog({
    type: "prompt",
    ...options,
  });
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

  product.artwork = importedData.artwork
    ? cloneArtworkMetadata(importedData.artwork)
    : null;

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

  let importedProductId = importedProduct.id;

  if (
    Object.prototype.hasOwnProperty.call(appState.products, importedProductId)
  ) {
    importedProductId = generateProductId();

    importedProduct.id = importedProductId;
  }

  appState.schemaVersion = migratedData.schemaVersion;

  appState.products[importedProductId] = importedProduct;

  appState.activeProductId = importedProductId;

  openCommentItemIds.clear();

  editingTitleItemId = null;

  resetTransientReviewUiState();

  saveStateToStorage();

  renderChecklist();

  renderProductTabs();

  renderAppState();

  scrollActiveProductTabIntoView();

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

window.addEventListener("beforeunload", () => {
  releaseAllSessionArtworks();
});

function initializeApp() {
  loadStateFromStorage();

  renderChecklist();

  bindProductInputs();

  bindArtworkInput();

  bindAppDialog();

  renderProductTabs();

  renderAppState();
}

initializeApp();
