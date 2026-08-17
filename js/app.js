// ============================================================
// ARTWORK & PACK COPY CHECKLIST
// Layer B — Centralized Domain Model
// ============================================================

// ============================================================
// REVIEW STATUS DEFINITIONS
// ============================================================

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
  schemaVersion: 1,

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

  item.currentTitle = String(newTitle);

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

  return true;
}

function setItemPin(itemId, pin) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  item.pin = pin;

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

            <span class="check-item-title">
              ${item.currentTitle}
            </span>

            <span
              class="review-status"
              data-role="status-label"
              data-status="${item.status}"
            >
              ${getReviewStatusLabel(item.status)}
            </span>

          </div>

          ${item.note ? `<div class="check-item-note">${item.note}</div>` : ""}

        </div>

        <div class="review-actions">
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

        <div class="check-item-hint">

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

        </div>
      `;

      const approveButton = itemElement.querySelector(
        '[data-action="approve"]',
      );

      const rejectButton = itemElement.querySelector('[data-action="reject"]');

      approveButton.addEventListener("click", (event) => {
        event.stopPropagation();

        handleReviewAction(item.id, REVIEW_STATUSES.APPROVED);
      });

      rejectButton.addEventListener("click", (event) => {
        event.stopPropagation();

        handleReviewAction(item.id, REVIEW_STATUSES.REJECTED);
      });

      itemElement.addEventListener("dragstart", (event) => {
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
// Zoom is UI state.
// It does not describe the reviewed product.
//

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

  const statusLabel = itemElement.querySelector('[data-role="status-label"]');

  const approveButton = itemElement.querySelector('[data-action="approve"]');

  const rejectButton = itemElement.querySelector('[data-action="reject"]');

  const isApproved = item.status === REVIEW_STATUSES.APPROVED;

  const isRejected = item.status === REVIEW_STATUSES.REJECTED;

  itemElement.dataset.status = item.status;

  if (titleElement) {
    titleElement.textContent = item.currentTitle;
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
}

// ============================================================
// CHECKBOX
// ============================================================
//
// User interaction
//      ↓
// domain state
//      ↓
// render function
//      ↓
// DOM
//

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

  renderItemState(itemId);

  updateProgress();
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
    });
  }
}

// ============================================================
// PINS
// ============================================================

const pinsLayer = document.getElementById("pins-layer");

const artworkWrapper = document.getElementById("artwork-wrapper");

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

    const x = (event.clientX - rectangle.left) / currentZoom;

    const y = (event.clientY - rectangle.top) / currentZoom;

    addPin(itemId, x, y);
  });
}

function createPinElement(item) {
  const pinElement = document.createElement("div");

  pinElement.className = "pin";

  pinElement.dataset.pid = item.id;

  pinElement.style.left = item.pin.x + "px";

  pinElement.style.top = item.pin.y + "px";

  pinElement.innerHTML = `
    <div class="pin-tooltip">
      ${item.currentTitle}
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

function addPin(itemId, x, y) {
  const item = getItemById(itemId);

  if (!item) {
    return;
  }

  setItemPin(itemId, {
    x,
    y,
  });

  renderPin(itemId);

  showToast(`Pinned ${itemId.toUpperCase()} to artwork`);
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

  renderPins();

  showToast("All pins cleared");
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
      pins[item.id] = {
        ...item.pin,
      };
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

function initializeApp() {
  renderChecklist();

  bindProductInputs();

  renderAppState();
}

initializeApp();
