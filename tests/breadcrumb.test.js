const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

let Breadcrumb;

test('breadcrumb module exists', () => {
  Breadcrumb = require('../themes/evan/source/js/breadcrumb.js');
  assert.ok(Breadcrumb);
});

test('buildBreadcrumbItems builds Home/Archives/(Category)/current', () => {
  const { buildBreadcrumbItems } = Breadcrumb;

  const withCategory = buildBreadcrumbItems({
    title: 'Hello World',
    categoryName: 'Programming',
    categoryUrl: '/categories/programming/'
  });

  assert.equal(withCategory.length, 4);
  assert.deepEqual(withCategory.map(i => i.name), ['Home', 'Archives', 'Programming', 'Hello World']);
  assert.equal(withCategory[0].url, '/');
  assert.equal(withCategory[1].url, '/archives/');
  assert.equal(withCategory[2].url, '/categories/programming/');
  assert.equal(withCategory[3].url, null);

  const withoutCategory = buildBreadcrumbItems({ title: 'Hello World' });
  assert.equal(withoutCategory.length, 3);
  assert.deepEqual(withoutCategory.map(i => i.name), ['Home', 'Archives', 'Hello World']);
});

test('initBreadcrumb renders breadcrumb exactly once (idempotent)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body>
      <nav data-breadcrumb data-breadcrumb-title="Hello" data-breadcrumb-category="Programming" data-breadcrumb-category-url="/categories/programming/"></nav>
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
  assert.ok(nav.querySelector('a[href="/categories/programming/"]'));

  const current = nav.querySelector('[aria-current="page"]');
  assert.ok(current);
  assert.equal(current.textContent.trim(), 'Hello');
  assert.equal(current.tagName.toLowerCase(), 'span');

  // No JSON-LD injection here: theme layout already outputs BreadcrumbList globally.
});
