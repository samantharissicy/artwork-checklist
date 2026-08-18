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
 * Persistable artwork layer of a product.
 *
 * Each layer owns an independent artwork identity and its own pin set.
 * Schema version 1 only supported a single artwork per product; schema
 * version 3 stores every artwork inside its own layer.
 *
 * @typedef {Object} ArtworkLayer
 * @property {string} id - Unique layer identifier within the product.
 * @property {string} name - Human-readable layer name.
 * @property {ArtworkMetadata|null} artwork - Artwork identity assigned to the layer.
 */

/**
 * Persisted artwork pin bound to one checklist item and one layer.
 *
 * The xRatio/yRatio values are normalized between 0 and 1 relative to the
 * layer's artwork dimensions.
 *
 * @typedef {Object} StoredLayerPin
 * @property {string} layerId - Layer that owns the pin.
 * @property {number} xRatio - Horizontal position from 0 (left) to 1 (right).
 * @property {number} yRatio - Vertical position from 0 (top) to 1 (bottom).
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
 * @property {StoredLayerPin[]} pins - Optional artwork positions, one per layer.
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
 * @property {string} productionCode - Production identifier, never derived from SKU.
 * @property {string} site - Allowed production site, or an empty string.
 * @property {string} artworkVersion - Revision of the artwork under review.
 * @property {ArtworkLayer[]} artworkLayers - Independent artwork layers.
 * @property {string} activeArtworkLayerId - Identifier of the layer currently under review.
 * @property {Object.<string, ReviewItem>} items
 * @property {Object} reviewer
 * @property {Object|null} signature
 * @property {string} createdAt - ISO creation timestamp.
 * @property {string} updatedAt - ISO last-modification timestamp.
 */

const CURRENT_SCHEMA_VERSION = 3;

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

const ALLOWED_SITES = Object.freeze(["OH1", "OH2", "BL"]);

/**
 * Determines whether a value is an allowed production site.
 *
 * An empty string is accepted because new products start without a site.
 * Any other value must belong to ALLOWED_SITES.
 *
 * @param {*} value - Candidate site value.
 * @returns {boolean} True when the value is an allowed site or empty.
 */
function isAllowedSite(value) {
  return (
    typeof value === "string" && (value === "" || ALLOWED_SITES.includes(value))
  );
}

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
 * Pins are stored as a per-layer array, so a fresh item contains no pins.
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

        pins: [],
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
 * Creates a fresh artwork layer for a product.
 *
 * A layer owns one independent artwork identity. The optional artwork
 * metadata is cloned so the layer never shares an object reference with
 * the caller.
 *
 * @param {string} id - Unique layer identifier within the product.
 * @param {string} name - Human-readable layer name.
 * @param {ArtworkMetadata|null} [artwork=null] - Optional artwork identity.
 * @returns {ArtworkLayer} Newly initialized artwork layer.
 */
function createArtworkLayer(id, name, artwork = null) {
  return {
    id,
    name,
    artwork: artwork ? cloneArtworkMetadata(artwork) : null,
  };
}

/**
 * Creates a new product review with empty product information and a fresh
 * copy of the complete checklist.
 *
 * Creation and update timestamps are initialized to the same ISO timestamp.
 * Artwork, signature and review decisions start empty.
 *
 * Every new product starts with a single default artwork layer named
 * "Main Artwork" (identifier "layer-main"), which is also the active layer.
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

    productionCode: "",

    site: "",

    artworkVersion: "",

    artworkLayers: [createArtworkLayer("layer-main", "Main Artwork")],

    activeArtworkLayerId: "layer-main",

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

/**
 * Runtime artwork sessions, keyed by product and then by artwork layer.
 *
 *     artworkSessions: Map<productId, Map<layerId, ArtworkSession>>
 *
 * Each (product, layer) pair owns an independent session so switching
 * products or layers never causes one loaded image to replace another.
 */
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
 * Retrieves an artwork layer from a product by its identifier.
 *
 * @param {Product|null} product - Product whose layers should be searched.
 * @param {string} layerId - Artwork layer identifier to look up.
 * @returns {ArtworkLayer|null} Matching layer, or null when it does not exist.
 */
function getArtworkLayerById(product, layerId) {
  if (!product || !Array.isArray(product.artworkLayers)) {
    return null;
  }

  return product.artworkLayers.find((layer) => layer.id === layerId) || null;
}

/**
 * Returns the artwork layer currently selected for review in a product.
 *
 * The active layer is resolved from product.activeArtworkLayerId. When the
 * stored identifier is missing or invalid, the first layer is used as a
 * defensive fallback so interface rendering never crashes.
 *
 * @param {Product|null} [product=getActiveProduct()] - Product to inspect.
 * @returns {ArtworkLayer|null} Active artwork layer, or null when unavailable.
 */
function getActiveArtworkLayer(product = getActiveProduct()) {
  if (!product || !Array.isArray(product.artworkLayers)) {
    return null;
  }

  return (
    getArtworkLayerById(product, product.activeArtworkLayerId) ||
    product.artworkLayers[0] ||
    null
  );
}

/**
 * Returns the artwork metadata of the active layer of a product.
 *
 * @param {Product|null} [product=getActiveProduct()] - Product to inspect.
 * @returns {ArtworkMetadata|null} Active-layer artwork metadata, or null.
 */
function getActiveArtworkMetadata(product = getActiveProduct()) {
  const layer = getActiveArtworkLayer(product);

  return layer ? layer.artwork : null;
}

/**
 * Returns the identifiers of every artwork layer of a product.
 *
 * @param {Product|null} product - Product whose layer IDs should be listed.
 * @returns {string[]} Layer identifiers, in storage order.
 */
function getArtworkLayerIds(product) {
  if (!product || !Array.isArray(product.artworkLayers)) {
    return [];
  }

  return product.artworkLayers.map((layer) => layer.id);
}

/**
 * Generates a permanent unique identifier for a new artwork layer.
 *
 * The generated identifier is checked against the product's existing layers
 * so an accidental replacement of an existing layer is prevented.
 *
 * @param {Product|null} product - Product that will receive the new layer.
 * @returns {string} Unique layer identifier prefixed with "layer-".
 */
