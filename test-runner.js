/**
 * test-runner.js
 * A simple test runner for the Route 33 Guide tests
 * 
 * Usage:
 *   node test-runner.js
 *   node test-runner.js --file=optimized-data-processor.test.js
 *   node test-runner.js --verbose
 *   node test-runner.js --stop-on-fail
 */

// This is a Node.js script, but our tests are written for the browser
// So we need to set up a minimal browser-like environment

// Create a simple console object
global.console = {
  log: (...args) => process.stdout.write(args.join(' ') + '\n'),
  error: (...args) => process.stderr.write('\x1b[31m' + args.join(' ') + '\x1b[0m\n'),
  warn: (...args) => process.stderr.write('\x1b[33m' + args.join(' ') + '\x1b[0m\n'),
  info: (...args) => process.stdout.write('\x1b[36m' + args.join(' ') + '\x1b[0m\n'),
  group: (name) => console.log('\n--- ' + name + ' ---'),
  groupEnd: () => console.log('-------------------\n')
};

// Mock browser window and localStorage
global.window = {
  addEventListener: () => {},
  location: {
    reload: () => {}
  },
  localStorage: {
    data: {},
    getItem: (key) => window.localStorage.data[key] || null,
    setItem: (key, value) => window.localStorage.data[key] = String(value),
    removeItem: (key) => delete window.localStorage.data[key],
    clear: () => window.localStorage.data = {},
    key: (index) => Object.keys(window.localStorage.data)[index] || null,
    get length() { return Object.keys(window.localStorage.data).length; }
  }
};

// Mock document
global.document = {
  body: {
    appendChild: () => {},
    removeChild: () => {},
    classList: {
      add: () => {},
      remove: () => {}
    }
  },
  createElement: () => ({
    style: {},
    addEventListener: () => {},
    appendChild: () => {},
    removeChild: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    },
    select: () => {},
    setAttribute: () => {}
  }),
  getElementById: () => ({
    appendChild: () => {},
    removeChild: () => {},
    addEventListener: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    },
    style: {}
  }),
  querySelector: () => global.document.createElement(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};

// Add XMLHttpRequest for file reading
global.XMLHttpRequest = function() {
  this.open = () => {};
  this.send = () => {};
  this.readyState = 4;
  this.status = 200;
  this.response = '';
  this.responseText = '';
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  file: null,
  verbose: false,
  stopOnFail: false
};

args.forEach(arg => {
  if (arg.startsWith('--file=')) {
    options.file = arg.replace('--file=', '');
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--stop-on-fail') {
    options.stopOnFail = true;
  }
});

// Import necessary modules
const fs = require('fs');
const path = require('path');

// Find test files
const testDir = '.';
const testFiles = options.file 
  ? [options.file]
  : fs.readdirSync(testDir)
      .filter(file => file.endsWith('.test.js'));

// Load the test suite
const testSuiteContent = fs.readFileSync(path.join(testDir, 'test-suite.js'), 'utf8');
eval(testSuiteContent);

// Load modules being tested
const moduleFiles = [
  'area-classifier.js',
  'optimized-data-processor.js',
  'data-handler.js',
  'error-handler.js',
  'ui-config-manager.js'
];

moduleFiles.forEach(file => {
  if (fs.existsSync(path.join(testDir, file))) {
    const moduleContent = fs.readFileSync(path.join(testDir, file), 'utf8');
    try {
      eval(moduleContent);
    } catch (error) {
      console.error(`Error loading module ${file}:`, error);
    }
  }
});

// Load and run test files
console.log('\n🧪 ROUTE 33 GUIDE TEST RUNNER 🧪');
console.log('================================\n');
console.log(`Running ${testFiles.length} test files...\n`);

// Run tests from each file
testFiles.forEach(file => {
  try {
    console.log(`\n📄 Running tests from: ${file}`);
    const testContent = fs.readFileSync(path.join(testDir, file), 'utf8');
    
    eval(testContent);
    
    // Run the tests
    TestSuite.runTests({
      stopOnFail: options.stopOnFail,
      verbose: options.verbose
    }).then(results => {
      // Tests will report their own results
    });
  } catch (error) {
    console.error(`Error running tests from ${file}:`, error);
  }
});

// Add an exit handler to display final summary
process.on('beforeExit', () => {
  console.log('\n\n================================');
  console.log('🏁 TEST RUN COMPLETE');
  console.log('================================\n');
});
