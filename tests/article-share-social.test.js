const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ArticleShare: generates correct Twitter share URL with title and URL', () => {
  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  const result = ArticleShare.generateShareUrl({
    platform: 'twitter',
    title: 'Test Article',
    url: 'https://example.com/test'
  });

  assert.match(result, /https:\/\/twitter\.com\/intent\/tweet/);
  assert.match(result, /text=Test%20Article/);
  assert.match(result, /url=https%3A%2F%2Fexample\.com%2Ftest/);
  assert.match(result, /via=xdlkc/);
});

test('ArticleShare: generates correct Weibo share URL with title and URL', () => {
  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  const result = ArticleShare.generateShareUrl({
    platform: 'weibo',
    title: '测试文章',
    url: 'https://example.com/test'
  });

  assert.match(result, /https:\/\/service\.weibo\.com\/share\/share\.php/);
  assert.match(result, /title=%E6%B5%8B%E8%AF%95%E6%96%87%E7%AB%A0/);
  assert.match(result, /url=https%3A%2F%2Fexample\.com%2Ftest/);
});

test('ArticleShare: generates correct LinkedIn share URL', () => {
  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  const result = ArticleShare.generateShareUrl({
    platform: 'linkedin',
    url: 'https://example.com/test'
  });

  assert.equal(result, 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Ftest');
});

test('ArticleShare: returns null for unsupported platform', () => {
  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  const result = ArticleShare.generateShareUrl({
    platform: 'unsupported',
    url: 'https://example.com/test'
  });

  assert.equal(result, null);
});

test('ArticleShare: initializes share buttons with correct href attributes', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share>
      <a href="#" data-share-platform="twitter" data-article-title="Test Article" data-article-url="https://example.com/test">Twitter</a>
      <a href="#" data-share-platform="weibo" data-article-title="测试文章" data-article-url="https://example.com/test">Weibo</a>
      <a href="#" data-share-platform="linkedin" data-article-url="https://example.com/test">LinkedIn</a>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');
  ArticleShare.initArticleShare({ root: document });

  const twitterLink = document.querySelector('[data-share-platform="twitter"]');
  assert.match(twitterLink.href, /https:\/\/twitter\.com\/intent\/tweet/);

  const weiboLink = document.querySelector('[data-share-platform="weibo"]');
  assert.match(weiboLink.href, /https:\/\/service\.weibo\.com\/share\/share\.php/);

  const linkedinLink = document.querySelector('[data-share-platform="linkedin"]');
  assert.equal(linkedinLink.href, 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Ftest');

  delete global.window;
  delete global.document;
});

test('ArticleShare: WeChat button opens QR modal', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share>
      <button type="button" data-share-platform="wechat" data-article-url="https://example.com/test">WeChat</button>
    </div>
    <div class="article-share-qr-modal" data-article-share-qr-modal style="display:none">
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
  const qrImg = document.querySelector('[data-article-share-qr-img]');

  // Initially hidden
  assert.equal(modal.style.display, 'none');

  // Click button to open modal
  wechatBtn.click();

  // Modal should be visible
  assert.match(modal.style.display, /(block|flex)/);
  // QR image src should be set
  assert.match(qrImg.src, /api\.qrserver\.com/);
  assert.match(qrImg.src, /https%3A%2F%2Fexample\.com%2Ftest/);

  delete global.window;
  delete global.document;
});

test('ArticleShare: clicking close button closes QR modal', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share>
      <button type="button" data-share-platform="wechat" data-article-url="https://example.com/test">WeChat</button>
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

  // Close modal
  closeBtn.click();
  assert.equal(modal.style.display, 'none');

  delete global.window;
  delete global.document;
});

test('ArticleShare: init is idempotent', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-article-share>
      <a href="#" data-share-platform="twitter" data-article-title="Test" data-article-url="https://example.com/test">Twitter</a>
    </div>
  </body></html>`, {
    url: 'https://example.com/test/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArticleShare = require('../themes/evan/source/js/article-share.js');

  const link = document.querySelector('[data-share-platform="twitter"]');
  const hrefBefore = link.href;

  ArticleShare.initArticleShare({ root: document });
  const hrefAfter1 = link.href;

  ArticleShare.initArticleShare({ root: document });
  const hrefAfter2 = link.href;

  assert.equal(hrefAfter1, hrefAfter2);
  assert.equal(hrefAfter2, hrefAfter2);

  delete global.window;
  delete global.document;
});
