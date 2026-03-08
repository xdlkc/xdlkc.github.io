const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

let Breadcrumb;

test('breadcrumb module exists', () => {
  Breadcrumb = require('../themes/evan/source/js/breadcrumb.js');
  assert.ok(Breadcrumb);
});

test('buildBreadcrumbItems builds Home/Archives/current', () => {
  const { buildBreadcrumbItems } = Breadcrumb;
  const items = buildBreadcrumbItems({
    title: 'Hello World',
    rootUrl: 'https://example.com',
  });

  assert.equal(items.length, 3);
  assert.deepEqual(items.map(i => i.name), ['Home', 'Archives', 'Hello World']);
  assert.equal(items[0].url, '/');
  assert.equal(items[1].url, '/archives/');
  assert.equal(items[2].url, null);
});

test('initBreadcrumb renders breadcrumb exactly once (idempotent)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body>
      <nav data-breadcrumb data-breadcrumb-title="Hello"></nav>
    </body></html>`,
    { url: 'https://example.com/2026/hello/' }
  );

  const { initBreadcrumb } = Breadcrumb;

  initBreadcrumb({ document: dom.window.document, location: dom.window.location });
  initBreadcrumb({ document: dom.window.document, location: dom.window.location });

  const nav = dom.window.document.querySelector('[data-breadcrumb]');
  assert.ok(nav);
  assert.ok(nav.querySelector('a[href="/"]'));
  assert.ok(nav.querySelector('a[href="/archives/"]'));

  const current = nav.querySelector('[aria-current="page"]');
  assert.ok(current);
  assert.equal(current.textContent.trim(), 'Hello');
  assert.equal(current.tagName.toLowerCase(), 'span');

  // No JSON-LD injection here: theme layout already outputs BreadcrumbList globally.
});
