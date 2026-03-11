const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function makeDom() {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <article class="article-content">
      <p>hello</p>
      <img id="img1" src="/a.png" alt="A" />
      <img id="img2" src="/b.png" alt="B" />
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  return dom;
}

test('ImageLightbox: init injects a single overlay and is idempotent', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');

  ImageLightbox.initImageLightbox({ window, document: window.document });
  ImageLightbox.initImageLightbox({ window, document: window.document });

  const overlays = window.document.querySelectorAll('div.image-lightbox[data-image-lightbox]');
  assert.equal(overlays.length, 1);
});

test('ImageLightbox: click image opens overlay with same src + alt', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ window, document: window.document });

  const img = window.document.querySelector('#img1');
  img.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));

  const overlay = window.document.querySelector('div.image-lightbox[data-image-lightbox]');
  assert.ok(overlay.classList.contains('is-open'));

  const lightboxImg = overlay.querySelector('img');
  assert.ok(lightboxImg);
  assert.equal(lightboxImg.getAttribute('src'), '/a.png');
  assert.equal(lightboxImg.getAttribute('alt'), 'A');
});

test('ImageLightbox: Escape closes overlay', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ window, document: window.document });

  const img = window.document.querySelector('#img2');
  img.dispatchEvent(new window.Event('click', { bubbles: true }));

  const overlay = window.document.querySelector('div.image-lightbox[data-image-lightbox]');
  assert.ok(overlay.classList.contains('is-open'));

  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!overlay.classList.contains('is-open'));
});

test('ImageLightbox: clicking backdrop closes overlay (but clicking panel does not)', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ window, document: window.document });

  const img = window.document.querySelector('#img1');
  img.dispatchEvent(new window.Event('click', { bubbles: true }));

  const overlay = window.document.querySelector('div.image-lightbox[data-image-lightbox]');
  const panel = overlay.querySelector('[data-image-lightbox-panel]');
  assert.ok(panel);

  panel.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(overlay.classList.contains('is-open'));

  overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(!overlay.classList.contains('is-open'));
});
