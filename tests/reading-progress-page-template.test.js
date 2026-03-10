const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('page template injects reading progress bar and bootstraps it', () => {
  const template = read('themes/evan/layout/page.ejs');
  assert.match(template, /class=\"reading-progress\"/);
  assert.match(template, /reading-progress\.js/);
  assert.match(template, /ReadingProgress\?\.initReadingProgress/);
});
