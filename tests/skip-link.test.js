const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout includes skip link targeting #main-content', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /<a[^>]*class="skip-link"[^>]*href="#main-content"[^>]*>/);
});

test('page templates expose a unique #main-content region', () => {
  const templates = [
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/page.ejs'
  ];

  templates.forEach((templatePath) => {
    const template = read(templatePath);
    const matches = template.match(/id="main-content"/g) || [];
    assert.equal(matches.length, 1, `${templatePath} should contain exactly one #main-content`);
  });
});

test('stylesheet defines skip-link hidden-by-default and visible-on-focus states', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.skip-link\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?transform:\s*translateY\(-120%\);/);
  assert.match(css, /\.skip-link:focus\s*\{[\s\S]*?transform:\s*translateY\(0\);/);
});
