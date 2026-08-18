// ============================================================
// TEST RUNNER
// ============================================================
//
// Executes every test registered by the layer files and restores
// the user's application state after the run.
// ============================================================

(function () {
  "use strict";

  const suite = window.ArtworkTests;

  if (!suite) {
    throw new Error(
      "ArtworkTests framework must load before runner.js.",
    );
  }

  const {
    RESULTS,
    TESTS,
    createSnapshot,
    restoreSnapshot,
  } = suite;

  async function run() {
    RESULTS.length = 0;

    console.group(
      "%cArtwork Checklist — Modular Regression Test Suite",
      "font-size: 14px; font-weight: bold;",
    );

    let snapshot;

    try {
      snapshot = createSnapshot();
    } catch (error) {
      console.error(
        "Unable to start test suite:",
        error,
      );

      console.groupEnd();

      return {
        total: 0,
        passed: 0,
        failed: 0,
        results: [],
      };
    }

    for (const { name, fn } of TESTS) {
      try {
        const result = fn();

        if (
          result &&
          typeof result.then === "function"
        ) {
          await result;
        }

        RESULTS.push({
          name,
          passed: true,
          error: null,
        });

        console.log(
          `%cPASS%c ${name}`,
          "color: #059669; font-weight: bold;",
          "",
        );
      } catch (error) {
        RESULTS.push({
          name,
          passed: false,
          error,
        });

        console.error(`FAIL ${name}`, error);
      }
    }

    try {
      restoreSnapshot(snapshot);
    } catch (error) {
      console.error(
        "Failed to restore the original application state:",
        error,
      );
    }

    const passed = RESULTS.filter(
      (result) => result.passed,
    ).length;

    const failed = RESULTS.length - passed;

    console.log("");

    console.log(
      `%c${passed}/${RESULTS.length} tests passed`,
      `font-weight: bold; color: ${
        failed === 0 ? "#059669" : "#dc2626"
      };`,
    );

    if (failed > 0) {
      console.log("");
      console.log("Failed tests:");

      RESULTS.filter(
        (result) => !result.passed,
      ).forEach((result) => {
        console.log(
          `- ${result.name}: ${result.error.message}`,
        );
      });
    }

    console.groupEnd();

    return {
      total: RESULTS.length,
      passed,
      failed,
      results: [...RESULTS],
    };
  }

  function getResults() {
    return [...RESULTS];
  }

  Object.assign(suite, {
    run,
    getResults,
  });
})();