function generateArtworkLayerId(product) {
  const existingIds = new Set(getArtworkLayerIds(product));

  let layerId;

  do {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      layerId = `layer-${window.crypto.randomUUID()}`;
    } else {
      layerId = `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  } while (existingIds.has(layerId));

  return layerId;
}

/**
 * Suggests the default display name for the next artwork layer of a product.
 *
 * The suggested name follows a sequence such as "Layer 2", "Layer 3", etc.
 * unless an equivalent name already exists, in which case a numbered suffix
 * is appended until a name that is not already used by another layer of the
 * same product is found.
 *
 * @param {Product|null} product - Product that will receive the new layer.
 * @returns {string} Suggested layer display name.
 */
function suggestArtworkLayerName(product) {
  if (!product || !Array.isArray(product.artworkLayers)) {
    return "Layer 2";
  }

  const existingNames = new Set(
    product.artworkLayers.map((layer) => layer.name.trim().toLowerCase()),
  );

  let candidateNumber = product.artworkLayers.length + 1;

  let candidate = `Layer ${candidateNumber}`;

  while (existingNames.has(candidate.toLowerCase())) {
    candidateNumber += 1;

    candidate = `Layer ${candidateNumber}`;
  }

  return candidate;
}

/**
 * Creates a new artwork layer for a product and makes it the active layer.
 *
 * This is a domain-level mutation only. It does not render the interface,
 * save to localStorage or display feedback by itself, allowing callers to
 * decide when those side effects should occur.
 *
 * The new layer receives a permanent identifier generated by
 * generateArtworkLayerId() and is positioned after the existing layers.
 * The product's active layer identifier is updated to the new layer so the
 * reviewer immediately reviews the freshly created layer.
 *
 * Empty or whitespace-only names are rejected. The name is trimmed before
 * storage.
 *
 * @param {string} productId - Permanent ID of the product that receives the layer.
 * @param {string} name - Display name of the new artwork layer.
 * @returns {ArtworkLayer|null} Newly created layer, or null when the product
 *   does not exist or the name is empty after trimming.
 */
function createArtworkLayerForProduct(productId, name) {
  const product = getProductById(productId);

  if (!product || !Array.isArray(product.artworkLayers)) {
    return null;
  }

  const trimmedName = String(name ?? "").trim();

  if (!trimmedName) {
    return null;
  }

  const layer = createArtworkLayer(generateArtworkLayerId(product), trimmedName);

  product.artworkLayers.push(layer);

  product.activeArtworkLayerId = layer.id;

  touchProduct(productId);

  return layer;
}

/**
 * Counts the artwork pins stored on one layer of a product.
 *
 * The count considers every checklist item of the supplied product.
 *
 * @param {Product|null} product - Product whose pins should be inspected.
 * @param {string} layerId - Artwork layer to count pins for.
 * @returns {number} Number of pinned items on the supplied layer.
 */
function layerPinCount(product, layerId) {
  if (!product) {
    return 0;
  }

  return Object.values(product.items).filter(
    (item) =>
      Array.isArray(item.pins) &&
      item.pins.some((pin) => pin.layerId === layerId),
  ).length;
}

/**
 * Switches the active artwork layer of the currently active product.
 *
 * Only the product's activeArtworkLayerId is changed. Review data, artwork
 * sessions and the product's modification timestamp are intentionally left
 * untouched because switching layers is a navigation action.
 *
 * The workspace is persisted and re-rendered so the viewer, the layer tabs
 * and the pin layer immediately reflect the newly selected layer.
 *
 * @param {string} layerId - Permanent ID of the layer to activate.
 * @returns {boolean} True when the active layer was switched.
 */
function switchArtworkLayer(layerId) {
  const product = getActiveProduct();

  const layer = product
    ? getArtworkLayerById(product, layerId)
    : null;

  if (!product || !layer || product.activeArtworkLayerId === layerId) {
    return false;
  }

  product.activeArtworkLayerId = layerId;

  saveStateToStorage();

  renderAppState();

  scrollActiveArtworkLayerTabIntoView();

  return true;
}

/**
 * Renames an artwork layer while preserving its identity and data.
 *
 * This is a domain-level mutation only. It does not render the interface,
 * save to localStorage or display feedback by itself.
 *
 * The layer's permanent identifier, artwork metadata, artwork session,
 * pins and active-layer status are never changed by a rename. Only the
 * display name is replaced after trimming. The product's modification
 * timestamp is updated because the persisted layer data changed.
 *
 * Empty or whitespace-only names are rejected.
 *
 * @param {string} layerId - Permanent ID of the layer to rename.
 * @param {string} newName - New display name for the layer.
 * @returns {boolean} True when the layer was renamed.
 */
function renameArtworkLayer(layerId, newName) {
  const product = getActiveProduct();

  const layer = product ? getArtworkLayerById(product, layerId) : null;

  if (!layer) {
    return false;
  }

  const trimmedName = String(newName ?? "").trim();

  if (!trimmedName) {
    return false;
  }

  layer.name = trimmedName;

  touchActiveProduct();

  return true;
}

/**
 * Deletes an artwork layer and its associated review data.
 *
 * This is a domain-level mutation only. Confirmation responsibility belongs
 * to the UI layer that calls this function. It does not render, persist or
 * display feedback by itself.
 *
 * Deletion is rejected when the product owns only one artwork layer, so the
 * product can never end up without layers.
 *
 * When the layer is removed:
 * - every pin belonging to the target layer is removed from the product's
 *   items, while pins of other layers are preserved;
 * - the layer's artwork session Object URL is released and removed from the
 *   sessions registry;
 * - if the deleted layer was active, another layer becomes active following
 *   a deterministic order: the next layer at the deleted position, otherwise
 *   the previous layer, otherwise the first layer;
 * - the product's modification timestamp is updated.
 *
 * @param {string} productId - Permanent ID of the product that owns the layer.
 * @param {string} layerId - Permanent ID of the layer to delete.
 * @returns {boolean} True when the layer was deleted.
 */
function deleteArtworkLayer(productId, layerId) {
  const product = getProductById(productId);

  if (!product || !Array.isArray(product.artworkLayers)) {
    return false;
  }

  const layerIndex = product.artworkLayers.findIndex(
    (layer) => layer.id === layerId,
  );

  if (layerIndex === -1) {
    return false;
  }

  if (product.artworkLayers.length <= 1) {
    return false;
  }

  clearLayerPins(product, layerId);

  releaseLayerSessionArtwork(productId, layerId);

  product.artworkLayers.splice(layerIndex, 1);

  if (product.activeArtworkLayerId === layerId) {
    const layerIds = getArtworkLayerIds(product);

    const nextLayerId = layerIds[layerIndex] || layerIds[layerIndex - 1] || layerIds[0];

    product.activeArtworkLayerId = nextLayerId;
  }

  touchProduct(productId);

  return true;
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

/**
 * Creates a detached copy of persistable artwork metadata.
 *
 * Only the supported metadata fields are copied. Runtime-only values such
 * as File objects and Object URLs must never enter the persisted domain state.
 *
 * @param {ArtworkMetadata|null} metadata - Artwork metadata to copy.
 * @returns {ArtworkMetadata|null} Independent metadata object, or null.
 */
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

/**
 * Validates the structure and values of artwork metadata.
 *
 * A valid artwork must:
 * - be a plain object;
 * - have a non-empty file name;
 * - use an image MIME type;
 * - have a non-negative file size;
 * - have positive natural width and height.
 *
 * @param {*} metadata - Value to validate.
 * @returns {boolean} True when the value is valid artwork metadata.
 */
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

/**
 * Determines whether two artwork metadata objects represent the same file
 * identity for the purposes of the review workflow.
 *
 * Identity currently depends on name, MIME type, file size and natural
 * dimensions. This allows the application to distinguish reloading the same
 * artwork from replacing it with another artwork.
 *
 * Two null values are considered equal. Invalid metadata is never treated
 * as the same artwork.
 *
 * @param {ArtworkMetadata|null} firstArtwork - First artwork identity.
 * @param {ArtworkMetadata|null} secondArtwork - Second artwork identity.
 * @returns {boolean} True when both values represent the same artwork.
 */
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

/**
 * Returns the normalized artwork pin of one checklist item on one layer.
 *
 * The returned object is a detached copy containing only the normalized
 * xRatio/yRatio coordinates, without the stored layerId, so callers cannot
 * accidentally corrupt the persisted pin entry.
 *
 * @param {ReviewItem|null} item - Checklist item to inspect.
 * @param {string} layerId - Artwork layer whose pin is requested.
 * @returns {NormalizedPin|null} Normalized pin for the layer, or null.
 */
function getItemPinForLayer(item, layerId) {
  if (!item || !Array.isArray(item.pins)) {
    return null;
  }

  const storedPin = item.pins.find((pin) => pin.layerId === layerId);

  if (!storedPin) {
    return null;
  }

  return {
    xRatio: storedPin.xRatio,
    yRatio: storedPin.yRatio,
  };
}

/**
 * Determines whether a checklist item has a pin on a specific layer.
 *
 * @param {ReviewItem|null} item - Checklist item to inspect.
 * @param {string} layerId - Artwork layer to check.
 * @returns {boolean} True when the item carries a pin on that layer.
 */
function itemHasPinOnLayer(item, layerId) {
  return getItemPinForLayer(item, layerId) !== null;
}

/**
 * Assigns or replaces the normalized artwork pin of a checklist item on one
 * artwork layer.
 *
 * Pins must use normalized xRatio/yRatio coordinates. Passing null removes
 * the layer pin from the item.
 *
 * A maximum of one pin exists per (item, layer) pair: assigning a pin to a
 * layer that already has one replaces the stored coordinates.
 *
 * The active product's modification timestamp is updated, while persistence
 * and rendering remain the caller's responsibility.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {string} layerId - Artwork layer owning the pin.
 * @param {NormalizedPin|null} pin - Normalized pin position, or null to remove it.
 * @returns {boolean} True when the pin state was successfully changed.
 */
function setItemPinForLayer(itemId, layerId, pin) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  if (typeof layerId !== "string" || layerId.trim() === "") {
    console.warn(`Invalid layer id for pin of "${itemId}".`);

    return false;
  }

  if (pin !== null && !isNormalizedPin(pin)) {
    console.warn(`Invalid normalized pin for "${itemId}".`);

    return false;
  }

  const pinIndex = item.pins.findIndex(
    (storedPin) => storedPin.layerId === layerId,
  );

  if (pin === null) {
    if (pinIndex >= 0) {
      item.pins.splice(pinIndex, 1);
    }
  } else if (pinIndex >= 0) {
    item.pins[pinIndex].xRatio = pin.xRatio;

    item.pins[pinIndex].yRatio = pin.yRatio;
  } else {
    item.pins.push({
      layerId,
      xRatio: pin.xRatio,
      yRatio: pin.yRatio,
    });
  }

  touchActiveProduct();

  return true;
}

/**
 * Removes the artwork pin of one checklist item from one layer.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {string} layerId - Artwork layer whose pin should be removed.
 * @returns {boolean} True when the pin existed and was removed.
 */
function removeItemPinFromLayer(itemId, layerId) {
  const item = getItemById(itemId);

  if (!item || !Array.isArray(item.pins)) {
    return false;
  }

  const pinIndex = item.pins.findIndex(
    (storedPin) => storedPin.layerId === layerId,
  );

  if (pinIndex < 0) {
    return false;
  }

  item.pins.splice(pinIndex, 1);

  touchActiveProduct();

  return true;
}

/**
 * Determines whether one artwork layer of a product contains at least one
 * pin, across any checklist item.
 *
 * @param {Product|null} product - Product to inspect.
 * @param {string} layerId - Artwork layer to check.
 * @returns {boolean} True when the layer has at least one pin.
 */
function layerHasPins(product, layerId) {
  if (!product) {
    return false;
  }

  return Object.values(product.items).some((item) =>
    itemHasPinOnLayer(item, layerId),
  );
}

/**
 * Removes every artwork pin belonging to one layer of a product.
 *
 * Pins belonging to other layers are intentionally left untouched, so this
 * operation is safe to run when more than one layer is present.
 *
 * This is a domain-level mutation only. It does not render the interface,
 * save to localStorage or update timestamps by itself.
 *
 * @param {Product|null} product - Product whose layer pins should be removed.
 * @param {string} layerId - Artwork layer to clear.
 * @returns {number} Number of pins that were cleared.
 */
function clearLayerPins(product, layerId) {
  if (!product) {
    return 0;
  }

  let clearedCount = 0;

  Object.values(product.items).forEach((item) => {
    if (itemHasPinOnLayer(item, layerId)) {
      item.pins = item.pins.filter(
        (storedPin) => storedPin.layerId !== layerId,
      );

      clearedCount += 1;
    }
  });

  return clearedCount;
}

/**
 * Checks whether a product currently contains at least one artwork pin on
 * any layer.
 *
 * When no product argument is supplied, the active product is checked.
 * This helper is primarily used before potentially destructive artwork
 * replacement operations.
 *
 * @param {Product|null} [product=getActiveProduct()] - Product to inspect.
 * @returns {boolean} True when at least one checklist item contains a pin.
 */
function productHasPins(product = getActiveProduct()) {
  if (!product) {
    return false;
  }

  return Object.values(product.items).some(
    (item) => Array.isArray(item.pins) && item.pins.length > 0,
  );
}

/**
 * Removes every artwork pin from the supplied product, across all layers.
 *
 * This is a domain-level mutation only. It does not render the interface,
 * save to localStorage or update timestamps by itself, allowing callers to
 * decide when those side effects should occur.
 *
 * @param {Product|null} product - Product whose pins should be removed.
 * @returns {number} Number of pins that were cleared.
 */
function clearProductPins(product) {
  if (!product) {
    return 0;
  }

  let clearedCount = 0;

  Object.values(product.items).forEach((item) => {
    if (Array.isArray(item.pins) && item.pins.length > 0) {
      clearedCount += item.pins.length;

      item.pins = [];
    }
  });

  return clearedCount;
}

// ============================================================
// DOMAIN HELPERS
// ============================================================

/**
 * Updates a product's last-modified timestamp.
 *
 * This helper should be called whenever persistent review data belonging
 * to the product is changed.
 *
 * @param {string} productId - Identifier of the modified product.
 * @returns {boolean} True when the timestamp was updated, false if the product was not found.
 */
function touchProduct(productId) {
  const product = getProductById(productId);

  if (!product) {
    return false;
  }

  product.updatedAt = new Date().toISOString();

  return true;
}

/**
 * Updates the last-modified timestamp of the currently active product.
 *
 * This is a convenience wrapper around touchProduct() for actions that
 * operate exclusively on the active review.
 *
 * @returns {boolean} True when the active product was successfully touched.
 */
function touchActiveProduct() {
  return touchProduct(appState.activeProductId);
}

/**
 * Checks whether a value is one of the review statuses supported by the domain.
 *
 * @param {*} status - Status value to validate.
 * @returns {boolean} True for pending, approved or rejected.
 */
function isValidReviewStatus(status) {
  return VALID_REVIEW_STATUSES.has(status);
}

/**
 * Changes the review status of a checklist item in the active product.
 *
 * Invalid item IDs and unsupported status values are rejected without
 * mutating the domain. A successful change also updates the active
 * product's modification timestamp.
 *
 * Persistence and rendering are intentionally handled by the caller.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {ReviewStatus} status - New review status.
 * @returns {boolean} True when the status was successfully changed.
 */
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

/**
 * Replaces the editable title of a checklist item.
 *
 * The supplied value is converted to a string and trimmed. Empty titles
 * are rejected so that currentTitle always remains usable by the interface.
 * originalTitle is never modified by this function.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {*} newTitle - Proposed replacement title.
 * @returns {boolean} True when currentTitle was successfully updated.
 */
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

/**
 * Updates the reviewer comment associated with a checklist item.
 *
 * Comments are converted to strings and may intentionally be empty.
 * Unlike several lower-level setters, this function immediately persists
 * the change because comment input is treated as an autosave boundary.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {*} comment - New reviewer comment.
 * @returns {boolean} True when the comment was successfully updated.
 */
function setItemComment(itemId, comment) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  item.comment = String(comment);

  touchActiveProduct();

  return true;
}

/**
 * Assigns or removes the normalized artwork pin of a checklist item on the
 * currently active artwork layer.
 *
 * This is the backward-compatible shorthand used by the interface and
 * existing callers. Layer-aware callers should prefer setItemPinForLayer().
 *
 * Pins must use normalized xRatio/yRatio coordinates. Passing null removes
 * the pin from the active layer.
 *
 * @param {string} itemId - Checklist item identifier.
 * @param {NormalizedPin|null} pin - Normalized pin position, or null to remove it.
 * @returns {boolean} True when the pin state was successfully changed.
 */
function setItemPin(itemId, pin) {
  const product = getActiveProduct();

  const activeLayer = getActiveArtworkLayer(product);

  if (!activeLayer) {
    console.warn("Unable to resolve the active artwork layer.");

    return false;
  }

  return setItemPinForLayer(itemId, activeLayer.id, pin);
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

/**
 * Validates the business rules of a single checklist review item.
 *
 * Current rules include:
 * - status must be one of the supported review statuses;
 * - rejected items must contain a non-empty reviewer comment.
 *
 * This function does not modify the item. It only reports validation
 * problems so that both UI and persistence layers can make decisions.
 *
 * @param {ReviewItem} item - Checklist item to validate.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
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

/**
 * Validates every checklist item belonging to the active product.
 *
 * Individual item errors are prefixed with their checklist identifier so
 * that callers can present meaningful product-level validation messages.
 *
 * The absence of an active product is also treated as an invalid state.
 *
 * @returns {{valid: boolean, errors: string[]}} Aggregated validation result.
 */
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

/**
 * Escapes characters that have special meaning in HTML.
 *
 * This helper is used when application-controlled or user-controlled text
 * must be inserted into an HTML template string. Escaping prevents values
 * such as "<", ">", quotes and ampersands from being interpreted as markup.
 *
 * Values are converted to strings before escaping so that the function
 * behaves consistently with numbers, null-like values and other primitives.
 *
 * @param {*} value - Value that will be converted to text and escaped.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Creates the collapsible DOM elements for one checklist section.
 *
 * @param {Object} section - Static checklist section definition.
 * @param {number} sectionIndex - Zero-based section position.
 * @returns {{button: HTMLButtonElement, content: HTMLDivElement}}
 */
function createChecklistSectionElements(section, sectionIndex) {
  const button = document.createElement("button");

  button.type = "button";

  button.className = "section-btn" + (sectionIndex > 0 ? " collapsed" : "");

  button.innerHTML = `
    <span>${escapeHtml(section.title)}</span>

    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 9l-7 7-7-7"/>
    </svg>
  `;

  const content = document.createElement("div");

  content.className = "section-content" + (sectionIndex > 0 ? " hidden" : "");

  button.addEventListener("click", () => {
    content.classList.toggle("hidden");

    button.classList.toggle("collapsed");
  });

  return {
    button,
    content,
  };
}

/**
 * Builds the static markup used by one rendered checklist item.
 *
 * @param {ReviewItem} item - Review item to represent.
 * @returns {string} Checklist item HTML.
 */
function buildChecklistItemMarkup(item) {
  return `
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
}

/**
 * Registers all interactions owned by one checklist item element.
 *
 * @param {HTMLElement} itemElement - Rendered checklist item element.
 * @param {ReviewItem} item - Review item represented by the element.
 * @returns {void}
 */
function bindChecklistItemEvents(itemElement, item) {
  const approveButton = itemElement.querySelector('[data-action="approve"]');

  const rejectButton = itemElement.querySelector('[data-action="reject"]');

  const commentButton = itemElement.querySelector('[data-action="comment"]');

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

  if (
    !approveButton ||
    !rejectButton ||
    !commentButton ||
    !commentTextarea ||
    !editTitleButton ||
    !titleEditInput ||
    !restoreTitleButton
  ) {
    console.warn(`Unable to bind checklist item "${item.id}".`);

    return;
  }

  // ============================================================
  // COMMENT EVENTS
  // ============================================================

  commentButton.addEventListener("click", (event) => {
    event.stopPropagation();

    toggleCommentPanel(item.id);
  });

  commentTextarea.addEventListener("input", (event) => {
    if (!setItemComment(item.id, event.target.value)) {
      return;
    }

    saveStateToStorage();

    renderCommentState(item.id);
  });

  commentTextarea.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  commentTextarea.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // ============================================================
  // TITLE EDIT EVENTS
  // ============================================================

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
    if (editingTitleItemId === item.id) {
      commitTitleEdit(item.id);
    }
  });

  titleEditInput.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  restoreTitleButton.addEventListener("click", (event) => {
    event.stopPropagation();

    restoreOriginalTitle(item.id);
  });

  // ============================================================
  // REVIEW EVENTS
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
  // ARTWORK DRAG / PIN HOVER
  // ============================================================

  itemElement.addEventListener("dragstart", (event) => {
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
}

/**
 * Creates one checklist item DOM node and binds its interactions.
 *
 * @param {ReviewItem} item - Review item to render.
 * @returns {HTMLDivElement} Fully configured checklist item element.
 */
function createChecklistItemElement(item) {
  const itemElement = document.createElement("div");

  itemElement.className = "check-item";

  itemElement.draggable = true;

  itemElement.dataset.id = item.id;

  itemElement.dataset.status = item.status;

  itemElement.innerHTML = buildChecklistItemMarkup(item);

  bindChecklistItemEvents(itemElement, item);

  return itemElement;
}

/**
 * Builds the complete checklist interface for the active product.
 *
 * Structural creation is delegated to specialized helpers so this function
 * remains responsible only for coordinating section and item rendering.
 *
 * @returns {void}
 */
function renderChecklist() {
  const checklistElement = document.getElementById("checklist");

  if (!checklistElement) {
    return;
  }

  checklistElement.innerHTML = "";

  sectionDefinitions.forEach((section, sectionIndex) => {
    const { button, content } = createChecklistSectionElements(
      section,
      sectionIndex,
    );

    section.items.forEach((itemDefinition) => {
      const item = getItemById(itemDefinition.id);

      if (!item) {
        return;
      }

      const itemElement = createChecklistItemElement(item);

      content.appendChild(itemElement);
    });

    checklistElement.append(button, content);
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

/**
 * Clears temporary checklist UI state that must not leak between products.
 *
 * This resets:
 * - open comment panels;
 * - the item currently being edited inline.
 *
 * The function intentionally does not modify appState because these values
 * describe interface state rather than persisted review data.
 *
 * It also intentionally leaves currentZoom unchanged because zoom is treated
 * as a viewer-level preference shared across products.
 *
 * @returns {void}
 */
function resetTransientReviewUiState() {
  openCommentItemIds.clear();

  editingTitleItemId = null;
}

let currentZoom = 1;

// ============================================================
// ZOOM
// ============================================================

/**
 * Changes the visual zoom level of the artwork viewer.
 *
 * The supplied delta is added to the current zoom and the result is clamped
 * between 0.5 and 2, corresponding to 50% and 200%.
 *
 * Zoom affects only the rendered artwork wrapper. It does not modify artwork
 * metadata or persisted pin coordinates. Pins remain stable because their
 * positions are stored as normalized ratios rather than zoom-dependent pixels.
 *
 * The function also updates the visible percentage label in the toolbar.
 *
 * @param {number} delta - Amount to add to the current zoom level.
 * @returns {void}
 */
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

/**
 * Toggles the visibility state of a checklist item's comment editor.
 *
 * Open comment panels are tracked in the temporary openCommentItemIds Set
 * rather than in appState because panel visibility is a UI concern and must
 * not be persisted with the review.
 *
 * After changing the temporary state, the item's comment interface is
 * re-rendered to reflect the new visibility.
 *
 * @param {string} itemId - Checklist item whose comment panel should toggle.
 * @returns {void}
 */
function toggleCommentPanel(itemId) {
  if (openCommentItemIds.has(itemId)) {
    openCommentItemIds.delete(itemId);
  } else {
    openCommentItemIds.add(itemId);
  }

  renderCommentState(itemId);
}

/**
 * Opens a checklist item's comment editor.
 *
 * Unlike toggleCommentPanel(), this function always leaves the panel open.
 * It is useful for workflows that require comment input, such as rejecting
 * an item.
 *
 * When shouldFocus is true, the function attempts to move keyboard focus
 * directly to the item's comment textarea after rendering.
 *
 * @param {string} itemId - Checklist item whose comment panel should open.
 * @param {boolean} [shouldFocus=false] - Whether to focus the comment textarea.
 * @returns {void}
 */
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

/**
 * Synchronizes the comment-related UI of one checklist item with domain and
 * temporary interface state.
 *
 * The function reads:
 * - item.comment from appState;
 * - item validation from validateItemState();
 * - panel visibility from openCommentItemIds.
 *
 * It then updates:
 * - comment panel visibility;
 * - textarea contents;
 * - aria-invalid;
 * - comment-button visual states;
 * - aria-expanded;
 * - validation error visibility and text;
 * - the item's data-valid attribute.
 *
 * A rejected item without a non-empty comment is visually marked as invalid.
 *
 * This function does not mutate the review domain or persist data. Its
 * responsibility is exclusively to represent the existing state in the DOM.
 *
 * @param {string} itemId - Checklist item whose comment UI should be rendered.
 * @returns {void}
 */
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

/**
 * Determines whether the current item copy differs from its immutable
 * original checklist title.
 *
 * This comparison drives the "Edited" indicator and the
 * "Restore original" interface.
 *
 * @param {ReviewItem} item - Checklist item to inspect.
 * @returns {boolean} True when currentTitle differs from originalTitle.
 */
function isItemTitleEdited(item) {
  return item.currentTitle !== item.originalTitle;
}

/**
 * Starts inline copy editing for a checklist item.
 *
 * The item ID is stored in the temporary editingTitleItemId UI state and the
 * item is re-rendered so that its normal title is replaced by the edit input.
 *
 * After rendering, the input is focused and its existing value is selected,
 * allowing the reviewer to immediately type a replacement.
 *
 * No domain data is modified until commitTitleEdit() succeeds.
 *
 * @param {string} itemId - Checklist item whose currentTitle should be edited.
 * @returns {void}
 */
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

/**
 * Commits the value currently entered in an item's inline title editor.
 *
 * The proposed value is trimmed before validation. Empty or whitespace-only
 * titles are rejected and the edit is cancelled without changing currentTitle.
 *
 * On success the function:
 * - updates currentTitle through the domain setter;
 * - exits edit mode;
 * - re-renders the checklist item;
 * - refreshes the item's pin tooltip when a pin exists;
 * - persists the updated review to localStorage.
 *
 * originalTitle is never modified.
 *
 * @param {string} itemId - Checklist item whose inline edit should be committed.
 * @returns {boolean} True when the title was successfully saved.
 */
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

  const activeLayer = getActiveArtworkLayer(getActiveProduct());

  if (activeLayer && itemHasPinOnLayer(item, activeLayer.id)) {
    renderPin(itemId);
  }

  saveStateToStorage();

  return true;
}

/**
 * Cancels inline editing for a checklist item without changing its domain data.
 *
 * The function only acts when the supplied item is currently being edited.
 * It clears the temporary editing state and restores the normal rendered view.
 *
 * @param {string} itemId - Checklist item whose edit session should be cancelled.
 * @returns {void}
 */
function cancelTitleEdit(itemId) {
  if (editingTitleItemId !== itemId) {
    return;
  }

  editingTitleItemId = null;

  renderItemState(itemId);
}

/**
 * Restores a checklist item's editable title to its immutable original value.
 *
 * Restoration is performed through setItemCurrentTitle() so that normal
 * domain mutation rules remain centralized.
 *
 * On success the function:
 * - exits inline edit mode;
 * - re-renders the checklist item;
 * - updates the pin tooltip when the item is pinned;
 * - persists the restored value.
 *
 * @param {string} itemId - Checklist item whose original title should be restored.
 * @returns {boolean} True when the original title was successfully restored.
 */
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

  const activeLayer = getActiveArtworkLayer(getActiveProduct());

  if (activeLayer && itemHasPinOnLayer(item, activeLayer.id)) {
    renderPin(itemId);
  }

  saveStateToStorage();

  return true;
}

// ============================================================
// ITEM STATE RENDERING
// ============================================================

/**
 * Synchronizes all dynamic UI states of one rendered checklist item with the
 * current domain and temporary interface state.
 *
 * The function updates:
 * - current title text;
 * - inline-edit input visibility and value;
 * - Edited indicator;
 * - original-title correction metadata;
 * - edit-button state;
 * - review status label;
 * - Approve and Reject button states;
 * - accessibility attributes;
 * - comment UI and validation.
 *
 * It reads the item from the active product in appState but does not mutate
 * the domain or persist anything.
 *
 * This function assumes that renderChecklist() has already created the item's
 * base DOM structure.
 *
 * @param {string} itemId - Checklist item whose UI should be synchronized.
 * @returns {void}
 */
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

/**
 * Handles an Approve or Reject action initiated from the checklist UI.
 *
 * Review status buttons behave as toggles:
 *
 * - selecting a different status applies that status;
 * - selecting the already active status returns the item to Pending.
 *
 * Status mutation is delegated to setItemStatus().
 *
 * When an item becomes Rejected, its comment panel is automatically opened
 * and the comment textarea receives focus so that the reviewer can provide
 * the required rejection reason.
 *
 * After a successful status change the function re-renders the item, updates
 * overall review progress and persists the review.
 *
 * @param {string} itemId - Checklist item receiving the review action.
 * @param {ReviewStatus} requestedStatus - Approved or Rejected status requested by the UI.
 * @returns {void}
 */
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

/**
 * Recalculates and renders review progress for the active product.
 *
 * Progress is derived exclusively from appState rather than from DOM classes
 * or selected controls.
 *
 * An item counts as reviewed whenever its status is not Pending. Therefore
 * both Approved and Rejected items contribute to the reviewed count.
 *
 * The function updates:
 * - the "X / Y reviewed" text;
 * - the progress bar width percentage.
 *
 * Detailed Approved, Rejected and Pending metrics are intentionally handled
 * separately by the review-metrics layer.
 *
 * @returns {void}
 */
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

/**
 * Creates a completely new product review and makes it the active product.
 *
 * The new product receives:
 * - a permanent unique ID;
 * - a fresh 49-item checklist;
 * - empty product fields;
 * - no artwork;
 * - no comments, review decisions or pins.
 *
 * After creation the function resets transient review UI state, persists the
 * complete workspace, refreshes the product tabs and active product interface,
 * scrolls the new tab into view and displays user feedback.
 *
 * @returns {string} Permanent ID of the newly created product.
 */
function createNewProduct() {
  const productId = generateProductId();

  const product = createProduct(productId);

  appState.products[productId] = product;

  appState.activeProductId = productId;

  resetTransientReviewUiState();

  saveStateToStorage();

  renderWorkspaceState({
    scrollActiveTab: true,
  });

  showToast("New product created.");

  return productId;
}

function renderWorkspaceState({
  scrollActiveTab = false,
  rebuildChecklist = false,
} = {}) {
  if (rebuildChecklist) {
    renderChecklist();
  }

  renderProductTabs();

  renderAppState();

  if (scrollActiveTab) {
    scrollActiveProductTabIntoView();
  }
}

/**
 * Changes which product is currently active in the workspace.
 *
 * Switching products does not modify the product itself and therefore does
 * not update its updatedAt timestamp.
 *
 * Temporary checklist UI state is cleared to prevent open comment panels or
 * inline-edit sessions from one product appearing in another product.
 *
 * The selected product ID is persisted so that the same product remains active
 * after the page is reloaded.
 *
 * @param {string} productId - Permanent ID of the product to activate.
 * @returns {boolean} True when the product exists and is active after the call.
 */
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

  renderWorkspaceState({
    scrollActiveTab: true,
  });

  return true;
}

/**
 * Changes the Product Name of a specific product.
 *
 * The supplied name is converted to a string and trimmed. Empty names are
 * rejected so that explicit rename operations cannot produce a blank label.
 *
 * A successful rename:
 * - updates product.productName;
 * - refreshes the product modification timestamp;
 * - persists the workspace;
 * - refreshes product tabs;
 * - refreshes product inputs when the renamed product is currently active.
 *
 * This is the reusable product-level operation. User interaction for obtaining
 * the new name is handled separately by renameActiveProduct().
 *
 * @param {string} productId - Permanent ID of the product to rename.
 * @param {*} newName - Proposed new product name.
 * @returns {boolean} True when the product was successfully renamed.
 */
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

/**
 * Opens the rename dialog for the currently active product.
 *
 * This function belongs to the UI interaction layer. It requests the new
 * product name through the custom application dialog and delegates the actual
 * domain mutation to renameProduct().
 *
 * Cancelling the dialog leaves the product unchanged. An empty submitted name
 * is rejected and produces user feedback.
 *
 * @async
 * @returns {Promise<void>} Resolves after the rename flow is completed or cancelled.
 */
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

/**
 * Creates an independent duplicate of an existing product review.
 *
 * The duplicated product copies the source review data, including:
 * - product fields;
 * - review statuses;
 * - comments;
 * - current copy corrections;
 * - independent artwork layers with artwork metadata;
 * - per-layer normalized pins;
 * - the active layer identifier;
 * - reviewer information.
 *
 * The duplicate receives:
 * - a new permanent product ID;
 * - a new creation timestamp;
 * - a new modification timestamp;
 * - a Product Name suffixed with "Copy".
 *
 * The serialized clone is passed through rehydrateProduct() so canonical item
 * properties such as immutable originalTitle are reconstructed correctly.
 *
 * Artwork metadata is duplicated, but the runtime Object URL for the actual
 * image file is intentionally not shared between products.
 *
 * The duplicate becomes the active product and the workspace is persisted
 * and re-rendered.
 *
 * @param {string} productId - Permanent ID of the product to duplicate.
 * @returns {string|null} New product ID, or null when the source does not exist.
 */
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

  renderWorkspaceState({
    scrollActiveTab: true,
  });

  showToast("Product duplicated.");

  return newProductId;
}

