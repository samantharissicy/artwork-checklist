// Artwork & Pack Copy Checklist
// Modular browser test-suite loader
// ============================================================
//
// index.html keeps a single test entry point:
//
//   <script src="js/tests.js"></script>
//
// This loader imports the test infrastructure and each layer
// test file in deterministic order.
//
// To run the suite from DevTools:
//
//   await runArtworkTests()
//
// ============================================================

(function () {
  "use strict";

  const currentScript = document.currentScript;

  if (!currentScript) {
    console.error("Unable to resolve the modular test-suite base path.");
    return;
  }

  const testsBaseUrl = new URL("./tests/", currentScript.src);

  const TEST_FILES = [
    "core/framework.js",
    "core/helpers.js",

    "layers/b1-domain.test.js",
    "layers/c1-review-status.test.js",
    "layers/c2-comments.test.js",
    "layers/c3-copy-corrections.test.js",

    "layers/d-persistence.test.js",

    "layers/e1-pin-geometry.test.js",
    "layers/e2-artwork-identity.test.js",

    "layers/f1-review-metrics.test.js",

    "layers/g-multiple-products.test.js",

    "layers/g4-multi-layer-artwork.test.js",

    "layers/g5-pantone-compliance.test.js",

    "layers/baseline-smoke.test.js",

    "core/runner.js",
  ];

  function loadTestScript(relativePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = new URL(relativePath, testsBaseUrl).href;
      script.async = false;
      script.dataset.testModule = relativePath;

      script.addEventListener("load", () => {
        resolve();
      });

      script.addEventListener("error", () => {
        reject(new Error(`Unable to load test module: ${relativePath}`));
      });

      document.head.appendChild(script);
    });
  }

  async function loadTestSuite() {
    for (const relativePath of TEST_FILES) {
      await loadTestScript(relativePath);
    }

    console.info(
      "Artwork modular test suite loaded. Run: await runArtworkTests()",
    );

    return true;
  }

  window.artworkTestsReady = loadTestSuite().catch((error) => {
    console.error("Failed to load modular artwork tests:", error);

    throw error;
  });

  window.runArtworkTests = async function runArtworkTests() {
    await window.artworkTestsReady;

    if (!window.ArtworkTests?.run) {
      throw new Error("Artwork test runner is not available.");
    }

    return window.ArtworkTests.run();
  };

  window.getArtworkTestResults = function getArtworkTestResults() {
    return window.ArtworkTests?.getResults?.() ?? [];
  };
})();
