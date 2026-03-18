const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ImageLightbox: init injects one overlay', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const overlay = document.querySelector('[data-image-lightbox-overlay]');
  assert.ok(overlay, 'Overlay should be injected');
  assert.equal(overlay.getAttribute('role'), 'dialog');
  assert.equal(overlay.getAttribute('aria-modal'), 'true');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: clicking an image opens overlay and sets image src', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image1.jpg" alt="Image 1" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const image = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');
  const overlayImg = overlay.querySelector('[data-image-lightbox-img]');

  // Initially hidden
  assert.equal(overlay.style.display, 'none');

  // Click image
  image.click();

  // Overlay should be visible
  assert.match(overlay.style.display, /(block|flex)/);
  assert.equal(overlayImg.src, 'https://example.com/image1.jpg');
  assert.equal(overlayImg.alt, 'Image 1');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: Escape closes overlay', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const image = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');

  // Open overlay
  image.click();
  assert.match(overlay.style.display, /(block|flex)/);

  // Press Escape on window (not document)
  const escapeEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape' });
  dom.window.dispatchEvent(escapeEvent);

  // Overlay should be hidden
  assert.equal(overlay.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: clicking backdrop closes overlay', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const image = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');

  // Open overlay
  image.click();
  assert.match(overlay.style.display, /(block|flex)/);

  // Click overlay (backdrop)
  overlay.click();

  // Overlay should be hidden
  assert.equal(overlay.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: clicking close button closes overlay', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const image = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');
  const closeBtn = overlay.querySelector('[data-image-lightbox-close]');

  // Open overlay
  image.click();
  assert.match(overlay.style.display, /(block|flex)/);

  // Click close button
  closeBtn.click();

  // Overlay should be hidden
  assert.equal(overlay.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: calling init twice keeps a single overlay', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');

  // Init twice
  ImageLightbox.initImageLightbox({ root: document });
  ImageLightbox.initImageLightbox({ root: document });

  // Should only have one overlay
  const overlays = document.querySelectorAll('[data-image-lightbox-overlay]');
  assert.equal(overlays.length, 1, 'Should have exactly one overlay');

  delete global.window;
  delete global.document;
});

test('ImageLightbox: does not affect images outside .article-content', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <header>
      <img src="https://example.com/logo.jpg" alt="Logo" />
    </header>
    <article class="article-content">
      <img src="https://example.com/article-image.jpg" alt="Article image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ root: document });

  const logo = document.querySelector('header img');
  const articleImage = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');

  // Click logo - should not open overlay
  logo.click();
  assert.equal(overlay.style.display, 'none');

  // Click article image - should open overlay
  articleImage.click();
  assert.match(overlay.style.display, /(block|flex)/);

  delete global.window;
  delete global.document;
});

test('ImageLightbox: init is idempotent', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <img src="https://example.com/image.jpg" alt="Test image" />
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ImageLightbox = require('../themes/evan/source/js/image-lightbox.js');
  const image = document.querySelector('.article-content img');
  const overlay = document.querySelector('[data-image-lightbox-overlay]');

  // First init
  ImageLightbox.initImageLightbox({ root: document });
  const handlerCount1 = image.eventListeners?.click?.length || 0;

  // Second init
  ImageLightbox.initImageLightbox({ root: document });
  const handlerCount2 = image.eventListeners?.click?.length || 0;

  // Handler count should not increase
  assert.equal(handlerCount1, handlerCount2, 'Click handlers should not be duplicated');

  delete global.window;
  delete global.document;
});