/**
 * Duplicates the currently active product.
 *
 * This is a convenience UI wrapper around duplicateProduct(). The actual
 * duplication rules remain centralized in the reusable product-level function.
 *
 * @returns {void}
 */
function duplicateActiveProduct() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  duplicateProduct(product.id);
}

/**
 * Deletes a product and all review data associated with it.
 *
 * The workspace must always contain at least one product, so deletion is
 * rejected when the supplied product is the last remaining product.
 *
 * Before deletion, the supplied confirmation callback is executed. Keeping
 * confirmation injectable allows this domain operation to be tested without
 * depending on the browser's native confirmation dialog.
 *
 * When deletion succeeds:
 * - every layer session Object URL of the product is released;
 * - the product is removed from appState;
 * - another product becomes active when the deleted product was active;
 * - transient review UI state is reset when necessary;
 * - the workspace is persisted and re-rendered.
 *
 * @param {string} productId - Permanent ID of the product to delete.
 * @param {Function} [confirmDelete=window.confirm] - Synchronous callback that
 *   receives the confirmation message and returns true to allow deletion.
 * @returns {boolean} True when the product was deleted.
 */
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

  releaseProductSessionArtworks(productId);

  delete appState.products[productId];

  if (wasActive) {
    const remainingIds = getProductIds();

    const nextIndex = Math.min(productIndex, remainingIds.length - 1);

    appState.activeProductId = remainingIds[nextIndex];

    resetTransientReviewUiState();
  }

  saveStateToStorage();

  renderWorkspaceState();

  showToast("Product deleted.");

  return true;
}

/**
 * Runs the interactive deletion flow for the currently active product.
 *
 * The function performs preliminary UI checks and displays the custom danger
 * confirmation dialog. If the reviewer confirms the operation, deletion is
 * delegated to deleteProduct().
 *
 * A confirmation callback that always returns true is supplied to
 * deleteProduct() because the user has already confirmed through the custom
 * asynchronous dialog.
 *
 * The last remaining product cannot enter the destructive deletion flow.
 *
 * @async
 * @returns {Promise<void>} Resolves after deletion is completed or cancelled.
 */
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

/**
 * Synchronizes the review-context header with the active product.
 *
 * Displays the current:
 * - Product;
 * - Production Code;
 * - Site;
 * - Artwork Revision.
 *
 * The function performs one-way rendering only:
 *
 *     appState → review context header
 *
 * No domain state is modified or persisted by this function.
 *
 * @returns {void}
 */
function renderProductContext() {
  const product = getActiveProduct();

  const productElement = document.getElementById("ctx-product");

  const codeElement = document.getElementById("ctx-code");

  const siteElement = document.getElementById("ctx-site");

  const artworkRevisionElement = document.getElementById("ctx-artwork-rev");

  if (productElement) {
    productElement.textContent = product
      ? getProductDisplayName(product, getProductIds().indexOf(product.id))
      : "—";
  }

  if (codeElement) {
    codeElement.textContent = product?.productionCode || "—";
  }

  if (siteElement) {
    siteElement.textContent = product?.site || "—";
  }

  if (artworkRevisionElement) {
    artworkRevisionElement.textContent = product?.artworkVersion || "—";
  }
}

/**
 * Synchronizes the product-information form with the active product.
 *
 * The function renders:
 * - Brand;
 * - Product Name;
 * - Weight;
 * - SKU;
 * - Production Code;
 * - Site;
 * - Artwork Revision.
 *
 * It performs one-way rendering only:
 *
 *     appState → product form
 *
 * @returns {void}
 */
function renderProductInputs() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const brandInput = document.getElementById("inp-brand");

  const nameInput = document.getElementById("inp-name");

  const weightInput = document.getElementById("inp-weight");

  const skuInput = document.getElementById("inp-sku");

  const productionCodeInput = document.getElementById("inp-production-code");

  const siteInput = document.getElementById("inp-site");

  const artworkVersionInput = document.getElementById("inp-artwork-version");

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

  if (productionCodeInput) {
    productionCodeInput.value = product.productionCode;
  }

  if (siteInput) {
    siteInput.value = product.site;
  }

  if (artworkVersionInput) {
    artworkVersionInput.value = product.artworkVersion;
  }
}

/**
 * Connects product-information form inputs to the active product domain state.
 *
 * Input listeners are registered for:
 * - Brand;
 * - Product Name;
 * - Weight;
 * - SKU;
 * - Production Code;
 * - Site;
 * - Artwork Version.
 *
 * Each change updates the currently active product, refreshes its updatedAt
 * timestamp, immediately persists the workspace and re-renders the header
 * review context.
 *
 * Product Name changes also re-render the product tabs because tab labels are
 * derived from product.productName.
 *
 * This function should normally be called once during application
 * initialization to avoid registering duplicate input listeners.
 *
 * @returns {void}
 */
function bindProductInputs() {
  const brandInput = document.getElementById("inp-brand");

  const nameInput = document.getElementById("inp-name");

  const weightInput = document.getElementById("inp-weight");

  const skuInput = document.getElementById("inp-sku");

  const productionCodeInput = document.getElementById("inp-production-code");

  const siteInput = document.getElementById("inp-site");

  const artworkVersionInput = document.getElementById("inp-artwork-version");

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

      renderProductContext();
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

  if (productionCodeInput) {
    productionCodeInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.productionCode = event.target.value;

      touchActiveProduct();

      saveStateToStorage();

      renderProductContext();
    });
  }

  if (siteInput) {
    siteInput.addEventListener("change", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.site = event.target.value;

      touchActiveProduct();

      saveStateToStorage();

      renderProductContext();
    });
  }

  if (artworkVersionInput) {
    artworkVersionInput.addEventListener("input", (event) => {
      const product = getActiveProduct();

      if (!product) {
        return;
      }

      product.artworkVersion = event.target.value;

      touchActiveProduct();

      saveStateToStorage();

      renderProductContext();
    });
  }
}

// ============================================================
// PINS
// ============================================================

const pinsLayer = document.getElementById("pins-layer");

const artworkWrapper = document.getElementById("artwork-wrapper");

/**
 * Restricts a numeric ratio to the normalized coordinate range from 0 to 1.
 *
 * Values below zero become 0 and values above one become 1.
 *
 * This prevents artwork pin coordinates from being persisted outside the
 * visible normalized artwork area.
 *
 * @param {number} value - Ratio to normalize.
 * @returns {number} Value clamped between 0 and 1.
 */
