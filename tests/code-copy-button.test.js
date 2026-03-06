const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('theme loads CodeCopy script and post template initializes it', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/code-copy\.js/);

  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /window\.CodeCopy\?\.initCodeCopy\(\)/);
});

test('stylesheet contains copy button and toast styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.article-content pre\s*\{[\s\S]*?position:\s*relative;/);
  assert.match(css, /\.code-copy-button\s*\{/);
  assert.match(css, /\.code-copy-toast\s*\{/);
});
