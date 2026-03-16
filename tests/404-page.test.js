const { test } = require('node:test');
const assert = require('node:assert/strict');

test('404 page test', () => {
  // Test 1: Verify 404 template exists
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.join(__dirname, '../themes/evan/layout/404.ejs');

  assert.ok(fs.existsSync(templatePath), '404.ejs template should exist');

  // Test 2: Verify template contains required elements
  const content = fs.readFileSync(templatePath, 'utf-8');

  assert.ok(content.includes('404'), 'Template should contain "404" text');
  assert.ok(content.includes('页面未找到') || content.includes('Not Found'), 'Template should contain error text');
  assert.ok(content.includes('首页') || content.includes('Home'), 'Template should contain navigation link');

  console.log('✅ 404 page tests passed');
});
