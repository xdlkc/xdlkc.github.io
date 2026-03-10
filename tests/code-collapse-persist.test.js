const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCollapse = require('../themes/evan/source/js/code-collapse.js');

function buildLongPreHtml() {
  return '<article class="article-content">' +
    '<pre><code>' + Array.from({ length: 30 }, (_, i) => `line-${i + 1}`).join("\n") + '</code></pre>' +
  '</article>';
}

test('code-collapse persists expanded/collapsed state in sessionStorage per pathname + index', () => {
  const dom1 = new JSDOM('<!doctype html><html><body>' + buildLongPreHtml() + '</body></html>', {
    url: 'https://example.com/2026/03/10/post/'
  });

  CodeCollapse.initCodeCollapse({
    root: dom1.window.document,
    storage: dom1.window.sessionStorage,
    location: dom1.window.location,
  });

  const pre1 = dom1.window.document.querySelector('pre');
  const btn1 = pre1.querySelector('.code-collapse-button');
  assert.ok(btn1);

  // Default: collapsed
  assert.equal(btn1.getAttribute('aria-expanded'), 'false');

  // Expand and persist
  btn1.click();
  assert.equal(btn1.getAttribute('aria-expanded'), 'true');

  const key = CodeCollapse.buildStorageKey({ pathname: '/2026/03/10/post/', index: 0 });
  assert.equal(dom1.window.sessionStorage.getItem(key), 'expanded');

  // Simulate reload: new DOM with same url + carried-over session values.
  const dom2 = new JSDOM('<!doctype html><html><body>' + buildLongPreHtml() + '</body></html>', {
    url: 'https://example.com/2026/03/10/post/'
  });

  dom2.window.sessionStorage.setItem(key, 'expanded');

  CodeCollapse.initCodeCollapse({
    root: dom2.window.document,
    storage: dom2.window.sessionStorage,
    location: dom2.window.location,
  });

  const pre2 = dom2.window.document.querySelector('pre');
  const btn2 = pre2.querySelector('.code-collapse-button');
  assert.ok(btn2);
  assert.equal(btn2.getAttribute('aria-expanded'), 'true');
  assert.ok(!pre2.classList.contains('is-collapsed'));

  // Collapse and persist
  btn2.click();
  assert.equal(btn2.getAttribute('aria-expanded'), 'false');
  assert.equal(dom2.window.sessionStorage.getItem(key), 'collapsed');
});
