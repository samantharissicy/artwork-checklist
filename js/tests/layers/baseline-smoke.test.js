// ============================================================
// BASELINE — DOM REGRESSION SMOKE TESTS
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
    assertNotEqual,
    assertExists,
  } = window.ArtworkTests;

  test("50 checklist elements are rendered", () => {
    assertEqual(document.querySelectorAll(".check-item").length, 50);
  });

  test("6 section buttons are rendered", () => {
    assertEqual(document.querySelectorAll(".section-btn").length, 6);
  });

  test("zoom controls still operate the artwork wrapper", () => {
    const wrapper = document.getElementById("artwork-wrapper");

    assertExists(wrapper);

    const previousZoom = currentZoom;

    zoom(0.1);

    assertNotEqual(
      currentZoom,
      previousZoom,
      "zoom() should change currentZoom.",
    );

    assert(
      wrapper.style.transform.includes("scale("),
      "zoom() should update artwork wrapper transform.",
    );

    // Restore the original zoom level.
    currentZoom = previousZoom;

    wrapper.style.transform = `scale(${currentZoom})`;

    const zoomLevel = document.getElementById("zoom-level");

    if (zoomLevel) {
      zoomLevel.textContent = Math.round(currentZoom * 100) + "%";
    }
  });
})();
