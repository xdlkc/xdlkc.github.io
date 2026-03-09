const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildBreadcrumbStructuredData } = require('../scripts/helpers/breadcrumb-structured-data');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('buildBreadcrumbStructuredData: post page with category => Home -> Archives -> Category -> Post', () => {
  const result = buildBreadcrumbStructuredData({
    page: {
      title: 'Hello Post',
      layout: 'post',
      categories: {
        data: [
          { name: 'Programming', path: 'categories/programming/' }
        ]
      }
    },
    site: {
      title: 'XDLKC Blog',
      url: 'https://xdlkc.github.io',
      root: '/'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/07/hello-post/'
  });

  assert.equal(result['@context'], 'https://schema.org');
  assert.equal(result['@type'], 'BreadcrumbList');
  assert.equal(result.itemListElement.length, 4);

  const [home, archives, category, post] = result.itemListElement;
  assert.deepEqual(home, {
    '@type': 'ListItem',
    position: 1,
    name: 'XDLKC Blog',
    item: 'https://xdlkc.github.io/'
  });

  assert.deepEqual(archives, {
    '@type': 'ListItem',
    position: 2,
    name: 'Archives',
    item: 'https://xdlkc.github.io/archives/'
  });

  assert.deepEqual(category, {
    '@type': 'ListItem',
    position: 3,
    name: 'Programming',
    item: 'https://xdlkc.github.io/categories/programming/'
  });

  assert.deepEqual(post, {
    '@type': 'ListItem',
    position: 4,
    name: 'Hello Post',
    item: 'https://xdlkc.github.io/2026/03/07/hello-post/'
  });
});

test('buildBreadcrumbStructuredData: post page without category => Home -> Archives -> Post', () => {
  const result = buildBreadcrumbStructuredData({
    page: {
      title: 'Hello Post',
      layout: 'post'
    },
    site: {
      title: 'XDLKC Blog',
      url: 'https://xdlkc.github.io',
      root: '/'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/07/hello-post/'
  });

  assert.equal(result.itemListElement.length, 3);
  assert.equal(result.itemListElement[2].name, 'Hello Post');
  assert.equal(result.itemListElement[2].position, 3);
});

test('buildBreadcrumbStructuredData: non-post page => Home -> Page', () => {
  const result = buildBreadcrumbStructuredData({
    page: {
      title: 'About',
      layout: 'page'
    },
    site: {
      title: 'XDLKC Blog',
      url: 'https://xdlkc.github.io',
      root: '/'
    },
    canonicalUrl: 'https://xdlkc.github.io/about/'
  });

  assert.equal(result.itemListElement.length, 2);
  assert.equal(result.itemListElement[1].name, 'About');
  assert.equal(result.itemListElement[1].item, 'https://xdlkc.github.io/about/');
});

test('buildBreadcrumbStructuredData: returns null when canonicalUrl missing', () => {
  const result = buildBreadcrumbStructuredData({
    page: { title: 'Hello', layout: 'post' },
    site: { title: 'XDLKC Blog', url: 'https://xdlkc.github.io', root: '/' },
    canonicalUrl: ''
  });

  assert.equal(result, null);
});

test('layout renders BreadcrumbList JSON-LD when breadcrumb_structured_data is present', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /breadcrumb_structured_data\(\)/);
  assert.match(layout, /application\/ld\+json/);
});
