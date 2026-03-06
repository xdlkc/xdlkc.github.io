const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template injects copy button enhancement for code blocks', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /querySelectorAll\("\.article-content pre"\)/);
  assert.match(template, /code-copy-button/);
  assert.match(template, /navigator\.clipboard\.writeText/);
  assert.match(template, /code-copy-toast/);
  assert.match(template, /复制成功/);
});

test('stylesheet contains copy button and toast styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.article-content pre\s*\{[\s\S]*?position:\s*relative;/);
  assert.match(css, /\.code-copy-button\s*\{/);
  assert.match(css, /\.code-copy-toast\s*\{/);
});
