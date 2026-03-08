const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout loads code-collapse script and post template initializes it', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/code-collapse\.js/);

  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /window\.CodeCollapse\?\.initCodeCollapse\(\)/);
});

test('stylesheet contains collapse button and collapsed styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.code-collapse-button\s*\{/);
  assert.match(css, /\.article-content\s+(pre|figure\.highlight)\.is-collapsed/);
});

test('initCodeCollapse injects toggle for long pre blocks and toggles on click', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<article class="article-content">' +
        '<pre><code>' + Array.from({ length: 30 }, (_, i) => `line-${i + 1}`).join("\n") + '</code></pre>' +
      '</article>' +
    '</body></html>',
    { url: 'https://example.com/' }
  );

  const CodeCollapse = require('../themes/evan/source/js/code-collapse.js');

  CodeCollapse.initCodeCollapse({ root: dom.window.document });

  const pre = dom.window.document.querySelector('pre');
  assert.ok(pre.classList.contains('is-collapsed'));

  const button = pre.querySelector('.code-collapse-button');
  assert.ok(button);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.match(button.textContent, /展开代码/);

  button.click();
  assert.ok(!pre.classList.contains('is-collapsed'));
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.match(button.textContent, /收起代码/);

  button.click();
  assert.ok(pre.classList.contains('is-collapsed'));
});

test('short code blocks are left untouched, and init is idempotent', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<article class="article-content">' +
        '<pre><code>one\ntwo\nthree</code></pre>' +
      '</article>' +
    '</body></html>',
    { url: 'https://example.com/' }
  );

  const CodeCollapse = require('../themes/evan/source/js/code-collapse.js');

  CodeCollapse.initCodeCollapse({ root: dom.window.document });
  CodeCollapse.initCodeCollapse({ root: dom.window.document });

  const pre = dom.window.document.querySelector('pre');
  assert.ok(!pre.classList.contains('is-collapsed'));
  assert.equal(pre.querySelectorAll('.code-collapse-button').length, 0);
});