function clampRatio(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Validates the canonical normalized artwork-pin structure.
 *
 * A valid pin must be a plain object containing finite xRatio and yRatio
 * values, both within the inclusive range from 0 to 1.
 *
 * This is the current persisted pin format used by schema version 2.
 *
 * @param {*} pin - Value to validate.
 * @returns {boolean} True when the value is a valid NormalizedPin.
 */
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

/**
 * Detects the pixel-based pin format used by legacy review data.
 *
 * Legacy pins contain finite numeric x and y coordinates instead of the
 * normalized xRatio and yRatio fields used by the current schema.
 *
 * This helper exists only for backward-compatible migration and should not be
 * used when creating new pin state.
 *
 * @param {*} pin - Value to inspect.
 * @returns {boolean} True when the value matches the legacy pixel-pin shape.
 */
function isLegacyPixelPin(pin) {
  if (!isPlainObject(pin)) {
    return false;
  }

  return Number.isFinite(pin.x) && Number.isFinite(pin.y);
}

/**
 * Converts browser pointer coordinates into normalized coordinates relative to
 * the currently rendered artwork rectangle.
 *
 * The returned ratios are independent from absolute pixel size and therefore
 * remain meaningful when the artwork is zoomed or rendered at another size.
 *
 * Coordinates outside the rectangle are clamped to the valid 0–1 range.
 * Rectangles without positive width or height cannot produce valid geometry.
 *
 * @param {number} clientX - Horizontal browser viewport coordinate.
 * @param {number} clientY - Vertical browser viewport coordinate.
 * @param {DOMRect|Object} rectangle - Artwork bounding rectangle containing
 *   left, top, width and height values.
 * @returns {NormalizedPin|null} Normalized pin coordinates, or null when the
 *   rectangle cannot be used.
 */
function calculatePinRatios(clientX, clientY, rectangle) {
  if (!rectangle || rectangle.width <= 0 || rectangle.height <= 0) {
    return null;
  }

  return {
    xRatio: clampRatio((clientX - rectangle.left) / rectangle.width),

    yRatio: clampRatio((clientY - rectangle.top) / rectangle.height),
  };
}

/**
 * Reads the current untransformed layout dimensions of the artwork wrapper.
 *
 * offsetWidth and offsetHeight are used instead of the transformed bounding
 * rectangle so that legacy pixel coordinates can be interpreted relative to
 * the artwork's base layout size rather than the current zoom level.
 *
 * @returns {{width: number, height: number}|null} Positive artwork dimensions,
 *   or null when the wrapper is unavailable or has no usable size.
 */
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

/**
 * Converts a legacy pixel-based artwork pin into the current normalized format.
 *
 * Legacy x/y coordinates are divided by the artwork's base width and height.
 * The resulting ratios are clamped so migrated data always conforms to the
 * canonical normalized coordinate range.
 *
 * This function is used by schema migration and should not normally be needed
 * during regular user interaction.
 *
 * @param {{x: number, y: number}} pin - Legacy pixel-based pin.
 * @param {number} width - Base artwork width used by the legacy coordinates.
 * @param {number} height - Base artwork height used by the legacy coordinates.
 * @returns {NormalizedPin|null} Migrated normalized pin, or null when the
 *   supplied legacy data or dimensions are invalid.
 */
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

/**
 * Creates the DOM representation of a checklist item pinned to the active
 * artwork layer.
 *
 * The element is positioned using percentage values derived from the item's
 * normalized xRatio and yRatio coordinates on the active layer. This allows
 * the marker to remain attached to the same relative artwork location as
 * display dimensions change.
 *
 * The pin contains:
 * - the checklist item identifier;
 * - a tooltip using the item's currentTitle.
 *
 * currentTitle is HTML-escaped before insertion into the template.
 *
 * Clicking the pin navigates back to the corresponding checklist item.
 *
 * An item without a pin on the active layer cannot be rendered and returns
 * null so callers do not build empty markers.
 *
 * The generated element carries permanent identity through data attributes:
 * - data-item-id identifies the checklist item;
 * - data-layer-id identifies the artwork layer that owns the pin.
 *
 * data-pid is preserved for backward compatibility.
 *
 * @param {ReviewItem} item - Pinned checklist item to render.
 * @param {NormalizedPin|null} pin - Pin belonging to the active layer.
 * @returns {HTMLDivElement|null} Newly created pin element, or null when the
 *   pin is missing.
 */
function createPinElement(item, pin = null) {
  if (!pin) {
    return null;
  }

  const product = getActiveProduct();

  const activeLayer = getActiveArtworkLayer(product);

  const layerId = pin.layerId ? pin.layerId : activeLayer ? activeLayer.id : "";

  const pinElement = document.createElement("div");

  pinElement.className = "pin";

  pinElement.dataset.pid = item.id;

  pinElement.dataset.itemId = item.id;

  pinElement.dataset.layerId = layerId;

  pinElement.style.left = `${pin.xRatio * 100}%`;

  pinElement.style.top = `${pin.yRatio * 100}%`;

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

/**
 * Re-renders a single checklist pin from the active product's active layer.
 *
 * Any existing DOM pin for the supplied item is removed first. If the item
 * exists and still contains a pin on the active layer, a fresh element is
 * created and appended to the pin layer.
 *
 * This replacement approach also ensures that changes such as currentTitle
 * edits are immediately reflected in the pin tooltip.
 *
 * @param {string} itemId - Checklist item whose pin should be refreshed.
 * @returns {void}
 */
function renderPin(itemId) {
  if (!pinsLayer) {
    return;
  }

  const existing = document.querySelector(`.pin[data-pid="${itemId}"]`);

  if (existing) {
    existing.remove();
  }

  const item = getItemById(itemId);

  const product = getActiveProduct();

  const activeLayer = getActiveArtworkLayer(product);

  const pin = activeLayer ? getItemPinForLayer(item, activeLayer.id) : null;

  if (!item || !pin) {
    return;
  }

  const pinElement = createPinElement(item, pin);

  if (pinElement) {
    pinsLayer.appendChild(pinElement);
  }
}

/**
 * Rebuilds every artwork pin belonging to the active layer of the currently
 * active product.
 *
 * The existing pin layer is cleared first and only items whose domain state
 * contains a pin on the active layer are rendered.
 *
 * Because each product owns an independent items collection and each layer
 * owns an independent pin set, switching products or layers followed by this
 * render automatically displays only the active layer's pins.
 *
 * No pin state is created, changed or persisted by this function.
 *
 * @returns {void}
 */
function renderPins() {
  if (!pinsLayer) {
    return;
  }

  pinsLayer.innerHTML = "";

  const product = getActiveProduct();

  const activeLayer = getActiveArtworkLayer(product);

  if (!product || !activeLayer) {
    return;
  }

  Object.values(product.items).forEach((item) => {
    const pin = getItemPinForLayer(item, activeLayer.id);

    if (pin) {
      const pinElement = createPinElement(item, pin);

      if (pinElement) {
        pinsLayer.appendChild(pinElement);
      }
    }
  });
}

/**
 * Assigns a normalized artwork location to a checklist item on the active
 * artwork layer and immediately reflects the change in the application.
 *
 * Pin mutation is delegated to setItemPinForLayer() so coordinate validation
 * and timestamp updates remain centralized in the domain layer.
 *
 * On success the function:
 * - renders the new pin;
 * - persists the workspace;
 * - displays confirmation feedback.
 *
 * @param {string} itemId - Checklist item to pin to the artwork.
 * @param {NormalizedPin} pin - Normalized artwork coordinates.
 * @returns {boolean} True when the pin was successfully stored and rendered.
 */
function addPin(itemId, pin) {
  const item = getItemById(itemId);

  if (!item) {
    return false;
  }

  const product = getActiveProduct();

  const activeLayer = getActiveArtworkLayer(product);

  if (!activeLayer) {
    return false;
  }

  if (!setItemPinForLayer(itemId, activeLayer.id, pin)) {
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

/**
 * Navigates from an artwork pin to its corresponding checklist item.
 *
 * If the checklist item belongs to a collapsed section, the section is
 * automatically expanded before scrolling.
 *
 * The item is centered in the viewport using smooth scrolling and receives a
 * temporary background highlight so the reviewer can quickly identify it.
 *
 * This function changes only presentation state. It does not mutate appState
 * or persist any review data.
 *
 * @param {string} itemId - Checklist item to reveal and highlight.
 * @returns {void}
 */
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

/**
 * Applies the temporary highlight animation to an artwork pin.
 *
 * This is used when the reviewer hovers over a pinned checklist item,
 * providing visual navigation from checklist item to artwork location.
 *
 * The function has no effect when the corresponding pin is not currently
 * rendered.
 *
 * @param {string} itemId - Checklist item whose artwork pin should be highlighted.
 * @returns {void}
 */
function highlightPin(itemId) {
  const activeLayer = getActiveArtworkLayer(getActiveProduct());

  if (!activeLayer) {
    return;
  }

  const pin = document.querySelector(
    `.pin[data-layer-id="${activeLayer.id}"][data-pid="${itemId}"]`,
  );

  if (pin) {
    pin.classList.add("pulse");
  }
}

/**
 * Removes the temporary highlight animation from an artwork pin.
 *
 * This complements highlightPin() and is normally called when the pointer
 * leaves the corresponding checklist item.
 *
 * @param {string} itemId - Checklist item whose artwork pin should stop highlighting.
 * @returns {void}
 */
function unhighlightPin(itemId) {
  const activeLayer = getActiveArtworkLayer(getActiveProduct());

  if (!activeLayer) {
    return;
  }

  const pin = document.querySelector(
    `.pin[data-layer-id="${activeLayer.id}"][data-pid="${itemId}"]`,
  );

  if (pin) {
    pin.classList.remove("pulse");
  }
}

/**
 * Applies artwork metadata to one artwork layer while protecting existing
 * layer pin geometry.
 *
 * The function compares the candidate artwork with the target layer's
 * current artwork identity.
 *
 * When the artwork is different and the target layer already contains pins,
 * the supplied confirmation callback must approve the replacement before
 * any destructive change occurs.
 *
 * If replacement is approved:
 * - pins on the target layer are cleared when the artwork identity changed;
 * - artwork metadata is copied into the target layer domain;
 * - the product modification timestamp is updated;
 * - the workspace is persisted.
 *
 * Pins and artwork metadata belonging to other layers are never touched.
 *
 * Selecting the same artwork does not clear existing pins.
 *
 * Only persistable artwork metadata is stored here. The actual image file
 * and its Object URL are handled separately by the artwork-session functions.
 *
 * @param {ArtworkMetadata} metadata - Valid artwork metadata to apply.
 * @param {Function} [confirmReplacement=window.confirm] - Synchronous callback
 *   used when replacing artwork that already contains pins.
 * @param {string} [productId=appState.activeProductId] - Product receiving the artwork.
 * @param {string} [layerId] - Layer receiving the artwork; defaults to the
 *   product's active layer.
 * @returns {{
 *   applied: boolean,
 *   reason?: string,
 *   sameArtwork?: boolean,
 *   pinsCleared?: number
 * }} Result describing whether the artwork was applied.
 */
function applyArtworkIdentity(
  metadata,
  confirmReplacement = window.confirm,
  productId = appState.activeProductId,
  layerId,
) {
  const product = getProductById(productId);

  if (!product) {
    return {
      applied: false,
      reason: "no-product",
    };
  }

  const targetLayer = layerId
    ? getArtworkLayerById(product, layerId)
    : getActiveArtworkLayer(product);

  if (!targetLayer) {
    return {
      applied: false,
      reason: "no-layer",
    };
  }

  if (!isValidArtworkMetadata(metadata)) {
    return {
      applied: false,
      reason: "invalid-metadata",
    };
  }

  const previousArtwork = targetLayer.artwork;

  const sameArtwork = isSameArtworkIdentity(previousArtwork, metadata);

  if (sameArtwork) {
    return {
      applied: true,
      sameArtwork: true,
      pinsCleared: 0,
    };
  }

  const hasPins = layerHasPins(product, targetLayer.id);

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
    pinsCleared = clearLayerPins(product, targetLayer.id);
  }

  targetLayer.artwork = cloneArtworkMetadata(metadata);

  touchProduct(productId);
  saveStateToStorage();

  return {
    applied: true,
    sameArtwork,
    pinsCleared,
  };
}

/**
 * Builds the persistable artwork metadata object from a browser File and its
 * natural image dimensions.
 *
 * The returned object intentionally contains only lightweight information that
 * can safely be stored in appState, localStorage and exported JSON.
 *
 * The File object itself is not persisted.
 *
 * @param {File} file - Browser file selected by the reviewer.
 * @param {number} width - Natural image width in pixels.
 * @param {number} height - Natural image height in pixels.
 * @returns {ArtworkMetadata} Persistable artwork identity metadata.
 */
function createArtworkMetadata(file, width, height) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    width,
    height,
  };
}

/**
 * Resolves the layer identifier used by session operations.
 *
 * When an explicit layer id is supplied it is used directly. Otherwise the
 * product's active layer determines the session, which keeps existing
 * single-layer call sites working without changing their arguments.
 *
 * @param {string} productId - Product owning the session.
 * @param {string|null} [requestedLayerId=null] - Explicit layer id, or null
 *   to resolve the product's active layer.
 * @returns {string|null} Resolved layer id, or null when unavailable.
 */
function resolveSessionLayerId(productId, requestedLayerId = null) {
  if (typeof requestedLayerId === "string" && requestedLayerId !== "") {
    return requestedLayerId;
  }

  const product = getProductById(productId);

  if (!product) {
    return null;
  }

  const activeLayer = getActiveArtworkLayer(product);

  return activeLayer ? activeLayer.id : null;
}

/**
 * Retrieves the temporary artwork session associated with one artwork layer
 * of a product.
 *
 * Artwork sessions contain runtime-only information such as the Object URL
 * required to display a locally selected image. They are stored separately
 * from appState because Object URLs are valid only during the current browser
 * session and must never be persisted.
 *
 * When createIfMissing is true, a new empty session is created for the
 * (product, layer) pair when one does not already exist.
 *
 * Each (product, layer) pair owns an independent session so switching between
 * products or layers does not replace another pair's loaded image.
 *
 * @param {string} [productId=appState.activeProductId] - Product whose session is requested.
 * @param {string|null} [layerId=null] - Layer whose session is requested;
 *   defaults to the product's active layer.
 * @param {boolean} [createIfMissing=false] - Whether to create an empty session when absent.
 * @returns {{metadata: ArtworkMetadata|null, objectUrl: string|null}|null}
 *   Existing or newly created session, or null when unavailable.
 */
function getArtworkSession(
  productId = appState.activeProductId,
  layerId = null,
  createIfMissing = false,
) {
  if (!productId) {
    return null;
  }

  const resolvedLayerId = resolveSessionLayerId(productId, layerId);

  if (!resolvedLayerId) {
    return null;
  }

  let layerSessions = artworkSessions.get(productId);

  if (!layerSessions && createIfMissing) {
    layerSessions = new Map();

    artworkSessions.set(productId, layerSessions);
  }

  if (!layerSessions) {
    return null;
  }

  if (!layerSessions.has(resolvedLayerId) && createIfMissing) {
    layerSessions.set(resolvedLayerId, {
      metadata: null,
      objectUrl: null,
    });
  }

  return layerSessions.get(resolvedLayerId) || null;
}

/**
 * Releases the runtime artwork resources of a single (product, layer) pair.
 *
 * If the layer session contains an Object URL, URL.revokeObjectURL() is
 * called before the entry is removed from the product's session map.
 *
 * Persisted layer artwork metadata is intentionally left unchanged.
 *
 * @param {string} productId - Product owning the layer session.
 * @param {string} layerId - Artwork layer whose runtime artwork should be released.
 * @returns {void}
 */
function releaseLayerSessionArtwork(productId, layerId) {
  const session = getArtworkSession(productId, layerId, false);

  if (!session) {
    return;
  }

  if (session.objectUrl) {
    URL.revokeObjectURL(session.objectUrl);
  }

  const layerSessions = artworkSessions.get(productId);

  if (layerSessions) {
    layerSessions.delete(layerId);
  }
}

/**
 * Releases every runtime artwork session owned by one product.
 *
 * All layer sessions of the product are released through
 * releaseLayerSessionArtwork() so their Object URLs are revoked before the
 * product entry is removed from artworkSessions.
 *
 * @param {string} [productId=appState.activeProductId] - Product whose
 *   runtime artwork should be released.
 * @returns {void}
 */
function releaseProductSessionArtworks(productId = appState.activeProductId) {
  const layerSessions = artworkSessions.get(productId);

  if (!layerSessions) {
    return;
  }

  [...layerSessions.keys()].forEach((layerId) => {
    releaseLayerSessionArtwork(productId, layerId);
  });

  artworkSessions.delete(productId);
}

/**
 * Releases all runtime artwork resources associated with one product.
 *
 * When a layer id is supplied only that layer's session is released;
 * otherwise every layer session of the product is released. This keeps the
 * historical product-scoped behavior while supporting layer-scoped calls.
 *
 * Persisted artwork metadata is intentionally left unchanged.
 *
 * @param {string} [productId=appState.activeProductId] - Product whose runtime artwork should be released.
 * @param {string|null} [layerId=null] - Optional layer to release; when
 *   omitted, every layer session of the product is released.
 * @returns {void}
 */
function releaseSessionArtwork(
  productId = appState.activeProductId,
  layerId = null,
) {
  if (typeof layerId === "string" && layerId !== "") {
    releaseLayerSessionArtwork(productId, layerId);

    return;
  }

  releaseProductSessionArtworks(productId);
}

/**
 * Releases every temporary artwork session currently held by the application.
 *
 * Each registered product is delegated to releaseProductSessionArtworks() so
 * every layer Object URL is properly revoked before being removed.
 *
 * This function is primarily useful during application shutdown or page unload
 * to avoid leaving browser-managed Object URLs unnecessarily allocated.
 *
 * @returns {void}
 */
function releaseAllSessionArtworks() {
  [...artworkSessions.keys()].forEach((productId) => {
    releaseProductSessionArtworks(productId);
  });
}

/**
 * Associates a loaded artwork Object URL with one artwork layer's runtime
 * session.
 *
 * If the (product, layer) pair already has another Object URL, the previous
 * URL is revoked before the new one is adopted. This prevents stale browser
 * resources from accumulating when artwork files are replaced or reselected.
 *
 * Artwork metadata is cloned before being stored in the session so the runtime
 * session does not depend on the caller's object reference.
 *
 * This function affects session-only state and does not mutate layer artwork
 * metadata or persist anything.
 *
 * @param {ArtworkMetadata} metadata - Metadata identifying the loaded artwork.
 * @param {string} objectUrl - Browser Object URL used to display the image.
 * @param {string} [productId=appState.activeProductId] - Product that owns the session.
 * @param {string|null} [layerId=null] - Layer that owns the session; defaults
 *   to the product's active layer.
 * @returns {boolean} True when the artwork session was successfully adopted.
 */
function adoptSessionArtwork(
  metadata,
  objectUrl,
  productId = appState.activeProductId,
  layerId = null,
) {
  if (!productId) {
    return false;
  }

  const resolvedLayerId = resolveSessionLayerId(productId, layerId);

  if (!resolvedLayerId) {
    return false;
  }

  const session = getArtworkSession(productId, resolvedLayerId, true);

  if (session.objectUrl && session.objectUrl !== objectUrl) {
    URL.revokeObjectURL(session.objectUrl);
  }

  session.metadata = cloneArtworkMetadata(metadata);

  session.objectUrl = objectUrl;

  return true;
}

/**
 * Determines whether the requested artwork is currently available as a loaded
 * browser-session image for one artwork layer of a product.
 *
 * A layer is considered loaded only when:
 * - its runtime session contains an Object URL; and
 * - the session metadata matches the requested artwork identity.
 *
 * This distinction allows persisted layer artwork metadata to survive page
 * reloads while still correctly reporting that the original local file must
 * be selected again.
 *
 * @param {ArtworkMetadata|null} metadata - Persisted artwork identity to compare.
 * @param {string} [productId=appState.activeProductId] - Product whose session should be checked.
 * @param {string|null} [layerId=null] - Layer whose session should be checked;
 *   defaults to the product's active layer.
 * @returns {boolean} True when the corresponding image is available this session.
 */
function isArtworkLoadedInSession(
  metadata,
  productId = appState.activeProductId,
  layerId = null,
) {
  const session = getArtworkSession(productId, layerId, false);

  return (
    Boolean(session?.objectUrl) &&
    isSameArtworkIdentity(session.metadata, metadata)
  );
}

/**
 * Loads and inspects a browser File selected as artwork.
 *
 * The file must use an image MIME type. A temporary Object URL is created and
 * assigned to an Image instance so the browser can determine its natural
 * width and height.
 *
 * Once the image loads successfully, persistable artwork metadata is built and
 * validated before the Promise resolves.
 *
 * If image loading or metadata validation fails, the temporary Object URL is
 * revoked before the Promise is rejected.
 *
 * Ownership of a successfully returned Object URL passes to the caller. The
 * caller must either adopt it into an artwork session or revoke it when the
 * artwork is not used.
 *
 * @param {File} file - Browser image file selected by the reviewer.
 * @returns {Promise<{metadata: ArtworkMetadata, objectUrl: string}>}
 *   Resolves with validated metadata and a temporary Object URL.
 * @throws {Error} Rejects when the file is not an image, cannot be loaded,
 *   or produces invalid artwork metadata.
 */
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

/**
 * Converts a file size in bytes into a compact human-readable string.
 *
 * Values are formatted as:
 * - bytes below 1 KB;
 * - kilobytes below 1 MB;
 * - megabytes otherwise.
 *
 * KB and MB values are rounded to one decimal place.
 *
 * Invalid or non-finite values produce an empty string instead of throwing.
 *
 * @param {number} bytes - File size in bytes.
 * @returns {string} Human-readable file size.
 */
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

/**
 * Creates the compact artwork description displayed in the viewer toolbar.
 *
 * The summary combines:
 * - file name;
 * - natural image dimensions;
 * - formatted file size.
 *
 * Example:
 *
 *     package-front.png · 1600×2400 · 2.4 MB
 *
 * Invalid metadata produces an empty string.
 *
 * @param {ArtworkMetadata} metadata - Artwork metadata to summarize.
 * @returns {string} Human-readable artwork summary.
 */
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

/**
 * Synchronizes the artwork viewer with the active artwork layer of the
 * active product.
 *
 * All artwork state shown by the viewer — metadata, loaded image and pins —
 * refers exclusively to the layer returned by getActiveArtworkLayer().
 * Other layers are never displayed or rendered by this function.
 *
 * The viewer supports three distinct states:
 *
 * 1. Demo
 *    The active layer has no artwork metadata. The built-in demonstration
 *    artwork is shown and pins remain available.
 *
 * 2. Loaded
 *    Valid artwork metadata exists and the matching local image is available
 *    in the layer's runtime artwork session. The real image and pins are shown.
 *
 * 3. File required
 *    Artwork metadata exists but the browser no longer has access to the local
 *    file, typically after reload or JSON import. A placeholder is displayed
 *    asking the reviewer to select the artwork again.
 *
 * Pins remain persisted in the item domain during the File required state, but
 * they are intentionally hidden because displaying them over a placeholder
 * would give a misleading visual reference.
 *
 * The function also updates:
 * - artwork metadata summary;
 * - artwork status badge;
 * - Set/Replace Artwork button text;
 * - demo artwork visibility;
 * - real image visibility;
 * - missing-file message;
 * - pin-layer visibility.
 *
 * This function only renders existing state and does not mutate or persist the
 * product domain.
 *
 * @returns {void}
 */
function renderArtworkState() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const activeLayer = getActiveArtworkLayer(product);

  const demoArtwork = document.getElementById("demo-artwork");

  const artworkImage = document.getElementById("artwork-image");

  const missingState = document.getElementById("artwork-missing");

  const missingName = document.getElementById("artwork-missing-name");

  const statusBadge = document.getElementById("artwork-status-badge");

  const metadataText = document.getElementById("artwork-meta");

  const artworkButton = document.getElementById("btn-artwork");

  const metadata = activeLayer ? activeLayer.artwork : null;

  /*
   * No artwork on the active layer:
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

  const artworkSession = getArtworkSession(product.id, activeLayer.id, false);

  const isLoaded = isArtworkLoadedInSession(metadata, product.id, activeLayer.id);

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

/**
 * Removes all artwork pins belonging to the active layer of the currently
 * active product.
 *
 * Pins on other layers are intentionally left untouched.
 *
 * Pin removal is delegated to clearLayerPins() so the domain mutation remains
 * reusable independently from UI and persistence concerns.
 *
 * After clearing the pins, the function:
 * - updates the active product's modification timestamp;
 * - persists the workspace;
 * - re-renders the pin layer;
 * - displays confirmation feedback.
 *
 * Review statuses, comments, copy corrections and artwork metadata are left
 * unchanged.
 *
 * @returns {void}
 */
function clearPins() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const activeLayer = getActiveArtworkLayer(product);

  if (!activeLayer) {
    return;
  }

  const cleared = clearLayerPins(product, activeLayer.id);

  touchActiveProduct();

  saveStateToStorage();

  renderPins();

  showToast(
    `Cleared ${cleared} pin${cleared === 1 ? "" : "s"} from ${activeLayer.name}.`,
  );
}

