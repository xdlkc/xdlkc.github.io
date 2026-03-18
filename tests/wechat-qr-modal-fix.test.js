const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('WeChat QR Modal: modal shows immediately on button click before QR generation', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-url="https://example.com/test">
      <button type="button" data-share-platform="wechat">WeChat</button>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');
  ArticleShare.initArticleShare({ root: document });

  const wechatBtn = document.querySelector('[data-share-platform="wechat"]');
  const modal = document.querySelector('[data-article-share-qr-modal]');

  // Initially hidden
  assert.equal(modal.style.display, 'none');

  // Click button - modal should show immediately
  wechatBtn.click();

  // Modal should be visible immediately (before QR async generation)
  assert.match(modal.style.display, /(block|flex)/);

  delete global.window;
  delete global.document;
});

test('WeChat QR Modal: modal hides on close button click', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-url="https://example.com/test">
      <button type="button" data-share-platform="wechat">WeChat</button>
    </div>
    <div class="article-share-qr-modal" data-article-share-qr-modal>
      <div class="article-share-qr-panel">
        <img data-article-share-qr-img src="" alt="QR Code" />
        <button type="button" data-article-share-qr-close>Close</button>
      </div>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');
  ArticleShare.initArticleShare({ root: document });

  const wechatBtn = document.querySelector('[data-share-platform="wechat"]');
  const closeBtn = document.querySelector('[data-article-share-qr-close]');
  const modal = document.querySelector('[data-article-share-qr-modal]');

  // Open modal
  wechatBtn.click();
  assert.match(modal.style.display, /(block|flex)/);

  // Wait a bit for async operations to settle
  await new Promise(resolve => setTimeout(resolve, 50));

  // Close modal
  closeBtn.click();
  assert.equal(modal.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('WeChat QR Modal: modal hides on click outside', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-url="https://example.com/test">
      <button type="button" data-share-platform="wechat">WeChat</button>
    </div>
    <div class="article-share-qr-modal" data-article-share-qr-modal>
      <div class="article-share-qr-panel">
        <img data-article-share-qr-img src="" alt="QR Code" />
        <button type="button" data-article-share-qr-close>Close</button>
      </div>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');
  ArticleShare.initArticleShare({ root: document });

  const wechatBtn = document.querySelector('[data-share-platform="wechat"]');
  const modal = document.querySelector('[data-article-share-qr-modal]');

  // Open modal
  wechatBtn.click();
  assert.match(modal.style.display, /(block|flex)/);

  // Click outside (on modal itself)
  modal.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  assert.equal(modal.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('WeChat QR Modal: modal hides on ESC key', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-url="https://example.com/test">
      <button type="button" data-share-platform="wechat">WeChat</button>
    </div>
    <div class="article-share-qr-modal" data-article-share-qr-modal>
      <div class="article-share-qr-panel">
        <img data-article-share-qr-img src="" alt="QR Code" />
        <button type="button" data-article-share-qr-close>Close</button>
      </div>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');
  ArticleShare.initArticleShare({ root: document });

  const wechatBtn = document.querySelector('[data-share-platform="wechat"]');
  const modal = document.querySelector('[data-article-share-qr-modal]');

  // Open modal
  wechatBtn.click();
  assert.match(modal.style.display, /(block|flex)/);

  // Press ESC on window (where the event listener is registered)
  dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(modal.style.display, 'none');

  delete global.window;
  delete global.document;
});
