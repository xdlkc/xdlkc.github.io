const assert = require('assert');
const { generateBreadcrumbData } = require('../src/structured-data-breadcrumb.js');

try {
  const result = generateBreadcrumbData('https://example.com/post', 'Test Post', 'Tech');
  const parsed = JSON.parse(result);
  
  assert.strictEqual(parsed['@context'], 'https://schema.org');
  assert.strictEqual(parsed['@type'], 'BreadcrumbList');
  assert.strictEqual(parsed.itemListElement.length, 3);
  assert.strictEqual(parsed.itemListElement[0].name, 'Home');
  assert.strictEqual(parsed.itemListElement[1].name, 'Tech');
  assert.strictEqual(parsed.itemListElement[2].name, 'Test Post');
  console.log('✅ PASS: Structured data test passed.');
} catch (e) {
  console.error('❌ FAIL:', e.message);
  process.exit(1);
}