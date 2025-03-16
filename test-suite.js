/**
 * test-suite.js
 * A lightweight testing framework for the Route 33 Guide
 * Includes utilities for unit testing and integration testing
 */

const TestSuite = (function() {
  // Test state
  const testState = {
    tests: [],
    currentSuite: null,
    results: {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      elapsedMs: 0
    },
    options: {
      stopOnFail: false,
      timeout: 5000,
      verbose: true
    }
  };
  
  // Test result types
  const RESULT = {
    PASS: 'pass',
    FAIL: 'fail',
    SKIP: 'skip',
    ERROR: 'error'
  };
  
  /**
   * Define a test suite
   */
  function describe(name, fn) {
    // Record the current suite
    const previousSuite = testState.currentSuite;
    testState.currentSuite = name;
    
    // Log the suite start
    if (testState.options.verbose) {
      console.group(`Test Suite: ${name}`);
    }
    
    try {
      // Run the suite function
      fn();
    } catch (error) {
      console.error(`Error in test suite "${name}":`, error);
    }
    
    // Restore the previous suite
    testState.currentSuite = previousSuite;
    
    // Close the group
    if (testState.options.verbose) {
      console.groupEnd();
    }
  }
  
  /**
   * Define a test case
   */
  function it(name, fn) {
    // Create the test object
    const test = {
      name,
      suite: testState.currentSuite,
      fn,
      result: null,
      error: null,
      skipped: false,
      fullName: testState.currentSuite ? `${testState.currentSuite} > ${name}` : name
    };
    
    // Add to tests
    testState.tests.push(test);
  }
  
  /**
   * Define a skipped test case
   */
  function xit(name, fn) {
    // Create the test object
    const test = {
      name,
      suite: testState.currentSuite,
      fn,
      result: RESULT.SKIP,
      error: null,
      skipped: true,
      fullName: testState.currentSuite ? `${testState.currentSuite} > ${name}` : name
    };
    
    // Add to tests
    testState.tests.push(test);
    
    // Update results
    testState.results.skipped++;
    testState.results.total++;
    
    // Log the skipped test
    if (testState.options.verbose) {
      console.log(`⏭️ SKIPPED: ${test.fullName}`);
    }
  }
  
  /**
   * Run all registered tests
   */
  async function runTests(options = {}) {
    // Update options
    Object.assign(testState.options, options);
    
    // Reset results
    testState.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: new Date(),
      endTime: null,
      elapsedMs: 0
    };
    
    console.log(`🧪 Starting test run with ${testState.tests.length} tests...`);
    
    // Run each test
    for (const test of testState.tests) {
      // Skip tests already marked as skipped
      if (test.skipped) {
        continue;
      }
      
      await runTest(test);
      
      // Stop if requested after a failure
      if (testState.options.stopOnFail && test.result === RESULT.FAIL) {
        console.warn(`⛔ Stopping tests due to failure in "${test.fullName}"`);
        break;
      }
    }
    
    // Finalize results
    testState.results.endTime = new Date();
    testState.results.elapsedMs = testState.results.endTime - testState.results.startTime;
    
    // Print summary
    printSummary();
    
    return testState.results;
  }
  
  /**
   * Run a single test
   */
  async function runTest(test) {
    // Skip already processed tests
    if (test.result !== null) {
      return;
    }
    
    // Update total
    testState.results.total++;
    
    try {
      // Create a promise that runs the test with a timeout
      const testPromise = Promise.race([
        // The actual test
        Promise.resolve().then(() => test.fn()),
        
        // A timeout promise
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Test timed out after ${testState.options.timeout}ms`));
          }, testState.options.timeout);
        })
      ]);
      
      // Run the test
      await testPromise;
      
      // Test passed
      test.result = RESULT.PASS;
      testState.results.passed++;
      
      if (testState.options.verbose) {
        console.log(`✅ PASS: ${test.fullName}`);
      }
    } catch (error) {
      // Test failed
      test.result = RESULT.FAIL;
      test.error = error;
      testState.results.failed++;
      
      console.error(`❌ FAIL: ${test.fullName}`);
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(`   ${error.stack.split('\n')[1]}`);
      }
    }
  }
  
  /**
   * Print a summary of test results
   */
  function printSummary() {
    const { passed, failed, skipped, total, elapsedMs } = testState.results;
    
    console.log("\n--------------------------------");
    console.log("📊 TEST SUMMARY");
    console.log("--------------------------------");
    console.log(`Total tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`⏱️ Time: ${(elapsedMs / 1000).toFixed(2)}s`);
    console.log("--------------------------------");
    
    if (failed === 0) {
      console.log("🎉 All tests passed!");
    } else {
      console.log("❗ Some tests failed.");
      
      // List failed tests
      console.group("Failed Tests:");
      testState.tests.forEach(test => {
        if (test.result === RESULT.FAIL) {
          console.log(`- ${test.fullName}: ${test.error.message}`);
        }
      });
      console.groupEnd();
    }
  }
  
  /**
   * Clear all registered tests
   */
  function clearTests() {
    testState.tests = [];
    testState.currentSuite = null;
    testState.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      elapsedMs: 0
    };
  }
  
  /**
   * Assertions for tests
   */
  const assert = {
    /**
     * Assert that a condition is true
     */
    isTrue(condition, message = "Expected condition to be true") {
      if (!condition) {
        throw new Error(message);
      }
    },
    
    /**
     * Assert that a condition is false
     */
    isFalse(condition, message = "Expected condition to be false") {
      if (condition) {
        throw new Error(message);
      }
    },
    
    /**
     * Assert that two values are equal (non-strict)
     */
    equal(actual, expected, message = "Values should be equal") {
      if (actual != expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
      }
    },
    
    /**
     * Assert that two values are strictly equal
     */
    strictEqual(actual, expected, message = "Values should be strictly equal") {
      if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
      }
    },
    
    /**
     * Assert that two values are not equal
     */
    notEqual(actual, expected, message = "Values should not be equal") {
      if (actual == expected) {
        throw new Error(`${message}: both values are ${actual}`);
      }
    },
    
    /**
     * Assert that two values are not strictly equal
     */
    notStrictEqual(actual, expected, message = "Values should not be strictly equal") {
      if (actual === expected) {
        throw new Error(`${message}: both values are ${actual}`);
      }
    },
    
    /**
     * Assert that a value is defined (not undefined)
     */
    isDefined(value, message = "Value should be defined") {
      if (value === undefined) {
        throw new Error(message);
      }
    },
    
    /**
     * Assert that a value is undefined
     */
    isUndefined(value, message = "Value should be undefined") {
      if (value !== undefined) {
        throw new Error(`${message}: got ${value}`);
      }
    },
    
    /**
     * Assert that a value is null
     */
    isNull(value, message = "Value should be null") {
      if (value !== null) {
        throw new Error(`${message}: got ${value}`);
      }
    },
    
    /**
     * Assert that a value is not null
     */
    isNotNull(value, message = "Value should not be null") {
      if (value === null) {
        throw new Error(message);
      }
    },
    
    /**
     * Assert that a value is an array
     */
    isArray(value, message = "Value should be an array") {
      if (!Array.isArray(value)) {
        throw new Error(`${message}: got ${typeof value}`);
      }
    },
    
    /**
     * Assert that a function throws an error
     */
    throws(fn, expectedError, message = "Function should throw an error") {
      try {
        fn();
        throw new Error(message);
      } catch (error) {
        if (expectedError) {
          if (typeof expectedError === 'string' && error.message !== expectedError) {
            throw new Error(`${message}: expected "${expectedError}", got "${error.message}"`);
          }
          if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
            throw new Error(`${message}: expected message to match ${expectedError}, got "${error.message}"`);
          }
          if (typeof expectedError === 'function' && !(error instanceof expectedError)) {
            throw new Error(`${message}: expected error of type ${expectedError.name}`);
          }
        }
      }
    },
    
    /**
     * Assert that a function does not throw an error
     */
    doesNotThrow(fn, message = "Function should not throw an error") {
      try {
        fn();
      } catch (error) {
        throw new Error(`${message}: got "${error.message}"`);
      }
    },
    
    /**
     * Assert that a value is a specific type
     */
    isType(value, type, message = "Value should be of specified type") {
      if (typeof value !== type) {
        throw new Error(`${message}: expected ${type}, got ${typeof value}`);
      }
    },
    
    /**
     * Assert that an object has a property
     */
    hasProperty(obj, prop, message = "Object should have property") {
      if (!(prop in obj)) {
        throw new Error(`${message}: property "${prop}" not found`);
      }
    },
    
    /**
     * Assert that an array contains a value
     */
    contains(array, value, message = "Array should contain value") {
      if (!Array.isArray(array)) {
        throw new Error(`${message}: first argument is not an array`);
      }
      
      if (!array.includes(value)) {
        throw new Error(`${message}: ${value} not found in array`);
      }
    },
    
    /**
     * Assert that a string contains a substring
     */
    stringContains(string, substring, message = "String should contain substring") {
      if (typeof string !== 'string') {
        throw new Error(`${message}: first argument is not a string`);
      }
      
      if (!string.includes(substring)) {
        throw new Error(`${message}: "${substring}" not found in "${string}"`);
      }
    },
    
    /**
     * Assert that a value is approximately equal to another value
     */
    approximately(actual, expected, epsilon = 0.0001, message = "Values should be approximately equal") {
      if (Math.abs(actual - expected) > epsilon) {
        throw new Error(`${message}: expected ${expected} ±${epsilon}, got ${actual}`);
      }
    }
  };
  
  /**
   * Create a mock object for testing
   */
  function createMock(implementation = {}) {
    const calls = {};
    const mock = {};
    
    // Create the mock object
    Object.keys(implementation).forEach(method => {
      // Initialize call tracking
      calls[method] = [];
      
      // Create mock method
      mock[method] = function(...args) {
        // Track call
        calls[method].push({
          args,
          timestamp: Date.now()
        });
        
        // Call implementation if provided
        if (typeof implementation[method] === 'function') {
          return implementation[method](...args);
        }
        
        // Return implementation value if not a function
        return implementation[method];
      };
    });
    
    // Add call tracking interface
    mock._calls = calls;
    
    // Add verification helpers
    mock.verify = {
      called(method) {
        return calls[method] && calls[method].length > 0;
      },
      
      calledWith(method, ...expectedArgs) {
        if (!calls[method]) return false;
        
        return calls[method].some(call => {
          if (call.args.length !== expectedArgs.length) return false;
          
          return call.args.every((arg, i) => 
            JSON.stringify(arg) === JSON.stringify(expectedArgs[i])
          );
        });
      },
      
      calledTimes(method, count) {
        return calls[method] && calls[method].length === count;
      },
      
      notCalled(method) {
        return !calls[method] || calls[method].length === 0;
      }
    };
    
    return mock;
  }
  
  /**
   * Create a spy that wraps an existing object
   */
  function spyOn(obj, method) {
    // Store the original method
    const original = obj[method];
    
    // Make sure the method exists
    if (typeof original !== 'function') {
      throw new Error(`Cannot spy on ${method} - it's not a function`);
    }
    
    // Call tracking
    const calls = [];
    
    // Replace the method with our spy
    obj[method] = function(...args) {
      // Track call
      calls.push({
        args,
        timestamp: Date.now()
      });
      
      // Call the original method
      return original.apply(this, args);
    };
    
    // Add call tracking interface
    obj[method]._calls = calls;
    
    // Add verification helpers
    obj[method].verify = {
      called() {
        return calls.length > 0;
      },
      
      calledWith(...expectedArgs) {
        return calls.some(call => {
          if (call.args.length !== expectedArgs.length) return false;
          
          return call.args.every((arg, i) => 
            JSON.stringify(arg) === JSON.stringify(expectedArgs[i])
          );
        });
      },
      
      calledTimes(count) {
        return calls.length === count;
      },
      
      notCalled() {
        return calls.length === 0;
      }
    };
    
    // Function to restore the original method
    obj[method].restore = function() {
      obj[method] = original;
    };
    
    return obj[method];
  }
  
  // Public API
  return {
    describe,
    it,
    xit,
    runTests,
    clearTests,
    assert,
    createMock,
    spyOn,
    RESULT
  };
})();