const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout renders og:site_name meta tag', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /property="og:site_name"/);
});
