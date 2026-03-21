const assert = require('assert');
const { JSDOM } = require('jsdom'); // Mock DOM for testing

// Import the module from the source path
// In a real environment, this would be handled by a build step or module loader.
// For testing directly, we need to adapt. The factory function needs document and window.
const TocScrollSpyFactory = require('../toc-scrollspy.js');

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error);
    process.exit(1); // Exit with error code on failure
  }
}

// Mock browser environment for testing toc-scrollspy.js
const dom = new JSDOM(`<!DOCTYPE html><body><div id="article-content"></div></body></html>`);
const document = dom.window.document;
const window = dom.window;

const TocScrollSpy = TocScrollSpyFactory(document, window);
const slugifyHeading = TocScrollSpy.slugifyHeading;
const ensureHeadingIds = TocScrollSpy.ensureHeadingIds;

// Test Cases for slugifyHeading
runTest('slugifyHeading: should convert basic text to slug', () => {
  assert.strictEqual(slugifyHeading('Hello World'), 'hello-world');
});

runTest('slugifyHeading: should handle multiple spaces and special characters', () => {
  assert.strictEqual(slugifyHeading('  Test Heading with !@#$%^&*() special  chars  '), 'test-heading-with-special-chars');
});

runTest('slugifyHeading: should handle Chinese characters', () => {
  assert.strictEqual(slugifyHeading('你好 世界'), '你好-世界');
});

runTest('slugifyHeading: should handle mixed English and Chinese characters', () => {
  assert.strictEqual(slugifyHeading('Section 1 - 介绍'), 'section-1-介绍');
});

runTest('slugifyHeading: should handle numbers and hyphens', () => {
  assert.strictEqual(slugifyHeading('Chapter 2.1.3 - Final Section'), 'chapter-2-1-3-final-section');
});

runTest('slugifyHeading: should return "section" for empty or non-text content', () => {
  assert.strictEqual(slugifyHeading(''), 'section');
  assert.strictEqual(slugifyHeading('   '), 'section');
  assert.strictEqual(slugifyHeading('!@#'), 'section');
});

// Test Cases for ensureHeadingIds
runTest('ensureHeadingIds: should assign unique IDs to headings without existing IDs', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h2>First Heading</h2>
    <h3>Second Heading</h3>
    <h2>Third Heading</h2>
  `;
  const headings = Array.from(container.querySelectorAll('h2, h3'));
  ensureHeadingIds(headings);

  assert.strictEqual(headings[0].id, 'first-heading');
  assert.strictEqual(headings[1].id, 'second-heading');
  assert.strictEqual(headings[2].id, 'third-heading');
});

runTest('ensureHeadingIds: should preserve existing IDs', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h2 id="existing-id">Existing Heading</h2>
    <h3>New Heading</h3>
  `;
  const headings = Array.from(container.querySelectorAll('h2, h3'));
  ensureHeadingIds(headings);

  assert.strictEqual(headings[0].id, 'existing-id');
  assert.strictEqual(headings[1].id, 'new-heading');
});

runTest('ensureHeadingIds: should deduplicate IDs for same text content', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h2>Duplicate Heading</h2>
    <h3>Duplicate Heading</h3>
    <h2>Another Duplicate Heading</h2>
    <h3>Another Duplicate Heading</h3>
  `;
  const headings = Array.from(container.querySelectorAll('h2, h3'));
  ensureHeadingIds(headings);

  assert.strictEqual(headings[0].id, 'duplicate-heading');
  assert.strictEqual(headings[1].id, 'duplicate-heading-2');
  assert.strictEqual(headings[2].id, 'another-duplicate-heading');
  assert.strictEqual(headings[3].id, 'another-duplicate-heading-2');
});

runTest('ensureHeadingIds: should handle Chinese characters in deduplication', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h2>中文标题</h2>
    <h3>中文标题</h3>
  `;
  const headings = Array.from(container.querySelectorAll('h2, h3'));
  ensureHeadingIds(headings);

  assert.strictEqual(headings[0].id, '中文标题');
  assert.strictEqual(headings[1].id, '中文标题-2');
});

console.log('All tests passed.');
