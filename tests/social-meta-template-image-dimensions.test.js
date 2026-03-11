const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout template conditionally renders og:image:type and dimensions meta tags', () => {
  const template = read('themes/evan/layout/layout.ejs');

  // Should render when data exists.
  assert.match(template, /og:image:type/);
  assert.match(template, /og:image:width/);
  assert.match(template, /og:image:height/);

  // Should be conditional.
  assert.match(template, /if \(social\.imageType\)/);
  assert.match(template, /if \(social\.imageWidth && social\.imageHeight\)/);
});
