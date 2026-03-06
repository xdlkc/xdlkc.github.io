const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template injects reading progress bar and bootstraps it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /class=\"reading-progress\"/);
  assert.match(template, /reading-progress\.js/);
  assert.match(template, /ReadingProgress\?\.initReadingProgress/);
});

test('stylesheet contains reading progress bar styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.reading-progress\s*\{/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /\.reading-progress-bar\s*\{/);
});
