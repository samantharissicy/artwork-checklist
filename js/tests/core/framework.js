// ============================================================
// TEST FRAMEWORK
// ============================================================
//
// Minimal dependency-free browser test framework used by every
// roadmap-layer test file.
//
// Responsibilities:
// - register tests;
// - provide assertion helpers;
// - store execution results.
//
// Application-specific fixtures belong in helpers.js.
// ============================================================

(function () {
  "use strict";

  const RESULTS = [];
  const TESTS = [];

  function assert(condition, message = "Assertion failed") {
    if (!condition) {
      throw new Error(message);
    }
  }

  function assertEqual(actual, expected, message = "") {
    if (actual !== expected) {
      throw new Error(
        message ||
          `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
      );
    }
  }

  function assertNotEqual(actual, expected, message = "") {
    if (actual === expected) {
      throw new Error(
        message || `Expected value to differ from ${JSON.stringify(expected)}`,
      );
    }
  }

  function assertDeepEqual(actual, expected, message = "") {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);

    if (actualJson !== expectedJson) {
      throw new Error(
        message || `Expected ${expectedJson}, received ${actualJson}`,
      );
    }
  }

  function assertExists(value, message = "Expected value to exist") {
    if (value === null || value === undefined) {
      throw new Error(message);
    }
  }

  function assertClose(actual, expected, tolerance = 0.0001) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`Expected ${actual} to be close to ${expected}`);
    }
  }

  function test(name, fn) {
    TESTS.push({
      name,
      fn,
    });
  }

  window.ArtworkTests = {
    RESULTS,
    TESTS,

    test,

    assert,
    assertEqual,
    assertNotEqual,
    assertDeepEqual,
    assertExists,
    assertClose,
  };
})();
