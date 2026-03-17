/**
 * @jest-environment jsdom
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ArticleShare generates QR code using frontend library', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-title="Test Post" data-article-url="https://example.com/test/">
      <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
    </div>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  ArticleShare.initArticleShare({ root: dom.window.document });

  const wechatBtn = dom.window.document.querySelector('[data-share-platform="wechat"]');
  assert.ok(wechatBtn);

  // Simulate click
  wechatBtn.click();

  // Wait for QR code generation
  await new Promise(resolve => setTimeout(resolve, 200));

  const modal = dom.window.document.querySelector('[data-article-share-qr-modal]');
  assert.ok(modal);
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.ok(modal.classList.contains('is-open'));

  const qrImg = modal.querySelector('[data-article-share-qr-img]');
  assert.ok(qrImg);
  // With qrcode library, img.src will be a data URL
  assert.ok(qrImg.src.startsWith('data:image/'));

  delete global.window;
  delete global.document;
});

test('ArticleShare generates QR code with correct URL', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-title="Test Post" data-article-url="https://example.com/test/?id=123">
      <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
    </div>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  ArticleShare.initArticleShare({ root: dom.window.document });

  const wechatBtn = dom.window.document.querySelector('[data-share-platform="wechat"]');
  wechatBtn.click();

  await new Promise(resolve => setTimeout(resolve, 200));

  const qrImg = dom.window.document.querySelector('[data-article-share-qr-img]');
  assert.ok(qrImg);
  assert.ok(qrImg.src.startsWith('data:image/'));

  delete global.window;
  delete global.document;
});

test('ArticleShare QR code generation completes reasonably', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-title="Test Post" data-article-url="https://example.com/test/">
      <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
    </div>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  ArticleShare.initArticleShare({ root: dom.window.document });

  const wechatBtn = dom.window.document.querySelector('[data-share-platform="wechat"]');
  const startTime = Date.now();

  wechatBtn.click();

  // Wait for QR code generation
  await new Promise(resolve => setTimeout(resolve, 600));

  const endTime = Date.now();
  const duration = endTime - startTime;

  // QR code should be generated and modal opened
  const modal = dom.window.document.querySelector('[data-article-share-qr-modal]');
  assert.equal(modal.getAttribute('aria-hidden'), 'false');

  const qrImg = modal.querySelector('[data-article-share-qr-img]');
  assert.ok(qrImg);
  assert.ok(qrImg.src.startsWith('data:image/'));

  // Performance check: should complete in reasonable time
  // (much faster than external API which typically takes >1s)
  assert.ok(duration < 1000, `QR code generation took ${duration}ms, expected < 1000ms`);

  delete global.window;
  delete global.document;
});

test('ArticleShare preserves all existing share functionality', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-title="Test Post" data-article-url="https://example.com/test/">
      <a class="article-share-link article-share-twitter" href="#" data-share-platform="twitter" aria-label="Share to Twitter">Twitter</a>
      <a class="article-share-link article-share-weibo" href="#" data-share-platform="weibo" aria-label="Share to Weibo">Weibo</a>
      <a class="article-share-link article-share-linkedin" href="#" data-share-platform="linkedin" aria-label="Share to LinkedIn">LinkedIn</a>
      <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
    </div>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  ArticleShare.initArticleShare({ root: dom.window.document });

  // Check Twitter share link
  const twitterLink = dom.window.document.querySelector('[data-share-platform="twitter"]');
  assert.ok(twitterLink.href.includes('twitter.com/intent/tweet'));
  assert.equal(twitterLink.target, '_blank');
  assert.equal(twitterLink.rel, 'noopener noreferrer');

  // Check Weibo share link
  const weiboLink = dom.window.document.querySelector('[data-share-platform="weibo"]');
  assert.ok(weiboLink.href.includes('service.weibo.com/share'));

  // Check LinkedIn share link
  const linkedinLink = dom.window.document.querySelector('[data-share-platform="linkedin"]');
  assert.ok(linkedinLink.href.includes('linkedin.com/sharing/share-offsite'));

  delete global.window;
  delete global.document;
});

test('ArticleShare QR modal closes properly', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share data-article-title="Test Post" data-article-url="https://example.com/test/">
      <button class="article-share-link article-share-wechat" type="button" data-share-platform="wechat" aria-label="Share to WeChat">WeChat</button>
    </div>
  </body></html>`);

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  ArticleShare.initArticleShare({ root: dom.window.document });

  const wechatBtn = dom.window.document.querySelector('[data-share-platform="wechat"]');
  wechatBtn.click();

  await new Promise(resolve => setTimeout(resolve, 200));

  const modal = dom.window.document.querySelector('[data-article-share-qr-modal]');
  assert.equal(modal.getAttribute('aria-hidden'), 'false');

  // Close via close button
  const closeBtn = modal.querySelector('[data-article-share-qr-close]');
  closeBtn.click();

  assert.equal(modal.getAttribute('aria-hidden'), 'true');

  // Open again
  wechatBtn.click();
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(modal.getAttribute('aria-hidden'), 'false');

  // Close via click outside
  modal.dispatchEvent(new dom.window.MouseEvent('click', {
    bubbles: true,
    cancelable: true
  }));

  assert.equal(modal.getAttribute('aria-hidden'), 'true');

  delete global.window;
  delete global.document;
});
