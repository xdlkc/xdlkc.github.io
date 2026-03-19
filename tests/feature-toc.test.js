// feature-toc.test.js

// Mock a very basic document and element structure for Node.js
function MockElement(tagName, id = '') {
  this.tagName = tagName.toUpperCase();
  this.id = id;
  this.children = [];
  this.innerHTML = '';
  this._attributes = {};
  this.textContent = ''; // Add textContent for slugify
  this.parentNode = null; // To simulate DOM parentage

  this.setAttribute = (name, value) => {
    if (name === 'id') this.id = value;
    this._attributes[name] = value;
  };
  this.getAttribute = (name) => this._attributes[name];
  this.appendChild = (child) => {
    this.children.push(child);
    child.parentNode = this;
  };
  // Simplified querySelectorAll for nested elements
  this.querySelectorAll = (selector) => {
    const results = [];
    // Check if this element matches the selector
    const tagMatch = selector.split(',').some(s => s.trim().toLowerCase() === this.tagName.toLowerCase());
    const idMatch = selector.startsWith('#') && this.id === selector.substring(1);

    if (tagMatch || idMatch) {
        results.push(this);
    }

    // Recursively check children
    this.children.forEach(child => {
        results.push(...child.querySelectorAll(selector));
    });
    return results;
  };
}

// Global list to hold all mock elements to ensure consistent references
const _mockElementsRegistry = {};
let _nextMockId = 0;

function createMockElement(tagName, id = '') {
    const el = new MockElement(tagName, id);
    // Assign a unique internal ID for tracking if not already set
    if (!el._internalId) {
        el._internalId = `mock-el-${_nextMockId++}`;
    }
    _mockElementsRegistry[el._internalId] = el;
    return el;
}

// Setup a simple, pre-defined DOM structure for the test
const mockArticleContent = createMockElement('div', 'article-content');
const heading1 = createMockElement('h1');
heading1.textContent = 'Initial Heading 1 Text';
const heading2 = createMockElement('h2');
heading2.textContent = 'Initial Sub-heading 1.1 Text';
const heading3 = createMockElement('h1');
heading3.textContent = 'Another Heading 1 Text';

mockArticleContent.appendChild(heading1);
mockArticleContent.appendChild(heading2);
mockArticleContent.appendChild(heading3);

const mockTocContainer = createMockElement('div', 'toc-container');

const mockBody = createMockElement('body');
mockBody.appendChild(mockArticleContent);
mockBody.appendChild(mockTocContainer);

// A very basic mock for document
const mockDocument = {
  body: mockBody,
  getElementById: (id) => {
    // Traverse the pre-defined mock DOM
    const search = (element) => {
        if (element.id === id) return element;
        for (const child of element.children) {
            const found = search(child);
            if (found) return found;
        }
        return null;
    };
    return search(mockDocument.body);
  },
  createElement: (tagName) => createMockElement(tagName),
  querySelectorAll: (selector) => {
    // Delegate to the body's querySelectorAll which can traverse children
    return mockDocument.body.querySelectorAll(selector);
  },
  // Mock event listener for DOMContentLoaded
  _eventListeners: {},
  addEventListener: (event, callback) => {
    if (!mockDocument._eventListeners[event]) {
      mockDocument._eventListeners[event] = [];
    }
    mockDocument._eventListeners[event].push(callback);
  },
  dispatchEvent: (event) => {
    if (mockDocument._eventListeners[event.type]) {
      mockDocument._eventListeners[event.type].forEach(callback => callback(event));
    }
  }
};

global.document = mockDocument;

// Basic test runner
const describe = (name, fn) => {
  console.log(`\n${name}`);
  fn();
};

const test = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${error.message}`);
  }
};

const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  not: {
    toBe: (expected) => {
      if (actual === expected) {
        throw new Error(`Expected ${actual} not to be ${expected}`);
      }
    },
    toBeNull: () => {
      if (actual === null) {
        throw new Error(`Expected ${actual} not to be null`);
      }
    },
  },
  toBeDefined: () => {
    if (typeof actual === 'undefined') {
      throw new Error(`Expected ${actual} to be defined`);
    }
  }
});

// Load and execute toc.js
const fs = require('fs');
const path = require('path');
const tocJsPath = path.resolve(__dirname, '../js/toc.js');
const tocJsContent = fs.readFileSync(tocJsPath, 'utf8');

// Mock the Event class for Node.js if it's not natively available
if (typeof Event === 'undefined') {
  global.Event = class MockEvent {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      Object.assign(this, eventInitDict);
    }
  };
}

// Wrap in a function to control scope and execute
const runTocScript = () => {
  eval(tocJsContent); // Execute the loaded script
};

// Immediately execute the script and trigger DOMContentLoaded
runTocScript();
global.document.dispatchEvent(new Event('DOMContentLoaded'));

describe('Table of Contents (TOC) Feature - ID Generation', () => {
  test('all headings within article content should have a non-empty ID after generation', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6'); // Query all headings
    expect(headings.length).not.toBe(0);

    headings.forEach((heading) => {
      expect(heading.id).not.toBe(''); // This should now pass
    });
  });

  test('generated IDs should be unique', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h3, h4, h5, h6'); // Intentionally added duplicate h3 to test uniqueness
    const ids = new Set();
    headings.forEach(heading => {
      ids.add(heading.id);
    });
    expect(ids.size).toBe(headings.length); // This should pass if IDs are unique
  });
});