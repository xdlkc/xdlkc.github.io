const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function makeDom() {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <article class="article-content">
      <p>hello</p>
      <img id="img1" src="/a.png" alt="A" />
      <img id="img2" src="/b.png" alt="B" />
      <img id="img3" src="/c.png" alt="C" />
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  return dom;
}

test('ImageLightbox: ArrowRight/ArrowLeft navigates between images with wrapping when open', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ window, document: window.document });

  // Open at img2.
  const img2 = window.document.querySelector('#img2');
  img2.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));

  const overlay = window.document.querySelector('div.image-lightbox[data-image-lightbox]');
  const lightboxImg = overlay.querySelector('img[data-image-lightbox-img]');
  assert.equal(lightboxImg.getAttribute('src'), '/b.png');

  // Next => img3.
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(lightboxImg.getAttribute('src'), '/c.png');
  assert.equal(lightboxImg.getAttribute('alt'), 'C');

  // Next => wraps to img1.
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(lightboxImg.getAttribute('src'), '/a.png');

  // Prev from img1 => wraps to img3.
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(lightboxImg.getAttribute('src'), '/c.png');
});

test('ImageLightbox: Arrow keys do nothing when overlay is closed', () => {
  const dom = makeDom();
  const { window } = dom;

  const ImageLightbox = require('../../themes/evan/source/js/image-lightbox.js');
  ImageLightbox.initImageLightbox({ window, document: window.document });

  const overlay = window.document.querySelector('div.image-lightbox[data-image-lightbox]');
  const lightboxImg = overlay.querySelector('img[data-image-lightbox-img]');

  // Start closed: should not change.
  const before = lightboxImg.getAttribute('src');
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(lightboxImg.getAttribute('src'), before);
});