// ============================================================
// LAYER D — PERSISTENCE
// D2 — LOCAL STORAGE
// ============================================================

const STORAGE_KEY = `artworkChecklist:v${CURRENT_SCHEMA_VERSION}`;

const LEGACY_STORAGE_KEYS = ["artworkChecklist:v2", "artworkChecklist:v1"];
// ============================================================
// STATE SERIALIZATION
// ============================================================

/*
 * Persisted-state restoration pipeline:
 *
 * serialized JSON
 *      ↓
 * deserialize
 *      ↓
 * migrate
 *      ↓
 * validate
 *      ↓
 * rehydrate
 *      ↓
 * appState
 *
 * Each step has a separate responsibility and should remain independent.
 */

/**
 * Serializes the complete application workspace into JSON.
 *
 * The entire appState is converted into a JSON string, including:
 * - schema version;
 * - active product ID;
 * - every product;
 * - checklist review state;
 * - comments;
 * - copy corrections;
 * - normalized pins;
 * - artwork metadata;
 * - reviewer data;
 * - timestamps.
 *
 * Runtime-only UI state and browser-session resources are intentionally absent
 * because they are stored outside appState.
 *
 * The resulting string is used by local persistence and state-based tests.
 *
 * @returns {string} JSON representation of the complete application state.
 */
function serializeState() {
  return JSON.stringify(appState);
}
// ============================================================
// LAYER D — PERSISTENCE
// D1 — DESERIALIZATION
// ============================================================

/**
 * Parses a serialized JSON string into a plain JavaScript state object.
 *
 * This function performs syntax parsing only. It does not validate schema
 * compatibility, migrate older versions or restore canonical domain
 * properties.
 *
 * Those responsibilities belong respectively to:
 * - migrateState();
 * - validateState();
 * - rehydrateState().
 *
 * Malformed JSON is caught defensively, logged to the console and converted
 * into null so corrupted persisted data cannot crash application startup.
 *
 * @param {string} serializedState - JSON string to parse.
 * @returns {Object|null} Parsed plain object, or null when parsing fails.
 */
function deserializeState(serializedState) {
  try {
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Failed to deserialize state:", error);

    return null;
  }
}

/**
 * Checks whether a value is a non-null object that is not an Array.
 *
 * Persistence validation uses this helper to distinguish expected JSON object
 * structures from primitives, null values and arrays.
 *
 * This is intentionally a lightweight structural check rather than a strict
 * prototype inspection because persisted JSON objects are ordinary parsed
 * object literals.
 *
 * @param {*} value - Value to inspect.
 * @returns {boolean} True when the value is a non-array object.
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Finds the canonical static checklist definition for an item ID.
 *
 * Persisted review data is mutable, but checklist structure comes from
 * sectionDefinitions. This helper allows validation and rehydration logic to
 * compare saved data against that canonical template.
 *
 * The result includes both:
 * - the parent section definition;
 * - the checklist item definition.
 *
 * @param {string} itemId - Permanent checklist item identifier.
 * @returns {{section: Object, definition: Object}|null}
 *   Canonical section and item definition, or null when the ID is unknown.
 */
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

/**
 * Validates one persisted layer pin entry.
 *
 * A valid stored pin must be a plain object containing a non-empty layerId
 * and finite xRatio/yRatio values within the inclusive range from 0 to 1.
 *
 * @param {*} pin - Persisted layer pin entry to validate.
 * @returns {boolean} True when the value is a valid stored layer pin.
 */
function isValidStoredLayerPin(pin) {
  if (!isPlainObject(pin)) {
    return false;
  }

  return (
    typeof pin.layerId === "string" &&
    pin.layerId.trim() !== "" &&
    Number.isFinite(pin.xRatio) &&
    Number.isFinite(pin.yRatio) &&
    pin.xRatio >= 0 &&
    pin.xRatio <= 1 &&
    pin.yRatio >= 0 &&
    pin.yRatio <= 1
  );
}

/**
 * Validates the persisted per-layer pin collection of one checklist item.
 *
 * Validation requires:
 * - an array collection;
 * - every entry to be a valid stored layer pin;
 * - no duplicate pins for the same (item, layer) pair.
 *
 * @param {*} pins - Persisted pin collection to validate.
 * @returns {boolean} True when the collection is structurally acceptable.
 */
function validateItemPins(pins) {
  if (!Array.isArray(pins)) {
    return false;
  }

  const seenLayerIds = new Set();

  for (const pin of pins) {
    if (!isValidStoredLayerPin(pin)) {
      return false;
    }

    if (seenLayerIds.has(pin.layerId)) {
      return false;
    }

    seenLayerIds.add(pin.layerId);
  }

  return true;
}

/**
 * Validates the persisted artwork layers of one product.
 *
 * Validation requires:
 * - a non-empty array collection;
 * - every layer to be a plain object with a non-empty id and a string name;
 * - layer ids to be unique;
 * - every layer artwork to be null or valid artwork metadata;
 * - a non-empty activeArtworkLayerId referencing an existing layer.
 *
 * @param {*} artworkLayers - Persisted artwork layer collection.
 * @param {*} activeArtworkLayerId - Persisted active layer identifier.
 * @returns {boolean} True when the artwork layers are structurally acceptable.
 */
function validateProductLayers(artworkLayers, activeArtworkLayerId) {
  if (!Array.isArray(artworkLayers) || artworkLayers.length === 0) {
    return false;
  }

  const seenLayerIds = new Set();

  for (const layer of artworkLayers) {
    if (
      !isPlainObject(layer) ||
      typeof layer.id !== "string" ||
      layer.id.trim() === "" ||
      typeof layer.name !== "string" ||
      seenLayerIds.has(layer.id)
    ) {
      return false;
    }

    seenLayerIds.add(layer.id);

    if (layer.artwork !== null && !isValidArtworkMetadata(layer.artwork)) {
      return false;
    }
  }

  return (
    typeof activeArtworkLayerId === "string" &&
    activeArtworkLayerId.trim() !== "" &&
    seenLayerIds.has(activeArtworkLayerId)
  );
}

/**
 * Validates the persisted structure of one checklist review item.
 *
 * The saved item is checked against the canonical checklist definition to
 * ensure that external JSON or corrupted storage cannot silently redefine
 * protected checklist structure.
 *
 * Validation confirms:
 * - the value is a plain object;
 * - item.id matches the expected item ID;
 * - sectionId matches the canonical section;
 * - originalTitle matches the canonical checklist title;
 * - currentTitle is a non-empty string;
 * - comment is a string;
 * - status is a supported ReviewStatus;
 * - pins is a valid per-layer pin collection.
 *
 * This function validates persisted structure, not complete review business
 * validity. In particular, a Rejected item with an empty comment may still be
 * persisted because incomplete review work must survive autosave and reload.
 * The rejected-comment business rule is evaluated separately by
 * validateItemState().
 *
 * @param {*} item - Persisted checklist item to validate.
 * @param {string} expectedItemId - Canonical checklist item ID expected here.
 * @returns {boolean} True when the persisted item structure is acceptable.
 */
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

  if (!validateItemPins(item.pins)) {
    return false;
  }

  return true;
}

