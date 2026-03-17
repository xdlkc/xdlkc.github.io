const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ImageLazyLoading: adds loading="lazy" to article content images', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="image1.jpg" alt="Image 1">
      <img src="image2.jpg" alt="Image 2">
      <p>Some text</p>
      <img src="image3.jpg" alt="Image 3">
    </article>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLazyLoading = require('../themes/evan/source/js/image-lazy-loading');
  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });

  const images = dom.window.document.querySelectorAll('.article-content img');
  assert.equal(images.length, 3);
  images.forEach(img => {
    assert.equal(img.getAttribute('loading'), 'lazy');
  });

  delete global.window;
  delete global.document;
});

test('ImageLazyLoading: does not modify images outside article content', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav>
      <img src="logo.png" alt="Logo">
    </nav>
    <article class="article-content">
      <img src="content.jpg" alt="Content">
    </article>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLazyLoading = require('../themes/evan/source/js/image-lazy-loading');
  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });

  const navImage = dom.window.document.querySelector('nav img');
  assert.equal(navImage.getAttribute('loading'), null);

  const contentImage = dom.window.document.querySelector('.article-content img');
  assert.equal(contentImage.getAttribute('loading'), 'lazy');

  delete global.window;
  delete global.document;
});

test('ImageLazyLoading: preserves existing attributes', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="test.jpg" alt="Test" class="test-class" id="test-id" width="100" height="100">
    </article>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLazyLoading = require('../themes/evan/source/js/image-lazy-loading');
  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });

  const img = dom.window.document.querySelector('.article-content img');
  assert.equal(img.getAttribute('src'), 'test.jpg');
  assert.equal(img.getAttribute('alt'), 'Test');
  assert.equal(img.getAttribute('class'), 'test-class');
  assert.equal(img.getAttribute('id'), 'test-id');
  assert.equal(img.getAttribute('width'), '100');
  assert.equal(img.getAttribute('height'), '100');
  assert.equal(img.getAttribute('loading'), 'lazy');

  delete global.window;
  delete global.document;
});

test('ImageLazyLoading: is idempotent (can be called multiple times)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="test.jpg" alt="Test">
    </article>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLazyLoading = require('../themes/evan/source/js/image-lazy-loading');

  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });
  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });

  const img = dom.window.document.querySelector('.article-content img');
  assert.equal(img.getAttribute('loading'), 'lazy');

  delete global.window;
  delete global.document;
});

test('ImageLazyLoading: handles empty article content gracefully', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <p>No images here</p>
    </article>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLazyLoading = require('../themes/evan/source/js/image-lazy-loading');
  ImageLazyLoading.initImageLazyLoading({ root: dom.window.document });

  // Should not throw an error
  const images = dom.window.document.querySelectorAll('.article-content img');
  assert.equal(images.length, 0);

  delete global.window;
  delete global.document;
});
