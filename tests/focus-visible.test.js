const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('stylesheet defines a shared :focus-visible style for interactive elements', () => {
  const css = read('themes/evan/source/css/style.css');

  assert.match(
    css,
    /:where\(a,\s*button,\s*\[role="button"\],\s*input,\s*textarea,\s*select,\s*summary\):focus-visible\s*\{/,
    'should target common interactive elements via :focus-visible'
  );

  assert.match(css, /outline:\s*3px\s+solid\s+var\(--accent\);/);
  assert.match(css, /outline-offset:\s*3px;/);
});