/**
 * Validates the persisted structure of a complete product review.
 *
 * A valid persisted product must contain:
 * - a non-empty permanent ID;
 * - string product fields;
 * - a valid artwork layer collection with an existing active layer;
 * - the complete canonical checklist item collection;
 * - valid serialized state for every checklist item;
 * - every item pin to reference an existing layer of the same product;
 * - a reviewer object;
 * - string timestamps when timestamps are present.
 *
 * The checklist item set is validated against sectionDefinitions so missing,
 * additional or structurally altered checklist items are rejected.
 *
 * The historical single-artwork product field is tolerated when absent or
 * null, but it is no longer the canonical source of artwork state.
 *
 * This function validates storage/import compatibility. It does not determine
 * whether the review itself is ready for final approval.
 *
 * @param {*} product - Persisted product object to validate.
 * @returns {boolean} True when the product can safely enter rehydration.
 */
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

  if (
    (product.productionCode !== undefined &&
      typeof product.productionCode !== "string") ||
    (product.artworkVersion !== undefined &&
      typeof product.artworkVersion !== "string") ||
    (product.site !== undefined && !isAllowedSite(product.site))
  ) {
    return false;
  }

  if (
    product.artwork !== undefined &&
    product.artwork !== null &&
    !isValidArtworkMetadata(product.artwork)
  ) {
    return false;
  }

  if (!validateProductLayers(product.artworkLayers, product.activeArtworkLayerId)) {
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

  const layerIds = new Set(
    product.artworkLayers.map((layer) => layer.id),
  );

  const itemsAreValid = expectedItemIds.every((itemId) => {
    const item = product.items[itemId];

    if (!validateSerializedItem(item, itemId)) {
      return false;
    }

    /*
     * Every persisted pin must reference a layer that exists on the
     * same product. Dangling layer references are rejected.
     */
    return item.pins.every((pin) => layerIds.has(pin.layerId));
  });

  if (!itemsAreValid) {
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

/**
 * Validates the complete persisted workspace against the current application
 * schema.
 *
 * Validation requires:
 * - a plain top-level state object;
 * - the current schemaVersion;
 * - a non-empty activeProductId;
 * - a non-empty products object;
 * - activeProductId to reference an existing product;
 * - every product key to match product.id;
 * - every product to pass validateSerializedProduct().
 *
 * This function intentionally accepts only the current schema version.
 * Older compatible versions must be processed by migrateState() before this
 * validation step.
 *
 * The function is side-effect free and does not mutate appState.
 *
 * @param {*} state - Candidate workspace state to validate.
 * @returns {boolean} True when the state matches the current persisted schema.
 */
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

/**
 * Reconstructs canonical runtime checklist items from validated saved data.
 *
 * Fresh items are first created through createInitialItems(). This restores
 * domain characteristics that JSON serialization cannot preserve, especially
 * the non-writable originalTitle property.
 *
 * Only mutable review values are then copied from the saved state:
 * - currentTitle;
 * - status;
 * - comment;
 * - per-layer pins.
 *
 * Static properties such as id, sectionId, note and originalTitle come from
 * the current canonical checklist definitions rather than from the persisted
 * object's property descriptors.
 *
 * The input is expected to have already passed structural validation.
 *
 * @param {Object.<string, Object>} savedItems - Validated persisted item data.
 * @returns {Object.<string, ReviewItem>} Reconstructed canonical review items.
 */
function rehydrateItems(savedItems) {
  const hydratedItems = createInitialItems();

  Object.keys(hydratedItems).forEach((itemId) => {
    const savedItem = savedItems[itemId];
    const hydratedItem = hydratedItems[itemId];

    hydratedItem.currentTitle = savedItem.currentTitle;

    hydratedItem.status = savedItem.status;

    hydratedItem.comment = savedItem.comment;

    hydratedItem.pins = (savedItem.pins || []).map((pin) => ({
      ...pin,
    }));
  });

  return hydratedItems;
}

/**
 * Reconstructs a canonical Product instance from validated persisted data.
 *
 * A fresh product is created first through createProduct() so default domain
 * structure is restored. Persisted mutable values are then copied into it.
 *
 * Rehydration includes:
 * - product identification fields;
 * - cloned artwork layers with independent artwork metadata;
 * - the active artwork layer identifier;
 * - canonical checklist-item reconstruction;
 * - reviewer data merged over reviewer defaults;
 * - signature data;
 * - preserved creation and update timestamps when valid.
 *
 * The function intentionally creates new nested objects instead of reusing the
 * parsed JSON object directly.
 *
 * @param {Object} savedProduct - Validated persisted product data.
 * @returns {Product} Reconstructed product suitable for appState.
 */
function rehydrateProduct(savedProduct) {
  const product = createProduct(savedProduct.id);

  product.brand = savedProduct.brand;

  product.productName = savedProduct.productName;

  product.weight = savedProduct.weight;

  product.sku = savedProduct.sku;

  product.productionCode = savedProduct.productionCode ?? "";

  product.site = savedProduct.site ?? "";

  product.artworkVersion = savedProduct.artworkVersion ?? "";

  product.artworkLayers = savedProduct.artworkLayers.map((layer) =>
    createArtworkLayer(layer.id, layer.name, layer.artwork),
  );

  product.activeArtworkLayerId = savedProduct.activeArtworkLayerId;

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

/**
 * Reconstructs the complete runtime workspace from validated persisted state.
 *
 * Top-level schemaVersion and activeProductId are preserved while every saved
 * product is independently rebuilt through rehydrateProduct().
 *
 * Rehydration deliberately produces a new object graph rather than assigning
 * the parsed JSON structure directly to appState.
 *
 * The input must already have been migrated to the current schema and validated.
 *
 * @param {Object} savedState - Validated current-schema persisted state.
 * @returns {Object} Fully rehydrated workspace state.
 */
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

/**
 * Migrates a persisted checklist-item collection to schema v2 pin geometry.
 *
 * Each item's pin is handled according to its stored representation:
 * - null remains null;
 * - an already normalized pin is copied unchanged;
 * - a legacy pixel pin is converted into xRatio/yRatio coordinates;
 * - unsupported pin data causes migration to fail.
 *
 * The function returns a new items object and does not mutate the supplied
 * item collection.
 *
 * Conversion depends on the artwork base dimensions that were used by the
 * legacy pixel coordinate system.
 *
 * @param {Object.<string, Object>} items - Persisted checklist items to migrate.
 * @param {{width: number, height: number}} dimensions - Base artwork dimensions.
 * @returns {Object.<string, Object>} Migrated item collection.
 * @throws {Error} When a legacy pin cannot be safely converted.
 */
function migrateItemsPinsToV2(items, dimensions) {
  const migratedItems = {};

  Object.entries(items).forEach(([itemId, item]) => {
    let migratedPin = null;

    if (item.pin == null) {
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

/**
 * Converts a compatible schema-v1 persisted workspace into schema v2.
 *
 * Schema-v1 state is deep-cloned and every legacy pixel pin is converted
 * into normalized schema-v2 coordinates.
 *
 * The original supplied state is not modified during migration because a deep
 * JSON clone is created before transformation.
 *
 * Migration depends on current artwork base dimensions. If those dimensions
 * cannot be determined, migration safely fails instead of producing incorrect
 * pin coordinates.
 *
 * @param {*} state - Parsed schema-v1 persisted state.
 * @returns {Object|null} Schema-v2 state, or null when migration is impossible.
 */
function migrateStateV1ToV2(state) {
  if (!isPlainObject(state) || state.schemaVersion !== 1) {
    return null;
  }

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

    migratedState.schemaVersion = 2;

    return migratedState;
  } catch (error) {
    console.error("Failed to migrate state:", error);

    return null;
  }
}

/**
 * Converts a compatible schema-v2 persisted workspace into schema v3.
 *
 * Migration transforms every product:
 * - the single product.artwork becomes the artwork of a default layer
 *   ("layer-main" / "Main Artwork");
 * - the single item.pin becomes the first entry of item.pins, bound to the
 *   default layer;
 * - activeArtworkLayerId points to the default layer.
 *
 * The original supplied state is not modified: a deep JSON clone is created
 * before transformation.
 *
 * @param {*} state - Parsed schema-v2 persisted state.
 * @returns {Object|null} Schema-v3 state, or null when migration is impossible.
 */
function migrateStateV2ToV3(state) {
  if (!isPlainObject(state) || state.schemaVersion !== 2) {
    return null;
  }

  try {
    const migratedState = JSON.parse(JSON.stringify(state));

    Object.entries(migratedState.products).forEach(([productId, product]) => {
      const migratedProduct = {
        ...product,
      };

      migratedProduct.artworkLayers = [
        createArtworkLayer("layer-main", "Main Artwork", product.artwork),
      ];

      migratedProduct.activeArtworkLayerId = "layer-main";

      delete migratedProduct.artwork;

      migratedProduct.items = {};

      Object.entries(product.items).forEach(([itemId, item]) => {
        const migratedItem = {
          ...item,
          pins: [],
        };

        if (item.pin !== null) {
          if (!isNormalizedPin(item.pin)) {
            throw new Error(`Invalid schema-v2 pin for ${itemId}.`);
          }

          migratedItem.pins.push({
            layerId: "layer-main",
            xRatio: item.pin.xRatio,
            yRatio: item.pin.yRatio,
          });
        }

        delete migratedItem.pin;

        migratedProduct.items[itemId] = migratedItem;
      });

      migratedState.products[productId] = migratedProduct;
    });

    migratedState.schemaVersion = 3;

    return migratedState;
  } catch (error) {
    console.error("Failed to migrate state:", error);

    return null;
  }
}

/**
 * Converts compatible persisted workspace versions into the current schema.
 *
 * Migration is performed before validateState().
 *
 * Behavior:
 * - current-schema state is returned unchanged;
 * - schema-v2 state is migrated to schema v3;
 * - schema-v1 state is migrated through the full v1 → v2 → v3 chain;
 * - unsupported schema versions are rejected.
 *
 * The original supplied state is never modified, since every migration step
 * operates on a deep JSON clone.
 *
 * @param {*} state - Parsed persisted state from any potentially supported version.
 * @returns {Object|null} Current-schema state, or null when migration is impossible.
 */
function migrateState(state) {
  if (!isPlainObject(state)) {
    return null;
  }

  if (state.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return state;
  }

  if (state.schemaVersion === 2) {
    return migrateStateV2ToV3(state);
  }

  if (state.schemaVersion === 1) {
    const v2State = migrateStateV1ToV2(state);

    if (!v2State) {
      return null;
    }

    return migrateStateV2ToV3(v2State);
  }

  console.warn(`Unsupported schema version: ${state.schemaVersion}`);

  return null;
}

function migrateLegacyItemsToV2(items) {
  if (!isPlainObject(items)) {
    return null;
  }

  const dimensions = getArtworkBaseDimensions();

  if (!dimensions) {
    return null;
  }

  return migrateItemsPinsToV2(items, dimensions);
}

/**
 * Locates persisted workspace data in browser localStorage.
 *
 * The current schema-specific storage key is checked first. If no current
 * record exists, known legacy storage keys are searched in order.
 *
 * Returning both the key and serialized value allows loadStateFromStorage()
 * to know whether the loaded state must later replace a legacy storage entry.
 *
 * This function does not deserialize, migrate, validate or modify storage.
 *
 * @returns {{key: string, serializedState: string}|null}
 *   Located storage record, or null when no persisted state exists.
 */
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

/**
 * Restores the application workspace from browser localStorage.
 *
 * The restoration pipeline is deliberately performed in separate stages:
 *
 *     locate stored record
 *          ↓
 *     deserialize JSON
 *          ↓
 *     migrate compatible schema
 *          ↓
 *     validate persisted structure
 *          ↓
 *     rehydrate canonical domain objects
 *          ↓
 *     replace appState contents
 *
 * If the state originated from a legacy storage key and migration succeeds,
 * the canonical state is saved under the current STORAGE_KEY and the old key
 * is removed.
 *
 * Corrupted JSON, invalid structure, unsupported schema versions and migration
 * errors all fail safely without replacing the existing in-memory appState.
 *
 * This function restores domain state only. Rendering is handled separately
 * by application initialization.
 *
 * @returns {boolean} True when persisted state was successfully restored.
 */
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

/**
 * Persists the complete current workspace to browser localStorage.
 *
 * appState is first serialized through serializeState() and stored under the
 * schema-specific STORAGE_KEY.
 *
 * A successful save displays lightweight user feedback through showToast().
 * Storage failures are caught and logged so quota, browser restrictions or
 * serialization problems do not crash the application.
 *
 * Because appState contains all products, this operation persists the complete
 * multi-product workspace rather than only the active product.
 *
 * @returns {boolean} True when the workspace was successfully written.
 */
function saveStateToStorage() {
  try {
    const serializedState = serializeState();

    localStorage.setItem(STORAGE_KEY, serializedState);

    return true;
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);

    return false;
  }
}

// ============================================================
// VERSIONED JSON EXPORT — D3
// ============================================================

/**
 * Builds the versioned JSON export representation of the active product review.
 *
 * Unlike serializeState(), which represents the complete multi-product
 * workspace, this function intentionally exports only the currently active
 * product review.
 *
 * The export contains:
 * - current schema version;
 * - export timestamp;
 * - product identification fields;
 * - product creation and modification timestamps;
 * - independent artwork layers and the active layer identifier;
 * - complete checklist review items with per-layer pins;
 * - reviewer information.
 *
 * Runtime-only artwork resources, UI state and other workspace products are
 * intentionally excluded.
 *
 * Artwork layer metadata is cloned so the exported structure does not share
 * the original metadata object references stored in appState.
 *
 * @returns {Object|null} Versioned active-product export data, or null when
 *   no active product exists.
 */
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
      productionCode: product.productionCode,
      site: product.site,
      artworkVersion: product.artworkVersion,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    },

    items: product.items,

    artworkLayers: product.artworkLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      artwork: cloneArtworkMetadata(layer.artwork),
    })),

    activeArtworkLayerId: product.activeArtworkLayerId,

    reviewer: product.reviewer,
  };
}

/**
 * Downloads the active product review as a versioned JSON file.
 *
 * Export data is first produced by buildExportData(). The resulting structure
 * is formatted as readable JSON and wrapped in a temporary Blob.
 *
 * A temporary Object URL and anchor element are used to trigger the browser
 * download without requiring a backend.
 *
 * The Object URL is revoked immediately after the download is triggered so the
 * browser does not retain the generated file resource unnecessarily.
 *
 * The downloaded file name contains the current timestamp to reduce accidental
 * filename collisions between exported reviews.
 *
 * @returns {void}
 */
