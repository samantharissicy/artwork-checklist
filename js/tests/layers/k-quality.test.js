// ============================================================
// CAMADA K — QUALIDADE
// K1 UX · K2 Acessibilidade · K3 Mobile/Touch · K4 Regressão
// ============================================================

(function () {
  "use strict";

  const camadaKTests = [];

  function test(name, fn) {
    camadaKTests.push({ name, fn });
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
  }

  // ── K1 · UX ──────────────────────────────────────────────

  test("K1: Toast element exists for feedback", () => {
    assert(document.getElementById("toast") !== null, "Toast element missing");
  });

  test("K1: Dialog overlay exists for confirmations", () => {
    assert(document.getElementById("app-dialog-overlay") !== null, "Dialog overlay missing");
  });

  test("K1: Missing-artwork empty state exists", () => {
    assert(document.getElementById("artwork-missing") !== null, "Missing artwork placeholder missing");
  });

  test("K1: No-pantone empty state exists", () => {
    const list = document.getElementById("pantone-colours-list");
    if (list) {
      assert(list.querySelector(".pantone-colours-empty") !== null || list.children.length === 0, "Pantone empty state missing");
    }
  });

  // ── K2 · Acessibilidade ───────────────────────────────────

  test("K2: Screen-reader announcer exists", () => {
    const el = document.getElementById("sr-announcer");
    assert(el !== null, "sr-announcer missing");
    assert(el.getAttribute("aria-live") === "polite", "Announcer missing aria-live");
  });

  test("K2: Review buttons have aria-labels", () => {
    const btn = document.querySelector('[data-action="approve"]');
    if (btn) {
      assert(btn.hasAttribute("aria-label"), "Approve button missing aria-label");
    }
  });

  test("K2: Focus-visible styles are defined", () => {
    let hasFocus = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || []) {
          if (rule.cssText && rule.cssText.includes("focus-visible")) {
            hasFocus = true;
          }
        }
      } catch (e) {
        // cross-origin stylesheets
      }
    }
    assert(hasFocus, "No focus-visible CSS rules found");
  });

  test("K2: Product inputs have accessible labels", () => {
    const brand = document.getElementById("inp-brand");
    assert(brand !== null, "Brand input missing");
    assert(
      brand.hasAttribute("aria-label") || document.querySelector("label[for='inp-brand']") !== null,
      "Brand input missing label"
    );
  });

  // ── K3 · Mobile / Touch ───────────────────────────────────

  test("K3: Hint text element exists for mobile rewrite", () => {
    assert(document.getElementById("hint-text") !== null, "hint-text span missing");
  });

  test("K3: Mobile panel toggle exists", () => {
    assert(document.getElementById("btn-panel-toggle") !== null, "Panel toggle missing");
  });

  test("K3: Touch zoom functions exist", () => {
    assert(typeof zoom === "function", "zoom() missing");
    assert(typeof fitArtworkToViewport === "function", "fitArtworkToViewport() missing");
  });

  test("K3: Pin target functions exist", () => {
    assert(typeof setPinTargetItem === "function", "setPinTargetItem() missing");
    assert(typeof clearPinTarget === "function", "clearPinTarget() missing");
  });

  test("K3: Viewport interactions initialized", () => {
    assert(typeof initializeViewportInteractions === "function", "initializeViewportInteractions() missing");
  });

  // ── K4 · Regressão ───────────────────────────────────────

  test("K4: App state contains products", () => {
    assert(typeof appState !== "undefined", "appState missing");
    assert(Object.keys(appState.products).length > 0, "No products in appState");
  });

  test("K4: Active product resolves", () => {
    assert(typeof getActiveProduct === "function", "getActiveProduct() missing");
    assert(getActiveProduct() !== null, "getActiveProduct() returned null");
  });

  test("K4: Checklist items loaded", () => {
    const product = getActiveProduct();
    assert(product !== null, "No active product");
    assert(Object.keys(product.items).length > 0, "No checklist items");
  });

  test("K4: Artwork layers exist", () => {
    const product = getActiveProduct();
    assert(product !== null, "No active product");
    assert(product.artworkLayers.length >= 1, "No artwork layers");
  });

  test("K4: Serialization works", () => {
    assert(typeof serializeState === "function", "serializeState() missing");
    const s = serializeState();
    assert(typeof s === "string" && s.length > 0, "serializeState() returned empty");
  });

  test("K4: Export function exists", () => {
    assert(typeof exportReviewAsJson === "function", "exportReviewAsJson() missing");
  });

  test("K4: Print report function exists", () => {
    assert(typeof printApprovalReport === "function", "printApprovalReport() missing");
  });

  test("K4: Sign-off panel can open", () => {
    assert(typeof openSignOffPanel === "function", "openSignOffPanel() missing");
  });

  test("K4: localStorage persists state", () => {
    assert(typeof saveStateToStorage === "function", "saveStateToStorage() missing");
    saveStateToStorage();
    const key = "artworkChecklist:v5";
    assert(localStorage.getItem(key) !== null, "State not found in localStorage");
  });

  // ── Register with framework or expose standalone ───────────

  if (
    window.ArtworkTests &&
    typeof window.ArtworkTests.suite === "function"
  ) {
    window.ArtworkTests.suite("K-quality", camadaKTests);
  } else if (
    window.ArtworkTests &&
    typeof window.ArtworkTests.register === "function"
  ) {
    window.ArtworkTests.register("K-quality", camadaKTests);
  } else {
    // Standalone fallback for beginners
    window.runCamadaKTests = async function () {
      const results = [];
      for (const t of camadaKTests) {
        try {
          await t.fn();
          results.push({ name: t.name, ok: true });
          console.log("PASS: " + t.name);
        } catch (err) {
          results.push({ name: t.name, ok: false, error: err.message });
          console.warn("FAIL: " + t.name + " — " + err.message);
        }
      }
      const passed = results.filter((r) => r.ok).length;
      console.log("\nCamada K result: " + passed + "/" + results.length + " passed");
      return results;
    };
  }
})();