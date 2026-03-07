const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { initImageOpen } = require('../themes/evan/source/js/image-open');

function makeDom(html = '') {
  const dom = new JSDOM(
    `<!doctype html><html><body>${html}</body></html>`,
    { url: 'https://example.com/post/' }
  );
  return dom;
}

test('initImageOpen: clicking a plain article image opens it in a new tab', () => {
  const dom = makeDom(`
    <article class="article-content">
      <p>hi</p>
      <img id="pic" src="/images/a.png" />
    </article>
  `);

  const { window } = dom;
  const { document } = window;

  const opened = [];
  window.open = (url, target, features) => {
    opened.push({ url, target, features });
    return null;
  };

  initImageOpen({ document, window });

  const img = document.getElementById('pic');
  assert.equal(img.getAttribute('data-image-open'), '1');

  img.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  assert.equal(opened.length, 1);
  assert.equal(opened[0].url, 'https://example.com/images/a.png');
  assert.equal(opened[0].target, '_blank');
  assert.match(opened[0].features, /noopener/);
});

test('initImageOpen: does not hijack images already wrapped by a link', () => {
  const dom = makeDom(`
    <article class="article-content">
      <a href="/go"><img id="pic" src="/images/a.png" /></a>
    </article>
  `);

  const { window } = dom;
  const { document } = window;

  const opened = [];
  window.open = (url) => {
    opened.push(url);
    return null;
  };

  initImageOpen({ document, window });

  const img = document.getElementById('pic');
  // Still marks image for cursor styling, but click should not open.
  assert.equal(img.getAttribute('data-image-open'), '1');

  // Prevent jsdom navigation error from the <a> default action.
  const anchor = img.closest('a');
  anchor.addEventListener('click', (e) => e.preventDefault());

  img.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  assert.equal(opened.length, 0);
});