function exportReviewAsJson() {
  const data = buildExportData();

  if (!data) {
    showToast("Unable to export review.");
    return;
  }

  downloadJsonFile(data, `artwork-review-${Date.now()}.json`);

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

/**
 * Converts a current normalized artwork pin back into legacy pixel coordinates.
 *
 * The conversion exists only to support the historical export representation
 * that stored pin positions as absolute x/y values.
 *
 * Current normalized ratios are multiplied by the artwork's base dimensions:
 *
 *     x = xRatio × width
 *     y = yRatio × height
 *
 * This function does not modify the original pin.
 *
 * @param {NormalizedPin} pin - Current normalized artwork pin.
 * @returns {{x: number, y: number}|null} Legacy pixel coordinates, or null
 *   when the pin or artwork dimensions are invalid.
 */
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

/**
 * Builds the historical baseline-compatible checklist export structure.
 *
 * This representation predates the versioned persistence model and therefore
 * intentionally simplifies current review state.
 *
 * In the legacy format:
 * - product information uses the original field names;
 * - each checklist item becomes a boolean check;
 * - only Approved items become true;
 * - normalized pins are converted back into pixel coordinates;
 * - comments, rejection state, copy corrections and artwork metadata are not
 *   represented.
 *
 * This function exists for backward compatibility and should not be used as
 * the canonical application persistence format.
 *
 * Because the legacy format cannot represent more than one artwork layer,
 * the export uses the pins of the product's active layer only.
 *
 * @returns {Object|null} Legacy checklist export data, or null when no active
 *   product exists.
 */
function buildLegacyCheckData() {
  const product = getActiveProduct();

  if (!product) {
    return null;
  }

  const activeLayer = getActiveArtworkLayer(product);

  const checks = {};

  const pins = {};

  Object.values(product.items).forEach((item) => {
    checks[item.id] = item.status === REVIEW_STATUSES.APPROVED;

    const pin = activeLayer ? getItemPinForLayer(item, activeLayer.id) : null;

    if (pin) {
      const pixelPin = normalizedPinToPixels(pin);

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

/**
 * Downloads the active product using the historical baseline-compatible JSON
 * representation.
 *
 * The legacy data is generated by buildLegacyCheckData(), converted into
 * readable JSON and downloaded through a temporary Blob/Object URL.
 *
 * This function is maintained for backward compatibility. New review export
 * workflows should prefer exportReviewAsJson(), which preserves the complete
 * versioned review model.
 *
 * @returns {void}
 */
function saveCheck() {
  const data = buildLegacyCheckData();

  if (!data) {
    showToast("Unable to save checklist.");
    return;
  }

  downloadJsonFile(data, `artwork-check-${Date.now()}.json`);

  showToast("Checklist saved! JSON file downloaded.");
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  try {
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ============================================================
// TOAST
// ============================================================

let toastTimeoutId = null;

/**
 * Displays a temporary non-blocking feedback message to the reviewer.
 *
 * The supplied message is written into the shared toast element and the
 * "show" CSS class is applied to make it visible.
 *
 * The toast automatically disappears after approximately 2.5 seconds.
 *
 * Toasts are intended for lightweight status feedback such as saves, imports,
 * pin creation and successful user actions. They do not modify application
 * state.
 *
 * @param {string} message - Text to display in the toast.
 * @returns {void}
 */
function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  if (toastTimeoutId !== null) {
    clearTimeout(toastTimeoutId);
  }

  toast.textContent = message;

  toast.classList.add("show");

  toastTimeoutId = setTimeout(() => {
    toast.classList.remove("show");

    toastTimeoutId = null;
  }, 2500);
}

// ============================================================
// ARTWORK LAYER WORKSPACE
// ============================================================

/**
 * Opens the "Add artwork layer" prompt for the active product.
 *
 * This function belongs to the UI interaction layer. It requests the new
 * layer name through the custom application dialog, defaults the input to
 * the next suggested name and delegates the actual domain mutation to
 * createArtworkLayerForProduct().
 *
 * Cancelling the dialog leaves the workspace unchanged. An empty submitted
 * name is rejected and produces user feedback.
 *
 * On success the new layer becomes the active layer, the workspace is
 * persisted and re-rendered and the new tab is scrolled into view.
 *
 * @async
 * @returns {Promise<void>} Resolves after the add-layer flow completes or is cancelled.
 */
async function addArtworkLayer() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  const suggestedName = suggestArtworkLayerName(product);

  const enteredName = await showPromptDialog({
    tone: "primary",
    title: "Add artwork layer",
    message: "Enter the name for the new artwork layer.",
    label: "Layer name",
    initialValue: suggestedName,
    placeholder: "Type the layer name",
    confirmText: "Add",
    cancelText: "Cancel",
  });

  if (enteredName === null) {
    return;
  }

  if (!createArtworkLayerForProduct(product.id, enteredName)) {
    showToast("Layer name cannot be empty.");

    return;
  }

  saveStateToStorage();

  renderAppState();

  scrollActiveArtworkLayerTabIntoView();

  showToast("Artwork layer added.");
}

/**
 * Opens the rename dialog for the active artwork layer.
 *
 * This function belongs to the UI interaction layer. It requests the new
 * layer name through the custom application dialog and delegates the actual
 * domain mutation to renameArtworkLayer().
 *
 * Cancelling the dialog leaves the layer unchanged. An empty submitted name
 * is rejected and produces user feedback.
 *
 * @async
 * @returns {Promise<void>} Resolves after the rename flow is completed or cancelled.
 */
async function renameActiveArtworkLayer() {
  const product = getActiveProduct();

  const layer = getActiveArtworkLayer(product);

  if (!product || !layer) {
    return;
  }

  const proposedName = await showPromptDialog({
    tone: "primary",
    title: "Rename artwork layer",
    message: `Enter the new name for artwork layer "${layer.name}".`,
    label: "Layer name",
    initialValue: layer.name,
    placeholder: "Type the layer name",
    confirmText: "Save",
    cancelText: "Cancel",
  });

  if (proposedName === null) {
    return;
  }

  if (!renameArtworkLayer(layer.id, proposedName)) {
    showToast("Layer name cannot be empty.");

    return;
  }

  saveStateToStorage();

  renderAppState();

  showToast("Artwork layer renamed.");
}

/**
 * Deletes the active artwork layer after the required confirmation.
 *
 * This function belongs to the UI interaction layer. Layer deletion always
 * keeps at least one artwork layer in the product, so deleting the last
 * remaining layer is rejected immediately without asking for confirmation.
 *
 * A confirmation dialog is shown whenever the layer contains pinned items
 * and/or persisted artwork data, because both are permanently removed.
 * Empty layers are deleted without confirmation.
 *
 * On success:
 * - the layer and its pins are removed;
 * - the layer's artwork session Object URL is released;
 * - another layer becomes active when the deleted layer was active;
 * - the workspace is persisted and re-rendered.
 *
 * @async
 * @returns {Promise<void>} Resolves after the delete flow completes or is cancelled.
 */
async function deleteActiveArtworkLayer() {
  const product = getActiveProduct();

  const layer = getActiveArtworkLayer(product);

  if (!product || !layer) {
    return;
  }

  if (product.artworkLayers.length <= 1) {
    showToast("At least one artwork layer must remain.");

    return;
  }

  const pinsCount = layerPinCount(product, layer.id);

  const hasArtwork = layer.artwork !== null;

  if (pinsCount > 0 || hasArtwork) {
    const details = hasArtwork
      ? pinsCount > 0
        ? `This layer contains artwork data and ${pinsCount} pinned item${pinsCount === 1 ? "" : "s"}.`
        : "This layer contains artwork data and its file."
      : `This layer contains ${pinsCount} pinned item${pinsCount === 1 ? "" : "s"}.`;

    const confirmed = await showConfirmDialog({
      tone: "danger",
      title: `Delete artwork layer "${layer.name}"?`,
      message: `${details} Deleting it permanently removes the layer and this data.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }
  }

  if (!deleteArtworkLayer(product.id, layer.id)) {
    showToast("At least one artwork layer must remain.");

    return;
  }

  saveStateToStorage();

  renderAppState();

  scrollActiveArtworkLayerTabIntoView();

  showToast("Artwork layer deleted.");
}

/**
 * Rebuilds the artwork layer tabs of the active product.
 *
 * The existing tab strip is cleared first and one tab is rendered per
 * artwork layer in storage order. The tab belonging to the product's active
 * layer receives the "active" class and aria-selected="true".
 *
 * Clicking a tab switches the active artwork layer of the product.
 *
 * This function changes only presentation state. It does not mutate appState
 * or persist any review data.
 *
 * @returns {void}
 */
function renderArtworkLayerTabs() {
  const container = document.getElementById("artwork-layer-tabs");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const product = getActiveProduct();

  if (!product || !Array.isArray(product.artworkLayers)) {
    return;
  }

  product.artworkLayers.forEach((layer) => {
    const tab = document.createElement("button");

    tab.type = "button";

    tab.className = "artwork-layer-tab";

    tab.dataset.layerId = layer.id;

    tab.setAttribute("role", "tab");

    const isActive = layer.id === product.activeArtworkLayerId;

    tab.setAttribute("aria-selected", String(isActive));

    if (isActive) {
      tab.classList.add("active");
    }

    tab.textContent = layer.name;

    tab.title = layer.name;

    tab.addEventListener("click", () => {
      switchArtworkLayer(layer.id);
    });

    container.appendChild(tab);
  });
}

/**
 * Ensures that the active artwork layer tab is visible inside the
 * horizontally scrollable artwork-layer-tab container.
 *
 * This is particularly useful after adding, deleting or switching a layer
 * when the active tab may exist outside the visible tab area.
 *
 * Scrolling is smooth and restricted to the nearest required position so the
 * page itself is not unnecessarily repositioned.
 *
 * @returns {void}
 */
function scrollActiveArtworkLayerTabIntoView() {
  const activeTab = document.querySelector(".artwork-layer-tab.active");

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
// COMPLETE STATE RENDER
// ============================================================

/**
 * Synchronizes the main application interface with the currently active product.
 *
 * This function acts as the high-level render coordinator after major state
 * changes such as product switching, loading persisted data or importing a
 * review.
 *
 * Rendering is delegated to specialized functions:
 *
 * - renderProductInputs() updates product fields;
 * - renderArtworkLayerTabs() rebuilds the artwork layer tabs;
 * - renderArtworkState() updates the artwork viewer;
 * - renderItemState() updates each checklist item;
 * - renderPins() rebuilds artwork pins;
 * - updateProgress() recalculates review progress.
 *
 * The function reads existing domain state and does not perform business
 * mutations itself.
 *
 * Product tabs are intentionally rendered separately by renderProductTabs()
 * because they represent the workspace rather than only the active product.
 *
 * @returns {void}
 */
function renderAppState() {
  const product = getActiveProduct();

  if (!product) {
    return;
  }

  renderProductInputs();

  renderProductContext();

  renderArtworkLayerTabs();

  renderArtworkState();

  Object.keys(product.items).forEach((itemId) => {
    renderItemState(itemId);
  });

  renderPins();

  updateProgress();
}

/**
 * Opens the browser file picker used to select or replace an artwork image.
 *
 * The hidden artwork file input is reset before being clicked so selecting the
 * same local file again still produces a change event.
 *
 * This function only initiates file selection. File inspection, validation,
 * replacement confirmation and domain updates are handled later by
 * handleArtworkFileChange().
 *
 * @returns {void}
 */
function selectArtwork() {
  const fileInput = document.getElementById("artwork-file-input");

  if (!fileInput) {
    console.error("Artwork file input not found.");

    return;
  }

  fileInput.value = "";

  fileInput.click();
}

/**
 * Handles a local artwork image selected through the browser file input.
 *
 * The active product ID and the active artwork layer ID are captured
 * immediately when the change event begins. This protects the asynchronous
 * workflow from accidentally applying a slowly loaded image to another
 * product or another layer if the reviewer switches either while the file
 * is being inspected.
 *
 * Processing follows these steps:
 *
 * 1. obtain the selected file;
 * 2. reject non-image files;
 * 3. inspect the image and create validated metadata;
 * 4. confirm that the original target product still exists;
 * 5. confirm that the original target layer still exists;
 * 6. compare the selected artwork with the target layer's current artwork identity;
 * 7. warn the reviewer when replacing different artwork that already has pins;
 * 8. apply the persisted artwork identity to the target layer;
 * 9. adopt the Object URL into the target layer's runtime session;
 * 10. re-render the artwork when the target product and target layer are
 *     still active;
 * 11. display feedback describing the result.
 *
 * If replacement is cancelled or any later step fails, temporary Object URLs
 * that were not adopted into a session are revoked.
 *
 * Existing pins are preserved when the same artwork is selected again.
 * Replacing a different artwork clears only the target layer's pins and only
 * after explicit confirmation. Other layers are never modified.
 *
 * The file input value is always reset in the finally block so the same file
 * may be selected again later.
 *
 * @async
 * @param {Event} event - Change event emitted by the artwork file input.
 * @returns {Promise<void>} Resolves after the artwork-selection workflow ends.
 */
async function handleArtworkFileChange(event) {
  const file = event.target.files?.[0];

  const targetProductId = appState.activeProductId;

  const targetLayerId = getActiveArtworkLayer(
    getProductById(targetProductId),
  )?.id;

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

    const targetLayer = targetLayerId
      ? getArtworkLayerById(targetProduct, targetLayerId)
      : getActiveArtworkLayer(targetProduct);

    if (!targetLayer) {
      URL.revokeObjectURL(objectUrl);
      showToast("Unable to find the target artwork layer.");
      return;
    }

    const sameArtwork = isSameArtworkIdentity(targetLayer.artwork, metadata);

    const hasPins = layerHasPins(targetProduct, targetLayer.id);

    if (!sameArtwork && hasPins) {
      const confirmed = await showConfirmDialog({
        tone: "warning",
        title: "Replace artwork",
        message: ARTWORK_REPLACEMENT_MESSAGE,
        confirmText: "Replace",
        cancelText: "Cancel",
      });

      if (!confirmed) {
        URL.revokeObjectURL(objectUrl);
        showToast("Artwork replacement cancelled.");
        return;
      }
    }

    const result = applyArtworkIdentity(
      metadata,
      () => true,
      targetProductId,
      targetLayer.id,
    );

    if (!result.applied) {
      URL.revokeObjectURL(objectUrl);

      if (result.reason === "cancelled") {
        showToast("Artwork replacement cancelled.");
      } else {
        showToast("Unable to use selected artwork.");
      }

      return;
    }

    adoptSessionArtwork(metadata, objectUrl, targetProductId, targetLayer.id);

    if (
      appState.activeProductId === targetProductId &&
      getActiveArtworkLayer(targetProduct)?.id === targetLayer.id
    ) {
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

/**
 * Connects the hidden artwork file input to the artwork-loading workflow.
 *
 * A change listener is registered so every selected file is processed by
 * handleArtworkFileChange().
 *
 * This function should normally be called once during application
 * initialization to avoid registering duplicate listeners.
 *
 * @returns {void}
 */
function bindArtworkInput() {
  const fileInput = document.getElementById("artwork-file-input");

  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", handleArtworkFileChange);
}

/**
 * Rebuilds the multi-product tab bar from the current workspace state.
 *
 * One tab is generated for every product stored in appState.products.
 *
 * Each tab:
 * - stores its permanent product ID in data-product-id;
 * - receives the tab accessibility role;
 * - exposes aria-selected according to activeProductId;
 * - displays Product Name or the configured fallback label;
 * - switches the active product when clicked.
 *
 * The active tab receives the "active" CSS class for visual identification.
 *
 * Tab labels are assigned with textContent rather than innerHTML so product
 * names are always rendered as text instead of executable markup.
 *
 * The complete tab container is rebuilt on each call, which ensures renamed,
 * created, deleted and imported products are reflected consistently.
 *
 * @returns {void}
 */
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

/**
 * Ensures that the currently active product tab is visible inside the
 * horizontally scrollable product-tab container.
 *
 * This is particularly useful after creating, duplicating or importing a
 * product when the new active tab may exist outside the visible tab area.
 *
 * Scrolling is smooth and restricted to the nearest required position so the
 * page itself is not unnecessarily repositioned.
 *
 * @returns {void}
 */
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

/**
 * Retrieves the DOM elements that compose the reusable application dialog.
 *
 * Centralizing these element lookups avoids repeating document.getElementById()
 * calls throughout the dialog workflow and keeps dialog behavior independent
 * from the specific actions that invoke it.
 *
 * The returned references include:
 * - overlay;
 * - status icon;
 * - title and message;
 * - optional prompt input;
 * - input label;
 * - Confirm button;
 * - Cancel button.
 *
 * Individual references may be null when the expected dialog markup is not
 * available in the document.
 *
 * @returns {{
 *   overlay: HTMLElement|null,
 *   icon: HTMLElement|null,
 *   title: HTMLElement|null,
 *   message: HTMLElement|null,
 *   inputWrapper: HTMLElement|null,
 *   inputLabel: HTMLElement|null,
 *   input: HTMLInputElement|null,
 *   confirmButton: HTMLButtonElement|null,
 *   cancelButton: HTMLButtonElement|null
 * }} References to the reusable dialog DOM elements.
 */
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

/**
 * Closes the currently active application dialog and resolves its pending
 * Promise with the supplied result.
 *
 * Dialog interactions are asynchronous from the caller's perspective.
 * openAppDialog() stores the Promise resolver in appDialogState.resolve, and
 * this function later invokes that resolver when the reviewer confirms,
 * cancels or dismisses the dialog.
 *
 * Closing the dialog:
 * - hides the overlay;
 * - updates aria-hidden;
 * - marks the dialog as closed;
 * - removes the stored resolver reference;
 * - resolves the original Promise.
 *
 * The result meaning depends on the dialog type:
 * - confirm dialog: true or false;
 * - prompt dialog: entered string or null;
 * - null may also represent dismissal or unavailable input.
 *
 * @param {boolean|string|null} [result=null] - Value returned to the caller
 *   waiting for the dialog result.
 * @returns {void}
 */
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

/**
 * Configures and opens the reusable application dialog.
 *
 * The same dialog component supports both confirmation and text-prompt
 * workflows. Its appearance and behavior are configured through the supplied
 * options object rather than by creating separate modal implementations.
 *
 * Supported dialog types:
 * - "confirm" for boolean confirmation flows;
 * - "prompt" for text-input flows.
 *
 * Supported tones determine the visual emphasis of the icon and primary
 * action, including primary, warning, danger and success presentations.
 *
 * When opened, the function:
 * - updates dialog title and message;
 * - applies the requested visual tone;
 * - configures button labels;
 * - shows or hides the text input depending on dialog type;
 * - reveals the overlay;
 * - updates accessibility state;
 * - stores a Promise resolver in appDialogState;
 * - moves focus to the most relevant interactive control.
 *
 * Prompt dialogs focus and select the input value. Confirmation dialogs focus
 * the primary confirmation button.
 *
 * The returned Promise remains pending until closeAppDialog() resolves it.
 *
 * @param {Object} options - Dialog configuration.
 * @param {"confirm"|"prompt"} [options.type="confirm"] - Dialog interaction mode.
 * @param {"primary"|"warning"|"danger"|"success"} [options.tone="primary"]
 *   - Visual intent of the dialog.
 * @param {string} [options.title="Confirm action"] - Dialog heading.
 * @param {string} [options.message=""] - Supporting explanation.
 * @param {string} [options.label="Value"] - Label used by prompt dialogs.
 * @param {string} [options.initialValue=""] - Initial prompt input value.
 * @param {string} [options.placeholder=""] - Prompt input placeholder.
 * @param {string} [options.confirmText="Confirm"] - Primary action label.
 * @param {string} [options.cancelText="Cancel"] - Secondary action label.
 * @returns {Promise<boolean|string|null>} Promise resolved with the user's
 *   confirmation result, entered text or cancellation value.
 */
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

/**
 * Registers the interaction handlers used by the reusable application dialog.
 *
 * This function connects:
 * - the Confirm button;
 * - the Cancel button;
 * - clicks on the modal backdrop;
 * - Escape-key dismissal;
 * - Enter-key submission for prompt dialogs.
 *
 * Result semantics depend on the active dialog type:
 *
 * Confirm dialog:
 *     Confirm → true
 *     Cancel  → false
 *     Escape  → false
 *
 * Prompt dialog:
 *     Confirm → current input value
 *     Enter   → current input value
 *     Cancel  → null
 *     Escape  → null
 *
 * Clicking inside the dialog itself does not dismiss it; only clicking the
 * overlay backdrop does.
 *
 * This function should normally be called once during initialization to avoid
 * registering duplicate event listeners.
 *
 * @returns {void}
 */
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

/**
 * Opens the reusable application dialog in confirmation mode.
 *
 * This convenience wrapper fixes the dialog type to "confirm" while allowing
 * callers to customize title, message, tone and action labels.
 *
 * It keeps destructive or warning workflows concise without exposing callers
 * to the lower-level dialog configuration details.
 *
 * @param {Object} options - Confirmation-dialog options forwarded to openAppDialog().
 * @returns {Promise<boolean|null>} Promise resolving to true when confirmed,
 *   false when cancelled, or null if the dialog cannot be opened.
 */
function showConfirmDialog(options) {
  return openAppDialog({
    type: "confirm",
    ...options,
  });
}

/**
 * Opens the reusable application dialog in text-prompt mode.
 *
 * This convenience wrapper fixes the dialog type to "prompt" while allowing
 * callers to configure the title, message, input label, initial value,
 * placeholder and button text.
 *
 * It is currently used by workflows such as product renaming.
 *
 * @param {Object} options - Prompt-dialog options forwarded to openAppDialog().
 * @returns {Promise<string|null>} Promise resolving to the entered text, or
 *   null when the prompt is cancelled or cannot be opened.
 */
function showPromptDialog(options) {
  return openAppDialog({
    type: "prompt",
    ...options,
  });
}

// ============================================================
// VERSIONED REVIEW IMPORT — D4
// ============================================================

/**
 * Migrates an imported single-review file into the current export schema.
 *
 * This migration pipeline is separate from migrateState() because imported
 * review files and complete persisted workspaces have different top-level
 * structures.
 *
 * Behavior:
 * - current-schema imports are returned unchanged;
 * - schema-v2 imports have their single artwork moved into the default
 *   layer and their single item pins moved into per-layer pin arrays;
 * - schema-v1 imports first run the legacy pixel-pin conversion and then the
 *   schema-v2 conversion;
 * - unsupported or malformed versions are rejected.
 *
 * Every migration step deep-clones the imported structure before modifying it
 * so the caller's original parsed data is never mutated.
 *
 * Legacy pin conversion requires usable artwork base dimensions. Migration
 * safely fails when those dimensions cannot be determined.
 *
 * This function performs version conversion only. Structural compatibility is
 * checked separately by validateImportData().
 *
 * @param {*} data - Parsed review-file data from a potentially supported version.
 * @returns {Object|null} Current-schema import data, or null when migration
 *   cannot be performed safely.
 */
function migrateImportData(data) {
  if (!isPlainObject(data)) {
    return null;
  }

  if (data.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  if (data.schemaVersion === 2) {
    try {
      const migratedData = JSON.parse(JSON.stringify(data));

      migratedData.artworkLayers = [
        createArtworkLayer("layer-main", "Main Artwork", migratedData.artwork),
      ];

      migratedData.activeArtworkLayerId = "layer-main";

      delete migratedData.artwork;

      migratedData.items = {};

      Object.entries(data.items).forEach(([itemId, item]) => {
        const migratedItem = {
          ...item,
          pins: [],
        };

        if (item.pin !== null) {
          if (!isNormalizedPin(item.pin)) {
            throw new Error(`Invalid schema-v2 pin for ${itemId}.`);
          }

          migratedItem.pins.push({
            layerId: "layer-main",
            xRatio: item.pin.xRatio,
            yRatio: item.pin.yRatio,
          });
        }

        delete migratedItem.pin;

        migratedData.items[itemId] = migratedItem;
      });

      migratedData.schemaVersion = 3;

      return migratedData;
    } catch (error) {
      console.error("Failed to migrate imported review:", error);

      return null;
    }
  }

  if (data.schemaVersion === 1) {
    try {
      const dimensions = getArtworkBaseDimensions();

      if (!dimensions || !isPlainObject(data.items)) {
        return null;
      }

      const migratedData = JSON.parse(JSON.stringify(data));

      migratedData.items = migrateItemsPinsToV2(migratedData.items, dimensions);

      migratedData.schemaVersion = 2;

      return migrateImportData(migratedData);
    } catch (error) {
      console.error("Failed to migrate imported review:", error);

      return null;
    }
  }

  return null;
}

/**
 * Validates whether migrated review-file data is structurally compatible with
 * the current single-review import format.
 *
 * Validation checks:
 * - the top-level value is a plain object;
 * - schemaVersion matches the current application schema;
 * - product data exists;
 * - the imported product has a non-empty permanent ID;
 * - checklist items exist;
 * - the reconstructed candidate product satisfies the normal persisted-product
 *   validation rules.
 *
 * Optional import fields receive safe defaults before product validation so
 * older compatible exports can omit non-essential values.
 *
 * This function does not modify appState and does not construct the final
 * Product object. It only determines whether the imported representation is
 * safe to continue processing.
 *
 * @param {*} data - Migrated review-file data to validate.
 * @returns {{valid: boolean, message: string}} Validation result and
 *   user-facing failure explanation when invalid.
 */
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

    productionCode: data.product.productionCode ?? "",

    site: data.product.site ?? "",

    artworkVersion: data.product.artworkVersion ?? "",

    items: data.items,

    artworkLayers: data.artworkLayers,

    activeArtworkLayerId: data.activeArtworkLayerId,

    artwork: null,

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

/**
 * Reconstructs a canonical Product object from validated review-import data.
 *
 * A fresh product is created through createProduct() so current domain
 * defaults and canonical checklist behavior are restored.
 *
 * Imported values are then applied for:
 * - Brand;
 * - Product Name;
 * - Weight;
 * - SKU;
 * - checklist review items;
 * - artwork metadata;
 * - reviewer information;
 * - original creation timestamp when available.
 *
 * Checklist items are rebuilt through rehydrateItems() so immutable and
 * canonical item properties are restored rather than trusting raw JSON object
 * descriptors.
 *
 * Artwork layers are rebuilt through createArtworkLayer() so metadata is
 * cloned and layer structure is canonical. The actual image files are not
 * imported because browser File/Object URL resources cannot be represented
 * by the review JSON.
 *
 * updatedAt is intentionally set to the current time because importing the
 * review creates a new modification event in this workspace.
 *
 * @param {Object} importedData - Validated current-schema review import.
 * @returns {Product} Canonical product reconstructed from the imported review.
 */
function buildImportedProduct(importedData) {
  const productId = importedData.product.id;

  const product = createProduct(productId);

  product.brand = importedData.product.brand ?? "";

  product.productName = importedData.product.productName ?? "";

  product.weight = importedData.product.weight ?? "";

  product.sku = importedData.product.sku ?? "";

  product.productionCode = importedData.product.productionCode ?? "";

  product.site = importedData.product.site ?? "";

  product.artworkVersion = importedData.product.artworkVersion ?? "";

  product.items = rehydrateItems(importedData.items);

  product.artworkLayers = importedData.artworkLayers.map((layer) =>
    createArtworkLayer(layer.id, layer.name, layer.artwork),
  );

  product.activeArtworkLayerId = importedData.activeArtworkLayerId;

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

/**
 * Processes and adds an imported review to the current multi-product workspace.
 *
 * The import pipeline is:
 *
 *     parsed review data
 *          ↓
 *     migrateImportData()
 *          ↓
 *     validateImportData()
 *          ↓
 *     buildImportedProduct()
 *          ↓
 *     resolve product-ID collision
 *          ↓
 *     add product to workspace
 *          ↓
 *     persist and render
 *
 * Importing a review does not replace the complete workspace. Existing products
 * remain available and the imported product is added to appState.products.
 *
 * If another product already uses the imported permanent ID, a new unique ID
 * is generated before insertion so existing workspace data is never silently
 * overwritten.
 *
 * After a successful import:
 * - the imported product becomes active;
 * - transient checklist UI state is cleared;
 * - the complete workspace is persisted;
 * - checklist, tabs and active product state are re-rendered;
 * - the imported product tab is scrolled into view.
 *
 * Artwork metadata may be restored from the file, but the corresponding local
 * image is not available until the reviewer selects that artwork again.
 *
 * @param {*} importedData - Parsed review data supplied by the Open Check workflow.
 * @returns {{valid: boolean, message: string}} Import result.
 */
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

  let importedProductId = importedProduct.id;

  if (
    Object.prototype.hasOwnProperty.call(appState.products, importedProductId)
  ) {
    importedProductId = generateProductId();

    importedProduct.id = importedProductId;
  }

  appState.products[importedProductId] = importedProduct;

  appState.activeProductId = importedProductId;

  resetTransientReviewUiState();

  saveStateToStorage();

  renderWorkspaceState({
    rebuildChecklist: true,
    scrollActiveTab: true,
  });

  return {
    valid: true,
    message: "",
  };
}

/**
 * Opens the browser file picker and imports a previously exported JSON review.
 *
 * The hidden check-file input is reset before opening so selecting the same
 * file repeatedly still triggers the import workflow.
 *
 * After file selection the function:
 * - requires a .json filename;
 * - reads the file as text using FileReader;
 * - parses the JSON through deserializeState();
 * - delegates migration, validation and workspace insertion to
 *   applyImportedReview();
 * - displays user feedback for success or failure.
 *
 * File-reading failures and malformed JSON are handled defensively without
 * modifying the existing workspace.
 *
 * The FileReader callbacks are asynchronous, but the imported review is applied
 * only after the complete file has been successfully read and parsed.
 *
 * This operation imports a single product review into the existing workspace;
 * it does not replace the complete appState.
 *
 * @returns {void}
 */
function openCheck() {
  selectCheckFile();
}

function selectCheckFile() {
  const fileInput = document.getElementById("check-file-input");

  if (!fileInput) {
    console.error("Check file input not found.");

    return;
  }

  fileInput.value = "";

  fileInput.click();
}

function bindCheckInput() {
  const fileInput = document.getElementById("check-file-input");

  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", handleCheckFileChange);
}

async function handleCheckFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    if (!file.name.toLowerCase().endsWith(".json")) {
      showToast("Please select a JSON review file.");

      return;
    }

    const serializedReview = await file.text();

    const importedData = deserializeState(serializedReview);

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
  } catch (error) {
    console.error("Failed to read check file:", error);

    showToast("Unable to read check file.");
  } finally {
    event.target.value = "";
  }
}

/*
 * Release all session-only artwork Object URLs before the document
 * is unloaded. Persisted artwork metadata remains in appState/localStorage.
 */
window.addEventListener("beforeunload", () => {
  releaseAllSessionArtworks();
});

// ============================================================
// APPLICATION INITIALIZATION
// ============================================================

/**
 * Initializes the complete application after the script has loaded.
 *
 * Startup is deliberately ordered so persisted domain state is restored before
 * the interface is rendered and interactive listeners are attached.
 *
 * Initialization performs:
 *
 * 1. loadStateFromStorage()
 *    Attempts to restore a migrated, validated and rehydrated workspace.
 *
 * 2. renderChecklist()
 *    Creates the checklist DOM for the active product.
 *
 * 3. bindProductInputs()
 *    Connects product form fields to domain state.
 *
 * 4. bindArtworkInput()
 *    Connects artwork file selection to the artwork-loading workflow.
 *
 * 5. bindAppDialog()
 *    Activates the reusable custom modal interactions.
 *
 * 6. renderProductTabs()
 *    Builds the multi-product workspace navigation.
 *
 * 7. renderAppState()
 *    Synchronizes the remaining interface with the active product.
 *
 * If no valid persisted state exists, the application continues using the
 * default product created during initial domain setup.
 *
 * This function should execute only once during normal page startup because
 * several binding functions register persistent DOM event listeners.
 *
 * @returns {void}
 */
function initializeApp() {
  loadStateFromStorage();

  renderChecklist();

  bindProductInputs();

  bindArtworkInput();

  bindAppDialog();

  renderProductTabs();

  renderAppState();

  bindCheckInput();
}

initializeApp();
