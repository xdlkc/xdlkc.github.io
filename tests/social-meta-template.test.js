const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout template conditionally renders og/twitter image alt meta tags', () => {
  const template = read('themes/evan/layout/layout.ejs');

  assert.match(template, /og:image:alt/);
  assert.match(template, /twitter:image:alt/);
  assert.match(template, /if \(social\.imageAlt\)/);
});
