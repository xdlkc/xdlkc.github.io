/**
 * Test suite for image lazy loading functionality.
 *
 * This test verifies that all img tags in the rendered HTML
 * have the loading="lazy" attribute for performance optimization.
 */

const test = require('node:test');
const assert = require('node:assert');

// Mock Hexo filter registration
const registeredFilters = {};
const mockHexo = {
  extend: {
    filter: {
      register: (name, fn) => {
        registeredFilters[name] = fn;
      }
    }
  }
};

// Load the plugin
let plugin;
try {
  plugin = require('../scripts/image-lazy-loading.js');
  if (typeof plugin === 'function') {
    plugin(mockHexo);
  }
} catch (e) {
  // Plugin might not exist yet - this is expected in TDD
}

test('Image Lazy Loading - add loading="lazy" to all img tags', () => {
  const filter = registeredFilters['after_render:html'];
  assert.ok(filter, 'after_render:html filter should be registered');

  const inputHtml = `
    <html>
      <body>
        <img src="/image1.jpg" alt="Test 1">
        <img src="/image2.png" alt="Test 2" class="test-class">
        <img src="https://example.com/image3.gif">
      </body>
    </html>
  `;

  const output = filter(inputHtml, {});

  assert.ok(output.includes('loading="lazy"'), 'Output should contain loading="lazy"');
  assert.ok(output.includes('src="/image1.jpg"'), 'Should preserve original src attributes');
  assert.ok(output.includes('alt="Test 1"'), 'Should preserve original alt attributes');
  assert.ok(output.includes('class="test-class"'), 'Should preserve original class attributes');
});

test('Image Lazy Loading - should not modify img tags that already have loading attribute', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `
    <img src="/image1.jpg" loading="eager">
  `;

  const output = filter(inputHtml, {});

  assert.ok(output.includes('loading="eager"'), 'Should preserve existing loading attribute');
});

test('Image Lazy Loading - should handle multiple img tags correctly', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `
    <img src="/img1.jpg">
    <p>Some text</p>
    <img src="/img2.png" alt="Test">
    <img src="/img3.gif" class="image">
  `;

  const output = filter(inputHtml, {});

  const matches = output.match(/loading="lazy"/g);
  assert.ok(matches, 'Should have loading="lazy" attributes');
  assert.strictEqual(matches.length, 3, 'Should add loading="lazy" to all 3 images');
});

test('Image Lazy Loading - should handle img tags with self-closing syntax', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `<img src="/image.jpg" alt="Test" />`;

  const output = filter(inputHtml, {});

  assert.ok(output.includes('loading="lazy"'), 'Should add loading="lazy" to self-closing tags');
});

test('Image Lazy Loading - should preserve all other attributes', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `
    <img src="/image.jpg" alt="Alt text" class="img-class" id="img-id" style="width: 100px;" data-custom="value">
  `;

  const output = filter(inputHtml, {});

  assert.ok(output.includes('alt="Alt text"'), 'Should preserve alt');
  assert.ok(output.includes('class="img-class"'), 'Should preserve class');
  assert.ok(output.includes('id="img-id"'), 'Should preserve id');
  assert.ok(output.includes('style="width: 100px;"'), 'Should preserve style');
  assert.ok(output.includes('data-custom="value"'), 'Should preserve data attributes');
});

test('Image Lazy Loading - should handle HTML without img tags', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `<p>Some text without images</p>`;

  const output = filter(inputHtml, {});

  assert.strictEqual(output, inputHtml, 'Should return unchanged HTML when no img tags');
});

test('Image Lazy Loading - should handle empty input', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const output = filter('', {});

  assert.strictEqual(output, '', 'Should handle empty input');
});

test('Image Lazy Loading - should handle img tags with mixed quotes', () => {
  const filter = registeredFilters['after_render:html'];
  if (!filter) return;

  const inputHtml = `<img src='/image.jpg' alt="Test">`;

  const output = filter(inputHtml, {});

  assert.ok(output.includes('loading="lazy"'), 'Should handle mixed quotes');
});
